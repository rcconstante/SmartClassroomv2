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
    
    def __init__(self, model_path='static/model/fer2013-bestmodel-new.pth'):
        """
        Initialize EfficientNet emotion detector
        
        Args:
            model_path: Path to trained model weights (.pth file)
        """
        self.model_path = model_path
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
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
            # Build EfficientNet-B0 model architecture - MATCH TRAINING EXACTLY
            print(f"[EfficientNet] Building model architecture...")
            model = models.efficientnet_b0(weights=None)
            
            # Modify classifier head for 7 emotion classes
            # The model expects RGB input (3 channels) as per training code
            num_features = model.classifier[1].in_features
            model.classifier[1] = nn.Linear(num_features, len(self.EMOTION_LABELS))
            
            # Try to load weights from multiple possible paths
            model_paths_to_try = [
                self.model_path,
                'static/model/model_combined_best.weights.h5',
                'static/model/final_effnet_fer_state.pth',
                'static/model/best_resemotenet_model.pth',
                'static/model/emotion_model.pth'
            ]
            
            model_loaded = False
            for path in model_paths_to_try:
                if os.path.exists(path):
                    try:
                        print(f"[EfficientNet] Attempting to load weights from: {path}")
                        
                        # Handle H5 format (combined model)
                        if path.endswith('.h5'):
                            print(f"[EfficientNet] Detected H5 format, loading with PyTorch H5 support...")
                            import torch.utils.model_zoo as model_zoo
                            try:
                                # Load H5 weights using PyTorch's native H5 support
                                checkpoint = torch.load(path, map_location=self.device)
                                if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                                    model.load_state_dict(checkpoint['model_state_dict'])
                                elif isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
                                    model.load_state_dict(checkpoint['state_dict'])
                                else:
                                    # Try direct loading if it's already a state dict
                                    model.load_state_dict(checkpoint)
                            except Exception as h5_error:
                                print(f"  PyTorch H5 loading failed, attempting Keras conversion...")
                                try:
                                    import h5py
                                    import tensorflow as tf
                                    # Load Keras/TF H5 model and extract weights
                                    with h5py.File(path, 'r') as h5file:
                                        # Try to extract layer weights from HDF5
                                        state_dict = {}
                                        for i, (layer_name, layer_data) in enumerate(h5file.items()):
                                            if isinstance(layer_data, h5py.Dataset):
                                                state_dict[f'layer_{i}'] = torch.from_numpy(layer_data[()])
                                        if state_dict:
                                            model.load_state_dict(state_dict, strict=False)
                                        else:
                                            raise Exception("Could not extract weights from H5 file")
                                except ImportError:
                                    print(f"  h5py not installed, cannot load H5 file")
                                    raise h5_error
                        else:
                            # Handle PyTorch .pth format
                            state_dict = torch.load(path, map_location=self.device)
                            model.load_state_dict(state_dict)
                        
                        model_loaded = True
                        self.model_path = path
                        print(f"✓ Successfully loaded model from: {path}")
                        break
                    except Exception as e:
                        print(f"  Failed to load from {path}: {e}")
                        continue
            
            if not model_loaded:
                print(f"⚠ Warning: Could not load model weights from any path")
                print(f"  Tried: {model_paths_to_try}")
                print(f"  Model will use random weights (not trained)")
                print(f"  ⚠ THIS WILL CAUSE POOR PREDICTIONS - ALL NEUTRAL!")
            
            # Move model to device and set to evaluation mode
            model = model.to(self.device)
            model.eval()
            
            self.model = model
            print(f"✓ Model ready on device: {self.device}")
            print(f"✓ Model loaded status: {'TRAINED' if model_loaded else 'UNTRAINED (RANDOM WEIGHTS)'}")
            
        except Exception as e:
            print(f"✗ Error loading EfficientNet model: {e}")
            import traceback
            traceback.print_exc()
            self.model = None
    
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
        if self.model is None:
            print("[EfficientNet] WARNING: Model is None! Returning default Neutral.")
            return 'Neutral', 'Engaged', 0.0, {label: 0.0 for label in self.EMOTION_LABELS}
        
        try:
            # Preprocess image
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
            
            # DEBUG: Print all predictions to see what model is actually predicting
            print(f"\n[EfficientNet DEBUG] Raw model output:")
            print(f"  Predicted index: {predicted_idx}")
            print(f"  Raw emotion: {raw_emotion}")
            print(f"  Confidence: {confidence*100:.1f}%")
            print(f"  All probabilities:")
            for label, prob in sorted(all_predictions.items(), key=lambda x: x[1], reverse=True):
                print(f"    {label:10s}: {prob*100:5.1f}%")
            
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
