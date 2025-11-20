"""
Keras/TensorFlow Emotion Detection Model
Uses pre-trained FER-2013 emotion recognition model
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
import cv2
from typing import Tuple, Dict
import os


class KerasEmotionDetector:
    """
    TensorFlow/Keras CNN model for emotion detection
    Trained on FER-2013 dataset with 7 emotion classes
    """
    
    # FER-2013 emotion labels (7 classes)
    EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
    
    # Mapping from FER-2013 emotions to engagement states
    EMOTION_TO_ENGAGEMENT = {
        'Happy': 'Engaged',
        'Surprise': 'Engaged',
        'Neutral': 'Engaged',
        'Sad': 'Bored',
        'Angry': 'Frustrated',
        'Disgust': 'Frustrated',
        'Fear': 'Confused'
    }
    
    def __init__(self, model_path='static/model/emotion_model_combined.h5'):
        """
        Initialize Keras emotion detector
        
        Args:
            model_path: Path to complete trained model (.h5 file)
        """
        self.model_path = model_path
        self.model = None
        self.emotion_labels = self.EMOTION_LABELS
        self.input_shape = None  # Will be set after loading
        
        self._load_model()
    
    def _load_model(self):
        """Load complete Keras model from .h5 file"""
        try:
            print(f"[Keras] Loading emotion model...")
            
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            # Load complete model
            self.model = keras.models.load_model(self.model_path, compile=False)
            
            # Get input shape from model
            self.input_shape = self.model.input_shape[1:3]  # (height, width)
            
            print(f"✓ Model loaded successfully")
            print(f"  Model path: {self.model_path}")
            print(f"  Input shape: {self.model.input_shape}")
            print(f"  Output classes: {len(self.EMOTION_LABELS)}")
            
        except Exception as e:
            print(f"✗ Error loading Keras model: {e}")
            import traceback
            traceback.print_exc()
            self.model = None
    
    def _preprocess_image(self, face_image):
        """
        Preprocess face image for model input
        
        Args:
            face_image: Face image in BGR format (from OpenCV)
            
        Returns:
            Preprocessed image tensor
        """
        # Resize to model input size (48x48)
        resized = cv2.resize(face_image, (48, 48))
        
        # Model expects RGB, convert from BGR
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        
        # Normalize to [0, 1]
        normalized = rgb.astype('float32') / 255.0
        
        # Add batch dimension
        tensor = np.expand_dims(normalized, axis=0)
        
        return tensor
    
    def predict_emotion(self, face_image) -> Tuple[str, str, float, Dict[str, float]]:
        """
        Predict emotion from face image
        
        Args:
            face_image: Face image in BGR format (from OpenCV)
            
        Returns:
            Tuple of:
            - raw_emotion: Raw FER-2013 emotion label
            - engagement_state: Mapped engagement state
            - confidence: Prediction confidence (0-1)
            - all_predictions: Dictionary of all emotion probabilities
        """
        if self.model is None:
            print("[Keras] WARNING: Model is None! Returning default Neutral.")
            return 'Neutral', 'Engaged', 0.0, {label: 0.0 for label in self.EMOTION_LABELS}
        
        try:
            # Preprocess image
            tensor = self._preprocess_image(face_image)
            
            # Predict
            predictions = self.model.predict(tensor, verbose=0)[0]
            
            # Get top prediction
            predicted_idx = np.argmax(predictions)
            confidence = float(predictions[predicted_idx])
            raw_emotion = self.EMOTION_LABELS[predicted_idx]
            
            # Build predictions dict
            all_predictions = {
                label: float(prob)
                for label, prob in zip(self.EMOTION_LABELS, predictions)
            }
            
            # Map to engagement state
            engagement_state = self.EMOTION_TO_ENGAGEMENT.get(raw_emotion, 'Engaged')
            
            return raw_emotion, engagement_state, confidence, all_predictions
            
        except Exception as e:
            print(f"Error during emotion prediction: {e}")
            import traceback
            traceback.print_exc()
            return 'Neutral', 'Engaged', 0.0, {label: 0.0 for label in self.EMOTION_LABELS}
    
    def predict_batch(self, face_images):
        """
        Predict emotions for multiple faces at once (batch processing)
        
        Args:
            face_images: List of face images in BGR format
            
        Returns:
            List of tuples (raw_emotion, engagement_state, confidence, all_predictions)
        """
        if self.model is None or len(face_images) == 0:
            return []
        
        try:
            # Preprocess all images
            tensors = [self._preprocess_image(img) for img in face_images]
            batch_tensor = np.vstack(tensors)
            
            # Batch predict
            predictions = self.model.predict(batch_tensor, verbose=0)
            
            # Process results
            results = []
            for i in range(len(face_images)):
                predicted_idx = np.argmax(predictions[i])
                confidence = float(predictions[i][predicted_idx])
                raw_emotion = self.EMOTION_LABELS[predicted_idx]
                engagement_state = self.EMOTION_TO_ENGAGEMENT.get(raw_emotion, 'Engaged')
                
                all_predictions = {
                    label: float(prob)
                    for label, prob in zip(self.EMOTION_LABELS, predictions[i])
                }
                
                results.append((raw_emotion, engagement_state, confidence, all_predictions))
            
            return results
            
        except Exception as e:
            print(f"Error during batch prediction: {e}")
            return []
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        return {
            'model_type': 'Keras Custom CNN',
            'model_path': self.model_path,
            'framework': 'TensorFlow/Keras',
            'emotion_classes': len(self.EMOTION_LABELS),
            'emotion_labels': self.EMOTION_LABELS,
            'input_size': (48, 48),
            'input_channels': 1,  # Grayscale
            'is_loaded': self.model is not None
        }
    
    def __repr__(self):
        """String representation"""
        return (f"KerasEmotionDetector("
                f"model_loaded={self.model is not None}, "
                f"emotions={len(self.EMOTION_LABELS)})")


# Test function
def test_detector():
    """Test the Keras detector with a sample image"""
    print("Testing Keras Emotion Detector...")
    
    # Initialize detector
    detector = KerasEmotionDetector()
    
    # Print model info
    info = detector.get_model_info()
    print(f"\nModel Info:")
    for key, value in info.items():
        print(f"  {key}: {value}")
    
    # Create sample image
    sample_face = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    
    # Test prediction
    print(f"\nTesting prediction...")
    raw_emotion, engagement, confidence, all_preds = detector.predict_emotion(sample_face)
    
    print(f"\nResults:")
    print(f"  Raw Emotion: {raw_emotion}")
    print(f"  Engagement State: {engagement}")
    print(f"  Confidence: {confidence:.2%}")
    print(f"\n  All Predictions:")
    for emotion, prob in sorted(all_preds.items(), key=lambda x: x[1], reverse=True):
        print(f"    {emotion:10s}: {prob*100:5.1f}%")
    
    print(f"\n✓ Test completed successfully!")


if __name__ == "__main__":
    test_detector()
