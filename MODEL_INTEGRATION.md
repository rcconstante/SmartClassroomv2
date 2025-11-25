# Smart Classroom Model Integration Documentation

## Overview

This document describes the integration of trained machine learning models into the Smart Classroom system. The system now uses **real predictions** instead of mock data.

## Integrated Models

### 1. **Gradient Boosting Forecasting Model**
- **File**: `static/model/gradient_boosting_forecasting_model.pkl`
- **Purpose**: Predicts future environmental conditions (temperature, humidity, CO2, light, sound)
- **Input**: Last 20 historical sensor readings
- **Output**: Predicted values for next time step

### 2. **Random Forest Classifier**
- **File**: `static/model/random_forest_classifier.pkl`
- **Purpose**: Classifies room comfort level based on current and predicted conditions
- **Output Classes**:
  - 0: Critical
  - 1: Poor
  - 2: Acceptable
  - 3: Optimal
- **Features Used**:
  - Current sensor readings (temperature, humidity, CO2, light, sound)
  - Predicted future values from Gradient Boosting
  - Occupancy count
  - High engagement count
  - Low engagement count
  - Time of day (hour, minute)

### 3. **Supporting Files**
- **Scaler**: `static/model/gb_scaler.pkl` - MinMaxScaler for normalizing sensor data
- **Feature Columns**: `static/model/feature_columns.pkl` - Feature definitions for the models

## Emotion Detection Changes

### Previous System (7 Emotions)
- Happy, Surprise, Neutral, Sad, Angry, Disgust, Fear

### New System (High/Low Engagement)
The computer vision system now groups emotions into two categories:

**High Engagement** (Green):
- Neutral
- Happy
- Surprise

**Low Engagement** (Red):
- Sad
- Angry
- Fear
- Disgust

### Visual Representation
- Camera feed now displays: **"High Engaged"** or **"Low Engaged"** labels
- Dashboard shows engagement groupings instead of individual emotions
- Color coding: Green for high engagement, Red for low engagement

## API Endpoints

### New Endpoints

#### 1. Environmental Predictions
```
GET /api/predictions/environment
```

**Response**:
```json
{
  "success": true,
  "is_available": true,
  "current_conditions": {
    "temperature": 24.5,
    "humidity": 55.0,
    "co2": 450,
    "light": 400,
    "sound": 40,
    "occupancy": 28,
    "high_engagement": 22,
    "low_engagement": 6
  },
  "predicted_conditions": {
    "predicted_temperature": 24.8,
    "predicted_humidity": 54.5,
    "predicted_gas": 460,
    "predicted_light": 405,
    "predicted_sound": 42
  },
  "changes": {
    "temperature": 0.3,
    "humidity": -0.5,
    "gas": 10,
    "light": 5,
    "sound": 2
  },
  "comfort_classification": {
    "level": 3,
    "label": "Optimal",
    "probabilities": {
      "Critical": 0.05,
      "Poor": 0.10,
      "Acceptable": 0.25,
      "Optimal": 0.60
    }
  },
  "recommendations": [
    "✅ All conditions are good!"
  ],
  "timestamp": "2025-11-25T14:30:00"
}
```

### Updated Endpoints

#### 2. Emotion Statistics
```
GET /api/emotions
```

Now includes engagement summary:
```json
{
  "success": true,
  "data": {
    "total_faces": 28,
    "emotions": {...},
    "emotion_percentages": {...},
    "high_engagement": 22,
    "low_engagement": 6,
    "high_engagement_pct": 78.6,
    "low_engagement_pct": 21.4,
    "engagement": 78,
    "engagement_summary": {
      "high_engaged_count": 22,
      "low_engaged_count": 6,
      "high_engaged_pct": 78.6,
      "low_engaged_pct": 21.4,
      "total_faces": 28
    }
  }
}
```

## Data Flow

### 1. Sensor Data Collection
```
IoT Sensors → Serial Port → iot_sensor.py → Database/Queue
```

### 2. Computer Vision Processing
```
Camera → YOLO11 (Face Detection) → Keras CNN (Emotion) → Engagement Grouping
```

### 3. Prediction Pipeline
```
Historical Data (20 readings) → Gradient Boosting → Future Predictions
    ↓
Current Sensors + Predictions + CV Data → Random Forest → Comfort Classification
    ↓
Actionable Recommendations
```

### 4. Data Synchronization
- **CV Data Sync**: Every 10 seconds
  - Occupancy count
  - High/Low engagement counts
  - Individual emotion counts (for tracking)

- **Environmental Predictor Update**: Every 10 seconds
  - Adds new readings to history buffer
  - Maintains 20-reading window for forecasting

## Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

**New dependencies added**:
- `scikit-learn>=1.3.0` - For loading pickle models
- `pandas>=2.0.0` - For data manipulation

### 2. Verify Model Files
Ensure these files exist in `static/model/`:
- ✓ `gradient_boosting_forecasting_model.pkl`
- ✓ `random_forest_classifier.pkl`
- ✓ `gb_scaler.pkl`
- ✓ `feature_columns.pkl`
- ✓ `best_yolo11_face.pt` (YOLO face detector)
- ✓ `emotion_model_combined.h5` (Keras emotion model)

### 3. Run the System
```bash
python app.py
```

The system will:
1. Load all models on startup
2. Initialize IoT sensors (if connected)
3. Initialize environmental predictor
4. Start Flask server on port 5000

## Usage

### Starting a Session

1. **Connect IoT Sensors** (Optional but recommended)
   - Connect Arduino to COM5 (or update port in app.py)
   - Ensure Serial Monitor is closed

2. **Start Camera**
   - Click "Start Camera" button
   - System will detect faces and classify engagement
   - Display shows "High Engaged" or "Low Engaged" labels

3. **Enable Database Logging** (For predictions)
   - Click "Start Logging" in IoT section
   - System needs 20 readings before predictions are available
   - Takes approximately 3-4 minutes to collect initial data

4. **View Predictions**
   - Access `/api/predictions/environment` endpoint
   - System will provide:
     - Future environmental forecasts
     - Comfort level classification
     - Actionable recommendations

### Dashboard Features

**All Mock Data Removed - Now Shows Real Data:**

1. **Engagement Chart**: Real-time high/low engagement percentages
2. **Occupancy Chart**: Live student count from YOLO detection
3. **Environment Monitor**: Real IoT sensor readings
4. **Engagement States**: High vs Low engagement distribution

## Model Performance

Based on training (from `trainedcode.md`):

### Gradient Boosting (Forecasting)
- **Temperature MAE**: ~0.06°C
- **Humidity MAE**: ~0.5%
- **CO2 MAE**: ~10 ppm
- **Light MAE**: ~5 lux
- **Sound MAE**: ~2 dBA

### Random Forest (Classification)
- **Accuracy**: 99.7%
- **Classes**: 4 comfort levels
- **Features**: 15 input features

## Recommendations System

The system provides real-time recommendations based on predictions:

### Temperature
- ⚠️ Temperature rising → Turn ON fan/AC
- ⚠️ Temperature dropping → Reduce cooling

### Air Quality
- ⚠️ CO₂ increasing → Open windows or improve ventilation

### Humidity
- ⚠️ Humidity too low → Consider humidifier
- ⚠️ Humidity too high → Improve ventilation

### Lighting
- ⚠️ Light too low → Increase lighting
- ⚠️ Light too bright → Dim lights

### Engagement
- ⚠️ Low engagement detected → Check teaching methods or take break

### Critical Alerts
- 🚨 ALERT: Room conditions predicted to be uncomfortable!

## Troubleshooting

### Predictions Not Available
**Error**: "Not enough historical data"
- **Solution**: Wait for 20 sensor readings (3-4 minutes)
- **Check**: Database logging is enabled

### Models Not Loading
**Error**: "Environmental prediction models not available"
- **Solution**: Verify all `.pkl` files are in `static/model/`
- **Check**: Install scikit-learn: `pip install scikit-learn`

### IoT Sensors Not Connecting
**Error**: "IoT sensors not connected"
- **Solution**: Close Arduino IDE Serial Monitor
- **Check**: Correct COM port in app.py
- **Try**: Different baud rate (9600)

### Low Prediction Accuracy
- **Check**: Sensors are calibrated
- **Verify**: No extreme outlier values
- **Ensure**: Stable environmental conditions

## Technical Details

### History Buffer
- **Size**: 20 readings (configurable)
- **Type**: Deque (efficient FIFO)
- **Storage**: In-memory (resets on restart)

### Feature Engineering
- **Time Features**: Hour, minute (for temporal patterns)
- **Engagement Features**: High/low engagement counts
- **Environmental Features**: All 5 sensor readings
- **Predicted Features**: Future values from GB model

### Performance Optimizations
- **Model Loading**: Once at startup
- **Prediction Frequency**: On-demand via API
- **Data Sync**: Every 10 seconds (configurable)
- **Chart Updates**: Every 2-5 seconds

## Future Enhancements

1. **Long-term Data Storage**
   - Persist history buffer to database
   - Load historical patterns on startup

2. **Advanced Predictions**
   - Multi-step forecasting (predict 5-10 minutes ahead)
   - Confidence intervals for predictions

3. **Learning from Feedback**
   - Track recommendation effectiveness
   - Retrain models with new data

4. **Integration with HVAC**
   - Automatic control of AC/ventilation
   - Energy optimization

## References

- Training Code: `trainedcode.md`
- Model Architecture: See trainedcode.md for LSTM/GB + RF pipeline
- Dataset: Main_Dataset_with_analog.csv (11,000+ readings)

## Contact & Support

For issues or questions about model integration:
- Check error logs in console
- Verify all model files are present
- Ensure dependencies are installed
- Test with sample data first

---

**Last Updated**: November 25, 2025
**Version**: 2.0 - Real Model Integration
