"""
Quick test script to verify Arduino IoT sensor connection
Run this to debug IoT connectivity issues
"""

import serial
import time

def test_arduino_connection(port='COM5', baudrate=9600):
    """Test Arduino connection and print raw data"""
    print("="*60)
    print("Arduino IoT Sensor Connection Test")
    print("="*60)
    print(f"\nAttempting to connect to {port} at {baudrate} baud...")
    
    try:
        # Try to open serial port
        ser = serial.Serial(port, baudrate, timeout=1)
        print(f"✓ Successfully opened port {port}")
        print(f"✓ Waiting for Arduino to stabilize...")
        time.sleep(2)
        
        # Clear buffer
        ser.reset_input_buffer()
        print(f"✓ Ready to receive data\n")
        print("="*60)
        print("RAW DATA FROM ARDUINO (Press Ctrl+C to stop):")
        print("="*60)
        
        # Read and print raw data
        line_count = 0
        while line_count < 50:  # Show first 50 lines
            if ser.in_waiting > 0:
                try:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    if line:
                        print(f"[{line_count+1}] {line}")
                        line_count += 1
                except Exception as e:
                    print(f"Error reading line: {e}")
            time.sleep(0.1)
        
        print("\n" + "="*60)
        print("✓ TEST COMPLETED - Connection is working!")
        print("="*60)
        
        ser.close()
        return True
        
    except PermissionError:
        print(f"\n✗ ERROR: Port {port} is blocked by another program")
        print("  Solution: Close Arduino IDE Serial Monitor")
        return False
        
    except serial.SerialException as e:
        if "could not open port" in str(e).lower():
            print(f"\n✗ ERROR: Port {port} does not exist")
            print("  Check if Arduino is connected and which port it's using")
            print("\n  Available ports:")
            try:
                import serial.tools.list_ports
                ports = serial.tools.list_ports.comports()
                for p in ports:
                    print(f"    - {p.device}: {p.description}")
            except:
                pass
        else:
            print(f"\n✗ ERROR: {e}")
        return False
        
    except Exception as e:
        print(f"\n✗ UNEXPECTED ERROR: {e}")
        return False

if __name__ == "__main__":
    print("\n")
    success = test_arduino_connection(port='COM5')
    
    if success:
        print("\n✓ Your Arduino is sending data correctly!")
        print("✓ You can now run app.py and IoT data should appear")
    else:
        print("\n✗ Fix the errors above, then run this test again")
        print("\nCommon solutions:")
        print("  1. Close Arduino IDE Serial Monitor")
        print("  2. Check correct COM port in Device Manager")
        print("  3. Re-upload Arduino sketch")
        print("  4. Unplug and replug Arduino USB cable")
    
    print("\n")
