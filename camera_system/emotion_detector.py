"""
Facial Emotion Detection Module
Uses trained model to detect student emotions in real-time
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple
import os

# Suppress TensorFlow warnings and info messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # 0=all, 1=filter INFO, 2=filter WARNING, 3=filter ERROR
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN custom operations messages

# FER2013 Emotion labels in standard order
# NOTE: If your model outputs are in different order, update this array
EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# Alternative common orders (uncomment if your model uses different order):
# EMOTION_LABELS = ['Angry', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']  # 6 classes
# EMOTION_LABELS = ['Neutral', 'Happy', 'Sad', 'Surprise', 'Fear', 'Disgust', 'Angry']  # Alternative order

class EmotionDetector:
    """Detects facial emotions using pre-trained model"""
    
    def __init__(self, model_path='static/model/emotion_model.h5'):
        """
        Initialize emotion detector
        
        Args:
            model_path: Path to the trained emotion detection model (FER2013 CNN)
        """
        self.model = None
        self.model_path = model_path
        self.face_cascade = None
        self.emotion_counts = {emotion: 0 for emotion in EMOTION_LABELS}
        
        # Load model and face detector
        self._load_model()
        self._load_face_detector()
    
    def _load_model(self):
        """Load the emotion detection model"""
        try:
            from tensorflow import keras
            import tensorflow as tf
            
            # Try multiple possible model paths
            possible_paths = [
                self.model_path,
                'static/model/emotion_model.h5',
                'static/model/model.weights.h5'
            ]
            
            model_loaded = False
            for path in possible_paths:
                if os.path.exists(path):
                    try:
                        print(f"Attempting to load emotion model from {path}")
                        self.model = keras.models.load_model(path, compile=False)
                        
                        # Recompile model
                        self.model.compile(
                            optimizer='adam',
                            loss='categorical_crossentropy',
                            metrics=['accuracy']
                        )
                        
                        print(f"✓ Emotion model loaded successfully from {path}")
                        print(f"  Model input shape: {self.model.input_shape}")
                        print(f"  Model output shape: {self.model.output_shape}")
                        model_loaded = True
                        break
                    except Exception as e:
                        print(f"  Failed to load from {path}: {e}")
                        continue
            
            if not model_loaded:
                print(f"⚠ Warning: Could not load emotion model from any path")
                self.model = None
                
        except Exception as e:
            print(f"⚠ Warning: Could not load emotion model: {e}")
            import traceback
            traceback.print_exc()
            self.model = None
    
    def _load_face_detector(self):
        """Load Haar Cascade face detector"""
        try:
            # Try to load Haar Cascade from OpenCV
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            if self.face_cascade.empty():
                print("⚠ Warning: Could not load face detector")
                self.face_cascade = None
            else:
                print("✓ Face detector loaded successfully")
        except Exception as e:
            print(f"⚠ Warning: Could not load face detector: {e}")
            self.face_cascade = None
    
    def detect_faces(self, frame) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in frame using Haar Cascade
        
        Args:
            frame: Input image frame (BGR format)
            
        Returns:
            List of face rectangles (x, y, w, h)
        """
        if self.face_cascade is None:
            return []
        
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply histogram equalization to improve detection in varying lighting
        gray = cv2.equalizeHist(gray)
        
        # Detect faces with optimized parameters
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,      # How much image size is reduced at each scale
            minNeighbors=5,       # How many neighbors each candidate rectangle should have
            minSize=(48, 48),     # Minimum face size (matches model input)
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        return faces
    
    def predict_emotion(self, face_image) -> Tuple[str, float]:
        """
        Predict emotion from face image
        FER2013-specific preprocessing
        
        Args:
            face_image: Cropped face image (BGR format from OpenCV)
            
        Returns:
            Tuple of (emotion_label, confidence)
        """
        if self.model is None:
            return 'Neutral', 0.0
        
        try:
            # Convert to grayscale if needed
            if len(face_image.shape) == 3:
                face_gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            else:
                face_gray = face_image
            
            # Resize to 48x48 (FER2013 standard)
            face_resized = cv2.resize(face_gray, (48, 48), interpolation=cv2.INTER_AREA)
            
            # Normalize to [0, 1] range
            face_normalized = face_resized.astype('float32') / 255.0
            
            # Expand dimensions: (48, 48) -> (1, 48, 48, 1)
            face_input = np.expand_dims(face_normalized, axis=0)  # Add batch dimension
            face_input = np.expand_dims(face_input, axis=-1)      # Add channel dimension
            
            # Debug: Print input shape
            # print(f"Input shape for model: {face_input.shape}")
            
            # Predict emotion
            predictions = self.model.predict(face_input, verbose=0)
            
            # Debug: Print predictions
            # print(f"Raw predictions: {predictions[0]}")
            
            # Get emotion with highest probability
            emotion_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][emotion_idx])
            
            # Map index to emotion label
            if 0 <= emotion_idx < len(EMOTION_LABELS):
                emotion = EMOTION_LABELS[emotion_idx]
            else:
                emotion = 'Neutral'
                confidence = 0.0
            
            # Debug: Print result
            print(f"Detected emotion: {emotion} ({confidence*100:.1f}%)")
            
            return emotion, confidence
            
        except Exception as e:
            print(f"Error predicting emotion: {e}")
            import traceback
            traceback.print_exc()
            return 'Neutral', 0.0
    
    def process_frame(self, frame) -> Tuple[np.ndarray, Dict]:
        """
        Process frame to detect faces and emotions
        
        Args:
            frame: Input video frame
            
        Returns:
            Tuple of (annotated_frame, emotion_stats)
        """
        annotated_frame = frame.copy()
        
        # Reset emotion counts
        self.emotion_counts = {emotion: 0 for emotion in EMOTION_LABELS}
        
        # Detect faces
        faces = self.detect_faces(frame)
        num_faces = len(faces)
        
        # Process each face
        for (x, y, w, h) in faces:
            # Extract face region
            face_roi = frame[y:y+h, x:x+w]
            
            # Predict emotion
            emotion, confidence = self.predict_emotion(face_roi)
            
            # Update emotion count
            self.emotion_counts[emotion] += 1
            
            # Draw rectangle around face
            color = self._get_emotion_color(emotion)
            cv2.rectangle(annotated_frame, (x, y), (x+w, y+h), color, 2)
            
            # Draw emotion label
            label = f"{emotion} ({confidence*100:.1f}%)"
            label_y = y - 10 if y - 10 > 10 else y + h + 20
            
            # Draw background for text
            (text_width, text_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated_frame, 
                         (x, label_y - text_height - 5), 
                         (x + text_width, label_y + 5), 
                         color, -1)
            
            # Draw text
            cv2.putText(annotated_frame, label, (x, label_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Calculate emotion statistics
        emotion_stats = {
            'total_faces': num_faces,
            'emotions': self.emotion_counts,
            'emotion_percentages': self._calculate_percentages(num_faces)
        }
        
        return annotated_frame, emotion_stats
    
    def _get_emotion_color(self, emotion: str) -> Tuple[int, int, int]:
        """Get BGR color for emotion"""
        emotion_colors = {
            'Happy': (0, 255, 0),      # Green
            'Neutral': (255, 255, 0),  # Cyan
            'Sad': (255, 0, 0),        # Blue
            'Angry': (0, 0, 255),      # Red
            'Surprise': (0, 255, 255), # Yellow
            'Fear': (128, 0, 128),     # Purple
            'Disgust': (0, 128, 128)   # Dark Yellow
        }
        return emotion_colors.get(emotion, (255, 255, 255))
    
    def _calculate_percentages(self, total_faces: int) -> Dict[str, float]:
        """Calculate percentage for each emotion"""
        if total_faces == 0:
            return {emotion: 0.0 for emotion in EMOTION_LABELS}
        
        return {
            emotion: (count / total_faces) * 100 
            for emotion, count in self.emotion_counts.items()
        }
    
    def get_engagement_from_emotions(self) -> float:
        """
        Calculate engagement score based on emotions
        Positive emotions = higher engagement
        """
        if sum(self.emotion_counts.values()) == 0:
            return 0.0
        
        # Weight emotions for engagement calculation
        engagement_weights = {
            'Happy': 1.0,
            'Neutral': 0.5,
            'Surprise': 0.8,
            'Sad': 0.2,
            'Angry': 0.1,
            'Fear': 0.3,
            'Disgust': 0.1
        }
        
        total_faces = sum(self.emotion_counts.values())
        weighted_sum = sum(
            self.emotion_counts[emotion] * weight 
            for emotion, weight in engagement_weights.items()
        )
        
        engagement = (weighted_sum / total_faces) * 100
        return round(engagement, 2)
