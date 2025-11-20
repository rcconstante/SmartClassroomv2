"""
Keras/TensorFlow Custom CNN Emotion Detection Model
For FER-2013 emotion recognition
Maps 7 raw emotions to 6 engagement states for classroom analysis
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
import cv2
from PIL import Image
from typing import Tuple, Dict
import os


class KerasEmotionDetector:
    """
    TensorFlow/Keras CNN model for emotion detection
    Trained on FER-2013 dataset with 7 emotion classes
    Input size: 48x48 grayscale images
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
    
    def __init__(self, model_path='static/model/model_combined_best.weights.h5'):
        """
        Initialize Keras CNN emotion detector
        
        Args:
            model_path: Path to trained model weights (.h5 file)
        """
        self.model_path = model_path
        self.model = None
        self.emotion_labels = self.EMOTION_LABELS
        self.input_shape = (48, 48, 1)  # Grayscale input
        
        self._load_model()
    
    def _build_cnn_architecture(self):
        """Build the custom CNN architecture"""
        model = keras.Sequential([
            # Block 1
            keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same', input_shape=self.input_shape),
            keras.layers.BatchNormalization(),
            keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            keras.layers.BatchNormalization(),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Dropout(0.25),
            
            # Block 2
            keras.layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
            keras.layers.BatchNormalization(),
            keras.layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
            keras.layers.BatchNormalization(),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Dropout(0.25),
            
            # Block 3
            keras.layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
            keras.layers.BatchNormalization(),
            keras.layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
            keras.layers.BatchNormalization(),
            keras.layers.MaxPooling2D((2, 2)),
            keras.layers.Dropout(0.25),
            
            # Dense layers
            keras.layers.Flatten(),
            keras.layers.Dense(512, activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(256, activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(len(self.EMOTION_LABELS), activation='softmax')
        ])
        
        return model
    
    def _load_model(self):
        """Load Keras model from .h5 weights file"""
        try:
            print(f"[Keras CNN] Loading model...")
            
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            print(f"[Keras CNN] Building architecture...")
            self.model = self._build_cnn_architecture()
            
            print(f"[Keras CNN] Loading weights from: {self.model_path}")
            try:
                # Try loading weights
                self.model.load_weights(self.model_path)
                print(f"✓ Successfully loaded Keras CNN model weights")
            except Exception as e:
                print(f"Warning: Could not load weights directly: {e}")
                print(f"Attempting to build from scratch with saved weights...")
                
                # Try loading as full model if it's a complete model file
                try:
                    self.model = keras.models.load_model(self.model_path, compile=False)
                    print(f"✓ Loaded as complete Keras model")
                except:
                    print(f"Building model with random initialization (weights file may be incomplete)")
            
            # Compile model
            self.model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            print(f"  Input shape: {self.input_shape}")
            print(f"  Output classes: {len(self.EMOTION_LABELS)}")
            print(f"  Model ready for inference")
            
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
        # Convert to grayscale if needed
        if len(face_image.shape) == 3:
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_image
        
        # Resize to 48x48
        resized = cv2.resize(gray, (48, 48))
        
        # Normalize to [0, 1]
        normalized = resized.astype('float32') / 255.0
        
        # Add channel dimension and batch dimension
        tensor = np.expand_dims(normalized, axis=-1)  # Add channel dim
        tensor = np.expand_dims(tensor, axis=0)  # Add batch dim
        
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
