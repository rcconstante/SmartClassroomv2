# IoT Sensor Integration Guide

## Overview

This guide explains how to integrate Arduino-based environmental sensors with the Smart Classroom system. The IoT sensors monitor classroom environmental conditions (temperature, humidity, light, sound, air quality) and feed this data into the LSTM prediction model for comprehensive classroom analytics.

## Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Arduino Setup](#arduino-setup)
3. [Wiring Diagram](#wiring-diagram)
4. [Software Installation](#software-installation)
5. [Serial Communication Protocol](#serial-communication-protocol)
6. [Testing the Integration](#testing-the-integration)
7. [API Endpoints](#api-endpoints)
8. [Troubleshooting](#troubleshooting)

---

## Hardware Requirements

### Required Components

1. **Microcontroller**: Arduino Uno/Nano or ESP32
2. **Sensors**:
   - DHT22 (Temperature & Humidity)
   - BH1750 (Light Intensity)
   - Grove Loudness Sensor (Sound Level)
   - MQ135 (Air Quality/Gas Sensor)
3. **Accessories**:
   - USB cable (Type-A to Type-B for Arduino, or USB-C for ESP32)
   - Breadboard
   - Jumper wires
   - 10kΩ resistor (for DHT22)

### Component Specifications

| Sensor | Measurement | Range | Accuracy |
|--------|-------------|-------|----------|
| DHT22 | Temperature | -40°C to 80°C | ±0.5°C |
| DHT22 | Humidity | 0-100% RH | ±2-5% |
| BH1750 | Light | 1-65535 lux | ±20% |
| Grove | Sound | 0-4095 ADC | N/A |
| MQ135 | Air Quality | 0-4095 ADC | N/A |

---

## Arduino Setup

### 1. Install Arduino IDE

Download and install from: https://www.arduino.cc/en/software

### 2. Install Required Libraries

Open Arduino IDE, go to **Tools → Manage Libraries** and install:

- `DHT sensor library` by Adafruit
- `Adafruit Unified Sensor` by Adafruit
- `BH1750` by Christopher Laws

### 3. Upload Arduino Code

Upload the provided Arduino sketch to your board:

```cpp
#include <Wire.h>
#include <BH1750.h>
#include "DHT.h"

// Pin Definitions
#define DHTPIN 2        // DHT22 data pin
#define DHTTYPE DHT22   // DHT sensor type
#define SOUND_PIN A0    // Sound sensor analog pin
#define GAS_PIN A1      // MQ135 gas sensor analog pin

// Initialize sensors
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

// Variables
float humidity = 0;
float temperature = 0;
uint16_t lux = 0;
int soundLevel = 0;
int gasLevel = 0;

void setup() {
  Serial.begin(9600);
  
  // Initialize DHT22
  dht.begin();
  
  // Initialize BH1750 (I2C address 0x23)
  Wire.begin();
  if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("Error initializing BH1750");
  }
  
  Serial.println("Smart Classroom IoT Sensors Initialized");
}

void loop() {
  // Read DHT22 (Temperature & Humidity)
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();
  
  // Read BH1750 (Light)
  lux = lightMeter.readLightLevel();
  
  // Read analog sensors
  soundLevel = analogRead(SOUND_PIN);
  gasLevel = analogRead(GAS_PIN);
  
  // Check if DHT22 reading failed
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    // Print data in expected format
    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
    
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" °C");
  }
  
  // Print light level
  Serial.print("Light: ");
  Serial.print(lux);
  Serial.println(" lux");
  
  // Print sound level
  Serial.print("Sound: ");
  Serial.println(soundLevel);
  
  // Print gas/air quality
  Serial.print("Gas: ");
  Serial.println(gasLevel);
  
  Serial.println("---");
  
  // Wait 5 seconds before next reading
  delay(5000);
}
```

---

## Wiring Diagram

### DHT22 (Temperature & Humidity)

```
DHT22 Pin 1 (VCC)  →  Arduino 5V
DHT22 Pin 2 (DATA) →  Arduino Pin 2 (with 10kΩ pull-up resistor to 5V)
DHT22 Pin 4 (GND)  →  Arduino GND
```

### BH1750 (Light Sensor - I2C)

```
BH1750 VCC  →  Arduino 5V
BH1750 GND  →  Arduino GND
BH1750 SCL  →  Arduino A5 (SCL)
BH1750 SDA  →  Arduino A4 (SDA)
BH1750 ADDR →  GND (for address 0x23)
```

### Grove Loudness Sensor

```
Grove VCC  →  Arduino 5V
Grove GND  →  Arduino GND
Grove SIG  →  Arduino A0
```

### MQ135 Gas Sensor

```
MQ135 VCC  →  Arduino 5V
MQ135 GND  →  Arduino GND
MQ135 AOUT →  Arduino A1
```

### Complete Circuit Diagram

```
                    Arduino Uno/Nano
                   ┌──────────────┐
    DHT22 ────────►│ D2           │
    BH1750 (SDA) ──│ A4 (SDA)     │
    BH1750 (SCL) ──│ A5 (SCL)     │
    Sound ─────────│ A0           │
    MQ135 ─────────│ A1           │
                   │              │
    5V ────────────│ 5V           │
    GND ───────────│ GND          │
                   │              │
    USB ───────────│ USB Port     │
                   └──────────────┘
```

---

## Software Installation

### 1. Install Python Dependencies

```bash
pip install pyserial
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

### 2. Connect Arduino

1. Connect Arduino to PC via USB cable
2. Note the COM port (Windows) or device path (Linux/Mac):
   - **Windows**: Check Device Manager → Ports (COM & LPT) → Arduino (COM3, COM4, etc.)
   - **Linux**: Usually `/dev/ttyUSB0` or `/dev/ttyACM0`
   - **Mac**: Usually `/dev/cu.usbserial-*` or `/dev/cu.usbmodem*`

### 3. Configure Port (Optional)

The system auto-detects Arduino ports. If it fails, manually specify in `camera_system/iot_sensor.py`:

```python
# Initialize IoT sensors
sensor_reader = IoTSensorReader(port='COM3')  # Replace COM3 with your port
```

Or in `app.py`:

```python
# Initialize IoT sensors with specific port
initialize_iot(port='COM3')
```

---

## Serial Communication Protocol

### Output Format

The Arduino sends data every 5 seconds in text format:

```
Humidity: 65.4 %
Temperature: 23.5 °C
Light: 456 lux
Sound: 512
Gas: 345
---
```

### Python Parsing

The `IoTSensorReader` class parses this data using regex patterns:

```python
def parse_sensor_line(self, line: str) -> bool:
    """Parse a single line of sensor data"""
    
    # Temperature pattern: "Temperature: 23.5 °C"
    temp_match = re.search(r'Temperature:\s*([\d.]+)\s*°C', line)
    
    # Humidity pattern: "Humidity: 65.4 %"
    hum_match = re.search(r'Humidity:\s*([\d.]+)\s*%', line)
    
    # Light pattern: "Light: 456 lux"
    light_match = re.search(r'Light:\s*([\d.]+)\s*lux', line)
    
    # Sound pattern: "Sound: 512"
    sound_match = re.search(r'Sound:\s*([\d.]+)', line)
    
    # Gas pattern: "Gas: 345"
    gas_match = re.search(r'Gas:\s*([\d.]+)', line)
    
    # Extract and store values...
```

### Normalization

Raw sensor values are normalized to 0-100 scale:

| Sensor | Raw Range | Normalized Range | Optimal Range |
|--------|-----------|------------------|---------------|
| Temperature | -40 to 80°C | 0-100 | 20-25°C (normalized 62-75) |
| Humidity | 0-100% | 0-100 | 40-60% |
| Light | 0-1000 lux | 0-100 | 300-500 lux (normalized 30-50) |
| Sound | 0-4095 ADC | 0-100 | <2048 ADC (normalized <50) |
| Gas | 0-4095 ADC | 0-100 | <2048 ADC (normalized <50) |

### Environmental Score

Calculated based on sensor values:

```python
def calculate_environmental_score(self, data: dict) -> float:
    """Calculate overall environmental quality score (0-100)"""
    
    # Weight factors
    weights = {
        'temperature': 0.25,  # 25% weight
        'humidity': 0.20,     # 20% weight
        'light': 0.20,        # 20% weight
        'sound': 0.20,        # 20% weight
        'gas': 0.15           # 15% weight
    }
    
    # Optimal ranges (normalized 0-100)
    optimal_ranges = {
        'temperature': (62, 75),  # 20-25°C
        'humidity': (40, 60),
        'light': (30, 50),
        'sound': (0, 50),
        'gas': (0, 50)
    }
    
    # Calculate score for each sensor
    scores = {}
    for sensor, value in data.items():
        if sensor in optimal_ranges:
            min_val, max_val = optimal_ranges[sensor]
            if min_val <= value <= max_val:
                scores[sensor] = 100  # Perfect
            else:
                # Calculate distance from optimal range
                if value < min_val:
                    distance = min_val - value
                else:
                    distance = value - max_val
                scores[sensor] = max(0, 100 - distance * 2)
    
    # Weighted average
    total_score = sum(scores[s] * weights[s] for s in scores)
    return round(total_score, 1)
```

---

## Testing the Integration

### 1. Test Arduino Output

Open Arduino IDE Serial Monitor (115200 baud):

```
Humidity: 55.2 %
Temperature: 24.3 °C
Light: 432 lux
Sound: 486
Gas: 312
---
```

### 2. Test Python Serial Reading

Create `test_iot.py`:

```python
from camera_system.iot_sensor import IoTSensorReader
import time

# Create sensor reader (auto-detect port)
reader = IoTSensorReader()

# Connect to Arduino
if reader.connect():
    print("✓ Connected to Arduino")
    
    # Start reading in background
    reader.start_reading()
    
    # Wait for data
    time.sleep(10)
    
    # Get current readings
    data = reader.get_current_data()
    print("\nCurrent Sensor Data:")
    print(f"  Temperature: {data.get('raw_temperature')}°C (normalized: {data.get('temperature')})")
    print(f"  Humidity: {data.get('raw_humidity')}% (normalized: {data.get('humidity')})")
    print(f"  Light: {data.get('raw_light')} lux (normalized: {data.get('light')})")
    print(f"  Sound: {data.get('raw_sound')} ADC (normalized: {data.get('sound')})")
    print(f"  Gas: {data.get('raw_gas')} ADC (normalized: {data.get('gas')})")
    print(f"  Environmental Score: {data.get('environmental_score')}")
    
    # Check status
    status = reader.get_status()
    print(f"\nStatus: {'Connected' if status['connected'] else 'Disconnected'}")
    print(f"Port: {status['port']}")
    print(f"Last Update: {status['last_update']}")
    
    # Check alerts
    alerts = reader.get_alerts()
    if alerts:
        print(f"\n⚠ Alerts ({len(alerts)}):")
        for alert in alerts:
            print(f"  - [{alert['timestamp']}] {alert['message']}")
    else:
        print("\n✓ No alerts")
    
    # Stop and disconnect
    reader.stop_reading()
    reader.disconnect()
else:
    print("✗ Failed to connect to Arduino")
```

Run:

```bash
python test_iot.py
```

### 3. Test Flask Integration

Start the Flask server:

```bash
python app.py
```

Check console output:

```
IoT Sensors initialized successfully on port COM3
✓ Connected to Arduino
Started reading sensor data...
```

### 4. Test API Endpoints

#### Get IoT Status

```bash
curl http://localhost:5000/api/iot/status
```

Response:

```json
{
  "success": true,
  "connected": true,
  "port": "COM3",
  "reading": true,
  "last_update": "2024-01-15T10:30:45.123456"
}
```

#### Get Sensor Data

```bash
curl http://localhost:5000/api/iot/data
```

Response:

```json
{
  "success": true,
  "data": {
    "temperature": {
      "value": 24.3,
      "normalized": 71.5,
      "unit": "°C"
    },
    "humidity": {
      "value": 55.2,
      "normalized": 55.2,
      "unit": "%"
    },
    "light": {
      "value": 432,
      "normalized": 43.2,
      "unit": "lux"
    },
    "sound": {
      "value": 486,
      "normalized": 11.87,
      "unit": "ADC"
    },
    "gas": {
      "value": 312,
      "normalized": 7.62,
      "unit": "ADC"
    },
    "environmental_score": 82.4,
    "timestamp": "2024-01-15T10:30:45.123456"
  }
}
```

#### Get Environmental Data (Dashboard)

```bash
curl http://localhost:5000/api/dashboard/environment
```

Response:

```json
{
  "temperature": 24.3,
  "humidity": 55,
  "co2": 312,
  "lightLevel": 432,
  "noiseLevel": 486,
  "status": "optimal",
  "environmental_score": 82.4,
  "timestamp": "2024-01-15T10:30:45.123456",
  "source": "iot_sensors"
}
```

#### Get Alerts

```bash
curl http://localhost:5000/api/iot/alerts
```

Response:

```json
{
  "success": true,
  "alerts": [
    {
      "timestamp": "2024-01-15T10:25:30.123456",
      "sensor": "temperature",
      "value": 28.5,
      "message": "Temperature is high: 28.5°C"
    }
  ],
  "count": 1
}
```

---

## API Endpoints

### IoT Sensor Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/iot/status` | GET | Get sensor connection status | Status object |
| `/api/iot/data` | GET | Get current sensor readings | Sensor data object |
| `/api/iot/alerts` | GET | Get environmental alerts | Alert array |
| `/api/dashboard/environment` | GET | Get dashboard environment data | Environment object |

### LSTM Integration

The LSTM prediction endpoint (`/api/lstm/predict`) automatically includes IoT sensor data:

```python
# Observation sent to LSTM
observation = {
    'attention': 75.5,
    'engagement': 82.3,
    'state_counts': {...},
    'student_count': 25,
    'iot_data': {
        'temperature': 71.5,  # Normalized 0-100
        'humidity': 55.2,
        'light': 43.2,
        'sound': 11.87,
        'gas': 7.62
    },
    'environmental_score': 82.4,
    'timestamp': datetime.now()
}
```

The LSTM model uses all 15 features:

1. Attention level
2. Average engagement
3-8. 6 emotional states (happy, sad, angry, neutral, surprise, fear)
9. Student count
10. Temperature (normalized)
11. Humidity (normalized)
12. Light level (normalized)
13. Sound level (normalized)
14. Gas/Air quality (normalized)
15. Environmental score

---

## Troubleshooting

### Issue: Arduino Not Detected

**Symptoms**: "Failed to initialize IoT sensors" message

**Solutions**:

1. **Check USB Connection**:
   - Ensure USB cable is properly connected
   - Try a different USB port
   - Use a data cable (not charge-only cable)

2. **Check Device Manager (Windows)**:
   - Open Device Manager
   - Look for Arduino under "Ports (COM & LPT)"
   - If you see "Unknown Device" or error icon:
     - Right-click → Update Driver
     - Install CH340 driver if using Chinese Arduino clone

3. **Check Permissions (Linux)**:
   ```bash
   # Add user to dialout group
   sudo usermod -a -G dialout $USER
   
   # Logout and login again
   
   # Or change port permissions
   sudo chmod 666 /dev/ttyUSB0
   ```

4. **Manually Specify Port**:
   Edit `app.py`:
   ```python
   # Force specific port
   iot_enabled = initialize_iot(port='COM3')  # Windows
   # or
   iot_enabled = initialize_iot(port='/dev/ttyUSB0')  # Linux
   ```

### Issue: No Sensor Data

**Symptoms**: API returns "No sensor data available"

**Solutions**:

1. **Check Serial Monitor**:
   - Open Arduino IDE Serial Monitor
   - Set baud rate to 9600
   - Verify sensor data is printing

2. **Check Sensor Connections**:
   - Verify all sensors are properly connected
   - Check power supply (5V and GND)
   - Verify I2C connections for BH1750

3. **Check Sensor Initialization**:
   - Look for error messages in Serial Monitor
   - DHT22: "Failed to read from DHT sensor!"
   - BH1750: "Error initializing BH1750"

4. **Verify Reading Thread**:
   ```python
   # Check if background thread is running
   status = reader.get_status()
   print(f"Reading: {status['reading']}")
   ```

### Issue: Incorrect Sensor Values

**Symptoms**: Values are 0, NaN, or out of range

**Solutions**:

1. **DHT22 Issues**:
   - Add 10kΩ pull-up resistor between DATA and VCC
   - Increase delay between readings (DHT22 needs 2 seconds minimum)
   - Check if sensor is genuine DHT22 (not DHT11)

2. **BH1750 Issues**:
   - Verify I2C address (0x23 with ADDR→GND, 0x5C with ADDR→VCC)
   - Check SDA/SCL connections
   - Run I2C scanner to detect device

3. **Analog Sensor Issues**:
   - Check analog pins (A0, A1)
   - Verify sensor power supply
   - MQ135 needs 24-48 hour burn-in period

### Issue: High CPU Usage

**Symptoms**: System slows down, high CPU usage

**Solutions**:

1. **Increase Read Interval**:
   Edit Arduino code:
   ```cpp
   delay(10000);  // Change from 5000 to 10000 (10 seconds)
   ```

2. **Optimize Reading Thread**:
   Edit `iot_sensor.py`:
   ```python
   def _read_loop(self):
       while self._reading:
           # ... existing code ...
           time.sleep(0.1)  # Increase from 0.01 to 0.1
   ```

### Issue: Serial Port Access Error

**Symptoms**: "Permission denied" or "Access denied"

**Solutions**:

1. **Close Other Programs**:
   - Close Arduino IDE Serial Monitor
   - Close PuTTY, screen, or other serial programs
   - Only one program can access serial port at a time

2. **Restart Application**:
   - Stop Flask server
   - Disconnect/reconnect Arduino
   - Start Flask server

### Issue: LSTM Not Using IoT Data

**Symptoms**: Predictions don't change with environmental conditions

**Solutions**:

1. **Verify IoT Integration**:
   ```python
   # Check if IoT data is being passed
   print(f"IoT enabled: {iot_enabled}")
   if iot_data:
       print(f"IoT data: {iot_data}")
   ```

2. **Check Feature Normalization**:
   - IoT values should be 0-100 (from Arduino module)
   - LSTM expects 0-1 (normalized in preprocess)

3. **Retrain Model**:
   - Collect training data with IoT sensors
   - Include environmental features in training dataset
   - Retrain LSTM with 15 features

---

## Best Practices

### 1. Sensor Placement

- **DHT22**: Away from heat sources, good air circulation
- **BH1750**: At student desk height, facing room center
- **Sound Sensor**: Central location, not near AC/fan
- **MQ135**: Good ventilation, away from windows

### 2. Data Validation

- Implement range checks for sensor values
- Use moving average to smooth noisy readings
- Handle missing data gracefully (use last known good value)

### 3. Alert Thresholds

Customize alert thresholds in `iot_sensor.py`:

```python
def check_alerts(self, data: dict):
    alerts = []
    
    # Temperature alerts
    if data.get('raw_temperature', 0) > 28:
        alerts.append({
            'sensor': 'temperature',
            'value': data['raw_temperature'],
            'message': f"Temperature is high: {data['raw_temperature']}°C"
        })
    
    # Add custom alerts...
    return alerts
```

### 4. Maintenance

- Clean sensors monthly (dust affects readings)
- Recalibrate MQ135 every 6 months
- Check connections periodically
- Monitor alert logs for patterns

---

## Next Steps

1. **Update Training Data**: Include IoT features in training dataset
2. **Retrain LSTM**: Train model with 15 features instead of 10
3. **Frontend Dashboard**: Add environmental sensor cards to UI
4. **Historical Data**: Store sensor readings in database
5. **Alerts**: Implement email/SMS notifications for critical alerts
6. **Automation**: Control AC, lights based on sensor readings

---

## References

- [Arduino Official Documentation](https://www.arduino.cc/reference/en/)
- [DHT22 Datasheet](https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf)
- [BH1750 Library](https://github.com/claws/BH1750)
- [PySerial Documentation](https://pyserial.readthedocs.io/)
- [Smart Classroom Architecture](ARCHITECTURE.md)
- [LSTM Training Guide](LSTM_TRAINING_GUIDE.md)

---

## Support

For issues or questions:

1. Check this guide's Troubleshooting section
2. Verify sensor connections and Arduino code
3. Test each component individually
4. Check system logs for error messages

---

**Last Updated**: 2024-01-15
**Version**: 1.0
