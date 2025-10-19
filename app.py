"""
Smart Classroom Flask Backend
A clean and organized Flask API for the Smart Classroom application
"""

from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import sys
import random
import cv2

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
    'attendance': [],
    'engagement_history': [],
    'environment_data': [],
    'current_stats': {
        'totalStudents': 32,
        'presentToday': 28,
        'studentsDetected': 28,
        'avgEngagement': 78,
        'attentionLevel': 82,
        'lookingAtBoard': 23,
        'takingNotes': 18,
        'distracted': 5,
        'tired': 2
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


@app.route('/api/dashboard/attendance', methods=['GET'])
def get_attendance_data():
    """Get attendance data"""
    attendance = {
        'present': 28,
        'absent': 4,
        'total': 32,
        'percentage': 87.5,
        'recent': [
            {'date': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'), 
             'present': random.randint(25, 32)} 
            for i in range(7)
        ]
    }
    return jsonify(attendance), 200


@app.route('/api/dashboard/environment', methods=['GET'])
def get_environment_data():
    """Get environmental monitoring data"""
    environment = {
        'temperature': round(random.uniform(22, 26), 1),
        'humidity': random.randint(45, 65),
        'co2': random.randint(400, 800),
        'lightLevel': random.randint(300, 500),
        'noiseLevel': random.randint(30, 50),
        'status': 'optimal',
        'timestamp': datetime.now().isoformat()
    }
    return jsonify(environment), 200


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
            'attendance': random.randint(75, 95),
            'engagement': random.randint(65, 90),
            'status': random.choice(['present', 'absent'])
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
        'attendance': random.randint(75, 95),
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
    """Get engagement trends over time"""
    days = request.args.get('days', default=7, type=int)
    
    trends = {
        'period': f'Last {days} days',
        'data': [
            {
                'date': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
                'avgEngagement': random.randint(65, 85),
                'highlyEngaged': random.randint(15, 25),
                'disengaged': random.randint(2, 8)
            }
            for i in range(days, 0, -1)
        ]
    }
    return jsonify(trends), 200


@app.route('/api/analytics/attendance-report', methods=['GET'])
def get_attendance_report():
    """Get detailed attendance report"""
    month = request.args.get('month', default=datetime.now().month, type=int)
    
    report = {
        'month': month,
        'totalClasses': 20,
        'avgAttendance': 87.5,
        'dailyData': [
            {
                'date': f'2024-{month:02d}-{i:02d}',
                'present': random.randint(25, 32),
                'absent': random.randint(0, 7)
            }
            for i in range(1, 21)
        ]
    }
    return jsonify(report), 200


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
    CAMERA_SYSTEM_AVAILABLE = True
    print("✓ Camera system loaded successfully")
except ImportError as e:
    print(f"Warning: Camera system not available: {e}")
    CAMERA_SYSTEM_AVAILABLE = False
    CameraDetector = None
    CameraStream = None
    EmotionDetector = None

# Global camera stream instance and emotion detector
active_camera_stream = None
emotion_detector = None
current_emotion_stats = {
    'total_faces': 0,
    'emotions': {'Angry': 0, 'Disgust': 0, 'Fear': 0, 'Happy': 0, 'Sad': 0, 'Surprise': 0, 'Neutral': 0},
    'emotion_percentages': {'Angry': 0, 'Disgust': 0, 'Fear': 0, 'Happy': 0, 'Sad': 0, 'Surprise': 0, 'Neutral': 0},
    'engagement': 0
}

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
    global active_camera_stream
    
    try:
        if active_camera_stream:
            active_camera_stream.stop()
            active_camera_stream = None
            
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
        if active_camera_stream and active_camera_stream.is_running:
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
                break
        else:
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
    app.run(debug=True, host='0.0.0.0', port=5000)
