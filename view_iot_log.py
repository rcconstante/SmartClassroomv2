"""
View IoT Sensor Log CSV
Shows the latest logged data from the persistent CSV file
"""

import csv
import os
from datetime import datetime

csv_file = 'data/iot_sensor_log.csv'

if not os.path.exists(csv_file):
    print(f"❌ CSV file not found: {csv_file}")
    print("\nTo generate data:")
    print("  1. Start Flask: python app.py")
    print("  2. Connect IoT sensors")
    print("  3. Data will be logged automatically every 5 seconds")
    exit(1)

print("=" * 80)
print("IoT Sensor Data Log")
print("=" * 80)

# Count total rows
with open(csv_file, 'r') as f:
    row_count = sum(1 for row in f) - 1  # Subtract header

print(f"Total records: {row_count}")
print(f"File: {csv_file}")
print(f"File size: {os.path.getsize(csv_file)} bytes")
print()

# Show last 20 entries
print("Latest 20 entries:")
print("-" * 80)

with open(csv_file, 'r') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    
    if not rows:
        print("No data yet")
    else:
        # Show last 20
        recent = rows[-20:]
        
        print(f"{'Timestamp':<20} {'Temp':<6} {'Humid':<6} {'Light':<7} {'Sound':<6} {'Gas':<6} {'Score':<6}")
        print("-" * 80)
        
        for row in recent:
            try:
                ts = datetime.fromisoformat(row['timestamp']).strftime('%m/%d %H:%M:%S')
            except:
                ts = row['timestamp'][:19] if len(row['timestamp']) > 19 else row['timestamp']
            
            print(f"{ts:<20} {row['temperature']:<6} {row['humidity']:<6} {row['light']:<7} "
                  f"{row['sound']:<6} {row['gas']:<6} {row['environmental_score']:<6}")

print("=" * 80)

# Show statistics
if rows:
    temps = [float(r['temperature']) for r in rows if r['temperature']]
    humids = [float(r['humidity']) for r in rows if r['humidity']]
    scores = [float(r['environmental_score']) for r in rows if r['environmental_score']]
    
    print("\nStatistics (all data):")
    print(f"  Temperature: min={min(temps):.1f}°C, max={max(temps):.1f}°C, avg={sum(temps)/len(temps):.1f}°C")
    print(f"  Humidity:    min={min(humids):.1f}%, max={max(humids):.1f}%, avg={sum(humids)/len(humids):.1f}%")
    print(f"  Env Score:   min={min(scores):.1f}, max={max(scores):.1f}, avg={sum(scores)/len(scores):.1f}")
    
    first_time = datetime.fromisoformat(rows[0]['timestamp'])
    last_time = datetime.fromisoformat(rows[-1]['timestamp'])
    duration = last_time - first_time
    
    print(f"\nLogging period:")
    print(f"  Start: {first_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  End:   {last_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Duration: {duration}")

print("\n✓ Data is being logged continuously every 5 seconds")
print("✓ CSV file will keep growing - no 50 record limit!")
