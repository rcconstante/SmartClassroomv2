"""
Test script for IoT sensor integration
Run this to verify Arduino connection and sensor readings
"""

from camera_system.iot_sensor import IoTSensorReader
import time
import sys

def print_separator():
    print("\n" + "="*70 + "\n")

def main():
    print_separator()
    print("Smart Classroom - IoT Sensor Test")
    print_separator()
    
    # Create sensor reader (auto-detect port)
    print("Creating IoT sensor reader...")
    reader = IoTSensorReader()
    
    # Try to connect
    print("Attempting to connect to Arduino...")
    if not reader.connect():
        print("\n✗ Failed to connect to Arduino")
        print("\nTroubleshooting:")
        print("  1. Check if Arduino is connected via USB")
        print("  2. Verify the correct sketch is uploaded")
        print("  3. Check Device Manager (Windows) or ls /dev/tty* (Linux)")
        print("  4. Try manually specifying port: reader = IoTSensorReader(port='COM3')")
        sys.exit(1)
    
    print("✓ Connected successfully!")
    
    # Get status
    status = reader.get_status()
    print(f"\nConnection Details:")
    print(f"  Port: {status['port']}")
    print(f"  Connected: {status['connected']}")
    
    # Start reading in background
    print("\nStarting background sensor reading...")
    reader.start_reading()
    print("✓ Reading thread started")
    
    # Wait for initial data
    print("\nWaiting 10 seconds for sensor data...")
    for i in range(10, 0, -1):
        print(f"  {i}...", end='\r')
        time.sleep(1)
    print("      ")
    
    print_separator()
    print("Current Sensor Readings")
    print_separator()
    
    # Get current readings
    data = reader.get_current_data()
    
    if not data or not data.get('timestamp'):
        print("✗ No data received yet")
        print("  Check Arduino Serial Monitor to verify sensor output")
    else:
        print("Raw Values:")
        print(f"  Temperature:  {data.get('raw_temperature', 'N/A')}°C")
        print(f"  Humidity:     {data.get('raw_humidity', 'N/A')}%")
        print(f"  Light:        {data.get('raw_light', 'N/A')} lux")
        print(f"  Sound:        {data.get('raw_sound', 'N/A')} ADC")
        print(f"  Gas/Air:      {data.get('raw_gas', 'N/A')} ADC")
        
        print("\nNormalized Values (0-100):")
        print(f"  Temperature:  {data.get('temperature', 'N/A')}")
        print(f"  Humidity:     {data.get('humidity', 'N/A')}")
        print(f"  Light:        {data.get('light', 'N/A')}")
        print(f"  Sound:        {data.get('sound', 'N/A')}")
        print(f"  Gas/Air:      {data.get('gas', 'N/A')}")
        
        print(f"\nEnvironmental Score: {data.get('environmental_score', 'N/A')}/100")
        print(f"Last Update: {data.get('timestamp', 'N/A')}")
    
    # Check alerts
    print_separator()
    print("Environmental Alerts")
    print_separator()
    
    alerts = reader.get_alerts()
    if alerts:
        print(f"⚠ {len(alerts)} alert(s) detected:")
        for alert in alerts:
            timestamp = alert['timestamp'].strftime('%H:%M:%S') if hasattr(alert['timestamp'], 'strftime') else str(alert['timestamp'])
            print(f"  [{timestamp}] {alert['message']}")
    else:
        print("✓ No alerts - all values in normal range")
    
    # Monitor for 30 seconds
    print_separator()
    print("Continuous Monitoring (30 seconds)")
    print("Press Ctrl+C to stop early")
    print_separator()
    
    try:
        for i in range(6):  # 6 iterations x 5 seconds = 30 seconds
            time.sleep(5)
            data = reader.get_current_data()
            
            if data and data.get('timestamp'):
                timestamp = data['timestamp'].strftime('%H:%M:%S') if hasattr(data['timestamp'], 'strftime') else str(data['timestamp'])
                print(f"[{timestamp}] Temp: {data.get('raw_temperature', 'N/A')}°C, "
                      f"Humidity: {data.get('raw_humidity', 'N/A')}%, "
                      f"Light: {data.get('raw_light', 'N/A')} lux, "
                      f"Score: {data.get('environmental_score', 'N/A')}/100")
    except KeyboardInterrupt:
        print("\n\nStopped by user")
    
    # Stop and disconnect
    print_separator()
    print("Cleaning up...")
    reader.stop_reading()
    reader.disconnect()
    print("✓ Disconnected from Arduino")
    
    print_separator()
    print("Test completed successfully!")
    print("\nNext Steps:")
    print("  1. If sensor data looks correct, start Flask app: python app.py")
    print("  2. Check Flask console for 'IoT Sensors initialized successfully'")
    print("  3. Test API endpoints:")
    print("     - http://localhost:5000/api/iot/status")
    print("     - http://localhost:5000/api/iot/data")
    print("     - http://localhost:5000/api/iot/alerts")
    print("  4. View dashboard at http://localhost:5000")
    print_separator()

if __name__ == "__main__":
    main()
