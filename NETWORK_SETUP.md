# Smart Classroom - Network Access Setup Guide

## 📱 Access from Multiple Devices on Same Network

### Quick Start

1. **Start the server** on the main computer (where Arduino is connected):
   ```bash
   python app.py
   ```

2. **Note the Network IP** shown in the console:
   ```
   ============================================================
   🎓 Smart Classroom Backend Server
   ============================================================
   Server running on: http://localhost:5000
   Network access:    http://192.168.1.100:5000  <-- Use this IP!
   API endpoints:     http://192.168.1.100:5000/api/
   ============================================================
   ```

3. **Access from any device** on the same WiFi/network:
   - **Students' phones/tablets**: Open browser → `http://192.168.1.100:5000`
   - **Teacher's laptop**: Open browser → `http://192.168.1.100:5000`
   - **Admin computer**: Open browser → `http://192.168.1.100:5000`

---

## 🔧 Firewall Configuration (Windows)

If devices cannot connect, allow Python through Windows Firewall:

### Option 1: Automatic (Recommended)
Run this PowerShell command **as Administrator**:
```powershell
New-NetFirewallRule -DisplayName "Smart Classroom Server" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

### Option 2: Manual
1. Open **Windows Defender Firewall**
2. Click **Advanced Settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → Click **Next**
5. Select **TCP** → Enter **5000** → Click **Next**
6. Select **Allow the connection** → Click **Next**
7. Check all profiles (Domain, Private, Public) → Click **Next**
8. Name: **Smart Classroom Server** → Click **Finish**

---

## 📊 Data Limits & Storage

### Real-Time Data Limits

| Component | Limit | Duration | Purpose |
|-----------|-------|----------|---------|
| **IoT Data Queue** | 500 readings | ~8 minutes at 1/sec | In-memory buffer for API access |
| **Emotion History** | 3600 snapshots | 1 hour at 1/sec | In-memory for analytics averaging |
| **Database Logging** | **UNLIMITED** | ∞ (disk space) | Persistent storage in SQLite |

### Detailed Explanation

#### 1. IoT Data Queue (500 readings)
- **Type**: In-memory circular buffer
- **Purpose**: Quick API access for real-time display
- **Limit**: 500 most recent sensor readings
- **What happens when full**: Oldest reading is removed when new one arrives
- **Access**: `/api/iot/history` endpoint
- **Network**: ✅ Accessible from all devices on network

#### 2. Emotion History (3600 snapshots)
- **Type**: In-memory list
- **Purpose**: Calculate average emotions for Analytics page
- **Limit**: 3600 snapshots (1 hour of data at 1 snapshot/second)
- **What happens when full**: Oldest snapshot is removed
- **Access**: `/api/emotions/history` endpoint
- **Network**: ✅ Accessible from all devices on network
- **Clear**: Call `/api/emotions/clear` to reset

#### 3. Database Logging (UNLIMITED)
- **Type**: SQLite file on disk
- **Purpose**: Permanent storage for research/analysis
- **Limit**: **NO LIMIT** - only limited by disk space
- **File size**: ~1 MB per hour of continuous logging
- **Location**: `data/iot_log_YYYYMMDD_HHMMSS.db`
- **Features**:
  - Stores ALL sensor readings (temperature, humidity, light, sound, gas)
  - Stores ALL emotion counts (happy, sad, angry, etc.)
  - Stores occupancy (student count)
  - Environmental score
  - Timestamps for every reading
- **Export**: Can export to CSV via Analytics page
- **Network**: ✅ Database files stored on server, accessible via API

---

## 🌐 Network Architecture

```
Main Computer (Server)
├── Arduino/ESP32 (USB) ─→ IoT Sensor Data
├── Webcam (USB) ─────────→ CV Detection
└── Flask Server :5000
    ├── WiFi/LAN Network
    │   ├── Student Phone 1 ─→ http://192.168.1.100:5000
    │   ├── Student Phone 2 ─→ http://192.168.1.100:5000
    │   ├── Teacher Laptop ──→ http://192.168.1.100:5000
    │   └── Admin Computer ──→ http://192.168.1.100:5000
    │
    └── API Endpoints (All Real-Time)
        ├── /api/camera/status ─→ Check if CV is running
        ├── /api/camera/stream ─→ Live video stream
        ├── /api/emotions ──────→ Current emotion data
        ├── /api/emotions/history ─→ Averaged emotions
        ├── /api/iot/latest ────→ Latest sensor reading
        ├── /api/iot/history ───→ Last 500 readings
        ├── /api/dashboard/stats ─→ Current statistics
        └── /api/iot/start-logging ─→ Start database logging
```

---

## ✅ How Data Flows Across Network

### For Students (View-Only Access)
1. **Login**: Student opens `http://192.168.1.100:5000` on their phone
2. **Dashboard**: 
   - Fetches `/api/dashboard/stats` every 5 seconds
   - Fetches `/api/emotions` every 2 seconds (when camera active)
   - Shows real-time engagement stats
3. **Camera Page**:
   - Polls `/api/camera/status` every 3 seconds
   - When active, displays `/api/camera/stream` (live video)
   - Cannot control camera (view-only)

### For Teachers/Admins (Full Access)
1. **Login**: Teacher opens `http://192.168.1.100:5000` on laptop
2. **Dashboard**: Same as students + control features
3. **Camera Page**:
   - Can start/stop camera via `/api/camera/start` and `/api/camera/stop`
   - Live stream at `/api/camera/stream`
4. **Analytics Page**:
   - Fetches `/api/emotions/history` for averaged emotion data
   - Fetches `/api/iot/history` for environmental data table
   - Can export data to CSV
5. **IoT Logging**:
   - Start: `/api/iot/start-logging` → Creates SQLite database
   - Stop: `/api/iot/stop-logging` → Finalizes and saves
   - Export: `/api/iot/export-csv` → Downloads CSV file

---

## 🔍 Troubleshooting Network Access

### Problem: "Cannot connect from phone/other device"

**Solution 1: Check Server IP**
```bash
# On server computer, run:
ipconfig  # Windows
ifconfig  # Linux/Mac

# Look for "IPv4 Address" (e.g., 192.168.1.100)
# Use this IP to access: http://192.168.1.100:5000
```

**Solution 2: Check Firewall**
- Ensure port 5000 is allowed (see Firewall Configuration above)

**Solution 3: Same Network**
- Ensure all devices are on the SAME WiFi network
- Server computer must be connected (not hotspot)

**Solution 4: Test Connection**
```bash
# From client device, ping the server:
ping 192.168.1.100

# If successful, try accessing in browser:
http://192.168.1.100:5000
```

### Problem: "Camera shows 'Offline' on student device but working on teacher device"

**This is NORMAL behavior**:
- Students use **polling** (checks every 3 seconds)
- It may take up to 3 seconds for students to see the camera stream
- Check browser console for `[Student Mode]` messages

**Verify**:
1. Teacher starts camera first
2. Wait 3-5 seconds
3. Student should see stream automatically

### Problem: "IoT data not updating on remote device"

**Check**:
1. Verify Arduino is connected to server computer
2. Check `/api/iot/status` returns `connected: true`
3. Refresh the Analytics page
4. IoT data auto-updates every 10 seconds

---

## 📈 Database Size Estimates

For planning storage space:

| Duration | Approximate Database Size |
|----------|---------------------------|
| 1 hour | ~1 MB |
| 1 day (8 hours class) | ~8 MB |
| 1 week (5 days) | ~40 MB |
| 1 month (20 days) | ~160 MB |
| 1 semester (4 months) | ~640 MB |

**Notes**:
- Database includes: IoT sensors (5 values) + Emotions (7 values) + Metadata
- Logging at 1 reading per second
- Compressed efficiently with SQLite
- Can export to CSV for archival (smaller file size)

---

## 🎯 Best Practices

1. **Start Database Logging** at the beginning of class
2. **Stop Database Logging** at the end of class
3. **Export to CSV** weekly for backup
4. **Clear Emotion History** between classes if needed: `/api/emotions/clear`
5. **Monitor Disk Space** if logging continuously for days

---

## 🔒 Security Notes

- Server runs on local network only (not internet-accessible)
- No external API calls
- All data stays on your local computer
- Student access is view-only (cannot control camera or delete data)

---

## 📞 Quick Reference

| What | Where | How Often |
|------|-------|-----------|
| Current IoT reading | `/api/iot/latest` | Real-time |
| IoT history (500) | `/api/iot/history` | Every 10s on Analytics |
| Current emotions | `/api/emotions` | Every 2s when camera on |
| Averaged emotions | `/api/emotions/history` | Every 15s on Analytics |
| Camera status | `/api/camera/status` | Every 3s for students |
| Camera stream | `/api/camera/stream` | Continuous MJPEG |
| Dashboard stats | `/api/dashboard/stats` | Every 5s |

All endpoints work across the network - just replace `localhost` with the server's IP address!
