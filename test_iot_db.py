"""
Test script for IoT SQLite database functionality
"""

import sys
from camera_system.iot_sensor import IoTSensorReader

def test_db_operations():
    """Test database operations without Arduino connection"""
    
    print("=" * 60)
    print("IoT Database Functionality Test")
    print("=" * 60)
    
    # Create sensor instance (no connection required for DB operations)
    sensor = IoTSensorReader()
    sensor.is_connected = True  # Simulate connection
    
    # Test 1: Start logging
    print("\n[TEST 1] Starting database logging...")
    result = sensor.start_db_logging()
    print(f"Result: {result}")
    
    if not result['success']:
        print("❌ Failed to start logging")
        return
    
    print(f"✅ Database created: {result['db_file']}")
    print(f"   Session ID: {result['session_id']}")
    
    # Test 2: Check status
    print("\n[TEST 2] Checking logging status...")
    status = sensor.get_db_logging_status()
    print(f"Enabled: {status['enabled']}")
    print(f"Database: {status['db_file']}")
    print(f"Records: {status['record_count']}")
    
    # Test 3: Simulate some data writes
    print("\n[TEST 3] Simulating data writes...")
    import sqlite3
    from datetime import datetime
    
    try:
        cursor = sensor.db_connection.cursor()
        
        # Insert 5 test records
        for i in range(5):
            cursor.execute('''
                INSERT INTO sensor_data 
                (timestamp, session_id, temperature, humidity, light, sound, gas, 
                 environmental_score, temperature_norm, humidity_norm, light_norm, 
                 sound_norm, gas_norm)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                datetime.now().isoformat(),
                sensor.db_session_id,
                20 + i,  # temperature
                60 + i,  # humidity
                300 + i * 10,  # light
                512 + i,  # sound
                400 + i,  # gas
                0.75,  # environmental_score
                0.5, 0.6, 0.7, 0.5, 0.6  # normalized values
            ))
        
        sensor.db_connection.commit()
        print(f"✅ Inserted 5 test records")
        
        # Check count
        status = sensor.get_db_logging_status()
        print(f"   Current record count: {status['record_count']}")
        
    except Exception as e:
        print(f"❌ Error writing test data: {e}")
        return
    
    # Test 4: Export to CSV
    print("\n[TEST 4] Exporting to CSV...")
    csv_result = sensor.export_db_to_csv()
    print(f"Result: {csv_result}")
    
    if csv_result['success']:
        print(f"✅ CSV exported: {csv_result['csv_file']}")
        print(f"   Records exported: {csv_result['record_count']}")
    else:
        print(f"❌ Export failed: {csv_result['message']}")
    
    # Test 5: Stop logging
    print("\n[TEST 5] Stopping database logging...")
    stop_result = sensor.stop_db_logging()
    print(f"Result: {stop_result}")
    
    if stop_result['success']:
        print(f"✅ Logging stopped")
        print(f"   Final record count: {stop_result['record_count']}")
    else:
        print(f"❌ Failed to stop: {stop_result['message']}")
    
    # Test 6: Verify file exists
    print("\n[TEST 6] Verifying database file...")
    import os
    
    if os.path.exists(result['db_file']):
        size = os.path.getsize(result['db_file'])
        print(f"✅ Database file exists")
        print(f"   Path: {result['db_file']}")
        print(f"   Size: {size} bytes")
    else:
        print(f"❌ Database file not found: {result['db_file']}")
    
    if csv_result['success'] and os.path.exists(csv_result['csv_file']):
        with open(csv_result['csv_file'], 'r') as f:
            lines = f.readlines()
        print(f"✅ CSV file exists")
        print(f"   Path: {csv_result['csv_file']}")
        print(f"   Lines: {len(lines)} (1 header + {len(lines)-1} data rows)")
    else:
        print(f"❌ CSV file not found")
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)

if __name__ == '__main__':
    try:
        test_db_operations()
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
