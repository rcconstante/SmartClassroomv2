# IoT SQLite Database Logging

## Overview
The Smart Classroom system now supports SQLite database logging for IoT sensor data. This provides persistent, structured storage with manual start/stop control.

## Features

### 1. Manual Start/Stop Control
- **Start Simulation Button**: Located in Analytics page
- Database logging does NOT start automatically
- Only starts when user clicks "Start Simulation"
- Stops when user clicks "Stop Simulation" or when Flask app closes

### 2. New SQLite Database Per Session
- Each time you click "Start Simulation", a new database file is created
- Naming format: `data/iot_log_YYYYMMDD_HHMMSS.db`
- Example: `data/iot_log_20251117_143052.db`
- All data for that session is stored in this dedicated database

### 3. Continuous Logging Across Pages
- Once started, logging continues in the background
- Persists even when switching pages (Dashboard → Analytics → Settings)
- Only stops when:
  - User clicks "Stop Simulation"
  - Flask backend (app.py) is closed
  
### 4. CSV Export from SQLite
- **During Active Session**: Click "Export Current Session" button
- **After Session Ends**: Database file remains in `data/` folder
- Export flow: **IoT Sensors → SQLite → Export as CSV**

### 5. Status Indicator
- Green status bar shows when logging is active
- Displays current database filename
- Shows real-time record count
- Updates every 5 seconds

## Database Schema

```sql
CREATE TABLE sensor_data (
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
    gas_norm REAL
)
```

**Indexes:**
- `idx_timestamp`: Faster time-based queries
- `idx_session`: Faster session-based filtering

## API Endpoints

### Start Logging
```
POST /api/iot/start-logging
Response:
{
    "success": true,
    "message": "Database logging started",
    "db_file": "data/iot_log_20251117_143052.db",
    "session_id": "20251117_143052"
}
```

### Stop Logging
```
POST /api/iot/stop-logging
Response:
{
    "success": true,
    "message": "Database logging stopped",
    "db_file": "data/iot_log_20251117_143052.db",
    "record_count": 120
}
```

### Check Status
```
GET /api/iot/logging-status
Response:
{
    "enabled": true,
    "db_file": "data/iot_log_20251117_143052.db",
    "session_id": "20251117_143052",
    "record_count": 45
}
```

### Export to CSV
```
POST /api/iot/export-csv
Response: CSV file download
```

### List All Databases
```
GET /api/iot/list-databases
Response:
{
    "databases": [
        {
            "filename": "iot_log_20251117_143052.db",
            "filepath": "data/iot_log_20251117_143052.db",
            "created": "2025-11-17T14:30:52",
            "size": 32768,
            "record_count": 120
        }
    ]
}
```

## Usage Guide

### Starting a Logging Session
1. Open Smart Classroom in browser
2. Navigate to **Analytics** page
3. Click **"Start Simulation"** button
4. Green status bar appears showing active logging
5. Data is saved to SQLite every 5 seconds

### Monitoring Session
- Status bar shows database filename
- Record count updates automatically
- Logging continues even if you navigate to other pages

### Stopping a Session
1. Click **"Stop Simulation"** button
2. Status bar disappears
3. Final record count shown in notification
4. Database file remains in `data/` folder

### Exporting Data
**During Active Session:**
- Click "Export Current Session" button
- CSV file downloads immediately
- Format: `iot_log_YYYYMMDD_HHMMSS.csv`

**After Session:**
- Database file persists in `data/` folder
- Can be opened with SQLite tools
- Or write custom export scripts

## File Locations

```
SmartClassroom/
├── data/
│   ├── iot_log_20251117_143052.db     # SQLite database files
│   ├── iot_log_20251117_143052.csv     # Exported CSV files
│   ├── iot_log_20251117_150000.db
│   └── iot_log_20251117_150000.csv
├── camera_system/
│   └── iot_sensor.py                   # Database logging implementation
├── app.py                              # Flask API endpoints
└── templates/js/
    └── app.js                          # Frontend controls
```

## Testing

Run the test script to verify database functionality:

```powershell
python test_iot_db.py
```

This will:
- Create a test database
- Insert 5 sample records
- Export to CSV
- Stop logging
- Verify file creation

## Important Notes

1. **Arduino Connection**: IoT sensors must be connected (or simulated) before starting logging
2. **Automatic Cleanup**: Old database files are NOT automatically deleted - manage manually
3. **Thread Safety**: Database connection uses `check_same_thread=False` for Flask
4. **Data Interval**: Sensor readings are written to database every 5 seconds
5. **Session Isolation**: Each session has a unique session_id for filtering data

## Troubleshooting

### "IoT sensors not connected" error
- Ensure Arduino is connected to COM port
- Check that IoT sensor reading is active
- Verify Flask backend shows "Connected to Arduino"

### Database file not created
- Check `data/` folder exists (created automatically)
- Verify write permissions
- Check Flask console for error messages

### Export fails
- Ensure logging session is active
- Check database file exists in `data/` folder
- Verify SQLite connection is open

### Record count not updating
- Check Flask console for "[IoT] ✓ Data logged" messages
- Verify sensor data is being received
- Refresh Analytics page to update status

## Advantages Over Previous CSV Approach

| Feature | Old (CSV) | New (SQLite) |
|---------|-----------|--------------|
| **Storage** | Single CSV file | Multiple database files (one per session) |
| **Control** | Automatic start | Manual start/stop |
| **Persistence** | Limited (50 records in memory) | Unlimited (disk-based) |
| **Query Speed** | Slow (full file scan) | Fast (indexed queries) |
| **Concurrent Access** | File locking issues | Thread-safe |
| **Data Integrity** | No validation | Schema enforcement |
| **Session Tracking** | None | Built-in session_id |
| **Export** | N/A (was the primary format) | On-demand CSV export |

## Future Enhancements

Possible improvements:
- Database file browser in UI
- Historical session comparison
- Data visualization from SQLite
- Automatic cleanup of old databases
- Advanced filtering and analytics
- Multi-sensor support
