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
        self.data_queue = queue.Queue(maxsize=100)
        
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
            'raw_gas': None
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
    
    def connect(self, port: str = None) -> bool:
        """
        Connect to Arduino via serial port
        
        Args:
            port: Serial port (e.g., 'COM3' on Windows, '/dev/ttyUSB0' on Linux)
        
        Returns:
            True if connected successfully
        """
        if port:
            self.port = port
        
        if not self.port:
            # Try to auto-detect Arduino
            ports = serial.tools.list_ports.comports()
            for p in ports:
                if 'Arduino' in p.description or 'CH340' in p.description or 'USB' in p.description:
                    self.port = p.device
                    print(f"[IoT] Auto-detected Arduino on {self.port}")
                    break
        
        if not self.port:
            print("[IoT] No Arduino port specified or detected")
            return False
        
        try:
            self.serial_connection = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=1
            )
            time.sleep(2)  # Wait for Arduino to reset
            self.is_connected = True
            print(f"[IoT] Connected to Arduino on {self.port}")
            return True
        except Exception as e:
            print(f"[IoT] Connection failed: {e}")
            self.is_connected = False
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
        
        while self.is_reading:
            try:
                if self.serial_connection and self.serial_connection.in_waiting > 0:
                    line = self.serial_connection.readline().decode('utf-8', errors='ignore')
                    
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
                        
                        # Calculate environmental score
                        env_score = self.calculate_environmental_score()
                        self.current_data['environmental_score'] = env_score
                        
                        # Add to queue for processing
                        try:
                            self.data_queue.put_nowait(self.current_data.copy())
                        except queue.Full:
                            pass  # Queue full, skip this reading
                
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
        print("[IoT] Sensor reading stopped")
    
    def get_current_data(self) -> Dict:
        """Get the most recent sensor readings"""
        return self.current_data.copy()
    
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
    Initialize IoT sensor reader
    
    Args:
        port: Serial port (e.g., 'COM3')
        baudrate: Serial baud rate (default 9600)
    
    Returns:
        True if initialized successfully
    """
    global iot_sensor
    
    try:
        iot_sensor = IoTSensorReader(port=port, baudrate=baudrate)
        
        if iot_sensor.connect():
            iot_sensor.start_reading()
            print("[IoT] ✓ IoT sensor system initialized")
            return True
        else:
            print("[IoT] ✗ Failed to connect to Arduino")
            return False
    except Exception as e:
        print(f"[IoT] ✗ Initialization failed: {e}")
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
