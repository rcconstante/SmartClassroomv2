"""
Facial Emotion Detection Module
Uses YOLO11 for face detection and PyTorch EfficientNet for emotion recognition
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple
import os

# FER-2013 emotion labels (7 classes from computer vision model)
EMOTION_LABELS = ['Happy', 'Surprise', 'Neutral', 'Sad', 'Angry', 'Disgust', 'Fear']

class EmotionDetector:
    """Detects student emotions using YOLO11 face detection + PyTorch EfficientNet emotion recognition"""
    
    def __init__(self, 
                 emotion_model_path='static/model/final_effnet_fer_state.pth',
                 yolo_model_path='static/model/best_yolo11_face.pt'):
        """
        Initialize emotion detector with YOLO face detection + EfficientNet emotion recognition
        
        Args:
            emotion_model_path: Path to the trained PyTorch EfficientNet emotion model (.pth)
            yolo_model_path: Path to the trained YOLO11 face detection model (.pt)
        """
        self.efficientnet_detector = None
        self.yolo_detector = None
        self.emotion_model_path = emotion_model_path
        self.yolo_model_path = yolo_model_path
        self.face_cascade = None  # Kept for backward compatibility
        self.emotion_counts = {emotion: 0 for emotion in EMOTION_LABELS}
        self.input_shape = (48, 48)  # EfficientNet FER input size
        
        # Load both models
        self._load_efficientnet_model()
        self._load_yolo_detector()
    
    def _load_efficientnet_model(self):
        """Load the trained PyTorch EfficientNet emotion model"""
        try:
            # Import EfficientNet detector
            from camera_system.efficientnet_model import EfficientNetEmotionDetector
            
            # Initialize PyTorch model
            self.efficientnet_detector = EfficientNetEmotionDetector(model_path=self.emotion_model_path)
            print(f"✓ EfficientNet Emotion Model loaded: {self.emotion_model_path}")
            print(f"Model expects input shape: {self.input_shape}")
            print(f"Using device: {self.efficientnet_detector.device}")
                
        except Exception as e:
            print(f"Error loading EfficientNet emotion detection model: {e}")
            print("Emotion detection will use fallback mode")
            self.efficientnet_detector = None
    
    def _load_yolo_detector(self):
        """Load YOLO11 face detection model"""
        try:
            from camera_system.yolo_face_detector import YOLOFaceDetector
            
            self.yolo_detector = YOLOFaceDetector(model_path=self.yolo_model_path)
            if self.yolo_detector.is_loaded:
                print(f"✓ YOLO11 Face Detector loaded: {self.yolo_model_path}")
            else:
                print("⚠ YOLO face detector not available, falling back to Haar Cascade")
                self._load_face_detector()
                
        except Exception as e:
            print(f"⚠ Could not load YOLO detector: {e}")
            print("Falling back to Haar Cascade face detector")
            self._load_face_detector()
    
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
        Detect faces in frame using YOLO11 (primary) or Haar Cascade (fallback)
        
        Args:
            frame: Input image frame (BGR format)
            
        Returns:
            List of face rectangles (x, y, w, h)
        """
        # Try YOLO first
        if self.yolo_detector and self.yolo_detector.is_loaded:
            try:
                yolo_faces, count = self.yolo_detector.detect_faces(frame, conf_threshold=0.5)
                # Convert YOLO format (x1, y1, x2, y2) to Haar format (x, y, w, h)
                faces = []
                for face in yolo_faces:
                    x1, y1, x2, y2 = face['bbox']
                    w = x2 - x1
                    h = y2 - y1
                    faces.append((x1, y1, w, h))
                return faces
            except Exception as e:
                print(f"[YOLO] Error during detection, falling back to Haar Cascade: {e}")
        
        # Fallback to Haar Cascade
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
        Predict emotion from face image using EfficientNet FER-2013 model
        
        Args:
            face_image: Cropped face image (BGR format from OpenCV)
            
        Returns:
            Tuple of (emotion_label, confidence) - Returns raw FER-2013 emotion
        """
        if self.efficientnet_detector is None:
            return 'Neutral', 0.0
        
        try:
            # Use EfficientNet detector to predict emotion
            raw_emotion, engagement_state, confidence, all_predictions = self.efficientnet_detector.predict_emotion(face_image)
            
            # Debug: Print predictions if confident
            if confidence > 0.3:
                print(f"\n[EfficientNet Emotion Detection]")
                print(f"  Raw FER-2013 Emotion: {raw_emotion} ({confidence*100:.1f}%)")
                print(f"  All Predictions:")
                for emotion, prob in all_predictions.items():
                    print(f"    {emotion:10s}: {prob*100:5.1f}%")
            
            # Return raw FER-2013 emotion instead of mapped engagement state
            return raw_emotion, confidence
            
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
        """Get BGR color for FER-2013 emotion"""
        emotion_colors = {
            'Happy': (0, 255, 0),          # Green
            'Surprise': (238, 211, 34),    # Cyan
            'Neutral': (246, 92, 139),     # Purple
            'Sad': (128, 128, 128),        # Gray
            'Angry': (0, 0, 255),          # Red
            'Disgust': (22, 115, 249),     # Orange
            'Fear': (11, 158, 245)         # Amber
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
        Calculate engagement score based on FER-2013 emotions
        Positive emotions = higher engagement, negative = lower
        """
        if sum(self.emotion_counts.values()) == 0:
            return 0.0
        
        # Weight FER-2013 emotions for engagement score
        engagement_weights = {
            'Happy': 1.0,      # Highly engaged
            'Surprise': 0.8,   # Engaged, attentive
            'Neutral': 0.6,    # Moderate engagement
            'Sad': 0.3,        # Low engagement
            'Angry': 0.2,      # Frustrated/disengaged
            'Disgust': 0.2,    # Disengaged
            'Fear': 0.4        # Confused/uncertain
        }
        
        total_faces = sum(self.emotion_counts.values())
        weighted_sum = sum(
            self.emotion_counts[emotion] * weight 
            for emotion, weight in engagement_weights.items()
        )
        
        engagement = (weighted_sum / total_faces) * 100
        return round(engagement, 2)
    
    def get_occupancy_count(self, frame) -> int:
        """
        Get student occupancy count using YOLO face detection
        This is independent of emotion detection
        
        Args:
            frame: Input video frame
            
        Returns:
            Number of faces detected (student count)
        """
        if self.yolo_detector and self.yolo_detector.is_loaded:
            try:
                return self.yolo_detector.get_occupancy_count(frame, conf_threshold=0.5)
            except Exception as e:
                print(f"[YOLO] Error getting occupancy count: {e}")
        
        # Fallback to counting detected faces
        faces = self.detect_faces(frame)
        return len(faces)
    
    def cleanup(self):
        """Cleanup resources"""
        # Reset emotion counts
        self.emotion_counts = {emotion: 0 for emotion in EMOTION_LABELS}
        # Clear any cached data
        if hasattr(self, 'model') and self.model is not None:
            # Model cleanup if needed
            pass
    
    def __del__(self):
        """Destructor to ensure proper cleanup"""
        self.cleanup()
