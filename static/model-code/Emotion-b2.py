import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, mean_absolute_error, mean_squared_error
from sklearn.multioutput import MultiOutputRegressor
import matplotlib.pyplot as plt
import seaborn as sns
import pickle

# ========================================
# STEP 1: DATA PREPARATION
# ========================================

# Load your dataset
df = pd.read_csv('/content/Main_Dataset_with_analog.csv')  # Adjust path as needed

# Create engagement metrics
df['high_engagement'] = df['neutral'] + df['happy'] + df['surprise']
df['low_engagement'] = df['sad'] + df['angry'] + df['fear'] + df['disgust']

# Drop individual emotion columns
df = df.drop(['neutral', 'happy', 'surprise', 'sad', 'angry', 'fear', 'disgust'], axis=1)

# Convert timestamp to datetime
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values('timestamp')

# Feature engineering
df['hour'] = df['timestamp'].dt.hour
df['minute'] = df['timestamp'].dt.minute

# Define comfort classification function
def classify_comfort(row):
    """
    Classify room conditions based on optimal ranges
    Returns: 0=Critical, 1=Poor, 2=Acceptable, 3=Optimal
    """
    score = 0

    # Temperature (22-24°C optimal)
    if 22 <= row['temperature'] <= 24:
        score += 1
    elif 21 <= row['temperature'] <= 25:
        score += 0.5

    # Humidity (30-50% optimal)
    if 30 <= row['humidity'] <= 50:
        score += 1
    elif 25 <= row['humidity'] <= 55:
        score += 0.5

    # CO2 (<800 ppm good)
    if row['gas'] < 800:
        score += 1
    elif row['gas'] < 1000:
        score += 0.5

    # Lighting (150-250 lux optimal)
    if 150 <= row['light'] <= 250:
        score += 1
    elif 100 <= row['light'] <= 300:
        score += 0.5

    # Noise (35-60 dBA acceptable)
    if 35 <= row['sound'] <= 60:
        score += 1
    elif row['sound'] <= 70:
        score += 0.5

    # Classification
    if score >= 4.5:
        return 3  # Optimal
    elif score >= 3:
        return 2  # Acceptable
    elif score >= 1.5:
        return 1  # Poor
    else:
        return 0  # Critical

# Apply classification
df['comfort_level'] = df.apply(classify_comfort, axis=1)

print("Dataset shape:", df.shape)
print("\nComfort level distribution:")
print(df['comfort_level'].value_counts().sort_index())

# ========================================
# STEP 2: ENHANCED FEATURE ENGINEERING
# ========================================

print("\n" + "="*50)
print("FEATURE ENGINEERING FOR TIME SERIES")
print("="*50)

# Features to predict (environmental only)
forecast_features = ['temperature', 'humidity', 'gas', 'light', 'sound']

# Complementing features (NOT predicted, used as inputs)
complementing_features = ['occupancy', 'high_engagement', 'low_engagement']

def create_time_series_features(df, env_features, comp_features, windows=[5, 10, 15, 20]):
    """
    Create rolling statistics and lagged features for environmental variables
    AND include complementing features (occupancy, engagement) as additional inputs
    """
    df_features = df.copy()

    # Create features for ENVIRONMENTAL variables only
    for feature in env_features:
        # Rolling statistics
        for window in windows:
            df_features[f'{feature}_roll_mean_{window}'] = df[feature].rolling(window=window, min_periods=1).mean()
            df_features[f'{feature}_roll_std_{window}'] = df[feature].rolling(window=window, min_periods=1).std().fillna(0)
            df_features[f'{feature}_roll_min_{window}'] = df[feature].rolling(window=window, min_periods=1).min()
            df_features[f'{feature}_roll_max_{window}'] = df[feature].rolling(window=window, min_periods=1).max()

        # Lagged features
        for lag in [1, 2, 3, 5, 10]:
            df_features[f'{feature}_lag_{lag}'] = df[feature].shift(lag)

        # Trend features
        df_features[f'{feature}_trend_5'] = df[feature].diff(5)
        df_features[f'{feature}_trend_10'] = df[feature].diff(10)

    # ADD COMPLEMENTING FEATURES with their own rolling stats
    print("\n📊 Adding Complementing Features (Occupancy & Engagement):")
    for feature in comp_features:
        # Rolling statistics for complementing features
        for window in [5, 10, 15]:
            df_features[f'{feature}_roll_mean_{window}'] = df[feature].rolling(window=window, min_periods=1).mean()
            df_features[f'{feature}_roll_std_{window}'] = df[feature].rolling(window=window, min_periods=1).std().fillna(0)

        # Lagged features
        for lag in [1, 2, 5]:
            df_features[f'{feature}_lag_{lag}'] = df[feature].shift(lag)

        print(f"  ✓ Added features for: {feature}")

    # Additional interaction features
    df_features['engagement_ratio'] = df_features['high_engagement'] / (df_features['low_engagement'] + 1)
    df_features['occupancy_engagement'] = df_features['occupancy'] * df_features['high_engagement']

    # Drop rows with NaN
    df_features = df_features.dropna()

    return df_features

print("\nCreating enhanced time series features...")
df_engineered = create_time_series_features(df, forecast_features, complementing_features)

print(f"\n✅ Original dataset size: {len(df)}")
print(f"✅ After feature engineering: {len(df_engineered)}")
print(f"✅ Total features created: {len(df_engineered.columns)}")

# ========================================
# STEP 3: GRADIENT BOOSTING WITH COMPLEMENTING FEATURES
# ========================================

print("\n" + "="*50)
print("TRAINING GRADIENT BOOSTING WITH ENHANCED FEATURES")
print("="*50)

# Prepare features - NOW INCLUDING occupancy and engagement features
feature_cols = [col for col in df_engineered.columns
                if any(x in col for x in ['roll_mean', 'roll_std', 'roll_min', 'roll_max',
                                          'lag', 'trend', 'hour', 'minute',
                                          'occupancy', 'engagement', 'ratio'])]

print(f"\n📊 Total input features: {len(feature_cols)}")
print(f"\n🔍 Sample feature breakdown:")
env_features_count = sum(1 for col in feature_cols if any(x in col for x in forecast_features))
comp_features_count = sum(1 for col in feature_cols if any(x in col for x in complementing_features + ['engagement_ratio', 'occupancy_engagement']))
print(f"  - Environmental features: {env_features_count}")
print(f"  - Complementing features (occupancy/engagement): {comp_features_count}")
print(f"  - Time features: {sum(1 for col in feature_cols if col in ['hour', 'minute'])}")

# Show sample of complementing features included
comp_feat_samples = [f for f in feature_cols if any(x in f for x in complementing_features + ['engagement_ratio', 'occupancy_engagement'])][:10]
print(f"\n📋 Sample complementing features used:")
for feat in comp_feat_samples:
    print(f"  • {feat}")

# Current features (X) to predict next environmental values (y)
X_gb = df_engineered[feature_cols].iloc[:-1].values
y_gb = df_engineered[forecast_features].iloc[1:].values  # Only predict environmental features

# Train-test split
split_idx = int(len(X_gb) * 0.8)
X_train_gb = X_gb[:split_idx]
X_test_gb = X_gb[split_idx:]
y_train_gb = y_gb[:split_idx]
y_test_gb = y_gb[split_idx:]

print(f"\n✅ Gradient Boosting Training samples: {X_train_gb.shape[0]}")
print(f"✅ Gradient Boosting Test samples: {X_test_gb.shape[0]}")
print(f"✅ Input features shape: {X_train_gb.shape}")
print(f"✅ Output features (environmental): {len(forecast_features)}")

# Scale features
scaler_gb = StandardScaler()
X_train_gb_scaled = scaler_gb.fit_transform(X_train_gb)
X_test_gb_scaled = scaler_gb.transform(X_test_gb)

# Build Gradient Boosting model
print("\n🚀 Building Gradient Boosting model with complementing features...")
gb_model = MultiOutputRegressor(
    GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        min_samples_split=10,
        min_samples_leaf=4,
        subsample=0.8,
        random_state=42,
        verbose=0
    )
)

print("⏳ Training Gradient Boosting model...")
gb_model.fit(X_train_gb_scaled, y_train_gb)
print("✅ Training complete!")

# Make predictions
print("\n🔮 Making predictions...")
y_pred_gb = gb_model.predict(X_test_gb_scaled)

# Calculate metrics
print("\n" + "="*50)
print("GRADIENT BOOSTING PREDICTION ERRORS")
print("="*50)

for i, feature in enumerate(forecast_features):
    pred_values = y_pred_gb[:, i]
    actual_values = y_test_gb[:, i]
    mae = mean_absolute_error(actual_values, pred_values)
    rmse = np.sqrt(mean_squared_error(actual_values, pred_values))
    mape = np.mean(np.abs((actual_values - pred_values) / (actual_values + 1e-10))) * 100

    print(f"\n{feature.upper()}:")
    print(f"  MAE:  {mae:.2f}")
    print(f"  RMSE: {rmse:.2f}")
    print(f"  MAPE: {mape:.2f}%")

# Sample predictions
print("\n" + "="*50)
print("SAMPLE PREDICTIONS (First 5)")
print("="*50)
print("Format: [Temperature, Humidity, CO2, Light, Sound]\n")

for i in range(min(5, len(y_pred_gb))):
    print(f"Sample {i+1}:")
    print(f"  Predicted: {y_pred_gb[i]}")
    print(f"  Actual:    {y_test_gb[i]}")
    errors = np.abs(y_pred_gb[i] - y_test_gb[i])
    print(f"  Error:     {errors}\n")

# ========================================
# STEP 4: ENHANCED VISUALIZATION
# ========================================

print("Creating visualizations...")

# Plot 1: Prediction vs Actual for each feature
fig, axes = plt.subplots(2, 3, figsize=(15, 10))
sample_size = min(100, len(y_pred_gb))

plot_configs = [
    ('temperature', 'Temperature (°C)', 0),
    ('humidity', 'Humidity (%)', 1),
    ('gas', 'CO₂ (ppm)', 2),
    ('light', 'Light (lux)', 3),
    ('sound', 'Sound (dBA)', 4)
]

for i, (feature, ylabel, idx) in enumerate(plot_configs):
    row, col = i // 3, i % 3
    ax = axes[row, col]

    actual = y_test_gb[:sample_size, idx]
    predicted = y_pred_gb[:sample_size, idx]

    ax.plot(actual, label='Actual', alpha=0.8, linewidth=2, color='#2E86AB')
    ax.plot(predicted, label='Predicted', alpha=0.8, linewidth=2, linestyle='--', color='#A23B72')

    mae = mean_absolute_error(actual, predicted)
    ax.text(0.02, 0.98, f'MAE: {mae:.2f}',
            transform=ax.transAxes,
            verticalalignment='top',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.7),
            fontsize=10, fontweight='bold')

    ax.set_title(f'{ylabel} - Prediction vs Actual', fontsize=12, fontweight='bold')
    ax.set_xlabel('Time Step', fontsize=10)
    ax.set_ylabel(ylabel, fontsize=10)
    ax.legend(loc='upper right', fontsize=9)
    ax.grid(True, alpha=0.3)

axes[1, 2].remove()

plt.suptitle('Gradient Boosting Prediction Performance\n(Using Occupancy & Engagement Features)',
             fontsize=16, fontweight='bold', y=1.00)
plt.tight_layout()
plt.savefig('gb_predictions_with_complementing.png', dpi=300, bbox_inches='tight')
plt.show()

# Plot 2: Feature Importance Analysis
print("\n📊 Analyzing feature importance...")

# Combine feature importances from all models
all_importances = []
for estimator in gb_model.estimators_:
    all_importances.append(estimator.feature_importances_)

avg_importance = np.mean(all_importances, axis=0)

feature_importance_df = pd.DataFrame({
    'feature': feature_cols,
    'importance': avg_importance
}).sort_values('importance', ascending=False)

# Categorize features
def categorize_feature(feat_name):
    if any(x in feat_name for x in ['occupancy', 'engagement', 'ratio']):
        return 'Complementing'
    elif any(x in feat_name for x in forecast_features):
        return 'Environmental'
    else:
        return 'Time'

feature_importance_df['category'] = feature_importance_df['feature'].apply(categorize_feature)

print("\n🏆 Top 20 Most Important Features:")
print(feature_importance_df.head(20))

# Plot feature importance with categories
plt.figure(figsize=(12, 10))
top_features = feature_importance_df.head(25)

colors = {'Environmental': '#2E86AB', 'Complementing': '#F18F01', 'Time': '#C73E1D'}
bar_colors = [colors[cat] for cat in top_features['category']]

plt.barh(range(len(top_features)), top_features['importance'], color=bar_colors)
plt.yticks(range(len(top_features)), top_features['feature'])
plt.xlabel('Importance', fontsize=12, fontweight='bold')
plt.title('Feature Importance (Top 25)\nWith Occupancy & Engagement Integration',
          fontsize=14, fontweight='bold')
plt.gca().invert_yaxis()

# Add legend
from matplotlib.patches import Patch
legend_elements = [Patch(facecolor=colors['Environmental'], label='Environmental'),
                   Patch(facecolor=colors['Complementing'], label='Complementing (Occupancy/Engagement)'),
                   Patch(facecolor=colors['Time'], label='Time')]
plt.legend(handles=legend_elements, loc='lower right')

plt.tight_layout()
plt.savefig('gb_feature_importance_categorized.png', dpi=300, bbox_inches='tight')
plt.show()

# Show complementing features contribution
comp_features_importance = feature_importance_df[feature_importance_df['category'] == 'Complementing']
print(f"\n🎯 Complementing Features Contribution:")
print(f"  Total complementing features: {len(comp_features_importance)}")
print(f"  Total importance: {comp_features_importance['importance'].sum():.4f}")
print(f"  Average importance: {comp_features_importance['importance'].mean():.4f}")
print(f"\n  Top 10 Complementing Features:")
print(comp_features_importance.head(10))

# ========================================
# STEP 5: RANDOM FOREST CLASSIFICATION
# ========================================

print("\n" + "="*50)
print("TRAINING RANDOM FOREST FOR CLASSIFICATION")
print("="*50)

# Prepare data
rf_data = df_engineered.iloc[1:].copy().reset_index(drop=True)

# Get predictions
y_pred_train = gb_model.predict(X_train_gb_scaled)
complete_predictions = np.vstack([y_pred_train, y_pred_gb])

rf_data = rf_data.iloc[:len(complete_predictions)].copy()
rf_data['predicted_temperature'] = complete_predictions[:, 0]
rf_data['predicted_humidity'] = complete_predictions[:, 1]
rf_data['predicted_gas'] = complete_predictions[:, 2]
rf_data['predicted_light'] = complete_predictions[:, 3]
rf_data['predicted_sound'] = complete_predictions[:, 4]

# Features for Random Forest - INCLUDING complementing features
rf_features = [
    'temperature', 'humidity', 'gas', 'light', 'sound',
    'occupancy', 'high_engagement', 'low_engagement',  # Original complementing features
    'predicted_temperature', 'predicted_humidity', 'predicted_gas',
    'predicted_light', 'predicted_sound', 'hour', 'minute'
]

X_rf = rf_data[rf_features]
y_rf = rf_data['comfort_level']

unique_classes = sorted(y_rf.unique())
print(f"\n✅ Unique comfort levels: {unique_classes}")

# Split and train
X_train_rf, X_test_rf, y_train_rf, y_test_rf = train_test_split(
    X_rf, y_rf, test_size=0.2, random_state=42, stratify=y_rf
)

print(f"✅ Random Forest Training samples: {X_train_rf.shape[0]}")
print(f"✅ Random Forest Test samples: {X_test_rf.shape[0]}")

rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_train_rf, y_train_rf)

y_pred_rf = rf_model.predict(X_test_rf)
rf_accuracy = rf_model.score(X_test_rf, y_test_rf)

print(f"\n🎯 Random Forest Accuracy: {rf_accuracy:.4f}")

comfort_labels_map = {0: 'Critical', 1: 'Poor', 2: 'Acceptable', 3: 'Optimal'}
target_names = [comfort_labels_map[cls] for cls in unique_classes]

print("\nClassification Report:")
print(classification_report(y_test_rf, y_pred_rf, labels=unique_classes, target_names=target_names))

# Confusion Matrix
plt.figure(figsize=(8, 6))
cm = confusion_matrix(y_test_rf, y_pred_rf, labels=unique_classes)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=target_names, yticklabels=target_names)
plt.title('Random Forest Confusion Matrix', fontsize=14, fontweight='bold')
plt.ylabel('Actual', fontsize=12)
plt.xlabel('Predicted', fontsize=12)
plt.tight_layout()
plt.savefig('rf_confusion_matrix.png', dpi=300, bbox_inches='tight')
plt.show()

# Feature Importance
feature_importance_rf = pd.DataFrame({
    'feature': rf_features,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=False)

print("\n🏆 Top 10 Random Forest Feature Importances:")
print(feature_importance_rf.head(10))

plt.figure(figsize=(10, 8))
top_rf = feature_importance_rf.head(15)
plt.barh(top_rf['feature'], top_rf['importance'], color='#2E86AB')
plt.xlabel('Importance', fontsize=12)
plt.title('Random Forest Feature Importance (Top 15)', fontsize=14, fontweight='bold')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig('rf_feature_importance.png', dpi=300, bbox_inches='tight')
plt.show()

# ========================================
# STEP 6: INTEGRATED PREDICTION
# ========================================

print("\n" + "="*50)
print("INTEGRATED PREDICTION EXAMPLE")
print("="*50)

def predict_and_recommend(current_data, gb_model, scaler_gb, rf_model, feature_cols):
    """Complete prediction pipeline with complementing features"""
    current_engineered = create_time_series_features(
        current_data,
        forecast_features,
        complementing_features
    )

    if len(current_engineered) == 0:
        print("❌ Not enough data")
        return None, None

    X_current = current_engineered[feature_cols].iloc[-1:].values
    X_current_scaled = scaler_gb.transform(X_current)

    future_values = gb_model.predict(X_current_scaled)[0]
    current_row = current_data.iloc[-1]

    rf_input = pd.DataFrame([{
        'temperature': current_row['temperature'],
        'humidity': current_row['humidity'],
        'gas': current_row['gas'],
        'light': current_row['light'],
        'sound': current_row['sound'],
        'occupancy': current_row['occupancy'],
        'high_engagement': current_row['high_engagement'],
        'low_engagement': current_row['low_engagement'],
        'predicted_temperature': future_values[0],
        'predicted_humidity': future_values[1],
        'predicted_gas': future_values[2],
        'predicted_light': future_values[3],
        'predicted_sound': future_values[4],
        'hour': current_row['hour'],
        'minute': current_row['minute']
    }])

    comfort_prediction = rf_model.predict(rf_input)[0]
    comfort_proba = rf_model.predict_proba(rf_input)[0]
    actual_classes = rf_model.classes_

    print(f"\n📊 Current Conditions:")
    print(f"Temperature: {current_row['temperature']:.1f}°C")
    print(f"Humidity: {current_row['humidity']:.1f}%")
    print(f"CO₂: {current_row['gas']:.0f} ppm")
    print(f"Light: {current_row['light']:.0f} lux")
    print(f"Sound: {current_row['sound']:.0f} dBA")
    print(f"👥 Occupancy: {current_row['occupancy']}")
    print(f"😊 High Engagement: {current_row['high_engagement']}")
    print(f"😟 Low Engagement: {current_row['low_engagement']}")

    print(f"\n🔮 GB Predicted (Next Reading):")
    print(f"Temperature: {future_values[0]:.1f}°C (Δ{future_values[0]-current_row['temperature']:+.1f}°C)")
    print(f"Humidity: {future_values[1]:.1f}% (Δ{future_values[1]-current_row['humidity']:+.1f}%)")
    print(f"CO₂: {future_values[2]:.0f} ppm (Δ{future_values[2]-current_row['gas']:+.0f} ppm)")
    print(f"Light: {future_values[3]:.0f} lux (Δ{future_values[3]-current_row['light']:+.0f} lux)")
    print(f"Sound: {future_values[4]:.0f} dBA (Δ{future_values[4]-current_row['sound']:+.0f} dBA)")

    print(f"\n🎯 RF Classification:")
    print(f"Comfort: {comfort_labels_map[comfort_prediction]}")

    pred_idx = np.where(actual_classes == comfort_prediction)[0][0]
    print(f"Confidence: {comfort_proba[pred_idx]*100:.1f}%")

    print(f"\nProbabilities:")
    for i, cls in enumerate(actual_classes):
        print(f"  {comfort_labels_map[cls]}: {comfort_proba[i]*100:.1f}%")

    print(f"\n💡 Recommendations:")
    recs = []
    if future_values[0] > 24: recs.append("⚠️ Temp rising → AC")
    elif future_values[0] < 22: recs.append("⚠️ Temp low → Reduce cooling")
    if future_values[2] > 800: recs.append("⚠️ CO₂ high → Ventilate")
    if future_values[1] < 30: recs.append("⚠️ Humidity low → Humidifier")
    elif future_values[1] > 50: recs.append("⚠️ Humidity high → Ventilate")
    if future_values[3] < 150: recs.append("⚠️ Light low → Increase")
    elif future_values[3] > 250: recs.append("⚠️ Light high → Dim")
    if current_row['low_engagement'] > current_row['high_engagement']:
        recs.append("⚠️ Low engagement → Check teaching/break")
    if comfort_prediction <= 1: recs.append("🚨 ALERT: Uncomfortable conditions!")
    if not recs: recs.append("✅ All good!")

    for rec in recs:
        print(rec)

    return comfort_prediction, future_values

# Test
test_sample = df.iloc[-100:] if len(df) >= 100 else df
predict_and_recommend(test_sample, gb_model, scaler_gb, rf_model, feature_cols)

# ========================================
# STEP 7: SAVE MODELS
# ========================================

print("\n" + "="*50)
print("SAVING MODELS")
print("="*50)

with open('gb_model_with_complementing.pkl', 'wb') as f:
    pickle.dump(gb_model, f)
print("✅ GB model saved")

with open('rf_model_with_complementing.pkl', 'wb') as f:
    pickle.dump(rf_model, f)
print("✅ RF model saved")

with open('gb_scaler.pkl', 'wb') as f:
    pickle.dump(scaler_gb, f)
print("✅ Scaler saved")

with open('feature_columns.pkl', 'wb') as f:
    pickle.dump(feature_cols, f)
print("✅ Feature columns saved")

print("\n✅ COMPLETE!")
print("\n" + "="*50)
print("KEY ENHANCEMENTS:")
print("="*50)
print("✓ Occupancy features integrated as input")
print("✓ High/Low engagement features integrated")
print("✓ Interaction features (engagement_ratio, etc.)")
print("✓ Rolling stats for complementing features")
print("✓ Lagged values for occupancy & engagement")
print("✓ Color-coded feature importance chart")
print("✓ All features used in predictions")
print("="*50)