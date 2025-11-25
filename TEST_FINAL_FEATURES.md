# Testing Guide - Final Features

## ✅ Features to Test

### 1. Forecast Chart
**Location**: Dashboard → "Environmental Forecast" section (replaced Occupancy chart)

**What to Check**:
- [ ] Bar chart displays with 5 parameters (Temperature, Humidity, CO₂, Light, Sound)
- [ ] Two bars for each parameter: "Current" (blue) and "Predicted" (orange)
- [ ] Hover tooltip shows:
  - Current value with unit (e.g., "25.5°C")
  - Predicted value with unit
  - Change/delta value (e.g., "Change: +2.3")
- [ ] Chart updates every 10 seconds automatically

**How to Test**:
```bash
# 1. Start the Flask server
python app.py

# 2. Open browser: http://localhost:5000

# 3. Check the forecast chart in the dashboard
# - Look for "Environmental Forecast" section
# - Verify bars are visible and labeled correctly
# - Hover over bars to see tooltips

# 4. Check browser console for errors:
# Press F12 → Console tab
# Should see "Dashboard initialized successfully!"
# Should NOT see any errors related to forecastChart
```

**API Test**:
```bash
# Test the predictions endpoint
curl http://localhost:5000/api/predictions/environment

# Expected output:
{
  "success": true,
  "comfort_classification": "Poor",  # or Optimal/Acceptable/Critical
  "comfort_confidence": 0.85,
  "current_conditions": {
    "temperature": 28.5,
    "humidity": 65.0,
    "co2": 850,
    "light": 250,
    "sound": 55
  },
  "predicted_conditions": {
    "predicted_temperature": 29.2,
    "predicted_humidity": 68.0,
    "predicted_gas": 900,
    "predicted_light": 240,
    "predicted_sound": 58
  },
  "recommendations": [
    "Temperature rising → Increase cooling",
    "CO2 increasing → Improve ventilation"
  ]
}
```

---

### 2. Dynamic Environment Status
**Location**: Dashboard → Top section, "Environment Status" card

**What to Check**:
- [ ] Status badge changes color based on RF classification:
  - 🟢 Green = "Optimal"
  - 🔵 Blue = "Acceptable"
  - 🟠 Orange = "Poor"
  - 🔴 Red = "Critical"
- [ ] Shows confidence percentage (e.g., "85.3%")
- [ ] Updates every 10 seconds
- [ ] No longer shows static "Optimal"

**How to Test**:
```bash
# 1. Check the environment status card in the dashboard
# - Look for colored badge with classification
# - Verify it's NOT always "Optimal"

# 2. Wait 10 seconds and observe status changes
# - Status should update based on real IoT sensor data

# 3. Manually trigger different classifications (optional):
# - Adjust temperature/humidity sensors
# - Watch status change from Optimal → Acceptable → Poor → Critical
```

---

### 3. Real-Time Notification System
**Location**: Top-right corner of the screen

**What to Check**:
- [ ] Notifications appear as pop-up toasts
- [ ] Color-coded by severity:
  - 🚨 Red = Critical alert
  - ⚠️ Orange = Warning
  - ℹ️ Blue = Information
- [ ] Shows recommendation icons: 🌡️ 💧 🌬️ 💡 🔊
- [ ] Auto-dismisses after 10-15 seconds
- [ ] Manual close button (X) works
- [ ] Multiple notifications stack vertically
- [ ] Slide-in animation from right

**How to Test**:
```bash
# 1. Wait for environment status to become "Poor" or "Critical"
# - Notifications will automatically appear

# 2. Check notification content:
# - Alert notification (if Critical/Poor): "🚨 ALERT: Room Conditions Critical!"
# - Recommendation notifications (top 3): "🌡️ Recommendation: Temperature rising → Increase cooling"

# 3. Test manual close:
# - Click the X button on a notification
# - Should fade out and slide away

# 4. Test auto-dismiss:
# - Wait 10 seconds for info notifications
# - Wait 15 seconds for warning/error notifications
# - Should automatically fade out

# 5. Test multiple notifications:
# - Should stack with 3 recommendation notifications
# - Staggered appearance (2-second delay between each)
```

**Manual Trigger (Testing Only)**:
Open browser console (F12) and run:
```javascript
// Test info notification
showNotification({
    type: 'recommendation',
    title: '🌡️ Recommendation',
    message: 'Temperature rising → Increase cooling',
    duration: 10000,
    severity: 'info'
});

// Test warning notification
showNotification({
    type: 'alert',
    title: '⚠️ Warning: Room Conditions Poor',
    message: 'Environment predicted to be poor. Please check recommendations.',
    duration: 15000,
    severity: 'warning'
});

// Test error notification
showNotification({
    type: 'alert',
    title: '🚨 ALERT: Room Conditions Critical!',
    message: 'Environment predicted to be critical. Immediate action required!',
    duration: 15000,
    severity: 'error'
});
```

---

### 4. Emotion & Engagement Charts (Verify No Regression)
**Location**: Dashboard → "Engagement States" and "Student Engagement & Attention" sections

**What to Check**:
- [ ] **Emotion States Chart**: Shows 7 emotions (Happy, Surprise, Neutral, Sad, Angry, Disgust, Fear)
- [ ] **Engagement & Attention Chart**: Shows "High Engagement" (green) and "Low Engagement" (red) trends
- [ ] Both charts update every 5 seconds
- [ ] No mock data visible

**How to Test**:
```bash
# 1. Check Emotion States chart (doughnut)
# - Should show percentages for all 7 emotions
# - Colors should match emotion type (e.g., Happy = yellow/green, Sad = blue)

# 2. Check Engagement & Attention chart (line)
# - Should show two lines: High Engagement (green) and Low Engagement (red)
# - X-axis shows timestamps
# - Y-axis shows student count

# 3. Test API endpoint:
curl http://localhost:5000/api/emotions

# Expected output:
{
  "emotions": {
    "Happy": 35.5,
    "Neutral": 40.2,
    "Sad": 10.0,
    "Angry": 5.0,
    "Surprise": 8.3,
    "Fear": 0.5,
    "Disgust": 0.5
  },
  "engagement_summary": {
    "high_engagement": 28,
    "low_engagement": 5,
    "high_engagement_percentage": 84.8,
    "low_engagement_percentage": 15.2
  },
  "faces_detected": 33
}
```

---

## 🔧 Troubleshooting

### Forecast Chart Not Showing
**Symptoms**: Blank space where forecast chart should be
**Solutions**:
1. Check browser console for errors
2. Verify `/api/predictions/environment` returns data:
   ```bash
   curl http://localhost:5000/api/predictions/environment
   ```
3. Ensure ML models are loaded in `static/model/`:
   - `gradient_boosting_forecasting_model.pkl`
   - `random_forest_classifier.pkl`
   - `scaler.pkl`
   - `feature_names.pkl`
4. Check Flask server logs for errors

### Environment Status Always "N/A"
**Symptoms**: Environment status shows "N/A" and doesn't update
**Solutions**:
1. Check IoT sensor data is flowing:
   ```bash
   python test_iot_connection.py
   ```
2. Verify environmental predictor has 20+ readings:
   ```python
   # In Python console
   from camera_system.ml_models import EnvironmentalPredictor
   predictor = EnvironmentalPredictor()
   print(f"Buffer size: {len(predictor.sensor_buffer)}")  # Should be >= 20
   ```
3. Wait 3-5 minutes for buffer to fill (10-second intervals × 20 readings = 200 seconds)

### Notifications Not Appearing
**Symptoms**: No notifications despite Poor/Critical status
**Solutions**:
1. Check browser console for JavaScript errors
2. Verify notification container exists:
   ```javascript
   // In browser console
   document.getElementById('notificationContainer')  // Should return element
   ```
3. Manually trigger notification (see test code above)
4. Check if notifications are blocked by browser (check browser settings)
5. Verify environment status is actually "Poor" or "Critical" (not "Acceptable" or "Optimal")

### Charts Not Updating
**Symptoms**: Charts frozen or not showing real-time data
**Solutions**:
1. Check browser console for interval errors
2. Verify API endpoints are responding:
   ```bash
   curl http://localhost:5000/api/emotions
   curl http://localhost:5000/api/predictions/environment
   ```
3. Refresh page (Ctrl+F5 / Cmd+Shift+R)
4. Clear browser cache
5. Check Flask server is running without errors

---

## 📊 Expected Behavior Timeline

**0-30 seconds** (Initial load):
- All charts initialize (emotion, engagement, forecast, occupancy)
- Environment status shows "N/A" (waiting for predictions)
- No notifications yet

**30-60 seconds**:
- Emotion & engagement charts start updating with CV data
- Occupancy chart shows student count
- Environment status still "N/A" (buffer filling)

**3-5 minutes** (After buffer fills):
- Environment status changes to classification (Optimal/Acceptable/Poor/Critical)
- Forecast chart updates with predictions
- Notifications appear if status is Poor/Critical

**Ongoing** (After 5 minutes):
- All charts update continuously
- Environment status updates every 10 seconds
- Notifications appear when recommendations change
- System runs autonomously

---

## ✅ Success Criteria

All features are working correctly if:
1. ✅ Forecast chart displays current vs predicted values
2. ✅ Environment status badge shows color-coded classification
3. ✅ Notifications appear for Poor/Critical conditions
4. ✅ All charts update in real-time
5. ✅ No JavaScript errors in browser console
6. ✅ API endpoints return valid data
7. ✅ No mock data visible anywhere

---

## 📝 Test Checklist

### Pre-Test Setup
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] ML models in `static/model/` directory
- [ ] IoT sensors connected (Arduino ESP32)
- [ ] Camera system functional (YOLO + Keras models)

### Dashboard Tests
- [ ] Forecast chart visible and updating
- [ ] Environment status badge color-coded
- [ ] Notifications appear and auto-dismiss
- [ ] Emotion chart shows 7 emotions
- [ ] Engagement chart shows high/low trends
- [ ] Occupancy chart shows student count

### API Tests
- [ ] `/api/predictions/environment` returns predictions
- [ ] `/api/emotions` returns emotion data
- [ ] No 500 errors in Flask logs

### Integration Tests
- [ ] Environment status matches RF classification
- [ ] Forecast chart matches prediction data
- [ ] Notifications match recommendations
- [ ] All charts sync with backend data

---

**Last Updated**: 2024
**System Version**: 1.0.0
