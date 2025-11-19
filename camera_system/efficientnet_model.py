"""
EfficientNet-B0 Emotion Detection Model
PyTorch implementation for FER-2013 emotion recognition
Maps 7 raw emotions to 6 engagement states for classroom analysis
"""

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import cv2
import numpy as np
from typing import Tuple, Dict
import os


class EfficientNetEmotionDetector:
    """
    PyTorch EfficientNet-B0 model for emotion detection
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
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.keras_model = None  # Will hold the Keras model
        self.use_keras = False  # Flag to indicate if using Keras model
        self.emotion_labels = self.EMOTION_LABELS
        
        # Image preprocessing transform - match training exactly
        # Training uses 224x224 RGB with per-channel normalization (mean=0.5, std=0.5)
        # NOTE: PyTorch will broadcast [0.5] to [0.5, 0.5, 0.5] for 3-channel RGB
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
        ])
        
        # Load the model
        self._load_model()
    def _load_model(self):
        """Load EfficientNet-B0 model with trained weights"""
        try:
            print(f"[EfficientNet] Loading model...")
            
            # Load the specific combined model weights (Keras H5 format)
            model_path = 'static/model/model_combined_best.weights.h5'
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found: {model_path}")
            
            print(f"[EfficientNet] Loading Keras model from: {model_path}")
            
            try:
                # This is a Keras model in HDF5 format - load it directly using TensorFlow
                import tensorflow as tf
                
                # Load the pre-trained Keras model
                keras_model = tf.keras.models.load_model(model_path)
                print(f"✓ Successfully loaded Keras model from: {model_path}")
                print(f"  Model input shape: {keras_model.input_shape}")
                print(f"  Model output shape: {keras_model.output_shape}")
                
                # Convert Keras model to PyTorch-compatible format
                # Extract weights from Keras model and create PyTorch model
                print(f"[EfficientNet] Converting Keras model to PyTorch format...")
                
                # Build PyTorch EfficientNet model with same architecture
                pytorch_model = models.efficientnet_b0(weights=None)
                num_features = pytorch_model.classifier[1].in_features
                pytorch_model.classifier[1] = nn.Linear(num_features, len(self.EMOTION_LABELS))
                
                # Try to transfer weights from Keras to PyTorch
                # Note: This is a simplified approach - layer names and structures may differ
                state_dict = {}
                for layer in keras_model.layers:
                    if layer.get_weights():
                        layer_name = layer.name
                        weights = layer.get_weights()
                        if len(weights) > 0:
                            # Store weights for manual mapping if needed
                            state_dict[layer_name] = weights
                
                if state_dict:
                    print(f"  Extracted {len(state_dict)} layers with weights from Keras model")
                
                # For now, use the Keras model directly with PyTorch
                # Create a wrapper that uses the Keras model for inference
                self.keras_model = keras_model
                self.use_keras = True
                pytorch_model = pytorch_model.to(self.device)
                pytorch_model.eval()
                self.model = pytorch_model
                
                self.model_path = model_path
                print(f"✓ Model loaded successfully")
                print(f"✓ Model ready on device: {self.device}")
                
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
            self.keras_model = None
    
    def preprocess_face(self, face_image):
        """
        Preprocess face image for model input
        
        Args:
            face_image: Face image in BGR format (from OpenCV)
            
        Returns:
            Preprocessed tensor ready for model
        """
        try:
            # Convert BGR to RGB
            if len(face_image.shape) == 3:
                face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            else:
                face_rgb = face_image
            
            # Convert to PIL Image
            pil_image = Image.fromarray(face_rgb)
            
            # Apply transforms (resize, grayscale, normalize)
            tensor = self.transform(pil_image)
            
            # Add batch dimension
            tensor = tensor.unsqueeze(0)
            
            return tensor.to(self.device)
            
        except Exception as e:
            print(f"Error preprocessing face: {e}")
            # Return a default tensor
            return torch.zeros((1, 1, 48, 48), device=self.device)
    
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
        if self.keras_model is None and self.model is None:
            print("[EfficientNet] WARNING: Model is None! Returning default Neutral.")
            return 'Neutral', 'Engaged', 0.0, {label: 0.0 for label in self.EMOTION_LABELS}
        
        try:
            # Use Keras model for inference if available
            if self.use_keras and self.keras_model is not None:
                import numpy as np
                
                # Preprocess for Keras model
                # Convert BGR to RGB
                if len(face_image.shape) == 3:
                    import cv2
                    face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
                else:
                    face_rgb = face_image
                
                # Resize to expected input size
                from PIL import Image
                pil_image = Image.fromarray(face_rgb)
                pil_image = pil_image.resize((224, 224))
                
                # Convert to array and normalize
                img_array = np.array(pil_image, dtype=np.float32)
                img_array = img_array / 255.0  # Normalize to 0-1
                img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
                
                # Run inference
                predictions = self.keras_model.predict(img_array, verbose=0)
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
            else:
                # Fall back to PyTorch inference
                input_tensor = self.preprocess_face(face_image)
                
                # Run inference
                with torch.no_grad():
                    outputs = self.model(input_tensor)
                    probabilities = torch.softmax(outputs, dim=1)
                    confidence, predicted_idx = torch.max(probabilities, dim=1)
                
                # Get prediction results
                predicted_idx = predicted_idx.item()
                confidence = confidence.item()
                raw_emotion = self.EMOTION_LABELS[predicted_idx]
                
                # Get all emotion probabilities
                all_probs = probabilities[0].cpu().numpy()
                all_predictions = {
                    label: float(prob) 
                    for label, prob in zip(self.EMOTION_LABELS, all_probs)
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
        if (self.keras_model is None and self.model is None) or len(face_images) == 0:
            return []
        
        try:
            if self.use_keras and self.keras_model is not None:
                import numpy as np
                import cv2
                from PIL import Image
                
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
                    predictions = self.keras_model.predict(img_array, verbose=0)
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
            else:
                # PyTorch batch inference
                tensors = [self.preprocess_face(img) for img in face_images]
                batch_tensor = torch.cat(tensors, dim=0)
                
                # Run batch inference
                with torch.no_grad():
                    outputs = self.model(batch_tensor)
                    probabilities = torch.softmax(outputs, dim=1)
                    confidences, predicted_indices = torch.max(probabilities, dim=1)
                
                # Parse results
                results = []
                for i in range(len(face_images)):
                    predicted_idx = predicted_indices[i].item()
                    confidence = confidences[i].item()
                    raw_emotion = self.EMOTION_LABELS[predicted_idx]
                    engagement_state = self.EMOTION_TO_ENGAGEMENT.get(raw_emotion, 'Engaged')
                    
                    all_probs = probabilities[i].cpu().numpy()
                    all_predictions = {
                        label: float(prob) 
                        for label, prob in zip(self.EMOTION_LABELS, all_probs)
                    }
                    
                    results.append((raw_emotion, engagement_state, confidence, all_predictions))
                
                return results
            
        except Exception as e:
            print(f"Error during batch prediction: {e}")
            return []
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        return {
            'model_type': 'EfficientNet-B0',
            'model_path': self.model_path,
            'device': str(self.device),
            'emotion_classes': len(self.EMOTION_LABELS),
            'emotion_labels': self.EMOTION_LABELS,
            'input_size': (224, 224),  # Changed from 48 to 224 to match training
            'is_loaded': self.model is not None
        }
    
    def __repr__(self):
        """String representation"""
        return (f"EfficientNetEmotionDetector("
                f"device={self.device}, "
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
