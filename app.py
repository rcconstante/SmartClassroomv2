"""
Smart Classroom Flask Backend
A clean and organized Flask API for the Smart Classroom application
"""

from flask import Flask, jsonify, request, send_from_directory, Response, send_file
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import sys
import cv2
import sqlite3
import threading
import time
import pickle
import pandas as pd
import numpy as np

# Suppress OpenCV warnings for cleaner console output
os.environ['OPENCV_LOG_LEVEL'] = 'ERROR'
os.environ['OPENCV_VIDEOIO_DEBUG'] = '0'

# Suppress TensorFlow messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Only show errors
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN messages

# Initialize Flask app
app = Flask(__name__, 
            static_folder='templates',
            static_url_path='',
            template_folder='templates')
CORS(app)

# Configuration
# IMPORTANT: Set SECRET_KEY via environment variable in production
# Example: export SECRET_KEY='your-secure-random-key-here'
import secrets
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['JSON_SORT_KEYS'] = False

# =========================
# Gradient Boosting Model Loading
# =========================

# Global variables for ML models
gb_model = None
rf_model = None
gb_scaler = None
feature_columns = None
models_loaded = False

def load_ml_models():
    """Load Gradient Boosting and Random Forest models"""
    global gb_model, rf_model, gb_scaler, feature_columns, models_loaded
    
    try:
        model_dir = 'static/model'
        
        # Load Gradient Boosting model
        with open(os.path.join(model_dir, 'gb_model_with_complementing.pkl'), 'rb') as f:
            gb_model = pickle.load(f)
        print("[ML] ✓ Gradient Boosting model loaded")
        
        # Load Random Forest model
        with open(os.path.join(model_dir, 'rf_model_with_complementing.pkl'), 'rb') as f:
            rf_model = pickle.load(f)
        print("[ML] ✓ Random Forest model loaded")
        
        # Load scaler
        with open(os.path.join(model_dir, 'gb_scaler.pkl'), 'rb') as f:
            gb_scaler = pickle.load(f)
        print("[ML] ✓ Scaler loaded")
        
        # Load feature columns
        with open(os.path.join(model_dir, 'feature_columns.pkl'), 'rb') as f:
            feature_columns = pickle.load(f)
        print(f"[ML] ✓ Feature columns loaded ({len(feature_columns)} features)")
        
        models_loaded = True
        print("[ML] ✓ All ML models loaded successfully")
        return True
        
    except Exception as e:
        print(f"[ML] ✗ Failed to load ML models: {e}")
        models_loaded = False
        return False

# Load models on startup
load_ml_models()

# =========================
# Feature Engineering Functions (from Emotion-b2.py)
# =========================

def create_time_series_features(df, forecast_features, complementing_features, windows=[5, 10, 15, 20]):
    """
    Create rolling statistics and lagged features for time series prediction
    
    Args:
        df: DataFrame with sensor and engagement data
        forecast_features: List of features to forecast (environmental sensors)
        complementing_features: List of complementing features (occupancy, engagement)
        windows: Rolling window sizes
    
    Returns:
        DataFrame with engineered features
    """
    # Build all features as a dictionary first, then concat at once to avoid fragmentation
    feature_dict = {}
    
    # Create features for ENVIRONMENTAL variables only
    for feature in forecast_features:
        # Rolling statistics
        for window in windows:
            feature_dict[f'{feature}_roll_mean_{window}'] = df[feature].rolling(window=window, min_periods=1).mean()
            feature_dict[f'{feature}_roll_std_{window}'] = df[feature].rolling(window=window, min_periods=1).std().fillna(0)
            feature_dict[f'{feature}_roll_min_{window}'] = df[feature].rolling(window=window, min_periods=1).min()
            feature_dict[f'{feature}_roll_max_{window}'] = df[feature].rolling(window=window, min_periods=1).max()
        
        # Lagged features
        for lag in [1, 2, 3, 5, 10]:
            feature_dict[f'{feature}_lag_{lag}'] = df[feature].shift(lag)
        
        # Trend features
        feature_dict[f'{feature}_trend_5'] = df[feature].diff(5)
        feature_dict[f'{feature}_trend_10'] = df[feature].diff(10)
    
    # ADD COMPLEMENTING FEATURES with their own rolling stats
    for feature in complementing_features:
        # Rolling statistics for complementing features
        for window in [5, 10, 15]:
            feature_dict[f'{feature}_roll_mean_{window}'] = df[feature].rolling(window=window, min_periods=1).mean()
            feature_dict[f'{feature}_roll_std_{window}'] = df[feature].rolling(window=window, min_periods=1).std().fillna(0)
        
        # Lagged features
        for lag in [1, 2, 5]:
            feature_dict[f'{feature}_lag_{lag}'] = df[feature].shift(lag)
    
    # Concatenate all features at once to avoid DataFrame fragmentation
    df_features = pd.concat([df, pd.DataFrame(feature_dict, index=df.index)], axis=1)
    
    # Additional interaction features (add to existing DataFrame)
    df_features['engagement_ratio'] = df_features['high_engagement'] / (df_features['low_engagement'] + 1)
    df_features['occupancy_engagement'] = df_features['occupancy'] * df_features['high_engagement']
    
    # Drop rows with NaN
    df_features = df_features.dropna()
    
    return df_features

def classify_comfort(temperature, humidity, gas, light, sound):
    """
    Classify room comfort based on optimal ranges
    Returns: 0=Critical, 1=Poor, 2=Acceptable, 3=Optimal
    """
    score = 0
    
    # Temperature (22-24°C optimal)
    if 22 <= temperature <= 24:
        score += 1
    elif 21 <= temperature <= 25:
        score += 0.5
    
    # Humidity (30-50% optimal)
    if 30 <= humidity <= 50:
        score += 1
    elif 25 <= humidity <= 55:
        score += 0.5
    
    # CO2/Gas (<800 ppm good)
    if gas < 800:
        score += 1
    elif gas < 1000:
        score += 0.5
    
    # Lighting (150-250 lux optimal)
    if 150 <= light <= 250:
        score += 1
    elif 100 <= light <= 300:
        score += 0.5
    
    # Noise (35-60 dBA acceptable)
    if 35 <= sound <= 60:
        score += 1
    elif sound <= 70:
        score += 0.5
    
    # Classification
    if score >= 4.5:
        return 3  # Optimal
    elif score >= 3:
        return 2  # Acceptable
    elif score >= 1.5:
        return 1  # Poor
    else:
        return 0  # Critical

comfort_labels_map = {0: 'Critical', 1: 'Poor', 2: 'Acceptable', 3: 'Optimal'}

# In-memory data storage (use a database in production)
classroom_data = {
    'users': [
        {
            'id': 1,
            'name': 'Dr. Johnson',
            'email': 'dr.johnson@smartclassroom.edu',
            'role': 'teacher',
            'initials': 'DJ'
        }
    ],
    'students': [],
    'engagement_history': [],
    'environment_data': [],
    'current_stats': {
        'totalStudents': 0,
        'presentToday': 0,
        'studentsDetected': 0,
        'avgEngagement': 0,
        'attentionLevel': 0,
        'lookingAtBoard': 0,
        'takingNotes': 0,
        'distracted': 0,
        'tired': 0
    }
}


# =========================
# Routes - Static Files
# =========================

@app.route('/')
def root():
    """Serve the login page at root"""
    return send_from_directory('templates', 'login.html')


@app.route('/dashboard')
def dashboard_page():
    """Serve the main dashboard (index)"""
    return send_from_directory('templates', 'index.html')


@app.route('/login')
def login_page():
    """Alias for the login page"""
    return send_from_directory('templates', 'login.html')


@app.route('/favicon.ico')
def favicon():
    """Return empty response for favicon to prevent 404 errors"""
    return '', 204


@app.route('/css/<path:path>')
def serve_css(path):
    """Serve CSS files"""
    return send_from_directory('templates/css', path)


@app.route('/js/<path:path>')
def serve_js(path):
    """Serve JavaScript files"""
    return send_from_directory('templates/js', path)


@app.route('/assets/<path:path>')
def serve_assets(path):
    """Serve asset files"""
    return send_from_directory('templates/assets', path)


@app.route('/static/<path:path>')
def serve_static_files(path):
    """Serve static files (images, etc.)"""
    return send_from_directory('static', path)


# =========================
# Routes - Authentication
# =========================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Handle user login"""
    data = request.get_json()
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'teacher')
    
    # Admin authentication
    if role == 'admin':
        if username == 'admin' and password == 'admin123':  # Change in production
            user = {
                'id': 'admin1',
                'name': 'System Administrator',
                'username': username,
                'role': 'admin',
                'initials': 'SA'
            }
            return jsonify({
                'success': True,
                'user': user,
                'token': 'mock-admin-jwt-token'
            }), 200
    
    # Teacher authentication
    elif role == 'teacher':
        # Check if teacher exists in database
        if email and password:
            # Demo credentials
            if email == 'dr.johnson@dlsud.edu.ph' and password == 'teacher123':
                user = {
                    'id': 1,
                    'name': 'Dr. Johnson',
                    'email': email,
                    'role': 'teacher',
                    'initials': 'DJ'
                }
                return jsonify({
                    'success': True,
                    'user': user,
                    'token': 'mock-teacher-jwt-token'
                }), 200
            
            # Check against existing users
            user = next((u for u in classroom_data['users'] if u['email'] == email), None)
            if user:
                return jsonify({
                    'success': True,
                    'user': user,
                    'token': 'mock-jwt-token'
                }), 200
    
    return jsonify({
        'success': False,
        'message': 'Invalid credentials'
    }), 401


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200


# =========================
# Routes - Dashboard Data
# =========================

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics - synced across all components"""
    stats = classroom_data['current_stats'].copy()
    stats['timestamp'] = datetime.now().isoformat()
    stats['environmentStatus'] = 'optimal'
    return jsonify(stats), 200


@app.route('/api/dashboard/stats/update', methods=['POST'])
def update_dashboard_stats():
    """Update dashboard statistics (called by CV system)"""
    data = request.get_json()
    
    # Update the current stats
    if 'studentsDetected' in data:
        classroom_data['current_stats']['studentsDetected'] = data['studentsDetected']
        classroom_data['current_stats']['presentToday'] = data['studentsDetected']
    
    if 'avgEngagement' in data:
        classroom_data['current_stats']['avgEngagement'] = data['avgEngagement']
    
    if 'attentionLevel' in data:
        classroom_data['current_stats']['attentionLevel'] = data['attentionLevel']
    
    if 'lookingAtBoard' in data:
        classroom_data['current_stats']['lookingAtBoard'] = data['lookingAtBoard']
    
    if 'takingNotes' in data:
        classroom_data['current_stats']['takingNotes'] = data['takingNotes']
    
    if 'distracted' in data:
        classroom_data['current_stats']['distracted'] = data['distracted']
    
    if 'tired' in data:
        classroom_data['current_stats']['tired'] = data['tired']
    
    return jsonify({'success': True, 'stats': classroom_data['current_stats']}), 200


@app.route('/api/dashboard/engagement', methods=['GET'])
def get_engagement_data():
    """Get real-time engagement data from CV emotion detection"""
    # Get current emotion stats from CV system
    high_engaged_pct = (current_emotion_stats.get('emotion_percentages', {}).get('Happy', 0) +
                        current_emotion_stats.get('emotion_percentages', {}).get('Surprise', 0) +
                        current_emotion_stats.get('emotion_percentages', {}).get('Neutral', 0))
    
    low_engaged_pct = (current_emotion_stats.get('emotion_percentages', {}).get('Fear', 0) +
                       current_emotion_stats.get('emotion_percentages', {}).get('Sad', 0) +
                       current_emotion_stats.get('emotion_percentages', {}).get('Disgust', 0) +
                       current_emotion_stats.get('emotion_percentages', {}).get('Angry', 0))
    
    total_faces = current_emotion_stats.get('total_faces', 0)
    current_engagement = current_emotion_stats.get('engagement', 0)
    
    engagement_data = {
        'current': int(current_engagement),
        'total_faces': total_faces,
        'high_engaged_pct': round(high_engaged_pct, 1),
        'low_engaged_pct': round(low_engaged_pct, 1),
        'breakdown': {
            'highly_engaged': round(high_engaged_pct),
            'engaged': round(current_emotion_stats.get('emotion_percentages', {}).get('Neutral', 0)),
            'disengaged': round(low_engaged_pct)
        },
        'timestamp': datetime.now().isoformat()
    }
    return jsonify(engagement_data), 200


@app.route('/api/dashboard/environment', methods=['GET'])
def get_environment_data():
    """Get environmental monitoring data (from IoT sensors if available)"""
    
    # Try to get real IoT data
    if iot_enabled and get_iot_data:
        iot_data = get_iot_data()
        if iot_data and iot_data.get('timestamp'):
            environment = {
                'temperature': iot_data.get('raw_temperature', 24.0),
                'humidity': iot_data.get('raw_humidity', 55.0),
                'co2': iot_data.get('raw_gas', 500),  # MQ135 gas sensor
                'lightLevel': iot_data.get('raw_light', 400),
                'noiseLevel': iot_data.get('raw_sound', 40),
                'status': 'optimal' if iot_data.get('environmental_score', 75) > 70 else 'warning',
                'environmental_score': iot_data.get('environmental_score', 75),
                'timestamp': iot_data.get('timestamp').isoformat() if iot_data.get('timestamp') else datetime.now().isoformat(),
                'source': 'iot_sensors'
            }
            return jsonify(environment), 200
    
    # No IoT data available
    return jsonify({
        'error': 'IoT sensors not connected',
        'message': 'Please connect Arduino and close Serial Monitor',
        'status': 'unavailable',
        'timestamp': datetime.now().isoformat(),
        'source': 'none'
    }), 503


@app.route('/api/iot/status', methods=['GET'])
def get_iot_sensor_status():
    """Get IoT sensor connection status"""
    if not iot_enabled or not get_iot_status:
        return jsonify({
            'success': False,
            'connected': False,
            'message': 'IoT sensors not initialized'
        }), 200
    
    status = get_iot_status()
    return jsonify({
        'success': True,
        **status
    }), 200


@app.route('/api/iot/data', methods=['GET'])
def get_iot_sensor_data():
    """Get current IoT sensor readings"""
    if not iot_enabled or not get_iot_data:
        return jsonify({
            'success': False,
            'error': 'IoT sensors not available'
        }), 503
    
    data = get_iot_data()
    if not data or not data.get('timestamp'):
        return jsonify({
            'success': False,
            'error': 'No sensor data available'
        }), 503
    
    return jsonify({
        'success': True,
        'data': {
            'temperature': {
                'value': data.get('raw_temperature'),
                'normalized': data.get('temperature'),
                'unit': '°C'
            },
            'humidity': {
                'value': data.get('raw_humidity'),
                'normalized': data.get('humidity'),
                'unit': '%'
            },
            'light': {
                'value': data.get('raw_light'),
                'normalized': data.get('light'),
                'unit': 'lux'
            },
            'sound': {
                'value': data.get('raw_sound'),
                'normalized': data.get('sound'),
                'unit': 'ADC'
            },
            'gas': {
                'value': data.get('raw_gas'),
                'normalized': data.get('gas'),
                'unit': 'ADC'
            },
            'environmental_score': data.get('environmental_score'),
            'timestamp': data.get('timestamp').isoformat() if data.get('timestamp') else None
        }
    }), 200


@app.route('/api/iot/alerts', methods=['GET'])
def get_iot_sensor_alerts():
    """Get IoT sensor alerts (out of range values)"""
    if not iot_enabled or not get_iot_alerts:
        return jsonify({
            'success': True,
            'alerts': []
        }), 200
    
    alerts = get_iot_alerts()
    return jsonify({
        'success': True,
        'alerts': alerts,
        'count': len(alerts)
    }), 200


@app.route('/api/iot/start-logging', methods=['POST'])
def start_iot_logging():
    """Start IoT database logging and CV data sync"""
    from camera_system.iot_sensor import iot_sensor
    
    if not iot_enabled or not iot_sensor or not iot_sensor.is_connected:
        return jsonify({
            'success': False,
            'message': 'IoT sensors not connected'
        }), 503
    
    result = iot_sensor.start_db_logging()
    
    # Start CV data sync thread if logging started successfully
    if result['success']:
        start_cv_data_sync()
    
    status_code = 200 if result['success'] else 400
    return jsonify(result), status_code


@app.route('/api/iot/stop-logging', methods=['POST'])
def stop_iot_logging():
    """Stop IoT database logging and CV data sync"""
    from camera_system.iot_sensor import iot_sensor
    
    if not iot_enabled or not iot_sensor:
        return jsonify({
            'success': False,
            'message': 'IoT sensor not initialized'
        }), 400
    
    # Stop CV data sync thread
    stop_cv_data_sync()
    
    result = iot_sensor.stop_db_logging()
    status_code = 200 if result['success'] else 400
    return jsonify(result), status_code


@app.route('/api/iot/logging-status', methods=['GET'])
def get_logging_status():
    """Get current database logging status"""
    from camera_system.iot_sensor import iot_sensor
    
    if not iot_enabled or not iot_sensor:
        return jsonify({
            'enabled': False,
            'db_file': None,
            'session_id': None,
            'record_count': 0
        })
    
    status = iot_sensor.get_db_logging_status()
    return jsonify(status)


@app.route('/api/iot/export-csv', methods=['POST'])
def export_iot_csv():
    """Export current SQLite database to CSV"""
    from camera_system.iot_sensor import iot_sensor
    
    if not iot_enabled or not iot_sensor or not iot_sensor.db_logging_enabled:
        return jsonify({
            'success': False,
            'message': 'No active database logging session'
        }), 400
    
    result = iot_sensor.export_db_to_csv()
    
    if result['success']:
        # Return the CSV file for download
        csv_file = result['csv_file']
        return send_file(
            csv_file,
            mimetype='text/csv',
            as_attachment=True,
            download_name=os.path.basename(csv_file)
        )
    else:
        return jsonify(result), 400


@app.route('/api/iot/log/csv', methods=['GET'])
def export_iot_log_csv():
    """Export IoT sensor log as CSV - saves to persistent file"""
    import csv
    import os
    
    if not iot_enabled or not get_iot_data:
        return jsonify({
            'success': False,
            'error': 'IoT sensors not available'
        }), 503
    
    data = get_iot_data()
    if not data or not data.get('timestamp'):
        return jsonify({
            'success': False,
            'error': 'No sensor data available'
        }), 503
    
    # Define CSV file path
    csv_file = 'data/iot_sensor_log.csv'
    os.makedirs('data', exist_ok=True)
    
    # Check if file exists to determine if we need to write headers
    file_exists = os.path.exists(csv_file)
    
    try:
        # Append new data to CSV
        with open(csv_file, 'a', newline='') as f:
            fieldnames = ['timestamp', 'temperature', 'humidity', 'light', 'sound', 'gas', 'environmental_score']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            # Write header only if file is new
            if not file_exists:
                writer.writeheader()
            
            # Write current data
            writer.writerow({
                'timestamp': data.get('timestamp').isoformat() if data.get('timestamp') else '',
                'temperature': data.get('raw_temperature', ''),
                'humidity': data.get('raw_humidity', ''),
                'light': data.get('raw_light', ''),
                'sound': data.get('raw_sound', ''),
                'gas': data.get('raw_gas', ''),
                'environmental_score': data.get('environmental_score', '')
            })
        
        return jsonify({
            'success': True,
            'message': f'Data logged to {csv_file}',
            'file': csv_file,
            'generated_at': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to write CSV: {str(e)}'
        }), 500


@app.route('/api/iot/list-databases', methods=['GET'])
def list_iot_databases():
    """List all available IoT database files"""
    try:
        data_dir = 'data'
        if not os.path.exists(data_dir):
            return jsonify({'databases': []})
        
        databases = []
        for filename in os.listdir(data_dir):
            if filename.startswith('iot_log_') and filename.endswith('.db'):
                filepath = os.path.join(data_dir, filename)
                
                # Get file stats
                stat = os.stat(filepath)
                created = datetime.fromtimestamp(stat.st_ctime).isoformat()
                size = stat.st_size
                
                # Try to get record count
                try:
                    conn = sqlite3.connect(filepath)
                    cursor = conn.cursor()
                    cursor.execute('SELECT COUNT(*) FROM sensor_data')
                    record_count = cursor.fetchone()[0]
                    conn.close()
                except:
                    record_count = 0
                
                databases.append({
                    'filename': filename,
                    'filepath': filepath,
                    'created': created,
                    'size': size,
                    'record_count': record_count
                })
        
        # Sort by creation time (newest first)
        databases.sort(key=lambda x: x['created'], reverse=True)
        
        return jsonify({'databases': databases})
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to list databases: {str(e)}',
            'databases': []
        }), 500

@app.route('/api/iot/latest', methods=['GET'])
def get_iot_latest():
    """Get latest IoT sensor reading (frontend expects this endpoint)"""
    if not iot_enabled or not get_iot_data:
        return jsonify({
            'success': False,
            'error': 'IoT sensors not available',
            'message': 'Please connect Arduino and close Serial Monitor'
        }), 200  # Return 200 to prevent frontend errors
    
    data = get_iot_data()
    if not data or not data.get('timestamp'):
        return jsonify({
            'success': False,
            'error': 'No sensor data available',
            'message': 'Waiting for sensor data...'
        }), 200  # Return 200 to prevent frontend errors
    
    # Format data for frontend with converted values
    return jsonify({
        'success': True,
        'data': {
            'temperature': round(data.get('raw_temperature', 0), 1),
            'humidity': round(data.get('raw_humidity', 0), 1),
            'light_level': round(data.get('raw_light', 0), 1),
            'air_quality': data.get('raw_gas', 0),
            'air_quality_ppm': data.get('gas_ppm', 0),  # Converted PPM value
            'sound': data.get('raw_sound', 0),
            'sound_dba': data.get('sound_dba', 0),  # Converted dBA value
            'environmental_score': round(data.get('environmental_score', 0), 1),
            'timestamp': data.get('timestamp').isoformat() if data.get('timestamp') else None
        }
    }), 200


@app.route('/api/iot/history', methods=['GET'])
def get_iot_history():
    """Get IoT sensor history data (all available readings) with converted values"""
    from camera_system.iot_sensor import iot_sensor, getDBA, mq135_getPPM
    
    limit = request.args.get('limit', default=1000, type=int)
    limit = min(limit, 5000)
    
    if not iot_enabled or not iot_sensor:
        return jsonify({
            'success': False,
            'error': 'IoT sensors not available',
            'data': []
        }), 200
    
    history_data = []
    try:
        while not iot_sensor.data_queue.empty() and len(history_data) < limit:
            data = iot_sensor.data_queue.get_nowait()
            if data and data.get('timestamp'):
                raw_sound = data.get('raw_sound', 0)
                raw_gas = data.get('raw_gas', 0)
                history_data.append({
                    'timestamp': data.get('timestamp').isoformat(),
                    'temperature': round(data.get('raw_temperature', 0), 1),
                    'humidity': round(data.get('raw_humidity', 0), 1),
                    'light': round(data.get('raw_light', 0), 1),
                    'sound': raw_sound,
                    'sound_dba': getDBA(raw_sound) if raw_sound else 0,
                    'gas': raw_gas,
                    'gas_ppm': mq135_getPPM(raw_gas) if raw_gas else 0,
                    'environmental_score': round(data.get('environmental_score', 0), 1),
                    'occupancy': data.get('occupancy', 0),
                    'happy': int(data.get('happy', 0)),
                    'surprise': int(data.get('surprise', 0)),
                    'neutral': int(data.get('neutral', 0)),
                    'sad': int(data.get('sad', 0)),
                    'angry': int(data.get('angry', 0)),
                    'disgust': int(data.get('disgust', 0)),
                    'fear': int(data.get('fear', 0))
                })
    except:
        pass
    
    if not history_data:
        data = get_iot_data()
        if data and data.get('timestamp'):
            raw_sound = data.get('raw_sound', 0)
            raw_gas = data.get('raw_gas', 0)
            history_data.append({
                'timestamp': data.get('timestamp').isoformat(),
                'temperature': round(data.get('raw_temperature', 0), 1),
                'humidity': round(data.get('raw_humidity', 0), 1),
                'light': round(data.get('raw_light', 0), 1),
                'sound': raw_sound,
                'sound_dba': data.get('sound_dba', 0) or getDBA(raw_sound) if raw_sound else 0,
                'gas': raw_gas,
                'gas_ppm': data.get('gas_ppm', 0) or mq135_getPPM(raw_gas) if raw_gas else 0,
                'environmental_score': round(data.get('environmental_score', 0), 1),
                'occupancy': data.get('occupancy', 0),
                'happy': int(data.get('happy', 0)),
                'surprise': int(data.get('surprise', 0)),
                'neutral': int(data.get('neutral', 0)),
                'sad': int(data.get('sad', 0)),
                'angry': int(data.get('angry', 0)),
                'disgust': int(data.get('disgust', 0)),
                'fear': int(data.get('fear', 0))
            })
    
    return jsonify({
        'success': True,
        'data': history_data[-limit:],
        'count': len(history_data),
        'timestamp': datetime.now().isoformat()
    }), 200


# =========================
# Routes - Students
# =========================

@app.route('/api/students', methods=['GET'])
def get_students():
    """Get detected students from CV system"""
    # Return real detection data - students are dynamically detected via CV
    students_detected = classroom_data['current_stats'].get('studentsDetected', 0)
    avg_engagement = classroom_data['current_stats'].get('avgEngagement', 0)
    
    # Return student detection summary (individual tracking not implemented yet)
    return jsonify({
        'detected_count': students_detected,
        'avg_engagement': avg_engagement,
        'message': 'Individual student tracking requires face enrollment feature',
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    """Get a specific student's details (requires enrollment feature)"""
    # Individual student tracking not implemented - return info message
    return jsonify({
        'message': 'Individual student tracking requires face enrollment feature',
        'student_id': student_id,
        'status': 'not_enrolled'
    }), 200


# =========================
# Routes - Settings
# =========================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get user settings"""
    settings = {
        'darkMode': False,
        'engagementThreshold': 50,
        'temperature': 24,
        'humidity': 55,
        'camera': 'main',
        'videoQuality': 'high'
    }
    return jsonify(settings), 200


@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update user settings"""
    data = request.get_json()
    # In production, save to database
    return jsonify({
        'success': True,
        'message': 'Settings updated successfully',
        'settings': data
    }), 200


# =========================
# Routes - Analytics
# =========================

@app.route('/api/analytics/engagement-trends', methods=['GET'])
def get_engagement_trends():
    """Get engagement trends over time - Real data from current session (30-minute intervals)"""
    minutes = request.args.get('minutes', default=30, type=int)
    
    # Get current engagement stats
    current_engagement = classroom_data['current_stats'].get('avgEngagement', 0)
    current_students = classroom_data['current_stats'].get('studentsDetected', 0)
    
    # Get emotion data
    emotion_data = current_emotion_stats.get('emotion_percentages', {})
    
    # High Engaged = Happy + Surprise + Neutral
    high_engaged_pct = (emotion_data.get('Happy', 0) + 
                        emotion_data.get('Surprise', 0) + 
                        emotion_data.get('Neutral', 0))
    
    # Low Engaged = Fear + Sad + Disgust + Angry
    low_engaged_pct = (emotion_data.get('Fear', 0) + 
                       emotion_data.get('Sad', 0) + 
                       emotion_data.get('Disgust', 0) + 
                       emotion_data.get('Angry', 0))
    
    # Generate data points for last 30 minutes (1-minute intervals)
    data_points = []
    for i in range(minutes - 1, -1, -1):
        timestamp = datetime.now() - timedelta(minutes=i)
        data_points.append({
            'date': timestamp.isoformat(),
            'time': timestamp.strftime('%H:%M'),
            'avgEngagement': current_engagement if i == 0 else 0,
            'highlyEngaged': round(high_engaged_pct) if i == 0 else 0,
            'disengaged': round(low_engaged_pct) if i == 0 else 0,
            'studentsPresent': current_students if i == 0 else 0
        })
    
    trends = {
        'period': f'Last {minutes} minutes',
        'data': data_points
    }
    return jsonify(trends), 200


@app.route('/api/analytics/export', methods=['GET'])
def export_analytics():
    """Export analytics data as CSV - Real data from current session"""
    days = request.args.get('days', default=30, type=int)
    include_iot = request.args.get('iot', default='false').lower() == 'true'
    
    current_students = classroom_data['current_stats'].get('studentsDetected', 0)
    current_engagement = classroom_data['current_stats'].get('avgEngagement', 0)
    current_attention = classroom_data['current_stats'].get('attentionLevel', 0)
    total_capacity = classroom_data['current_stats'].get('totalStudents', 32)
    
    iot_data = None
    if include_iot and iot_enabled and get_iot_data:
        sensor_data = get_iot_data()
        if sensor_data and sensor_data.get('timestamp'):
            iot_data = {
                'temperature': sensor_data.get('raw_temperature'),
                'humidity': sensor_data.get('raw_humidity'),
                'light': sensor_data.get('raw_light'),
                'sound': sensor_data.get('raw_sound'),
                'gas': sensor_data.get('raw_gas'),
                'environmental_score': sensor_data.get('environmental_score')
            }
    
    analytics_data = []
    today = datetime.now()
    
    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        if date.weekday() >= 5:
            continue
        
        if i == 0:
            students = current_students
            engagement = current_engagement
            attention = current_attention
        else:
            students = 0
            engagement = 0
            attention = 0
        
        status = 'N/A'
        if engagement > 0:
            status = 'Excellent' if engagement > 75 else 'Good' if engagement > 60 else 'Needs Attention'
        
        row = {
            'date': date.strftime('%Y-%m-%d'),
            'session': f"{date.strftime('%I:%M %p')} - Current Session",
            'students': students if students > 0 else 'N/A',
            'engagement': engagement if engagement > 0 else 'N/A',
            'attention': attention if attention > 0 else 'N/A',
            'status': status
        }
        
        if include_iot and iot_data and i == 0:
            row.update({
                'temperature': f"{iot_data['temperature']}°C" if iot_data['temperature'] else 'N/A',
                'humidity': f"{iot_data['humidity']}%" if iot_data['humidity'] else 'N/A',
                'light': f"{iot_data['light']} lux" if iot_data['light'] else 'N/A',
                'sound': iot_data['sound'] if iot_data['sound'] else 'N/A',
                'gas': iot_data['gas'] if iot_data['gas'] else 'N/A'
            })
        elif include_iot:
            row.update({
                'temperature': 'N/A',
                'humidity': 'N/A',
                'light': 'N/A',
                'sound': 'N/A',
                'gas': 'N/A'
            })
        
        analytics_data.append(row)
    
    return jsonify({
        'success': True,
        'data': analytics_data,
        'generated_at': datetime.now().isoformat()
    }), 200


@app.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    """Get analytics summary with real-time data"""
    # Get current stats
    current_engagement = classroom_data['current_stats'].get('avgEngagement', 0)
    current_students = classroom_data['current_stats'].get('studentsDetected', 0)
    current_attention = classroom_data['current_stats'].get('attentionLevel', 0)
    total_capacity = classroom_data['current_stats'].get('totalStudents', 32)
    
    # Get emotion percentages
    emotion_data = current_emotion_stats.get('emotion_percentages', {})
    
    # Determine peak engagement time (current hour if engaged, else N/A)
    peak_time = 'N/A'
    if current_engagement > 0:
        current_hour = datetime.now().hour
        peak_time = f"{current_hour % 12 or 12}:00 {'PM' if current_hour >= 12 else 'AM'}"
    
    summary = {
        'avgEngagement': current_engagement if current_engagement > 0 else 0,
        'totalSessions': 1 if current_students > 0 else 0,
        'peakTime': peak_time,
        'emotionDistribution': emotion_data,
        'currentStats': {
            'studentsDetected': current_students,
            'totalCapacity': total_capacity,
            'attentionLevel': current_attention,
            'confused': emotion_data.get('Confused', 0),
            'frustrated': emotion_data.get('Frustrated', 0),
            'drowsy': emotion_data.get('Drowsy', 0),
            'bored': emotion_data.get('Bored', 0),
            'lookingAway': emotion_data.get('Looking Away', 0),
            'engaged': emotion_data.get('Engaged', 0)
        }
    }
    
    return jsonify(summary), 200


# =========================
# Routes - Alerts
# =========================

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get current alerts and notifications"""
    alerts = [
        {
            'id': 1,
            'type': 'warning',
            'title': 'Low Engagement Detected',
            'message': 'Engagement level dropped below 60%',
            'timestamp': (datetime.now() - timedelta(minutes=5)).isoformat()
        },
        {
            'id': 2,
            'type': 'info',
            'title': 'Temperature Alert',
            'message': 'Classroom temperature is 27°C',
            'timestamp': (datetime.now() - timedelta(minutes=15)).isoformat()
        }
    ]
    return jsonify(alerts), 200


# =========================
# Camera System API
# =========================

# Try to import camera system, but don't fail if it's not available
try:
    from camera_system import CameraDetector, CameraStream
    from camera_system.emotion_detector import EmotionDetector
    from camera_system.iot_sensor import initialize_iot, get_iot_data, get_iot_status, get_iot_alerts
    CAMERA_SYSTEM_AVAILABLE = True
    print("✓ Camera system loaded successfully")
except ImportError as e:
    print(f"Warning: Camera system not available: {e}")
    CAMERA_SYSTEM_AVAILABLE = False
    CameraDetector = None
    CameraStream = None
    EmotionDetector = None
    initialize_iot = None
    get_iot_data = None
    get_iot_status = None
    get_iot_alerts = None

# Global camera stream instance and emotion detector
active_camera_stream = None
emotion_detector = None
iot_enabled = False
cv_data_sync_thread = None
cv_data_sync_running = False

current_emotion_stats = {
    'total_faces': 0,
    'emotions': {'Happy': 0, 'Surprise': 0, 'Neutral': 0, 'Sad': 0, 'Angry': 0, 'Disgust': 0, 'Fear': 0},
    'emotion_percentages': {'Happy': 0, 'Surprise': 0, 'Neutral': 0, 'Sad': 0, 'Angry': 0, 'Disgust': 0, 'Fear': 0},
    'engagement': 0
}

# Store emotion history for analytics (stores snapshots every second)
emotion_history = []
last_emotion_snapshot = time.time()

def cv_data_sync_worker():
    """Background worker to sync CV data to IoT sensor every 10 seconds"""
    global cv_data_sync_running, current_emotion_stats, classroom_data
    from camera_system.iot_sensor import iot_sensor
    
    print("[CV Sync] Background worker started - syncing every 10 seconds")
    
    while cv_data_sync_running:
        try:
            # Only sync if IoT logging is enabled
            if iot_enabled and iot_sensor and iot_sensor.db_logging_enabled:
                # Get current CV data
                occupancy = classroom_data['current_stats'].get('studentsDetected', 0)
                # Use emotion COUNTS (not percentages) - each face contributes 1 to its dominant emotion
                emotion_counts = current_emotion_stats.get('emotions', {})
                
                # Update IoT sensor with CV data (counts, not percentages)
                iot_sensor.update_cv_data(occupancy, emotion_counts)
                
                print(f"[CV Sync] Updated IoT with occupancy={occupancy}, emotion_counts={emotion_counts}")
            
        except Exception as e:
            print(f"[CV Sync] Error syncing data: {e}")
        
        # Wait 10 seconds before next sync
        time.sleep(10)
    
    print("[CV Sync] Background worker stopped")

def start_cv_data_sync():
    """Start the CV data sync background thread"""
    global cv_data_sync_thread, cv_data_sync_running
    
    if cv_data_sync_thread and cv_data_sync_thread.is_alive():
        return  # Already running
    
    cv_data_sync_running = True
    cv_data_sync_thread = threading.Thread(target=cv_data_sync_worker, daemon=True)
    cv_data_sync_thread.start()
    print("[CV Sync] Started background sync thread")

def stop_cv_data_sync():
    """Stop the CV data sync background thread"""
    global cv_data_sync_running
    
    cv_data_sync_running = False
    if cv_data_sync_thread:
        cv_data_sync_thread.join(timeout=2)
    print("[CV Sync] Stopped background sync thread")

# Initialize IoT sensors (optional - won't fail if not available)
if CAMERA_SYSTEM_AVAILABLE and initialize_iot:
    # Try to initialize IoT sensors on COM5 at 9600 baud
    print("[IoT] Attempting to connect to Arduino on COM5 at 9600 baud...")
    iot_enabled = initialize_iot(port='COM5', baudrate=9600)  # Explicitly use COM5 at 9600 baud
    if not iot_enabled:
        print("ℹ IoT sensors not connected (system will work without them)")
        print("ℹ Make sure Arduino IDE Serial Monitor is CLOSED")
        print("ℹ If Arduino is on different port, edit app.py line 937")

@app.route('/api/camera/detect', methods=['GET'])
def detect_cameras():
    """Detect all available cameras on the system"""
    if not CAMERA_SYSTEM_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Camera system not available. Please install opencv-python: pip install opencv-python',
            'cameras': [],
            'count': 0
        }), 200
    
    try:
        print("\n" + "="*60)
        print("Starting camera detection...")
        print("="*60)
        
        detector = CameraDetector()
        cameras = detector.detect_cameras()
        system_info = detector.get_system_info()
        
        print(f"Detection complete. Found {len(cameras)} camera(s)")
        for cam in cameras:
            print(f"  - Camera {cam['id']}: {cam['name']} ({cam['resolution']})")
        print("="*60 + "\n")
        
        return jsonify({
            'success': True,
            'cameras': cameras,
            'system_info': system_info,
            'count': len(cameras)
        }), 200
    except Exception as e:
        print(f"Camera detection error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'cameras': [],
            'count': 0
        }), 200  # Return 200 instead of 500 so frontend doesn't break


@app.route('/api/camera/test/<int:camera_id>', methods=['POST'])
def test_camera(camera_id):
    """Test if a specific camera is accessible"""
    if not CAMERA_SYSTEM_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Camera system not available'
        }), 200
    
    try:
        detector = CameraDetector()
        result = detector.test_camera(camera_id)
        
        if result['available']:
            return jsonify({
                'success': True,
                'camera_id': camera_id,
                'info': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'camera_id': camera_id,
                'error': 'Camera not accessible'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/camera/start', methods=['POST'])
def start_camera():
    """Start camera stream for monitoring with emotion detection"""
    global active_camera_stream, emotion_detector
    
    if not CAMERA_SYSTEM_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Camera system not available. Please install opencv-python.'
        }), 200
    
    try:
        data = request.get_json()
        camera_id = data.get('camera_id', 0)
        
        # Stop existing stream if any
        if active_camera_stream:
            active_camera_stream.stop()
        
        # Initialize emotion detector if not already created
        if emotion_detector is None and EmotionDetector is not None:
            try:
                emotion_detector = EmotionDetector()
                print("✓ Emotion detector initialized")
            except Exception as e:
                print(f"⚠ Warning: Could not initialize emotion detector: {e}")
        
        # Start new stream
        active_camera_stream = CameraStream(camera_id)
        success = active_camera_stream.start()
        
        if success:
            return jsonify({
                'success': True,
                'camera_id': camera_id,
                'message': 'Camera stream started successfully with emotion detection'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to start camera stream'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/camera/stop', methods=['POST'])
def stop_camera():
    """Stop active camera stream"""
    global active_camera_stream, current_emotion_stats
    
    try:
        if active_camera_stream:
            active_camera_stream.stop()
            active_camera_stream = None
        
        # Reset emotion stats
        current_emotion_stats = {
            'total_faces': 0,
            'emotions': {'Happy': 0, 'Surprise': 0, 'Neutral': 0, 'Sad': 0, 'Angry': 0, 'Disgust': 0, 'Fear': 0},
            'emotion_percentages': {'Happy': 0, 'Surprise': 0, 'Neutral': 0, 'Sad': 0, 'Angry': 0, 'Disgust': 0, 'Fear': 0},
            'engagement': 0
        }
        
        # Don't clear emotion_history here - keep it for analytics review
        # Users can manually clear it via /api/emotions/clear if needed
        
        # Reset dashboard stats to default values
        classroom_data['current_stats']['studentsDetected'] = 0
        classroom_data['current_stats']['avgEngagement'] = 78
            
        return jsonify({
            'success': True,
            'message': 'Camera stream stopped'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/camera/status', methods=['GET'])
def camera_status():
    """Get current camera stream status"""
    global active_camera_stream
    
    try:
        if active_camera_stream and active_camera_stream.is_running:
            return jsonify({
                'success': True,
                'active': True,
                'camera_id': active_camera_stream.camera_id,
                'fps': active_camera_stream.fps
            }), 200
        else:
            return jsonify({
                'success': True,
                'active': False
            }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def generate_frames():
    """Generator function to stream video frames with emotion detection"""
    global active_camera_stream, emotion_detector, current_emotion_stats
    
    while True:
        # Check if camera is still active
        if not active_camera_stream or not active_camera_stream.is_running:
            print("Camera stream stopped, ending frame generation")
            break
            
        try:
            frame = active_camera_stream.read_frame()
            
            if frame is not None:
                # Process frame with emotion detection
                if emotion_detector:
                    try:
                        annotated_frame, emotion_stats = emotion_detector.process_frame(frame)
                        
                        # Update global emotion stats
                        current_emotion_stats = emotion_stats
                        current_emotion_stats['engagement'] = emotion_detector.get_engagement_from_emotions()
                        
                        # Update classroom data with emotion-based stats
                        classroom_data['current_stats']['studentsDetected'] = emotion_stats['total_faces']
                        classroom_data['current_stats']['avgEngagement'] = int(current_emotion_stats['engagement'])
                        
                        # Store emotion snapshot every second for analytics
                        global last_emotion_snapshot, emotion_history
                        current_time = time.time()
                        if current_time - last_emotion_snapshot >= 1.0:  # Store every 1 second
                            emotion_snapshot = {
                                'timestamp': datetime.now().isoformat(),
                                'total_faces': emotion_stats['total_faces'],
                                'emotion_percentages': emotion_stats['emotion_percentages'].copy(),
                                'engagement': current_emotion_stats['engagement']
                            }
                            emotion_history.append(emotion_snapshot)
                            
                            # No limit on emotion history for long sessions (3-4 hours)
                            # Memory usage: ~1KB per snapshot = ~14.4MB for 4 hours
                            
                            last_emotion_snapshot = current_time
                        
                        frame = annotated_frame
                    except Exception as e:
                        print(f"Error in emotion detection: {e}")
                
                # Encode frame as JPEG
                ret, buffer = cv2.imencode('.jpg', frame)
                if ret:
                    frame_bytes = buffer.tobytes()
                    
                    # Yield frame in multipart format
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            else:
                print("No frame received from camera")
                break
        except Exception as e:
            print(f"Error generating frame: {e}")
            break


@app.route('/api/camera/stream')
def video_stream():
    """Video streaming route. Returns MJPEG stream"""
    if not CAMERA_SYSTEM_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Camera system not available'
        }), 200
    
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/emotions', methods=['GET'])
def get_emotions():
    """Get current emotion detection statistics"""
    global current_emotion_stats
    
    return jsonify({
        'success': True,
        'data': current_emotion_stats
    }), 200


@app.route('/api/emotions/history', methods=['GET'])
def get_emotion_history():
    """Get emotion history for analytics (averaged over time)"""
    global emotion_history
    
    if not emotion_history:
        return jsonify({
            'success': True,
            'average_emotions': {'Happy': 0, 'Surprise': 0, 'Neutral': 0, 'Sad': 0, 'Angry': 0, 'Disgust': 0, 'Fear': 0},
            'total_snapshots': 0,
            'time_range': 'No data'
        }), 200
    
    # Calculate average emotion percentages
    emotion_sums = {'Happy': 0, 'Surprise': 0, 'Neutral': 0, 'Sad': 0, 'Angry': 0, 'Disgust': 0, 'Fear': 0}
    count = len(emotion_history)
    
    for snapshot in emotion_history:
        for emotion, value in snapshot['emotion_percentages'].items():
            emotion_sums[emotion] += value
    
    # Calculate averages
    average_emotions = {emotion: round(total / count, 1) for emotion, total in emotion_sums.items()}
    
    # Get time range
    start_time = emotion_history[0]['timestamp']
    end_time = emotion_history[-1]['timestamp']
    
    return jsonify({
        'success': True,
        'average_emotions': average_emotions,
        'total_snapshots': count,
        'time_range': f"{start_time} to {end_time}",
        'history': emotion_history[-100:]  # Return last 100 snapshots for visualization
    }), 200


@app.route('/api/emotions/clear', methods=['POST'])
def clear_emotion_history():
    """Clear emotion history"""
    global emotion_history
    emotion_history = []
    
    return jsonify({
        'success': True,
        'message': 'Emotion history cleared'
    }), 200

# =========================
# Gradient Boosting Prediction API
# =========================

@app.route('/api/prediction/forecast', methods=['GET'])
def get_forecast_prediction():
    """
    Get environmental forecasting using Gradient Boosting model
    Uses recent IoT sensor data to predict next values
    """
    from camera_system.iot_sensor import iot_sensor
    
    if not models_loaded:
        return jsonify({
            'success': False,
            'error': 'ML models not loaded'
        }), 503
    
    if not iot_enabled or not iot_sensor:
        return jsonify({
            'success': False,
            'error': 'IoT sensors not available'
        }), 503
    
    try:
        # Get recent data (last 30 readings minimum for feature engineering)
        recent_data = iot_sensor.get_recent_data(limit=30)
        
        if len(recent_data) < 20:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for prediction (need at least 20 readings)',
                'message': 'Please start IoT logging and wait for data collection',
                'data_points': len(recent_data)
            }), 200
        
        # Convert to DataFrame
        df = pd.DataFrame(recent_data)
        
        # Ensure required columns exist
        required_cols = ['temperature', 'humidity', 'gas', 'light', 'sound', 
                        'occupancy', 'high_engagement', 'low_engagement', 'hour', 'minute']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return jsonify({
                'success': False,
                'error': f'Missing required columns: {missing_cols}'
            }), 200
        
        # Define features (must match training)
        forecast_features = ['temperature', 'humidity', 'gas', 'light', 'sound']
        complementing_features = ['occupancy', 'high_engagement', 'low_engagement']
        
        # Create time series features
        df_engineered = create_time_series_features(df, forecast_features, complementing_features)
        
        if len(df_engineered) == 0:
            return jsonify({
                'success': False,
                'error': 'Feature engineering failed - insufficient data after rolling window processing',
                'raw_data_points': len(df)
            }), 200
        
        # Add time features to engineered dataframe
        df_engineered['hour'] = df['hour'].iloc[-len(df_engineered):].values
        df_engineered['minute'] = df['minute'].iloc[-len(df_engineered):].values
        
        # Check if all required feature columns exist
        missing_features = [col for col in feature_columns if col not in df_engineered.columns]
        if missing_features:
            print(f"[ML] Warning: Missing features: {missing_features[:10]}...")  # Log first 10
            return jsonify({
                'success': False,
                'error': f'Feature engineering produced missing columns ({len(missing_features)} missing)',
                'sample_missing': missing_features[:5]
            }), 200
        
        # Get latest feature row
        X_current = df_engineered[feature_columns].iloc[-1:].values
        X_current_scaled = gb_scaler.transform(X_current)
        
        # Predict next environmental values using Gradient Boosting
        future_values = gb_model.predict(X_current_scaled)[0]
        
        # Get current values for comparison
        current_row = df.iloc[-1]
        
        # Prepare RF input for comfort classification
        rf_input = pd.DataFrame([{
            'temperature': current_row['temperature'],
            'humidity': current_row['humidity'],
            'gas': current_row['gas'],
            'light': current_row['light'],
            'sound': current_row['sound'],
            'occupancy': current_row['occupancy'],
            'high_engagement': current_row['high_engagement'],
            'low_engagement': current_row['low_engagement'],
            'predicted_temperature': future_values[0],
            'predicted_humidity': future_values[1],
            'predicted_gas': future_values[2],
            'predicted_light': future_values[3],
            'predicted_sound': future_values[4],
            'hour': current_row['hour'],
            'minute': current_row['minute']
        }])
        
        # Predict comfort level
        comfort_prediction = rf_model.predict(rf_input)[0]
        comfort_proba = rf_model.predict_proba(rf_input)[0]
        actual_classes = rf_model.classes_
        
        # Get confidence
        pred_idx = np.where(actual_classes == comfort_prediction)[0][0]
        confidence = float(comfort_proba[pred_idx] * 100)
        
        # Generate recommendations
        recommendations = []
        if future_values[0] > 24:
            recommendations.append({'type': 'warning', 'message': 'Temperature rising - Consider cooling'})
        elif future_values[0] < 22:
            recommendations.append({'type': 'warning', 'message': 'Temperature dropping - Reduce cooling'})
        
        if future_values[2] > 800:
            recommendations.append({'type': 'alert', 'message': 'CO₂ levels high - Ventilation needed'})
        
        if future_values[1] < 30:
            recommendations.append({'type': 'warning', 'message': 'Low humidity - Consider humidifier'})
        elif future_values[1] > 50:
            recommendations.append({'type': 'warning', 'message': 'High humidity - Ventilation needed'})
        
        if future_values[3] < 150:
            recommendations.append({'type': 'info', 'message': 'Low light - Increase lighting'})
        elif future_values[3] > 250:
            recommendations.append({'type': 'info', 'message': 'Bright lighting - Consider dimming'})
        
        if current_row['low_engagement'] > current_row['high_engagement']:
            recommendations.append({'type': 'warning', 'message': 'Low student engagement detected'})
        
        if comfort_prediction <= 1:
            recommendations.append({'type': 'alert', 'message': 'ALERT: Uncomfortable conditions predicted'})
        
        if not recommendations:
            recommendations.append({'type': 'success', 'message': 'All conditions optimal'})
        
        # Calculate probabilities for all comfort levels
        comfort_probabilities = {}
        for i, cls in enumerate(actual_classes):
            comfort_probabilities[comfort_labels_map[cls]] = float(comfort_proba[i] * 100)
        
        # Return prediction results
        return jsonify({
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'current': {
                'temperature': float(current_row['temperature']),
                'humidity': float(current_row['humidity']),
                'gas': int(current_row['gas']),
                'light': float(current_row['light']),
                'sound': int(current_row['sound']),
                'occupancy': int(current_row['occupancy']),
                'high_engagement': int(current_row['high_engagement']),
                'low_engagement': int(current_row['low_engagement'])
            },
            'predicted': {
                'temperature': float(future_values[0]),
                'humidity': float(future_values[1]),
                'gas': int(future_values[2]),
                'light': float(future_values[3]),
                'sound': int(future_values[4]),
                'delta_temperature': float(future_values[0] - current_row['temperature']),
                'delta_humidity': float(future_values[1] - current_row['humidity']),
                'delta_gas': int(future_values[2] - current_row['gas']),
                'delta_light': float(future_values[3] - current_row['light']),
                'delta_sound': int(future_values[4] - current_row['sound'])
            },
            'comfort': {
                'level': comfort_labels_map[comfort_prediction],
                'level_code': int(comfort_prediction),
                'confidence': round(confidence, 1),
                'probabilities': comfort_probabilities
            },
            'recommendations': recommendations,
            'data_points_used': len(recent_data)
        }), 200
        
    except Exception as e:
        print(f"[ML] Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Prediction failed: {str(e)}'
        }), 500


@app.route('/api/prediction/status', methods=['GET'])
def get_prediction_status():
    """Get prediction system status including memory buffer"""
    from camera_system.iot_sensor import iot_sensor
    
    buffer_status = {'buffer_size': 0, 'max_size': 100, 'ready_for_forecast': False, 'readings_needed': 20}
    if iot_sensor and hasattr(iot_sensor, 'get_memory_buffer_status'):
        buffer_status = iot_sensor.get_memory_buffer_status()
    
    return jsonify({
        'models_loaded': models_loaded,
        'iot_enabled': iot_enabled,
        'iot_connected': iot_sensor.is_connected if iot_sensor else False,
        'db_logging': iot_sensor.db_logging_enabled if iot_sensor else False,
        'memory_buffer': buffer_status,
        'ready': models_loaded and iot_enabled and buffer_status.get('ready_for_forecast', False)
    }), 200


@app.route('/api/alerts/check', methods=['GET'])
def check_alerts():
    """
    Check for alert conditions based on predictions and IoT data
    Returns alerts that should be displayed to the user
    """
    from camera_system.iot_sensor import iot_sensor
    
    alerts = []
    
    try:
        # Check if models are ready
        if not models_loaded or not iot_enabled or not iot_sensor:
            return jsonify({
                'success': True,
                'alerts': [],
                'message': 'System not ready for alerts'
            }), 200
        
        # Get recent data for prediction
        recent_data = iot_sensor.get_recent_data(limit=30)
        
        if len(recent_data) < 20:
            return jsonify({
                'success': True,
                'alerts': [],
                'message': 'Insufficient data for prediction'
            }), 200
        
        # Get prediction
        df = pd.DataFrame(recent_data)
        forecast_features = ['temperature', 'humidity', 'gas', 'light', 'sound']
        complementing_features = ['occupancy', 'high_engagement', 'low_engagement']
        
        df_engineered = create_time_series_features(df, forecast_features, complementing_features)
        
        if len(df_engineered) == 0:
            return jsonify({
                'success': True,
                'alerts': [],
                'message': 'Feature engineering failed'
            }), 200
        
        # Add time features
        df_engineered['hour'] = df['hour'].iloc[-len(df_engineered):].values
        df_engineered['minute'] = df['minute'].iloc[-len(df_engineered):].values
        
        # Check feature columns exist
        missing_features = [col for col in feature_columns if col not in df_engineered.columns]
        if missing_features:
            return jsonify({
                'success': True,
                'alerts': [],
                'message': 'Feature mismatch for prediction'
            }), 200
        
        X_current = df_engineered[feature_columns].iloc[-1:].values
        X_current_scaled = gb_scaler.transform(X_current)
        future_values = gb_model.predict(X_current_scaled)[0]
        current_row = df.iloc[-1]
        
        # Prepare RF input
        rf_input = pd.DataFrame([{
            'temperature': current_row['temperature'],
            'humidity': current_row['humidity'],
            'gas': current_row['gas'],
            'light': current_row['light'],
            'sound': current_row['sound'],
            'occupancy': current_row['occupancy'],
            'high_engagement': current_row['high_engagement'],
            'low_engagement': current_row['low_engagement'],
            'predicted_temperature': future_values[0],
            'predicted_humidity': future_values[1],
            'predicted_gas': future_values[2],
            'predicted_light': future_values[3],
            'predicted_sound': future_values[4],
            'hour': current_row['hour'],
            'minute': current_row['minute']
        }])
        
        comfort_prediction = rf_model.predict(rf_input)[0]
        
        # Generate alerts based on predictions and current conditions
        
        # Critical comfort alert
        if comfort_prediction == 0:  # Critical
            alerts.append({
                'id': 'comfort_critical',
                'type': 'error',
                'priority': 'high',
                'title': 'Critical Environment Conditions',
                'message': 'Classroom environment is predicted to be critical. Immediate action required.'
            })
        elif comfort_prediction == 1:  # Poor
            alerts.append({
                'id': 'comfort_poor',
                'type': 'warning',
                'priority': 'medium',
                'title': 'Poor Environment Conditions',
                'message': 'Classroom environment is below optimal. Consider adjustments.'
            })
        
        # Temperature alerts
        if future_values[0] > 26:
            alerts.append({
                'id': 'temp_high',
                'type': 'warning',
                'priority': 'medium',
                'title': 'High Temperature Alert',
                'message': f'Temperature predicted to reach {future_values[0]:.1f}°C. Consider cooling.'
            })
        elif future_values[0] < 20:
            alerts.append({
                'id': 'temp_low',
                'type': 'warning',
                'priority': 'low',
                'title': 'Low Temperature Alert',
                'message': f'Temperature predicted to drop to {future_values[0]:.1f}°C. Reduce cooling.'
            })
        
        # CO2/Gas alerts
        if future_values[2] > 1000:
            alerts.append({
                'id': 'co2_critical',
                'type': 'error',
                'priority': 'high',
                'title': 'High CO₂ Levels',
                'message': f'CO₂ levels predicted to reach {int(future_values[2])} ppm. Ventilation urgently needed.'
            })
        elif future_values[2] > 800:
            alerts.append({
                'id': 'co2_warning',
                'type': 'warning',
                'priority': 'medium',
                'title': 'Rising CO₂ Levels',
                'message': f'CO₂ levels predicted to reach {int(future_values[2])} ppm. Consider ventilation.'
            })
        
        # Humidity alerts
        if future_values[1] < 30:
            alerts.append({
                'id': 'humidity_low',
                'type': 'info',
                'priority': 'low',
                'title': 'Low Humidity',
                'message': f'Humidity predicted to drop to {future_values[1]:.1f}%. Consider humidifier.'
            })
        elif future_values[1] > 60:
            alerts.append({
                'id': 'humidity_high',
                'type': 'warning',
                'priority': 'medium',
                'title': 'High Humidity',
                'message': f'Humidity predicted to reach {future_values[1]:.1f}%. Ventilation recommended.'
            })
        
        # Light alerts
        if future_values[3] < 100:
            alerts.append({
                'id': 'light_low',
                'type': 'info',
                'priority': 'low',
                'title': 'Low Lighting',
                'message': f'Light level predicted at {int(future_values[3])} lux. Increase lighting.'
            })
        
        # Engagement alerts
        if current_row['low_engagement'] > current_row['high_engagement'] and current_row['occupancy'] > 0:
            engagement_ratio = current_row['low_engagement'] / (current_row['high_engagement'] + current_row['low_engagement'] + 1) * 100
            alerts.append({
                'id': 'engagement_low',
                'type': 'warning',
                'priority': 'medium',
                'title': 'Low Student Engagement',
                'message': f'{engagement_ratio:.0f}% of students showing low engagement. Consider intervention.'
            })
        
        return jsonify({
            'success': True,
            'alerts': alerts,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"[Alerts] Error checking alerts: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'alerts': []
        }), 200  # Return 200 to prevent frontend errors


# =========================
# Error Handlers
# =========================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


# =========================
# Health Check
# =========================

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }), 200


# =========================
# Main Entry Point
# =========================

if __name__ == '__main__':
    print("=" * 50)
    print("🎓 Smart Classroom Backend Server")
    print("=" * 50)
    print("Server running on: http://localhost:5000")
    print("API endpoints available at: http://localhost:5000/api/")
    print("=" * 50)
    # Disable debug mode to prevent auto-reload conflicts with serial port
    # Use 'use_reloader=False' to keep IoT connection stable
    app.run(debug=False, use_reloader=False, host='0.0.0.0', port=5000)
