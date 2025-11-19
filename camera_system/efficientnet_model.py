"""
EfficientNet-B0 Emotion Detection Model
Keras/TensorFlow implementation for FER-2013 emotion recognition
Maps 7 raw emotions to 6 engagement states for classroom analysis
"""

from PIL import Image
import cv2
import numpy as np
from typing import Tuple, Dict
import os


class EfficientNetEmotionDetector:
    """
    Keras/TensorFlow EfficientNet-B0 model for emotion detection
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
    
    def __init__(self, model_path='static/model/model_combined_best.weights.h5'):
        """
        Initialize EfficientNet emotion detector
        
        Args:
            model_path: Path to trained model weights (.h5 file)
        """
        self.model_path = model_path
        self.model = None  # Will hold the Keras model directly
        self.emotion_labels = self.EMOTION_LABELS
        
        # Load the model
        self._load_model()
    def _load_model(self):
        """Load Keras model from H5 file"""
        try:
            print(f"[EfficientNet] Loading model...")
            
            # Load the specific combined model weights (Keras H5 format)
            model_path = 'static/model/model_combined_best.weights.h5'
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found: {model_path}")
            
            print(f"[EfficientNet] Loading Keras model from: {model_path}")
            
            try:
                # Load the Keras model directly using TensorFlow
                import tensorflow as tf
                
                # Load the pre-trained Keras model
                self.model = tf.keras.models.load_model(model_path)
                self.model_path = model_path
                
                print(f"✓ Successfully loaded Keras model from: {model_path}")
                print(f"  Model input shape: {self.model.input_shape}")
                print(f"  Model output shape: {self.model.output_shape}")
                print(f"✓ Model ready for inference")
                
            except ImportError:
                print(f"✗ TensorFlow not installed. Install with: pip install tensorflow")
                raise Exception("TensorFlow is required to load Keras .h5 model files")
            except Exception as e:
                print(f"✗ Failed to load Keras model: {e}")
                import traceback
                traceback.print_exc()
                raise Exception(f"Could not load model from {model_path}: {e}")
            
        except Exception as e:
            print(f"✗ Error loading EfficientNet model: {e}")
            import traceback
            traceback.print_exc()
            self.model = None
    
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
            print("[EfficientNet] WARNING: Model is None! Returning default Neutral.")
            return 'Neutral', 'Engaged', 0.0, {label: 0.0 for label in self.EMOTION_LABELS}
        
        try:
            import numpy as np
            
            # Preprocess for Keras model
            # Convert BGR to RGB
            if len(face_image.shape) == 3:
                face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            else:
                face_rgb = face_image
            
            # Resize to expected input size (224x224)
            pil_image = Image.fromarray(face_rgb)
            pil_image = pil_image.resize((224, 224))
            
            # Convert to array and normalize
            img_array = np.array(pil_image, dtype=np.float32)
            img_array = img_array / 255.0  # Normalize to 0-1
            img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
            
            # Run inference
            predictions = self.model.predict(img_array, verbose=0)
            probabilities = predictions[0]  # Get first (only) batch
            
            # Get top prediction
            predicted_idx = int(np.argmax(probabilities))
            confidence = float(probabilities[predicted_idx])
            raw_emotion = self.EMOTION_LABELS[predicted_idx]
            
            # Get all emotion probabilities
            all_predictions = {
                label: float(prob) 
                for label, prob in zip(self.EMOTION_LABELS, probabilities)
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
            import numpy as np
            
            results = []
            for face_image in face_images:
                # Preprocess for Keras model
                # Convert BGR to RGB
                if len(face_image.shape) == 3:
                    face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
                else:
                    face_rgb = face_image
                
                # Resize to expected input size
                pil_image = Image.fromarray(face_rgb)
                pil_image = pil_image.resize((224, 224))
                
                # Convert to array and normalize
                img_array = np.array(pil_image, dtype=np.float32)
                img_array = img_array / 255.0  # Normalize to 0-1
                img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
                
                # Run inference
                predictions = self.model.predict(img_array, verbose=0)
                probabilities = predictions[0]  # Get first (only) batch
                
                # Get top prediction
                predicted_idx = int(np.argmax(probabilities))
                confidence = float(probabilities[predicted_idx])
                raw_emotion = self.EMOTION_LABELS[predicted_idx]
                engagement_state = self.EMOTION_TO_ENGAGEMENT.get(raw_emotion, 'Engaged')
                
                # Get all emotion probabilities
                all_predictions = {
                    label: float(prob) 
                    for label, prob in zip(self.EMOTION_LABELS, probabilities)
                }
                
                results.append((raw_emotion, engagement_state, confidence, all_predictions))
            
            return results
            
        except Exception as e:
            print(f"Error during batch prediction: {e}")
            return []
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        return {
            'model_type': 'EfficientNet-B0 (Keras)',
            'model_path': self.model_path,
            'framework': 'TensorFlow/Keras',
            'emotion_classes': len(self.EMOTION_LABELS),
            'emotion_labels': self.EMOTION_LABELS,
            'input_size': (224, 224),
            'is_loaded': self.model is not None
        }
    
    def __repr__(self):
        """String representation"""
        return (f"EfficientNetEmotionDetector("
                f"framework=TensorFlow/Keras, "
                f"model_loaded={self.model is not None}, "
                f"emotions={len(self.EMOTION_LABELS)})")


# Test function
def test_detector():
    """Test the EfficientNet detector with a sample image"""
    print("Testing EfficientNet Emotion Detector...")
    
    # Initialize detector
    detector = EfficientNetEmotionDetector()
    
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
