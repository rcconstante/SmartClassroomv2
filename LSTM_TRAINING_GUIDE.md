# LSTM Model Training Guide
## Student Engagement Prediction System

**Version:** 1.0  
**Date:** November 13, 2025  
**Purpose:** Train LSTM models to predict classroom engagement trends over time

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Data Collection](#data-collection)
4. [Data Format](#data-format)
5. [Model Architecture](#model-architecture)
6. [Training Process](#training-process)
7. [Evaluation](#evaluation)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What is LSTM?

**LSTM (Long Short-Term Memory)** is a type of Recurrent Neural Network (RNN) designed to learn patterns in sequential data. In our Smart Classroom system, LSTM models:

- **Analyze temporal patterns** in student engagement over time
- **Predict future engagement levels** based on historical data
- **Detect trends** (improving, declining, or stable engagement)
- **Identify anomalies** in classroom behavior
- **Forecast classroom conditions** for proactive intervention

### Why LSTM for Classrooms?

Traditional models analyze single moments in time, but classroom dynamics are **temporal** - they evolve minute by minute. LSTM models excel at:

1. **Memory**: Remembering patterns from earlier in the class
2. **Context**: Understanding that morning vs. afternoon affects engagement
3. **Momentum**: Detecting when engagement is building or declining
4. **Prediction**: Forecasting when intervention might be needed

---

## 💻 System Requirements

### Hardware Requirements

**Minimum:**
- CPU: Intel i5 or equivalent
- RAM: 8GB
- Storage: 10GB free space
- GPU: Optional (speeds up training)

**Recommended:**
- CPU: Intel i7/i9 or AMD Ryzen 7/9
- RAM: 16GB+
- Storage: 50GB+ SSD
- GPU: NVIDIA with CUDA support (GTX 1660 or better)

### Software Requirements

```bash
# Python 3.8 or higher
python --version  # Should show 3.8+

# Required packages
pip install tensorflow>=2.10.0
pip install numpy>=1.21.0
pip install pandas>=1.3.0
pip install scikit-learn>=1.0.0
pip install matplotlib>=3.4.0
pip install seaborn>=0.11.0
```

### Optional Tools

```bash
# For data analysis
pip install jupyter notebook
pip install plotly

# For GPU acceleration
pip install tensorflow-gpu  # If you have NVIDIA GPU
```

---

## 📊 Data Collection

### Automatic Data Collection

The Smart Classroom system automatically collects data when the camera is running. Data is stored in real-time as students are monitored.

**What is Collected:**

| Feature | Description | Range |
|---------|-------------|-------|
| Attention | Student attention level | 0-100% |
| Engagement | Overall engagement score | 0-100% |
| Engaged Count | Number of engaged students | 0-50 |
| Confused Count | Number of confused students | 0-50 |
| Frustrated Count | Number of frustrated students | 0-50 |
| Drowsy Count | Number of drowsy students | 0-50 |
| Bored Count | Number of bored students | 0-50 |
| Looking Away Count | Students not paying attention | 0-50 |
| Student Count | Total students present | 0-50 |
| Environmental Score | Classroom conditions (temp, lighting) | 0-100% |
| Timestamp | When measurement was taken | DateTime |

### Manual Data Collection

If you don't have the camera system yet, you can collect data manually:

```python
# Example: Collect data every 2 minutes during class
import pandas as pd
from datetime import datetime

data_log = []

# During class, record observations:
observation = {
    'timestamp': datetime.now(),
    'attention': 82,  # Your assessment
    'engagement': 78,
    'engaged': 25,
    'confused': 5,
    'frustrated': 2,
    'drowsy': 0,
    'bored': 3,
    'looking_away': 5,
    'student_count': 30,
    'environmental_score': 75
}

data_log.append(observation)

# Save after class
df = pd.DataFrame(data_log)
df.to_csv('classroom_data_2025-11-13.csv', index=False)
```

### Data Collection Best Practices

✅ **Do:**
- Collect data from multiple class sessions
- Include different times of day (morning, afternoon)
- Capture various class types (lecture, discussion, lab)
- Record at consistent intervals (every 1-2 minutes)
- Include at least 20 class sessions for good model training

❌ **Don't:**
- Collect data only from one class or one time
- Use inconsistent time intervals
- Skip recording when engagement is low (this is important data!)
- Mix data from different class sizes without normalization

---

## 📁 Data Format

### CSV Format

Your training data should be in CSV format:

```csv
timestamp,attention,engagement,engaged,confused,frustrated,drowsy,bored,looking_away,student_count,environmental_score
2025-11-13 08:00:00,85,82,25,3,1,0,1,0,30,78
2025-11-13 08:02:00,83,80,24,4,1,0,1,0,30,78
2025-11-13 08:04:00,82,79,23,4,2,0,1,0,30,78
...
```

### Directory Structure

Organize your data like this:

```
SmartClassroom/
├── data/
│   ├── training/
│   │   ├── class_2025-11-01.csv
│   │   ├── class_2025-11-02.csv
│   │   ├── class_2025-11-03.csv
│   │   └── ... (more sessions)
│   ├── validation/
│   │   ├── class_2025-11-11.csv
│   │   └── class_2025-11-12.csv
│   └── test/
│       └── class_2025-11-13.csv
├── static/
│   └── model/
│       └── lstm_classroom_model.h5  (trained model will be saved here)
└── training_scripts/
    └── train_lstm.py
```

### Data Preprocessing Script

Create `training_scripts/prepare_data.py`:

```python
"""
Data preparation script for LSTM training
Loads raw CSV files and creates sequences for training
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import MinMaxScaler
import pickle

def load_and_preprocess(csv_files):
    """Load CSV files and preprocess for LSTM"""
    
    all_data = []
    for csv_file in csv_files:
        df = pd.read_csv(csv_file)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        all_data.append(df)
    
    # Combine all sessions
    combined_df = pd.concat(all_data, ignore_index=True)
    
    # Feature columns (what the model will learn from)
    feature_cols = [
        'attention', 'engagement', 
        'engaged', 'confused', 'frustrated', 'drowsy', 'bored', 'looking_away',
        'student_count', 'environmental_score'
    ]
    
    # Normalize features to 0-1 range
    scaler = MinMaxScaler()
    normalized_data = scaler.fit_transform(combined_df[feature_cols])
    
    # Save scaler for later use
    with open('../static/model/lstm_scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    
    return normalized_data, combined_df

def create_sequences(data, seq_length=30, pred_horizon=10):
    """
    Create sequences for LSTM training
    
    Args:
        data: Normalized feature array
        seq_length: How many time steps to look back (30 = 30 observations)
        pred_horizon: How many steps to predict forward (10 = next 10 observations)
    
    Returns:
        X: Input sequences (past data)
        y: Target sequences (future data to predict)
    """
    X, y = [], []
    
    for i in range(len(data) - seq_length - pred_horizon):
        # Input: last 30 observations
        X.append(data[i:i + seq_length])
        
        # Target: next 10 observations (just attention and engagement)
        y.append(data[i + seq_length:i + seq_length + pred_horizon, :2])
    
    return np.array(X), np.array(y)

def prepare_training_data():
    """Main function to prepare all training data"""
    
    # Load training files
    train_files = list(Path('../data/training').glob('*.csv'))
    val_files = list(Path('../data/validation').glob('*.csv'))
    
    print(f"Found {len(train_files)} training files")
    print(f"Found {len(val_files)} validation files")
    
    # Process training data
    train_data, train_df = load_and_preprocess(train_files)
    X_train, y_train = create_sequences(train_data)
    
    # Process validation data
    val_data, val_df = load_and_preprocess(val_files)
    X_val, y_val = create_sequences(val_data)
    
    print(f"\nTraining data shape: {X_train.shape}")
    print(f"Training labels shape: {y_train.shape}")
    print(f"Validation data shape: {X_val.shape}")
    print(f"Validation labels shape: {y_val.shape}")
    
    # Save processed data
    np.save('../data/X_train.npy', X_train)
    np.save('../data/y_train.npy', y_train)
    np.save('../data/X_val.npy', X_val)
    np.save('../data/y_val.npy', y_val)
    
    print("\n✓ Data preparation complete!")
    return X_train, y_train, X_val, y_val

if __name__ == '__main__':
    prepare_training_data()
```

---

## 🏗️ Model Architecture

### LSTM Architecture Explained

Our LSTM model has the following structure:

```
Input Layer (30 timesteps × 10 features)
    ↓
LSTM Layer 1 (128 units) + Dropout (0.2)
    ↓
LSTM Layer 2 (64 units) + Dropout (0.2)
    ↓
Dense Layer (32 units, ReLU)
    ↓
Output Layer (10 timesteps × 2 features)
    [Predicted attention, engagement for next 10 steps]
```

### Training Script

Create `training_scripts/train_lstm.py`:

```python
"""
LSTM Model Training Script
Trains a model to predict classroom engagement trends
"""

import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, RepeatVector, TimeDistributed
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt
from datetime import datetime

def build_lstm_model(seq_length=30, n_features=10, pred_horizon=10):
    """
    Build LSTM model architecture
    
    Args:
        seq_length: Number of past time steps to consider
        n_features: Number of input features
        pred_horizon: Number of future time steps to predict
    
    Returns:
        Compiled Keras model
    """
    model = Sequential([
        # First LSTM layer - learns temporal patterns
        LSTM(128, activation='tanh', return_sequences=True, 
             input_shape=(seq_length, n_features)),
        Dropout(0.2),  # Prevent overfitting
        
        # Second LSTM layer - captures higher-level patterns
        LSTM(64, activation='tanh', return_sequences=False),
        Dropout(0.2),
        
        # Repeat vector to match output sequence length
        RepeatVector(pred_horizon),
        
        # Decoder LSTM
        LSTM(64, activation='tanh', return_sequences=True),
        Dropout(0.2),
        
        # Output layer - predicts attention and engagement
        TimeDistributed(Dense(32, activation='relu')),
        TimeDistributed(Dense(2, activation='sigmoid'))  # 2 outputs: attention, engagement
    ])
    
    # Compile model
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='mse',  # Mean Squared Error for regression
        metrics=['mae', 'mse']  # Track Mean Absolute Error and MSE
    )
    
    return model

def train_model():
    """Main training function"""
    
    print("=" * 60)
    print("LSTM Classroom Engagement Predictor - Training")
    print("=" * 60)
    
    # Load preprocessed data
    print("\n📂 Loading training data...")
    X_train = np.load('../data/X_train.npy')
    y_train = np.load('../data/y_train.npy')
    X_val = np.load('../data/X_val.npy')
    y_val = np.load('../data/y_val.npy')
    
    print(f"✓ Training samples: {len(X_train)}")
    print(f"✓ Validation samples: {len(X_val)}")
    
    # Build model
    print("\n🏗️  Building LSTM model...")
    model = build_lstm_model()
    print(model.summary())
    
    # Setup callbacks
    callbacks = [
        # Save best model
        ModelCheckpoint(
            '../static/model/lstm_classroom_model.h5',
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        
        # Stop training if no improvement
        EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        ),
        
        # Reduce learning rate when stuck
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=0.00001,
            verbose=1
        )
    ]
    
    # Train model
    print("\n🚀 Starting training...")
    print("This may take several minutes to hours depending on data size...")
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=100,
        batch_size=32,
        callbacks=callbacks,
        verbose=1
    )
    
    # Plot training history
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss Over Time')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['mae'], label='Training MAE')
    plt.plot(history.history['val_mae'], label='Validation MAE')
    plt.title('Model MAE Over Time')
    plt.xlabel('Epoch')
    plt.ylabel('MAE')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig(f'../training_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png')
    print(f"\n✓ Training history saved to training_results_*.png")
    
    # Evaluate final model
    print("\n📊 Evaluating model...")
    test_loss, test_mae, test_mse = model.evaluate(X_val, y_val, verbose=0)
    print(f"✓ Test Loss (MSE): {test_loss:.4f}")
    print(f"✓ Test MAE: {test_mae:.4f}")
    
    print("\n🎉 Training complete!")
    print(f"✓ Model saved to: static/model/lstm_classroom_model.h5")
    
    return model, history

if __name__ == '__main__':
    # Set random seeds for reproducibility
    np.random.seed(42)
    tf.random.set_seed(42)
    
    # Train model
    model, history = train_model()
```

---

## 🚀 Training Process

### Step-by-Step Training

**1. Collect Data** (at least 20 class sessions)
```bash
# Ensure you have data files
ls data/training/
# Should show multiple .csv files
```

**2. Prepare Data**
```bash
cd training_scripts
python prepare_data.py
```

**3. Train Model**
```bash
python train_lstm.py
```

**4. Monitor Training**

Watch the output for:
- **Loss decreasing**: Model is learning
- **Val_loss similar to loss**: Model is not overfitting
- **MAE below 0.1**: Good prediction accuracy

**Example Good Output:**
```
Epoch 50/100
45/45 [==============================] - 5s 112ms/step
loss: 0.0234 - mae: 0.0876 - val_loss: 0.0256 - val_mae: 0.0912
```

**5. Verify Model File**
```bash
ls ../static/model/
# Should show: lstm_classroom_model.h5
```

### Training Tips

💡 **For Best Results:**

1. **More Data = Better Model**
   - Minimum: 10 class sessions
   - Good: 20-30 sessions
   - Excellent: 50+ sessions

2. **Diverse Data**
   - Different times of day
   - Different class types
   - Various engagement levels
   - Multiple class sizes

3. **Consistent Collection**
   - Same time intervals (1-2 minutes)
   - Same features recorded
   - Complete sessions (don't stop mid-class)

4. **Quality over Quantity**
   - Accurate labels better than many inaccurate ones
   - Clean data better than messy large dataset

---

## 📈 Evaluation

### Testing Your Model

Create `training_scripts/test_model.py`:

```python
"""
Test trained LSTM model
"""

import numpy as np
import tensorflow as tf
from pathlib import Path
import matplotlib.pyplot as plt

def test_model():
    """Test model on unseen data"""
    
    # Load model
    model = tf.keras.models.load_model('../static/model/lstm_classroom_model.h5')
    
    # Load test data
    test_files = list(Path('../data/test').glob('*.csv'))
    # ... (use same preprocessing as training)
    
    # Make predictions
    predictions = model.predict(X_test)
    
    # Plot results
    plt.figure(figsize=(15, 5))
    
    # Sample prediction
    sample_idx = 0
    plt.subplot(1, 2, 1)
    plt.plot(y_test[sample_idx, :, 0] * 100, 'b-', label='Actual Attention', linewidth=2)
    plt.plot(predictions[sample_idx, :, 0] * 100, 'r--', label='Predicted Attention', linewidth=2)
    plt.xlabel('Future Time Steps')
    plt.ylabel('Attention (%)')
    plt.title('Attention Prediction')
    plt.legend()
    plt.grid(True)
    
    plt.subplot(1, 2, 2)
    plt.plot(y_test[sample_idx, :, 1] * 100, 'b-', label='Actual Engagement', linewidth=2)
    plt.plot(predictions[sample_idx, :, 1] * 100, 'r--', label='Predicted Engagement', linewidth=2)
    plt.xlabel('Future Time Steps')
    plt.ylabel('Engagement (%)')
    plt.title('Engagement Prediction')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('../test_predictions.png')
    print("✓ Test results saved to test_predictions.png")

if __name__ == '__main__':
    test_model()
```

### Performance Metrics

**Good Model Performance:**
- MAE < 0.1 (predictions within ±10%)
- Training and validation loss similar
- Smooth predictions (not erratic)

**Signs of Problems:**
- Val_loss >> loss → Overfitting (need more data or regularization)
- Loss not decreasing → Learning rate too high/low
- Predictions always same value → Model not learning patterns

---

## 🚢 Deployment

### Deploying Your Model

1. **Copy trained model to production**
```bash
# Model should be in:
static/model/lstm_classroom_model.h5
```

2. **Restart Flask server**
```bash
python app.py
```

3. **Verify LSTM is loaded**

Look for this in server output:
```
✓ Camera system loaded successfully
✓ LSTM predictor initialized
[LSTM] Model loaded successfully from: static/model/lstm_classroom_model.h5
```

4. **Test predictions**

Navigate to Camera Monitor page and check:
- "Predicted Trend" shows correct trend
- "Engagement Forecast" chart updates
- Predictions are reasonable (not 0% or 100% always)

### Updating the Model

To update with new data:

1. Collect new class sessions
2. Add to `data/training/`
3. Run `prepare_data.py` again
4. Run `train_lstm.py` again
5. Replace old model file
6. Restart server

---

## 🔧 Troubleshooting

### Common Issues

**Issue: "Module 'tensorflow' not found"**
```bash
# Solution:
pip install tensorflow
# Or for GPU:
pip install tensorflow-gpu
```

**Issue: "Out of memory" during training**
```python
# Solution: Reduce batch size in train_lstm.py
batch_size=16  # Instead of 32
```

**Issue: Model predictions are always the same**
```python
# Solutions:
# 1. Check if you have enough diverse data
# 2. Increase model complexity
# 3. Train for more epochs
# 4. Check data preprocessing
```

**Issue: Val_loss much higher than loss**
```python
# Solution: Add more dropout
Dropout(0.3)  # Instead of 0.2

# Or reduce model complexity
LSTM(64)  # Instead of 128
```

### Getting Help

**Check these first:**
1. TensorFlow documentation: https://www.tensorflow.org/api_docs
2. Keras LSTM guide: https://keras.io/api/layers/recurrent_layers/lstm/
3. Our GitHub issues: (your repository)

---

## 📚 Additional Resources

### Learn More About LSTM

- [Understanding LSTM Networks](http://colah.github.io/posts/2015-08-Understanding-LSTMs/)
- [TensorFlow Time Series Tutorial](https://www.tensorflow.org/tutorials/structured_data/time_series)
- [Keras Examples](https://keras.io/examples/)

### Improve Your Model

Advanced techniques:
- **Attention mechanisms**: Focus on important time steps
- **Bidirectional LSTM**: Look at past and future
- **Multi-task learning**: Predict multiple outputs
- **Transfer learning**: Use pre-trained models

---

## ✅ Quick Start Checklist

- [ ] Install all required packages
- [ ] Collect at least 20 class sessions of data
- [ ] Organize data in correct folder structure
- [ ] Run `prepare_data.py`
- [ ] Run `train_lstm.py`
- [ ] Verify `lstm_classroom_model.h5` exists
- [ ] Test model with `test_model.py`
- [ ] Deploy model to production
- [ ] Monitor predictions in Camera Monitor page

---

**Need Help?** Create an issue on GitHub or contact the development team.

**Version History:**
- v1.0 (2025-11-13): Initial release

