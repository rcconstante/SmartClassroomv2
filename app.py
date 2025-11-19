"""
Smart Classroom Flask Backend
A clean and organized Flask API for the Smart Classroom application
"""

from flask import Flask, jsonify, request, send_from_directory, Response, send_file
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import sys
import random
import cv2
import sqlite3
import threading
import time

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
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production
app.config['JSON_SORT_KEYS'] = False

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
    """Get real-time engagement data"""
    # Generate mock data
    engagement_data = {
        'current': random.randint(65, 85),
        'history': [
            {
                'time': (datetime.now() - timedelta(minutes=i*5)).strftime('%H:%M'),
                'value': random.randint(60, 90)
            }
            for i in range(12, 0, -1)
        ],
        'breakdown': {
            'highly_engaged': random.randint(15, 25),
            'engaged': random.randint(5, 10),
            'disengaged': random.randint(2, 5)
        }
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
    
    # Format data for frontend
    return jsonify({
        'success': True,
        'data': {
            'temperature': round(data.get('raw_temperature', 0), 1),
            'humidity': round(data.get('raw_humidity', 0), 1),
            'light_level': round(data.get('raw_light', 0), 1),
            'air_quality': data.get('raw_gas', 0),
            'sound': data.get('raw_sound', 0),
            'environmental_score': round(data.get('environmental_score', 0), 1),
            'timestamp': data.get('timestamp').isoformat() if data.get('timestamp') else None
        }
    }), 200


@app.route('/api/iot/history', methods=['GET'])
def get_iot_history():
    """Get IoT sensor history data (all available readings)"""
    from camera_system.iot_sensor import iot_sensor
    
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
                history_data.append({
                    'timestamp': data.get('timestamp').isoformat(),
                    'temperature': round(data.get('raw_temperature', 0), 1),
                    'humidity': round(data.get('raw_humidity', 0), 1),
                    'light': round(data.get('raw_light', 0), 1),
                    'sound': data.get('raw_sound', 0),
                    'gas': data.get('raw_gas', 0),
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
            history_data.append({
                'timestamp': data.get('timestamp').isoformat(),
                'temperature': round(data.get('raw_temperature', 0), 1),
                'humidity': round(data.get('raw_humidity', 0), 1),
                'light': round(data.get('raw_light', 0), 1),
                'sound': data.get('raw_sound', 0),
                'gas': data.get('raw_gas', 0),
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
    """Get all students"""
    students = [
        {
            'id': i,
            'name': f'Student {i}',
            'rollNumber': f'SCR{2024000 + i}',
            'engagement': random.randint(65, 90),
            'status': 'present' if i <= 28 else 'absent'
        }
        for i in range(1, 33)
    ]
    return jsonify(students), 200


@app.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    """Get a specific student's details"""
    student = {
        'id': student_id,
        'name': f'Student {student_id}',
        'rollNumber': f'SCR{2024000 + student_id}',
        'email': f'student{student_id}@smartclassroom.edu',
        'engagement': random.randint(65, 90),
        'status': 'present',
        'joinedDate': '2024-01-15',
        'performanceHistory': [
            {
                'week': f'Week {i}',
                'engagement': random.randint(60, 95)
            }
            for i in range(1, 9)
        ]
    }
    return jsonify(student), 200


# =========================
# Routes - Settings
# =========================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get user settings"""
    settings = {
        'darkMode': False,
        'notifications': True,
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
    """Get engagement trends over time - Real data from current session"""
    days = request.args.get('days', default=7, type=int)
    
    # Get current engagement stats
    current_engagement = classroom_data['current_stats'].get('avgEngagement', 0)
    current_students = classroom_data['current_stats'].get('studentsDetected', 0)
    
    # Get emotion data
    emotion_data = current_emotion_stats.get('emotion_percentages', {})
    engaged_pct = emotion_data.get('Engaged', 0)
    disengaged_pct = (emotion_data.get('Bored', 0) + 
                      emotion_data.get('Looking Away', 0) + 
                      emotion_data.get('Drowsy', 0))
    
    trends = {
        'period': f'Last {days} days',
        'data': [
            {
                'date': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
                'avgEngagement': current_engagement if i == 0 else 0,
                'highlyEngaged': round(engaged_pct) if i == 0 else 0,
                'disengaged': round(disengaged_pct) if i == 0 else 0,
                'studentsPresent': current_students if i == 0 else 0
            }
            for i in range(days - 1, -1, -1)
        ]
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
