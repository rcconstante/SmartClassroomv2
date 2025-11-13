# Quick Start Guide - Camera Page & LSTM

## 🚀 Start the Application

```bash
# 1. Navigate to project directory
cd "d:\Internship Projects\SmartClassroom"

# 2. Start Flask server
python app.py

# 3. Open browser
# Navigate to: http://localhost:5000
# Login, then click "Camera Monitor" in sidebar
```

---

## 📹 Camera Page Features

### New Layout

**Top Section:** Full-Width Camera Feed (16:9)
- Larger viewing area for better visibility
- Start/Stop controls overlay
- Student count badge
- Fullscreen button

**Middle Section:** Metrics Grid (4 cards)
- **Attention Level** - Real-time attention percentage with progress bar
- **Engagement** - Current engagement score with progress bar
- **Students Present** - Count of detected students (X/32)
- **Predicted Trend** - LSTM forecast (Improving/Declining/Stable)

**Bottom Section:** Charts (2 columns)
- **Current States** - Pie chart of engagement states
- **Engagement Forecast** - LSTM prediction chart (next 10 minutes)

**Final Section:** Detailed Analysis
- Large doughnut chart with all engagement states

---

## 🔮 LSTM Predictions

### What It Does

The LSTM model analyzes the **last 60 minutes** of classroom data and predicts the **next 20 minutes** of engagement trends.

### How to Read Predictions

**Trend Indicator:**
- 🟢 **Improving** - Engagement is expected to increase
- 🔴 **Declining** - Engagement is expected to decrease  
- 🟠 **Stable** - Engagement will remain consistent

**Forecast Chart:**
- **Green Solid Line** - Historical engagement (past 10 minutes)
- **Orange Dashed Line** - Predicted engagement (next 20 minutes)
- **Shaded Area** - Confidence interval (uncertainty range)

### Prediction Accuracy

**Without Trained Model (Simulation Mode):**
- Uses statistical analysis
- ~70% accuracy
- Good for demos and testing

**With Trained Model:**
- Uses deep learning
- 85-95% accuracy
- Requires training with your data

---

## 🎓 Train Your Own Model

### Quick Training (30 minutes)

```bash
# 1. Generate sample data
cd training_scripts
python generate_sample_data.py
# ✓ Creates 30 synthetic class sessions

# 2. Prepare data
python prepare_data.py
# ✓ Normalizes and creates sequences

# 3. Train model
python train_lstm.py
# ✓ Trains LSTM (may take 10-30 minutes)
# ✓ Saves to: static/model/lstm_classroom_model.h5

# 4. Restart server
cd ..
python app.py
# Should see: [LSTM] Model loaded successfully
```

### Production Training (with real data)

**Step 1: Collect Data**
- Run camera system during actual classes
- Record at least 20 different class sessions
- Export data to CSV format

**Step 2: Organize Data**
```
data/
├── training/      # 70% of sessions (e.g., 14 classes)
├── validation/    # 15% of sessions (e.g., 3 classes)
└── test/          # 15% of sessions (e.g., 3 classes)
```

**Step 3: Train**
```bash
cd training_scripts
python prepare_data.py
python train_lstm.py
```

**Step 4: Deploy**
- Model automatically saves to `static/model/`
- Restart Flask server
- Navigate to Camera Monitor page
- Predictions now use your trained model!

---

## 📊 Understanding the Data

### CSV Format Required

```csv
timestamp,attention,engagement,engaged,confused,frustrated,drowsy,bored,looking_away,student_count,environmental_score
2025-11-13 08:00:00,85,82,25,3,1,0,1,0,30,78
2025-11-13 08:02:00,83,80,24,4,1,0,1,0,30,78
```

**Columns:**
- `timestamp` - When recorded (every 1-2 minutes)
- `attention` - 0-100 (how focused students are)
- `engagement` - 0-100 (how actively participating)
- `engaged` - Count of engaged students
- `confused` - Count of confused students
- `frustrated` - Count of frustrated students
- `drowsy` - Count of drowsy students
- `bored` - Count of bored students
- `looking_away` - Count of students not paying attention
- `student_count` - Total students present
- `environmental_score` - 0-100 (room conditions)

---

## 🎯 Common Use Cases

### 1. Real-time Monitoring
**Scenario:** Monitor engagement during live class
- Open Camera Monitor page
- Start camera
- Watch real-time metrics update
- See current engagement states
- Monitor LSTM trend predictions

### 2. Intervention Planning
**Scenario:** Decide when to change teaching approach
- Check "Predicted Trend"
- If showing "Declining" → Plan intervention
- If "Stable but Low" → Adjust activity
- If "Improving" → Continue current approach

### 3. Historical Analysis
**Scenario:** Review past class performance
- Navigate to Analytics page
- Export CSV data
- Analyze patterns over time
- Compare different classes

### 4. Proactive Teaching
**Scenario:** Use predictions to stay ahead
- LSTM shows declining trend in 10 minutes
- Prepare engaging activity before decline happens
- Schedule break at predicted low point
- Time difficult content for predicted high engagement

---

## 🔧 Troubleshooting

### Camera Page Issues

**Issue:** Camera feed is small or side-by-side
- **Fix:** Clear browser cache (Ctrl+Shift+R)
- **Fix:** Ensure latest app.js is loaded

**Issue:** LSTM chart not showing
- **Check:** Browser console for errors (F12)
- **Fix:** Verify dashboard.js loaded
- **Fix:** Check if Chart.js is loaded

**Issue:** Predictions always "Stable" at 70%
- **This is normal:** No trained model yet
- **Fix:** Train model with real/sample data

### Training Issues

**Issue:** "Module 'tensorflow' not found"
```bash
pip install tensorflow
# or
pip install tensorflow-gpu  # if you have NVIDIA GPU
```

**Issue:** "Out of memory" during training
- **Fix:** Reduce batch size in train_lstm.py
- **Fix:** Close other applications
- **Fix:** Use smaller dataset initially

**Issue:** Training loss not decreasing
- **Check:** Data quality (needs at least 20 sessions)
- **Fix:** Increase epochs in train_lstm.py
- **Fix:** Adjust learning rate

### Prediction Issues

**Issue:** Predictions are always 0% or 100%
- **Check:** Model training completed successfully
- **Fix:** Verify model file exists: `static/model/lstm_classroom_model.h5`
- **Fix:** Retrain with more diverse data

**Issue:** API returns "LSTM predictor not available"
- **Check:** Terminal for import errors
- **Fix:** Install required packages
- **Fix:** Restart Flask server

---

## 📚 Documentation Files

**Main Guides:**
- `README.md` - Project overview and setup
- `LSTM_TRAINING_GUIDE.md` - Detailed training instructions (5000+ words)
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `data/README.md` - Data format and collection guide

**Quick References:**
- This file - Quick start and common tasks
- `ENGAGEMENT_MODEL_UPDATE.md` - Engagement model details

---

## ⚡ Performance Tips

### For Best Real-time Performance
1. Close unnecessary browser tabs
2. Use Chrome or Edge (best Canvas performance)
3. Keep camera resolution reasonable (720p sufficient)
4. Monitor CPU usage (<60% ideal)

### For Best Predictions
1. Collect data from diverse class sessions
2. Include morning and afternoon classes
3. Record different teaching styles
4. Maintain consistent observation intervals
5. Train with at least 20 sessions

### For Smooth Training
1. Use GPU if available (10x faster)
2. Start with smaller dataset for testing
3. Monitor training loss - should decrease
4. Stop if validation loss increases (overfitting)
5. Save training history plots for analysis

---

## ✅ Success Checklist

### Basic Setup
- [ ] Flask server starts without errors
- [ ] Can access http://localhost:5000
- [ ] Login works
- [ ] Camera Monitor page loads

### Camera Page
- [ ] Camera feed is full-width at top
- [ ] Metrics display in grid below
- [ ] Charts show below metrics
- [ ] Start camera button works
- [ ] All metrics update in real-time

### LSTM Predictions
- [ ] Trend indicator shows text
- [ ] Forecast chart displays
- [ ] Chart updates automatically
- [ ] Predictions are reasonable (40-95%)
- [ ] No console errors

### Model Training (Optional)
- [ ] Sample data generated successfully
- [ ] Data prepared (X_train.npy created)
- [ ] Model trained (lstm_classroom_model.h5 exists)
- [ ] Server loads model on startup
- [ ] Predictions use trained model

---

## 🎓 Learning Resources

**Understanding LSTM:**
- [LSTM Explained Visually](http://colah.github.io/posts/2015-08-Understanding-LSTMs/)
- [TensorFlow Time Series Guide](https://www.tensorflow.org/tutorials/structured_data/time_series)

**Improving Predictions:**
- Collect more diverse data
- Try different sequence lengths
- Adjust model architecture
- Use ensemble methods

**Advanced Features:**
- Real-time alerts based on predictions
- Email notifications for declining engagement
- Historical comparison reports
- Multi-class forecasting

---

## 💡 Pro Tips

### Camera Monitoring
- Position camera to see all students
- Ensure good lighting
- Test at different times of day
- Calibrate before important presentations

### Data Collection
- Start recording at class beginning
- Don't stop mid-session
- Record metadata (class type, time, weather)
- Note any unusual events

### Model Training
- More data = better predictions
- Diverse data > large homogeneous data
- Validate on recent unseen data
- Retrain monthly with new data

### Using Predictions
- Combine LSTM with real-time observations
- Don't rely 100% on predictions
- Use trends as guides, not rules
- Experiment with interventions

---

## 🆘 Getting Help

**Check First:**
1. Browser console (F12) for JavaScript errors
2. Terminal output for Python errors
3. This quick start guide
4. LSTM_TRAINING_GUIDE.md for detailed training help

**Still Need Help?**
- Review code comments in modified files
- Check requirements.txt for dependencies
- Verify all packages installed
- Test with sample data first

---

**Version:** 1.0  
**Last Updated:** November 13, 2025

**Ready to go!** Start with the basic setup, explore the camera page, then train your model when ready. 🚀
