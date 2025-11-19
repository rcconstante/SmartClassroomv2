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
        
        self.transform = transforms.Compose([
            transforms.Resize((48, 48)),
            transforms.Grayscale(num_output_channels=1),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5], std=[0.5])
        ])
        
        self._load_model()
    def _load_model(self):
        """Load PyTorch model from .pth file"""
        try:
            print(f"[EfficientNet] Loading model...")
            
            model_path = 'static/model/fer2013-bestmodel-new.pth'
            
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model file not found: {model_path}")
            
            print(f"[EfficientNet] Loading PyTorch model from: {model_path}")
            
            self.model = models.efficientnet_b0(pretrained=False)
            num_features = self.model.classifier[1].in_features
            self.model.classifier[1] = nn.Linear(num_features, len(self.EMOTION_LABELS))
            
            state_dict = torch.load(model_path, map_location=self.device)
            if isinstance(state_dict, dict) and 'state_dict' in state_dict:
                state_dict = state_dict['state_dict']
            
            self.model.load_state_dict(state_dict)
            self.model.to(self.device)
            self.model.eval()
            self.model_path = model_path
            
            print(f"✓ Successfully loaded PyTorch model from: {model_path}")
            print(f"  Device: {self.device}")
            print(f"  Model ready for inference")
            
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
            if len(face_image.shape) == 3:
                face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            else:
                face_rgb = face_image
            
            pil_image = Image.fromarray(face_rgb)
            tensor = self.transform(pil_image)
            tensor = tensor.unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, predicted_idx = torch.max(probabilities, dim=1)
            
            predicted_idx = predicted_idx.item()
            confidence = confidence.item()
            raw_emotion = self.EMOTION_LABELS[predicted_idx]
            
            all_probs = probabilities[0].cpu().numpy()
            all_predictions = {
                label: float(prob) 
                for label, prob in zip(self.EMOTION_LABELS, all_probs)
            }
            
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
            tensors = []
            for face_image in face_images:
                if len(face_image.shape) == 3:
                    face_rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
                else:
                    face_rgb = face_image
                pil_image = Image.fromarray(face_rgb)
                tensor = self.transform(pil_image)
                tensors.append(tensor)
            
            batch_tensor = torch.stack(tensors).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(batch_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidences, predicted_indices = torch.max(probabilities, dim=1)
            
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
            'framework': 'PyTorch',
            'device': str(self.device),
            'emotion_classes': len(self.EMOTION_LABELS),
            'emotion_labels': self.EMOTION_LABELS,
            'input_size': (48, 48),
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
