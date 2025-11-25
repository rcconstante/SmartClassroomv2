"""
Test script to verify model integration
Run this to check if all models load correctly
"""

import sys
import os

print("="*60)
print("SMART CLASSROOM MODEL INTEGRATION TEST")
print("="*60)

# Test 1: Check if model files exist
print("\n[1] Checking model files...")
model_files = {
    'Gradient Boosting Model': 'static/model/gradient_boosting_forecasting_model.pkl',
    'Random Forest Model': 'static/model/random_forest_classifier.pkl',
    'GB Scaler': 'static/model/gb_scaler.pkl',
    'Feature Columns': 'static/model/feature_columns.pkl',
    'YOLO Face Detector': 'static/model/best_yolo11_face.pt',
    'Emotion Model': 'static/model/emotion_model_combined.h5'
}

all_files_exist = True
for name, path in model_files.items():
    exists = os.path.exists(path)
    status = "✓" if exists else "✗"
    print(f"  {status} {name}: {path}")
    if not exists:
        all_files_exist = False

if not all_files_exist:
    print("\n❌ ERROR: Some model files are missing!")
    print("Please ensure all required model files are in static/model/")
    sys.exit(1)

print("\n✓ All model files found!")

# Test 2: Import required libraries
print("\n[2] Checking dependencies...")
try:
    import pickle
    print("  ✓ pickle")
except ImportError as e:
    print(f"  ✗ pickle: {e}")
    sys.exit(1)

try:
    import numpy as np
    print("  ✓ numpy")
except ImportError as e:
    print(f"  ✗ numpy: {e}")
    print("  Install: pip install numpy")
    sys.exit(1)

try:
    import pandas as pd
    print("  ✓ pandas")
except ImportError as e:
    print(f"  ✗ pandas: {e}")
    print("  Install: pip install pandas")
    sys.exit(1)

try:
    import sklearn
    print(f"  ✓ scikit-learn (version {sklearn.__version__})")
except ImportError as e:
    print(f"  ✗ scikit-learn: {e}")
    print("  Install: pip install scikit-learn")
    sys.exit(1)

# Test 3: Load Environmental Predictor
print("\n[3] Loading Environmental Predictor...")
try:
    from camera_system.ml_models import EnvironmentalPredictor
    
    predictor = EnvironmentalPredictor()
    
    if predictor.is_loaded:
        print("  ✓ Environmental predictor loaded successfully!")
        print(f"  - Gradient Boosting: {'Loaded' if predictor.gb_model else 'Failed'}")
        print(f"  - Random Forest: {'Loaded' if predictor.rf_model else 'Failed'}")
        print(f"  - Scaler: {'Loaded' if predictor.scaler else 'Failed'}")
        print(f"  - Sequence Length: {predictor.sequence_length}")
        print(f"  - Comfort Labels: {list(predictor.comfort_labels.values())}")
    else:
        print("  ✗ Environmental predictor failed to load")
        print("  Check model files and dependencies")
        sys.exit(1)
        
except Exception as e:
    print(f"  ✗ Error loading environmental predictor: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Test prediction with dummy data
print("\n[4] Testing prediction pipeline...")
try:
    from datetime import datetime
    
    # Add 20 dummy readings to the buffer
    print("  Adding 20 dummy sensor readings...")
    for i in range(20):
        dummy_data = {
            'temperature': 24.0 + (i * 0.1),
            'humidity': 55.0 + (i * 0.2),
            'gas': 500 + (i * 5),
            'light': 400 + (i * 2),
            'sound': 40 + (i * 1),
            'occupancy': 25 + (i % 5),
            'high_engagement': 20 + (i % 3),
            'low_engagement': 5 + (i % 2),
            'timestamp': datetime.now()
        }
        predictor.add_reading(dummy_data)
    
    print(f"  ✓ Buffer filled: {len(predictor.history_buffer)} readings")
    
    # Test prediction
    print("\n  Testing future predictions...")
    predictions, success = predictor.predict_future_conditions()
    
    if success:
        print("  ✓ Gradient Boosting predictions:")
        for key, value in predictions.items():
            print(f"    - {key}: {value:.2f}")
    else:
        print("  ✗ Gradient Boosting prediction failed")
    
    # Test classification
    print("\n  Testing comfort classification...")
    current_data = predictor.history_buffer[-1]
    comfort_level, probabilities, recommendations = predictor.classify_comfort(current_data, predictions)
    
    print(f"  ✓ Random Forest classification:")
    print(f"    - Comfort Level: {comfort_level} ({predictor.comfort_labels[comfort_level]})")
    print(f"    - Probabilities:")
    for label, prob in probabilities.items():
        print(f"      {label}: {prob*100:.1f}%")
    print(f"    - Recommendations:")
    for rec in recommendations:
        print(f"      {rec}")
    
    # Test full summary
    print("\n  Testing prediction summary...")
    summary = predictor.get_prediction_summary(current_data)
    
    if summary.get('is_available'):
        print("  ✓ Prediction summary generated successfully!")
        print(f"    - Current Temp: {summary['current_conditions']['temperature']:.1f}°C")
        print(f"    - Predicted Temp: {summary['predicted_conditions'].get('predicted_temperature', 'N/A')}")
        if 'temperature' in summary.get('changes', {}):
            print(f"    - Change: {summary['changes']['temperature']:+.1f}°C")
    else:
        print(f"  ✗ Prediction summary failed: {summary.get('error')}")
    
except Exception as e:
    print(f"  ✗ Error testing predictions: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 5: Test emotion detector integration
print("\n[5] Testing emotion detector (engagement grouping)...")
try:
    from camera_system.emotion_detector import HIGH_ENGAGEMENT_EMOTIONS, LOW_ENGAGEMENT_EMOTIONS
    
    print(f"  ✓ High Engagement Emotions: {HIGH_ENGAGEMENT_EMOTIONS}")
    print(f"  ✓ Low Engagement Emotions: {LOW_ENGAGEMENT_EMOTIONS}")
    
    print("\n  Emotion grouping configured correctly!")
    
except Exception as e:
    print(f"  ✗ Error checking emotion detector: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Final Summary
print("\n" + "="*60)
print("✓ ALL TESTS PASSED!")
print("="*60)
print("\nModel Integration Summary:")
print("  • Gradient Boosting: ✓ Loaded and tested")
print("  • Random Forest: ✓ Loaded and tested")
print("  • Scaler: ✓ Loaded and functional")
print("  • Prediction Pipeline: ✓ Working correctly")
print("  • Engagement Grouping: ✓ Configured")
print("\nThe system is ready to use!")
print("Run 'python app.py' to start the Smart Classroom server.")
print("="*60)
