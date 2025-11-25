# Quick Start Guide - Smart Classroom v2.0

## 🚀 Getting Started in 5 Minutes

### Step 1: Verify Setup ✅
```bash
python test_model_integration.py
```

**Expected Output**:
```
✓ All model files found!
✓ All dependencies loaded!
✓ Environmental predictor loaded successfully!
✓ ALL TESTS PASSED!
```

If you see errors, install dependencies:
```bash
pip install -r requirements.txt
```

---

### Step 2: Start the Server 🖥️
```bash
python app.py
```

**Expected Output**:
```
✓ Camera system loaded successfully
✓ Environmental prediction pipeline initialized
[IoT] Attempting to connect to Arduino on COM5...
Server running on: http://localhost:5000
```

---

### Step 3: Open Dashboard 🌐
```
http://localhost:5000
```

**Login Credentials**:
- Email: `dr.johnson@dlsud.edu.ph`
- Password: `teacher123`

---

### Step 4: Enable Features 🎥

#### A. Start Camera (Required for Engagement)
1. Click **"Start Camera"** button
2. Allow camera access if prompted
3. You should see:
   - Live video feed
   - Face detection boxes
   - "High Engaged" or "Low Engaged" labels in Green/Red

#### B. Start IoT Logging (Required for Predictions)
1. Connect Arduino to USB (COM5)
2. Close Arduino Serial Monitor
3. Click **"Start Logging"** in IoT section
4. Wait 3-4 minutes for 20 readings

---

### Step 5: View Results 📊

#### Dashboard Shows:
1. **Students Detected**: Real-time count from YOLO
2. **Avg Engagement**: Calculated from emotions
3. **Engagement Chart**: High (Green) vs Low (Red) distribution
4. **Occupancy Chart**: Time-series student count
5. **Environment Monitor**: Real IoT sensor readings

#### API Endpoints:
- **Emotions**: `http://localhost:5000/api/emotions`
- **Predictions**: `http://localhost:5000/api/predictions/environment`
- **IoT Data**: `http://localhost:5000/api/iot/latest`

---

## 🎯 Key Features

### 1. Engagement Detection
**What You See**:
- Camera overlays with colored boxes
- Green = High Engaged (Neutral, Happy, Surprise)
- Red = Low Engaged (Sad, Angry, Fear, Disgust)

**Dashboard**:
- 2-segment pie chart (High vs Low)
- Real-time percentages
- Historical trends

### 2. Environmental Predictions
**What It Does**:
- Forecasts future temperature, humidity, CO2, light, sound
- Classifies room comfort (Critical/Poor/Acceptable/Optimal)
- Provides actionable recommendations

**How to Access**:
```bash
curl http://localhost:5000/api/predictions/environment
```

**Example Response**:
```json
{
  "comfort_classification": {
    "level": 3,
    "label": "Optimal",
    "probabilities": {
      "Optimal": 0.60,
      "Acceptable": 0.25,
      ...
    }
  },
  "recommendations": [
    "✅ All conditions are good!"
  ]
}
```

---

## ⚙️ Configuration

### Camera Selection
1. Go to Settings (⚙️ icon)
2. Select camera from dropdown
3. Save settings

### IoT Port Configuration
If Arduino is on different port:
1. Edit `app.py` line ~950
2. Change: `port='COM5'` to your port
3. Restart server

---

## 🐛 Troubleshooting

### Camera Not Starting
**Problem**: "No cameras detected"
**Solution**: 
1. Check camera permissions
2. Close other apps using camera
3. Try different camera ID in settings

### Predictions Not Available
**Problem**: "Not enough historical data"
**Solution**:
1. Ensure IoT logging is started
2. Wait for 20 readings (~3-4 minutes)
3. Check `/api/predictions/environment` for buffer size

### IoT Sensors Not Connecting
**Problem**: "IoT sensors not connected"
**Solution**:
1. Close Arduino Serial Monitor
2. Check COM port in Device Manager
3. Update port in `app.py`
4. Restart server

### Models Not Loading
**Problem**: "Environmental prediction models not available"
**Solution**:
1. Verify files in `static/model/`:
   - `gradient_boosting_forecasting_model.pkl`
   - `random_forest_classifier.pkl`
   - `gb_scaler.pkl`
   - `feature_columns.pkl`
2. Install: `pip install scikit-learn pandas`
3. Run test: `python test_model_integration.py`

---

## 📚 Documentation

- **Full Integration Guide**: `MODEL_INTEGRATION.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Training Code Reference**: `trainedcode.md`

---

## 🎓 Usage Tips

### For Best Results:
1. **Camera**: Position to capture all students' faces
2. **Lighting**: Ensure adequate classroom lighting
3. **IoT Sensors**: Place sensors in central location
4. **Buffer Time**: Allow 5 minutes for system to stabilize

### Understanding Metrics:
- **High Engaged %**: Students showing positive attention (Neutral, Happy, Surprise)
- **Low Engaged %**: Students showing disengagement (Sad, Angry, Fear, Disgust)
- **Comfort Level**: Room environmental quality (0=Critical, 3=Optimal)

### Recommendations:
- **Green Checkmark** ✅: All conditions good
- **Warning** ⚠️: Specific action needed (e.g., "Turn ON AC")
- **Alert** 🚨: Critical condition detected

---

## 🎬 Example Session

### Minute 0: Startup
```bash
python app.py
# Server starts, models load
```

### Minute 1: Enable Camera
```
Click "Start Camera"
→ See live feed with engagement labels
→ Dashboard shows detected student count
```

### Minute 2: Enable IoT
```
Click "Start Logging"
→ Sensor data starts recording
→ Environment monitor updates
```

### Minute 5: Predictions Ready
```
Visit: http://localhost:5000/api/predictions/environment
→ See forecasts and comfort classification
→ Review recommendations
```

### Minute 10: Full Analytics
```
Dashboard fully populated:
✓ Engagement trends
✓ Occupancy history
✓ Environmental data
✓ Predictions available
```

---

## ✅ Success Checklist

- [ ] Test script passes (`python test_model_integration.py`)
- [ ] Server starts without errors
- [ ] Can access dashboard at localhost:5000
- [ ] Camera feed shows engagement labels
- [ ] IoT sensors connect and log data
- [ ] Predictions endpoint returns data after 20 readings
- [ ] Dashboard charts update in real-time
- [ ] No mock data visible anywhere

---

## 🆘 Support

**Check Logs**: Look at terminal output for error messages

**Test Models**: 
```bash
python test_model_integration.py
```

**Verify API**:
```bash
curl http://localhost:5000/api/health
```

**Common Issues**:
1. Port 5000 already in use → Change in `app.py`
2. Camera permission denied → Check OS settings
3. Arduino not found → Check COM port
4. Models not loading → Install scikit-learn

---

**Version**: 2.0  
**Last Updated**: November 25, 2025  
**Status**: Production Ready ✅
