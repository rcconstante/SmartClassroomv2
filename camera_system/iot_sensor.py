"""
IoT Sensor Integration Module
Receives and processes environmental data from Arduino sensors

Sensors Supported:
- DHT22: Temperature and Humidity
- BH1750: Light intensity (Lux)
- Grove Loudness Sensor: Sound level
- MQ135: Air quality (Gas/CO2)
"""

import serial
import serial.tools.list_ports
import threading
import time
import re
from typing import Dict, Optional, List
from datetime import datetime
import queue
import sqlite3
import os
import numpy as np


# =========================
# Sensor Conversion Constants (from conversion.py)
# =========================

# MQ135 Gas Sensor Constants
MQ135_RL = 10.0   # Load resistor in kΩ
MQ135_R0 = 9.83   # Calibrated R0 (adjust based on your sensor calibration)

def mq135_getPPM(rawADC: float) -> float:
    """
    Convert raw MQ135 ADC value to CO2/Gas PPM
    
    Args:
        rawADC: Raw ADC value from ESP32 (0-4095)
    
    Returns:
        Estimated CO2/Gas concentration in PPM
    """
    if rawADC <= 0:
        return 0.0
    
    Vadc = rawADC * (3.3 / 4095.0)
    if Vadc <= 0:
        return 0.0
    
    Rs = (3.3 - Vadc) * MQ135_RL / Vadc
    ratio = Rs / MQ135_R0
    ppm = 116.6020682 * np.power(ratio, -2.769034857)
    return round(ppm, 2)


def getDBA(soundRaw: float) -> float:
    """
    Convert raw sound sensor ADC value to dBA (decibels A-weighted)
    
    Args:
        soundRaw: Raw ADC value from ESP32 (0-4095)
    
    Returns:
        Sound level in dBA
    """
    if soundRaw <= 0:
        return 0.0
    
    centered = soundRaw - 2048  # ESP32 midpoint
    voltage = np.sqrt(centered**2) * (3.3 / 4095.0)
    
    # Avoid log of zero
    if voltage <= 0:
        return 0.0
    
    dBA = 20.0 * np.log10(voltage / 0.00631)
    return round(dBA, 1)


class IoTSensorReader:
    """
    Reads environmental sensor data from Arduino via Serial
    
    Expected Arduino Output Format:
    ---- Sensor Readings ----
    Humidity: 65.4 %
    Temperature: 23.5 °C
    Light: 450.2 lux
    Sound: 1245
    Gas (MQ135): 678
    --------------------------
    """
    
    def __init__(self, port: str = None, baudrate: int = 9600):
        self.port = port
        self.baudrate = baudrate
        self.serial_connection = None
        self.is_connected = False
        self.is_reading = False
        self.reading_thread = None
        self.data_queue = queue.Queue(maxsize=0)  # Unlimited queue for long sessions
        
        # Database logging attributes
        self.db_logging_enabled = False
        self.db_connection = None
        self.db_file = None
        self.db_session_id = None
        
        # Current sensor data
        self.current_data = {
            'temperature': None,
            'humidity': None,
            'light': None,
            'sound': None,
            'gas': None,
            'timestamp': None,
            'raw_temperature': None,
            'raw_humidity': None,
            'raw_light': None,
            'raw_sound': None,
            'raw_gas': None,
            # Converted sensor values
            'sound_dba': None,      # Sound in dBA
            'gas_ppm': None,        # Gas/CO2 in PPM
            'occupancy': 0,
            'happy': 0,
            'surprise': 0,
            'neutral': 0,
            'sad': 0,
            'angry': 0,
            'disgust': 0,
            'fear': 0
        }
        
        # Calibration ranges for normalization
        self.ranges = {
            'temperature': (15, 35),    # °C (comfortable classroom range)
            'humidity': (30, 70),       # % (comfortable range)
            'light': (0, 1000),         # lux (0=dark, 1000=bright)
            'sound': (0, 4095),         # ADC value (0-4095 for ESP32)
            'gas': (0, 4095)            # ADC value (0-4095 for ESP32)
        }
        
        # Quality thresholds
        self.thresholds = {
            'temperature': {'min': 18, 'max': 28, 'optimal': (20, 25)},
            'humidity': {'min': 40, 'max': 60, 'optimal': (45, 55)},
            'light': {'min': 300, 'max': 700, 'optimal': (400, 600)},
            'sound': {'max': 2500},  # Relative quiet
            'gas': {'max': 1500}     # Good air quality
        }
        
    def list_available_ports(self) -> List[str]:
        """List all available serial ports"""
        ports = serial.tools.list_ports.comports()
        available = []
        for port in ports:
            available.append(f"{port.device} - {port.description}")
        return available
    
    def connect(self, port: str = None, max_retries: int = 3) -> bool:
        """
        Connect to Arduino via serial port with retry logic
        
        Args:
            port: Serial port (e.g., 'COM3' on Windows, '/dev/ttyUSB0' on Linux)
            max_retries: Maximum number of connection attempts
        
        Returns:
            True if connected successfully
        """
        # If already connected to this port, return success
        if self.is_connected and self.serial_connection and self.serial_connection.is_open:
            if port is None or port == self.port:
                return True
        
        if port:
            self.port = port
        
        if not self.port:
            # Try to auto-detect Arduino/ESP32
            ports = serial.tools.list_ports.comports()
            for p in ports:
                desc = p.description.upper()
                if any(keyword in desc for keyword in ['ARDUINO', 'CH340', 'CP210', 'ESP32', 'USB-SERIAL', 'UART']):
                    self.port = p.device
                    print(f"[IoT] Auto-detected device on {self.port} ({p.description})")
                    break
        
        if not self.port:
            print("[IoT] No Arduino port specified or detected")
            return False
        
        # Try connecting with retries
        for attempt in range(max_retries):
            try:
                # Close any existing connection first
                if self.serial_connection and self.serial_connection.is_open:
                    try:
                        self.serial_connection.close()
                        time.sleep(0.5)
                    except:
                        pass
                
                self.serial_connection = serial.Serial(
                    port=self.port,
                    baudrate=self.baudrate,
                    timeout=1
                )
                time.sleep(2)  # Wait for Arduino to reset
                self.is_connected = True
                print(f"[IoT] ✓ Connected to Arduino on {self.port}")
                return True
                
            except PermissionError as e:
                print(f"[IoT] ✗ Port {self.port} is BLOCKED by another application (Attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    print(f"[IoT] Retrying in 2 seconds...")
                    time.sleep(2)
                else:
                    print(f"\n[IoT] ═══════════════════════════════════════════════════")
                    print(f"[IoT] ✗ CANNOT ACCESS PORT {self.port}")
                    print(f"[IoT] ")
                    print(f"[IoT] SOLUTION: Close Arduino IDE Serial Monitor!")
                    print(f"[IoT] Only ONE program can use the serial port at a time.")
                    print(f"[IoT] ")
                    print(f"[IoT] Steps:")
                    print(f"[IoT]   1. Close Arduino IDE Serial Monitor")
                    print(f"[IoT]   2. Keep Arduino IDE closed or minimize it")
                    print(f"[IoT]   3. Restart this Flask application")
                    print(f"[IoT] ═══════════════════════════════════════════════════\n")
                    self.is_connected = False
                    return False
                    
            except serial.SerialException as e:
                if "PermissionError" in str(e) or "Access is denied" in str(e) or "in use" in str(e).lower():
                    print(f"[IoT] ✗ Port {self.port} is in use (Attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                    else:
                        print(f"\n[IoT] ═══════════════════════════════════════════════════")
                        print(f"[IoT] ✗ PORT IN USE: {self.port}")
                        print(f"[IoT] ")
                        print(f"[IoT] Close Arduino IDE Serial Monitor and restart Flask!")
                        print(f"[IoT] ═══════════════════════════════════════════════════\n")
                        self.is_connected = False
                        return False
                else:
                    print(f"[IoT] ✗ Serial error on {self.port}: {e}")
                    print(f"[IoT] Make sure Arduino is connected and sketch is uploaded")
                    self.is_connected = False
                    return False
                    
            except Exception as e:
                print(f"[IoT] Connection failed on attempt {attempt + 1}: {e}")
                if attempt >= max_retries - 1:
                    self.is_connected = False
                    return False
                time.sleep(1)
        
        return False
    
    def disconnect(self):
        """Disconnect from Arduino"""
        self.stop_reading()
        if self.serial_connection and self.serial_connection.is_open:
            self.serial_connection.close()
        self.is_connected = False
        print("[IoT] Disconnected from Arduino")
    
    def parse_sensor_line(self, line: str) -> Optional[tuple]:
        """
        Parse a line of sensor data
        
        Args:
            line: Raw line from serial (e.g., "Humidity: 65.4 %")
        
        Returns:
            Tuple of (sensor_name, value) or None
        """
        line = line.strip()
        
        # Parse different sensor formats
        patterns = {
            'humidity': r'Humidity:\s*([\d.]+)',
            'temperature': r'Temperature:\s*([\d.]+)',
            'light': r'Light:\s*([\d.]+)',
            'sound': r'Sound:\s*([\d]+)',
            'gas': r'Gas.*:\s*([\d]+)'
        }
        
        for sensor, pattern in patterns.items():
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                try:
                    value = float(match.group(1))
                    return (sensor, value)
                except ValueError:
                    pass
        
        return None
    
    def normalize_value(self, sensor: str, value: float) -> float:
        """
        Normalize sensor value to 0-100 range
        
        Args:
            sensor: Sensor name
            value: Raw sensor value
        
        Returns:
            Normalized value (0-100)
        """
        if value is None:
            return 50.0  # Default middle value
        
        min_val, max_val = self.ranges.get(sensor, (0, 100))
        
        # Clamp value to range
        value = max(min_val, min(max_val, value))
        
        # Normalize to 0-100
        normalized = ((value - min_val) / (max_val - min_val)) * 100
        return round(normalized, 2)
    
    def calculate_environmental_score(self) -> float:
        """
        Calculate overall environmental quality score (0-100)
        
        Based on how close sensors are to optimal ranges
        """
        if not all([self.current_data['temperature'], 
                   self.current_data['humidity'], 
                   self.current_data['light']]):
            return 50.0  # Default if no data
        
        scores = []
        
        # Temperature score
        temp = self.current_data['raw_temperature']
        if temp:
            opt_min, opt_max = self.thresholds['temperature']['optimal']
            if opt_min <= temp <= opt_max:
                temp_score = 100
            else:
                # Distance from optimal range
                if temp < opt_min:
                    temp_score = max(0, 100 - abs(temp - opt_min) * 10)
                else:
                    temp_score = max(0, 100 - abs(temp - opt_max) * 10)
            scores.append(temp_score)
        
        # Humidity score
        humidity = self.current_data['raw_humidity']
        if humidity:
            opt_min, opt_max = self.thresholds['humidity']['optimal']
            if opt_min <= humidity <= opt_max:
                hum_score = 100
            else:
                if humidity < opt_min:
                    hum_score = max(0, 100 - abs(humidity - opt_min) * 2)
                else:
                    hum_score = max(0, 100 - abs(humidity - opt_max) * 2)
            scores.append(hum_score)
        
        # Light score
        light = self.current_data['raw_light']
        if light:
            opt_min, opt_max = self.thresholds['light']['optimal']
            if opt_min <= light <= opt_max:
                light_score = 100
            else:
                if light < opt_min:
                    light_score = max(0, 100 - abs(light - opt_min) / 4)
                else:
                    light_score = max(0, 100 - abs(light - opt_max) / 4)
            scores.append(light_score)
        
        # Sound score (lower is better)
        sound = self.current_data['raw_sound']
        if sound:
            max_sound = self.thresholds['sound']['max']
            if sound <= max_sound:
                sound_score = 100
            else:
                sound_score = max(0, 100 - (sound - max_sound) / 20)
            scores.append(sound_score)
        
        # Gas score (lower is better)
        gas = self.current_data['raw_gas']
        if gas:
            max_gas = self.thresholds['gas']['max']
            if gas <= max_gas:
                gas_score = 100
            else:
                gas_score = max(0, 100 - (gas - max_gas) / 20)
            scores.append(gas_score)
        
        # Average of all scores
        if scores:
            return round(sum(scores) / len(scores), 2)
        return 50.0
    
    def read_sensors(self):
        """Background thread to continuously read sensor data"""
        print("[IoT] Starting sensor reading thread...")
        print("[IoT] Waiting for data from Arduino...")
        
        last_db_write = time.time()
        last_debug_print = time.time()
        db_interval = 1  # Write to database every 1 second
        debug_interval = 10  # Print debug info every 10 seconds
        
        while self.is_reading:
            try:
                if self.serial_connection and self.serial_connection.in_waiting > 0:
                    line = self.serial_connection.readline().decode('utf-8', errors='ignore')
                    
                    # Debug: Print raw line occasionally
                    current_time = time.time()
                    if current_time - last_debug_print >= debug_interval:
                        print(f"[IoT] Raw data sample: {line.strip()}")
                        last_debug_print = current_time
                    
                    # Parse sensor data
                    result = self.parse_sensor_line(line)
                    if result:
                        sensor_name, value = result
                        
                        # Store raw value
                        self.current_data[f'raw_{sensor_name}'] = value
                        
                        # Normalize and store
                        normalized = self.normalize_value(sensor_name, value)
                        self.current_data[sensor_name] = normalized
                        self.current_data['timestamp'] = datetime.now()
                        
                        # Apply conversions for sound and gas sensors
                        if sensor_name == 'sound':
                            self.current_data['sound_dba'] = getDBA(value)
                        elif sensor_name == 'gas':
                            self.current_data['gas_ppm'] = mq135_getPPM(value)
                        
                        # Calculate environmental score
                        env_score = self.calculate_environmental_score()
                        self.current_data['environmental_score'] = env_score
                        
                        # Debug: Print first successful data read
                        if not hasattr(self, '_first_data_received'):
                            print(f"[IoT] ✓ First data received: {sensor_name} = {value}")
                            self._first_data_received = True
                        
                        # Add to queue for processing
                        try:
                            self.data_queue.put_nowait(self.current_data.copy())
                        except queue.Full:
                            pass  # Queue full, skip this reading
                        
                        # Write to SQLite database immediately when we have all sensor readings
                        if self.db_logging_enabled:
                            # Check if we have all required sensor data (complete reading from Arduino)
                            required_sensors = ['raw_temperature', 'raw_humidity', 'raw_light', 'raw_sound', 'raw_gas']
                            if all(key in self.current_data for key in required_sensors):
                                try:
                                    cursor = self.db_connection.cursor()
                                    cursor.execute('''
                                        INSERT INTO sensor_data 
                                        (timestamp, session_id, temperature, humidity, light, sound, gas, 
                                         environmental_score, temperature_norm, humidity_norm, light_norm, 
                                         sound_norm, gas_norm, occupancy, happy, surprise, neutral, sad, angry, disgust, fear)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    ''', (
                                        self.current_data['timestamp'].isoformat(),
                                        self.db_session_id,
                                        round(self.current_data.get('raw_temperature', 0), 1),
                                        round(self.current_data.get('raw_humidity', 0), 1),
                                        round(self.current_data.get('raw_light', 0), 1),
                                        self.current_data.get('raw_sound', 0),
                                        self.current_data.get('raw_gas', 0),
                                        round(self.current_data.get('environmental_score', 0), 1),
                                        round(self.current_data.get('temperature', 0), 1),
                                        round(self.current_data.get('humidity', 0), 1),
                                        round(self.current_data.get('light', 0), 1),
                                        round(self.current_data.get('sound', 0), 1),
                                        round(self.current_data.get('gas', 0), 1),
                                        self.current_data.get('occupancy', 0),
                                        int(self.current_data.get('happy', 0)),
                                        int(self.current_data.get('surprise', 0)),
                                        int(self.current_data.get('neutral', 0)),
                                        int(self.current_data.get('sad', 0)),
                                        int(self.current_data.get('angry', 0)),
                                        int(self.current_data.get('disgust', 0)),
                                        int(self.current_data.get('fear', 0))
                                    ))
                                    self.db_connection.commit()
                                    
                                    # Get record count
                                    cursor.execute('SELECT COUNT(*) FROM sensor_data WHERE session_id = ?', 
                                                 (self.db_session_id,))
                                    count = cursor.fetchone()[0]
                                    print(f"[IoT] ✓ Data logged to SQLite at {self.current_data['timestamp'].strftime('%H:%M:%S')} (Record #{count})")
                                    
                                    # Clear sensor data after logging to avoid duplicate logs
                                    for sensor in required_sensors:
                                        if sensor in self.current_data:
                                            del self.current_data[sensor]
                                except Exception as e:
                                    print(f"[IoT] ✗ Database write error: {e}")
                
                time.sleep(0.1)  # Small delay
                
            except Exception as e:
                print(f"[IoT] Read error: {e}")
                time.sleep(1)
    
    def start_reading(self):
        """Start reading sensor data in background thread"""
        if not self.is_connected:
            print("[IoT] Not connected. Call connect() first.")
            return False
        
        if self.is_reading:
            print("[IoT] Already reading")
            return True
        
        self.is_reading = True
        self.reading_thread = threading.Thread(target=self.read_sensors, daemon=True)
        self.reading_thread.start()
        print("[IoT] Sensor reading started")
        return True
    
    def stop_reading(self):
        """Stop reading sensor data"""
        self.is_reading = False
        if self.reading_thread:
            self.reading_thread.join(timeout=2)
        
        # Stop database logging if active
        if self.db_logging_enabled:
            self.stop_db_logging()
        
        print("[IoT] Sensor reading stopped")
    
    def get_current_data(self) -> Dict:
        """Get the most recent sensor readings"""
        return self.current_data.copy()
    
    def update_cv_data(self, occupancy: int, emotion_counts: Dict):
        """
        Update computer vision data for logging
        
        Args:
            occupancy: Number of students detected
            emotion_counts: Dictionary with emotion COUNTS (not percentages) - each face adds 1 to its dominant emotion
                          e.g., {'Happy': 2, 'Neutral': 1, 'Sad': 0, ...}
        """
        self.current_data['occupancy'] = occupancy
        # Store counts directly (integers, not percentages)
        self.current_data['happy'] = emotion_counts.get('Happy', 0)
        self.current_data['surprise'] = emotion_counts.get('Surprise', 0)
        self.current_data['neutral'] = emotion_counts.get('Neutral', 0)
        self.current_data['sad'] = emotion_counts.get('Sad', 0)
        self.current_data['angry'] = emotion_counts.get('Angry', 0)
        self.current_data['disgust'] = emotion_counts.get('Disgust', 0)
        self.current_data['fear'] = emotion_counts.get('Fear', 0)
    
    def get_status(self) -> Dict:
        """Get sensor system status"""
        return {
            'connected': self.is_connected,
            'reading': self.is_reading,
            'port': self.port,
            'has_data': self.current_data['timestamp'] is not None,
            'last_update': self.current_data['timestamp'].isoformat() if self.current_data['timestamp'] else None,
            'data_quality': self.calculate_environmental_score()
        }
    
    def start_db_logging(self) -> Dict:
        """Start logging to a new SQLite database and begin sensor data gathering"""
        if self.db_logging_enabled:
            return {
                'success': False,
                'message': 'Database logging already active',
                'db_file': self.db_file
            }
        
        # Check if connected to Arduino
        if not self.is_connected:
            return {
                'success': False,
                'message': 'IoT sensors not connected'
            }
        
        try:
            # Create data directory if it doesn't exist
            os.makedirs('data', exist_ok=True)
            
            # Create new database file with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            self.db_file = f'data/iot_log_{timestamp}.db'
            self.db_session_id = timestamp
            
            # Connect to database
            self.db_connection = sqlite3.connect(self.db_file, check_same_thread=False)
            cursor = self.db_connection.cursor()
            
            # Create table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sensor_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    temperature REAL,
                    humidity REAL,
                    light REAL,
                    sound INTEGER,
                    gas INTEGER,
                    environmental_score REAL,
                    temperature_norm REAL,
                    humidity_norm REAL,
                    light_norm REAL,
                    sound_norm REAL,
                    gas_norm REAL,
                    occupancy INTEGER DEFAULT 0,
                    happy INTEGER DEFAULT 0,
                    surprise INTEGER DEFAULT 0,
                    neutral INTEGER DEFAULT 0,
                    sad INTEGER DEFAULT 0,
                    angry INTEGER DEFAULT 0,
                    disgust INTEGER DEFAULT 0,
                    fear INTEGER DEFAULT 0
                )
            ''')
            
            # Create index for faster queries
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_data(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_session ON sensor_data(session_id)')
            
            self.db_connection.commit()
            
            self.db_logging_enabled = True
            
            # Start sensor reading thread if not already running
            if not self.is_reading:
                self.start_reading()
                print(f"[IoT] ✓ Sensor data gathering started")
            
            print(f"[IoT] ✓ Database logging started: {self.db_file}")
            
            return {
                'success': True,
                'message': 'Database logging started',
                'db_file': self.db_file,
                'session_id': self.db_session_id
            }
            
        except Exception as e:
            print(f"[IoT] ✗ Failed to start database logging: {e}")
            return {
                'success': False,
                'message': f'Failed to start database logging: {str(e)}'
            }
    
    def stop_db_logging(self) -> Dict:
        """Stop database logging and sensor data gathering"""
        if not self.db_logging_enabled:
            return {
                'success': False,
                'message': 'Database logging not active'
            }
        
        try:
            # Stop sensor reading thread
            if self.is_reading:
                self.is_reading = False
                if self.reading_thread:
                    self.reading_thread.join(timeout=2)
                print(f"[IoT] ✓ Sensor data gathering stopped")
            
            if self.db_connection:
                # Get final record count
                cursor = self.db_connection.cursor()
                cursor.execute('SELECT COUNT(*) FROM sensor_data WHERE session_id = ?', (self.db_session_id,))
                record_count = cursor.fetchone()[0]
                
                self.db_connection.close()
                self.db_connection = None
            
            db_file = self.db_file
            self.db_logging_enabled = False
            self.db_file = None
            self.db_session_id = None
            
            print(f"[IoT] ✓ Database logging stopped: {db_file} ({record_count} records)")
            
            return {
                'success': True,
                'message': 'Database logging stopped',
                'db_file': db_file,
                'record_count': record_count
            }
            
        except Exception as e:
            print(f"[IoT] ✗ Failed to stop database logging: {e}")
            return {
                'success': False,
                'message': f'Failed to stop database logging: {str(e)}'
            }
    
    def get_db_logging_status(self) -> Dict:
        """Get current database logging status"""
        if not self.db_logging_enabled:
            return {
                'enabled': False,
                'db_file': None,
                'session_id': None,
                'record_count': 0
            }
        
        try:
            cursor = self.db_connection.cursor()
            cursor.execute('SELECT COUNT(*) FROM sensor_data WHERE session_id = ?', (self.db_session_id,))
            record_count = cursor.fetchone()[0]
            
            return {
                'enabled': True,
                'db_file': self.db_file,
                'session_id': self.db_session_id,
                'record_count': record_count
            }
        except:
            return {
                'enabled': True,
                'db_file': self.db_file,
                'session_id': self.db_session_id,
                'record_count': 0
            }
    
    def get_recent_data(self, limit: int = 30) -> List[Dict]:
        """
        Get recent sensor data from database for Gradient Boosting prediction
        Returns list of dicts with sensor readings and metadata
        """
        if not self.db_logging_enabled or not self.db_connection:
            return []
        
        try:
            cursor = self.db_connection.cursor()
            cursor.execute('''
                SELECT timestamp, temperature, humidity, light, sound, gas,
                       occupancy, happy, surprise, neutral, sad, angry, disgust, fear
                FROM sensor_data
                WHERE session_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (self.db_session_id, limit))
            
            rows = cursor.fetchall()
            
            # Convert to list of dicts (reverse to chronological order)
            data = []
            for row in reversed(rows):
                data.append({
                    'timestamp': row[0],
                    'temperature': row[1],
                    'humidity': row[2],
                    'light': row[3],
                    'sound': row[4],
                    'gas': row[5],
                    'occupancy': row[6],
                    'happy': row[7],
                    'surprise': row[8],
                    'neutral': row[9],
                    'sad': row[10],
                    'angry': row[11],
                    'disgust': row[12],
                    'fear': row[13],
                    # Add time features for model
                    'hour': datetime.fromisoformat(row[0]).hour if row[0] else 0,
                    'minute': datetime.fromisoformat(row[0]).minute if row[0] else 0,
                    'high_engagement': (row[7] or 0) + (row[8] or 0) + (row[9] or 0),  # happy + surprise + neutral
                    'low_engagement': (row[10] or 0) + (row[11] or 0) + (row[12] or 0) + (row[13] or 0)  # sad + angry + disgust + fear
                })
            
            return data
            
        except Exception as e:
            print(f"[IoT] Error getting recent data: {e}")
            return []
    
    def export_db_to_csv(self, output_file: str = None) -> Dict:
        """Export current SQLite database to CSV"""
        if not self.db_logging_enabled or not self.db_connection:
            return {
                'success': False,
                'message': 'No active database logging session'
            }
        
        try:
            import csv
            
            # Generate output filename if not provided
            if not output_file:
                output_file = self.db_file.replace('.db', '.csv')
            
            # Query all data
            cursor = self.db_connection.cursor()
            cursor.execute('''
                SELECT timestamp, temperature, humidity, light, sound, gas, 
                       environmental_score, occupancy, happy, surprise, neutral, 
                       sad, angry, disgust, fear
                FROM sensor_data
                WHERE session_id = ?
                ORDER BY timestamp
            ''', (self.db_session_id,))
            
            rows = cursor.fetchall()
            
            # Write to CSV
            with open(output_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['timestamp', 'temperature', 'humidity', 'light', 'sound', 'gas', 
                               'environmental_score', 'occupancy', 'happy', 'surprise', 'neutral', 
                               'sad', 'angry', 'disgust', 'fear'])
                writer.writerows(rows)
            
            print(f"[IoT] ✓ Exported {len(rows)} records to {output_file}")
            
            return {
                'success': True,
                'message': f'Exported {len(rows)} records',
                'csv_file': output_file,
                'record_count': len(rows)
            }
            
        except Exception as e:
            print(f"[IoT] ✗ Failed to export CSV: {e}")
            return {
                'success': False,
                'message': f'Failed to export CSV: {str(e)}'
            }
    
    def get_alerts(self) -> List[Dict]:
        """Check if any sensor values are outside acceptable ranges"""
        alerts = []
        
        # Temperature alerts
        temp = self.current_data['raw_temperature']
        if temp:
            if temp < self.thresholds['temperature']['min']:
                alerts.append({
                    'sensor': 'temperature',
                    'level': 'warning',
                    'message': f'Temperature too low: {temp}°C'
                })
            elif temp > self.thresholds['temperature']['max']:
                alerts.append({
                    'sensor': 'temperature',
                    'level': 'warning',
                    'message': f'Temperature too high: {temp}°C'
                })
        
        # Humidity alerts
        humidity = self.current_data['raw_humidity']
        if humidity:
            if humidity < self.thresholds['humidity']['min']:
                alerts.append({
                    'sensor': 'humidity',
                    'level': 'warning',
                    'message': f'Humidity too low: {humidity}%'
                })
            elif humidity > self.thresholds['humidity']['max']:
                alerts.append({
                    'sensor': 'humidity',
                    'level': 'warning',
                    'message': f'Humidity too high: {humidity}%'
                })
        
        # Light alerts
        light = self.current_data['raw_light']
        if light:
            if light < self.thresholds['light']['min']:
                alerts.append({
                    'sensor': 'light',
                    'level': 'info',
                    'message': f'Lighting too dim: {light} lux'
                })
            elif light > self.thresholds['light']['max']:
                alerts.append({
                    'sensor': 'light',
                    'level': 'info',
                    'message': f'Lighting too bright: {light} lux'
                })
        
        # Sound alerts
        sound = self.current_data['raw_sound']
        if sound and sound > self.thresholds['sound']['max']:
            alerts.append({
                'sensor': 'sound',
                'level': 'warning',
                'message': f'Classroom too noisy: {sound}'
            })
        
        # Gas alerts
        gas = self.current_data['raw_gas']
        if gas and gas > self.thresholds['gas']['max']:
            alerts.append({
                'sensor': 'gas',
                'level': 'alert',
                'message': f'Poor air quality detected: {gas}'
            })
        
        return alerts


# Global instance
iot_sensor = None

def initialize_iot(port: str = None, baudrate: int = 9600) -> bool:
    """
    Initialize IoT sensor reader with graceful fallback
    
    Note: This only connects to the Arduino, but does NOT start reading data.
    Data gathering will start when start_db_logging() is called from the UI.
    
    Args:
        port: Serial port (e.g., 'COM3')
        baudrate: Serial baud rate (default 115200)
    
    Returns:
        True if initialized successfully, False if not (system will use simulated data)
    """
    global iot_sensor
    
    try:
        iot_sensor = IoTSensorReader(port=port, baudrate=baudrate)
        
        if iot_sensor.connect():
            # Auto-start reading data immediately
            iot_sensor.start_reading()
            print("[IoT] ✓ IoT sensor system initialized and reading started")
            print(f"[IoT] ✓ Connected to {iot_sensor.port}")
            print("[IoT] ✓ Automatic data collection active")
            return True
        else:
            print("[IoT] ✗ Arduino not connected - IoT features disabled")
            print("[IoT] ")
            print("[IoT] To enable IoT sensors:")
            print("[IoT]   1. Close Arduino IDE Serial Monitor if open")
            print("[IoT]   2. Verify Arduino is connected via USB")
            print("[IoT]   3. Upload the sketch to your ESP32")
            print("[IoT]   4. Restart the Flask application")
            return False
    except Exception as e:
        print(f"[IoT] ✗ Initialization failed: {e}")
        print("[IoT] ✗ IoT features disabled")
        return False

def get_iot_data() -> Optional[Dict]:
    """Get current IoT sensor data"""
    global iot_sensor
    if iot_sensor:
        return iot_sensor.get_current_data()
    return None

def get_iot_status() -> Dict:
    """Get IoT system status"""
    global iot_sensor
    if iot_sensor:
        return iot_sensor.get_status()
    return {'connected': False, 'reading': False}

def get_iot_alerts() -> List[Dict]:
    """Get IoT sensor alerts"""
    global iot_sensor
    if iot_sensor:
        return iot_sensor.get_alerts()
    return []
