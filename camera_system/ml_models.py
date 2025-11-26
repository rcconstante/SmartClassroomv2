"""
ML Models Module
Integrated prediction pipeline with:
- Gradient Boosting for environmental forecasting
- Random Forest for comfort classification
- YOLO11 for face detection
- CNN for emotion recognition
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd
import pickle
import os
import warnings
from datetime import datetime
from collections import deque

warnings.filterwarnings('ignore', category=UserWarning, module='sklearn')


class BaseModel(ABC):
    """Base class for all ML models"""
    
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.is_loaded = False
        self.model = None
        
    @abstractmethod
    def load_model(self, model_path: str) -> bool:
        """Load the model from file"""
        pass
    
    @abstractmethod
    def predict(self, input_data: Any) -> Any:
        """Make predictions on input data"""
        pass
    
    @abstractmethod
    def preprocess(self, data: Any) -> Any:
        """Preprocess data before prediction"""
        pass


class EnvironmentalPredictor:
    """
    Integrated environmental prediction system
    Uses Gradient Boosting for forecasting + Random Forest for classification
    Based on the trained model pipeline from trainedcode.md
    """
    
    def __init__(self, 
                 gb_model_path='static/model/gradient_boosting_forecasting_model.pkl',
                 rf_model_path='static/model/random_forest_classifier.pkl',
                 scaler_path='static/model/gb_scaler.pkl',
                 features_path='static/model/feature_columns.pkl',
                 sequence_length=4):
        """
        Initialize the prediction pipeline
        
        Args:
            gb_model_path: Path to Gradient Boosting forecasting model
            rf_model_path: Path to Random Forest classifier model
            scaler_path: Path to the scaler for GB model
            features_path: Path to feature columns definition
            sequence_length: Number of historical readings for forecasting (default 4 for 1-min ahead)
        """
        self.gb_model = None
        self.rf_model = None
        self.scaler = None
        self.feature_columns = None
        self.sequence_length = sequence_length
        self.is_loaded = False
        
        # Historical data buffer for sequence-based predictions
        self.history_buffer = deque(maxlen=sequence_length)
        
        # Comfort level labels
        self.comfort_labels = {
            0: 'Critical',
            1: 'Poor',
            2: 'Acceptable',
            3: 'Optimal'
        }
        
        # Forecast features (environmental sensors)
        self.forecast_features = ['temperature', 'humidity', 'gas', 'light', 'sound']
        
        # Load models
        self._load_models(gb_model_path, rf_model_path, scaler_path, features_path)
    
    def _load_models(self, gb_path, rf_path, scaler_path, features_path):
        """Load all prediction models and preprocessing objects"""
        try:
            # Load Gradient Boosting forecasting model
            if os.path.exists(gb_path):
                with open(gb_path, 'rb') as f:
                    self.gb_model = pickle.load(f)
                print(f"✓ Gradient Boosting model loaded: {gb_path}")
            else:
                print(f"⚠ Warning: GB model not found at {gb_path}")
            
            # Load Random Forest classifier
            if os.path.exists(rf_path):
                with open(rf_path, 'rb') as f:
                    self.rf_model = pickle.load(f)
                print(f"✓ Random Forest classifier loaded: {rf_path}")
            else:
                print(f"⚠ Warning: RF model not found at {rf_path}")
            
            # Load scaler
            if os.path.exists(scaler_path):
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                print(f"✓ Scaler loaded: {scaler_path}")
            else:
                print(f"⚠ Warning: Scaler not found at {scaler_path}")
            
            # Load feature columns (optional)
            if os.path.exists(features_path):
                with open(features_path, 'rb') as f:
                    self.feature_columns = pickle.load(f)
                print(f"✓ Feature columns loaded: {features_path}")
            
            # Check if all critical components loaded
            self.is_loaded = (self.gb_model is not None and 
                            self.rf_model is not None and 
                            self.scaler is not None)
            
            if self.is_loaded:
                print("✓ Environmental prediction pipeline ready")
            else:
                print("⚠ Warning: Some model components missing")
                
        except Exception as e:
            print(f"Error loading models: {e}")
            import traceback
            traceback.print_exc()
            self.is_loaded = False
    
    def add_reading(self, sensor_data: Dict):
        """
        Add a new sensor reading to the history buffer
        
        Args:
            sensor_data: Dictionary with keys: temperature, humidity, gas, light, sound,
                        occupancy, high_engagement, low_engagement
        """
        if not isinstance(sensor_data, dict):
            print(f"⚠ Warning: sensor_data must be a dictionary, got {type(sensor_data)}")
            return
        
        # Ensure all required fields are present
        required = self.forecast_features + ['occupancy', 'high_engagement', 'low_engagement']
        for key in required:
            if key not in sensor_data:
                print(f"⚠ Warning: Missing required field '{key}' in sensor data")
                return
        
        # Add timestamp if not present
        if 'timestamp' not in sensor_data:
            sensor_data['timestamp'] = datetime.now()
        
        # Calculate hour and minute for RF model
        timestamp = sensor_data['timestamp']
        sensor_data['hour'] = timestamp.hour
        sensor_data['minute'] = timestamp.minute
        
        self.history_buffer.append(sensor_data)
    
    def predict_future_conditions(self) -> Tuple[Dict, bool]:
        """
        Use Gradient Boosting to predict next environmental readings
        
        Returns:
            Tuple of (predictions_dict, success)
        """
        if not self.is_loaded or len(self.history_buffer) < self.sequence_length:
            return {}, False
        
        try:
            # Get last sequence_length readings
            sequence_data = list(self.history_buffer)[-self.sequence_length:]
            
            # Extract forecast features into 2D array
            sequence_array = np.array([
                [reading[feature] for feature in self.forecast_features]
                for reading in sequence_data
            ])
            
            # Flatten to 1D FIRST (before scaling)
            # Shape: (sequence_length * forecast_features,) = (4 * 5,) = (20,)
            sequence_flat = sequence_array.flatten().reshape(1, -1)
            
            # Normalize with scaler (expects flattened sequence)
            sequence_scaled = self.scaler.transform(sequence_flat)
            
            # Predict next values
            future_scaled = self.gb_model.predict(sequence_scaled)
            
            # Inverse transform to get real values
            future_values = self.scaler.inverse_transform(future_scaled.reshape(1, -1))[0]
            
            # Create predictions dictionary
            predictions = {
                'predicted_temperature': float(future_values[0]),
                'predicted_humidity': float(future_values[1]),
                'predicted_gas': float(future_values[2]),
                'predicted_light': float(future_values[3]),
                'predicted_sound': float(future_values[4])
            }
            
            return predictions, True
            
        except Exception as e:
            print(f"Error predicting future conditions: {e}")
            import traceback
            traceback.print_exc()
            return {}, False
    
    def classify_comfort(self, current_data: Dict, predictions: Dict = None) -> Tuple[int, Dict, List]:
        """
        Use Random Forest to classify room comfort level and get recommendations
        
        Args:
            current_data: Current sensor readings
            predictions: Predicted future values (optional, will compute if not provided)
            
        Returns:
            Tuple of (comfort_level, probabilities, recommendations)
        """
        if not self.is_loaded:
            return 0, {}, []
        
        try:
            # Get predictions if not provided
            if predictions is None:
                predictions, success = self.predict_future_conditions()
                if not success:
                    predictions = {f'predicted_{k}': current_data[k] 
                                 for k in self.forecast_features}
            
            # Prepare Random Forest input
            rf_input = pd.DataFrame([{
                'temperature': current_data['temperature'],
                'humidity': current_data['humidity'],
                'gas': current_data['gas'],
                'light': current_data['light'],
                'sound': current_data['sound'],
                'occupancy': current_data['occupancy'],
                'high_engagement': current_data['high_engagement'],
                'low_engagement': current_data['low_engagement'],
                'predicted_temperature': predictions.get('predicted_temperature', current_data['temperature']),
                'predicted_humidity': predictions.get('predicted_humidity', current_data['humidity']),
                'predicted_gas': predictions.get('predicted_gas', current_data['gas']),
                'predicted_light': predictions.get('predicted_light', current_data['light']),
                'predicted_sound': predictions.get('predicted_sound', current_data['sound']),
                'hour': current_data.get('hour', datetime.now().hour),
                'minute': current_data.get('minute', datetime.now().minute)
            }])
            
            # Predict comfort level
            comfort_level = int(self.rf_model.predict(rf_input)[0])
            comfort_proba = self.rf_model.predict_proba(rf_input)[0]
            
            # Create probability dictionary
            actual_classes = self.rf_model.classes_
            probabilities = {
                self.comfort_labels[cls]: float(comfort_proba[i])
                for i, cls in enumerate(actual_classes)
            }
            
            # Generate recommendations
            recommendations = self._generate_recommendations(current_data, predictions, comfort_level)
            
            return comfort_level, probabilities, recommendations
            
        except Exception as e:
            print(f"Error classifying comfort: {e}")
            import traceback
            traceback.print_exc()
            return 0, {}, []
    
    def _generate_recommendations(self, current: Dict, predicted: Dict, comfort_level: int) -> List[str]:
        """Generate actionable recommendations based on current and predicted conditions"""
        recommendations = []
        
        # Temperature recommendations
        pred_temp = predicted.get('predicted_temperature', current['temperature'])
        if pred_temp > 24:
            recommendations.append("⚠️ Temperature rising → Turn ON fan/AC")
        elif pred_temp < 22:
            recommendations.append("⚠️ Temperature dropping → Reduce cooling")
        
        # CO2/Gas recommendations
        pred_gas = predicted.get('predicted_gas', current['gas'])
        if pred_gas > 800:
            recommendations.append("⚠️ CO₂ increasing → Open windows or improve ventilation")
        
        # Humidity recommendations
        pred_humidity = predicted.get('predicted_humidity', current['humidity'])
        if pred_humidity < 30:
            recommendations.append("⚠️ Humidity too low → Consider humidifier")
        elif pred_humidity > 50:
            recommendations.append("⚠️ Humidity too high → Improve ventilation")
        
        # Light recommendations
        pred_light = predicted.get('predicted_light', current['light'])
        if pred_light < 150:
            recommendations.append("⚠️ Light too low → Increase lighting")
        elif pred_light > 250:
            recommendations.append("⚠️ Light too bright → Dim lights")
        
        # Engagement recommendations
        if current.get('low_engagement', 0) > current.get('high_engagement', 0):
            recommendations.append("⚠️ Low engagement detected → Check teaching methods or take break")
        
        # Critical alert
        if comfort_level <= 1:
            recommendations.append("🚨 ALERT: Room conditions predicted to be uncomfortable!")
        
        # All good
        if not recommendations:
            recommendations.append("✅ All conditions are good!")
        
        return recommendations
    
    def get_prediction_summary(self, current_data: Dict) -> Dict:
        """
        Get complete prediction summary with forecasting and classification
        
        Args:
            current_data: Current sensor readings
            
        Returns:
            Dictionary with current conditions, predictions, comfort classification, and recommendations
        """
        if not self.is_loaded:
            return {
                'error': 'Prediction models not loaded',
                'is_available': False
            }
        
        # Make sure we have enough history
        if len(self.history_buffer) < self.sequence_length:
            return {
                'error': f'Not enough historical data (need {self.sequence_length} readings, have {len(self.history_buffer)})',
                'is_available': False,
                'current_buffer_size': len(self.history_buffer),
                'required_buffer_size': self.sequence_length
            }
        
        # Get predictions
        predictions, pred_success = self.predict_future_conditions()
        
        # Get comfort classification
        comfort_level, probabilities, recommendations = self.classify_comfort(current_data, predictions)
        
        # Calculate changes (delta)
        changes = {}
        if pred_success:
            for feature in self.forecast_features:
                predicted_key = f'predicted_{feature}'
                if predicted_key in predictions:
                    changes[feature] = predictions[predicted_key] - current_data[feature]
        
        return {
            'is_available': True,
            'current_conditions': {
                'temperature': current_data['temperature'],
                'humidity': current_data['humidity'],
                'co2': current_data['gas'],
                'light': current_data['light'],
                'sound': current_data['sound'],
                'occupancy': current_data['occupancy'],
                'high_engagement': current_data['high_engagement'],
                'low_engagement': current_data['low_engagement']
            },
            'predicted_conditions': predictions if pred_success else {},
            'changes': changes,
            'comfort_classification': {
                'level': comfort_level,
                'label': self.comfort_labels.get(comfort_level, 'Unknown'),
                'probabilities': probabilities
            },
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        }


# Global instance of environmental predictor (singleton pattern)
_environmental_predictor = None

def get_environmental_predictor() -> EnvironmentalPredictor:
    """Get or create the global environmental predictor instance"""
    global _environmental_predictor
    if _environmental_predictor is None:
        _environmental_predictor = EnvironmentalPredictor()
    return _environmental_predictor
