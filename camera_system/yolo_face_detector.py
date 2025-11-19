"""
YOLO11 Face Detection for Occupancy Counting
Uses YOLOv11 model to detect faces and count students in the classroom
"""

import cv2
import numpy as np
from typing import List, Tuple, Dict
import os

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("Warning: ultralytics not installed. Install with: pip install ultralytics")


class YOLOFaceDetector:
    """
    YOLO11 Face Detector for student occupancy counting
    Detects faces in video frames to count number of students
    """
    
    def __init__(self, model_path='static/model/best_yolo11_face.pt'):
        """
        Initialize YOLO face detector
        
        Args:
            model_path: Path to YOLO11 face detection model
        """
        self.model_path = model_path
        self.model = None
        self.is_loaded = False
        
        if not YOLO_AVAILABLE:
            print("[YOLO] ultralytics package not available")
            return
            
        # Load model
        if os.path.exists(model_path):
            try:
                self.model = YOLO(model_path)
                self.is_loaded = True
                print(f"[YOLO] ✓ Face detection model loaded: {model_path}")
            except Exception as e:
                print(f"[YOLO] ✗ Failed to load model: {e}")
                self.is_loaded = False
        else:
            print(f"[YOLO] ✗ Model file not found: {model_path}")
            self.is_loaded = False
    
    def detect_faces(self, frame: np.ndarray, conf_threshold: float = 0.5) -> Tuple[List[Dict], int]:
        """
        Detect faces in a frame
        
        Args:
            frame: Input image frame (BGR format from OpenCV)
            conf_threshold: Confidence threshold for detection (0.0 to 1.0)
            
        Returns:
            Tuple of (list of face detections, face count)
            Each detection is a dict with: {bbox, confidence}
        """
        if not self.is_loaded or self.model is None:
            return [], 0
        
        try:
            # Run YOLO inference
            results = self.model(frame, conf=conf_threshold, verbose=False)
            
            # Extract face detections
            faces = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    
                    face_info = {
                        'bbox': (int(x1), int(y1), int(x2), int(y2)),
                        'confidence': confidence
                    }
                    faces.append(face_info)
            
            return faces, len(faces)
            
        except Exception as e:
            print(f"[YOLO] Detection error: {e}")
            return [], 0
    
    def annotate_frame(self, frame: np.ndarray, faces: List[Dict]) -> np.ndarray:
        """
        Draw bounding boxes around detected faces
        
        Args:
            frame: Input frame
            faces: List of face detections from detect_faces()
            
        Returns:
            Annotated frame with bounding boxes
        """
        annotated = frame.copy()
        
        for face in faces:
            x1, y1, x2, y2 = face['bbox']
            confidence = face['confidence']
            
            # Draw green bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw confidence label
            label = f"Face {confidence:.2f}"
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            
            # Background for text
            cv2.rectangle(annotated, 
                         (x1, y1 - label_size[1] - 10), 
                         (x1 + label_size[0], y1), 
                         (0, 255, 0), -1)
            
            # Text
            cv2.putText(annotated, label, (x1, y1 - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        return annotated
    
    def get_occupancy_count(self, frame: np.ndarray, conf_threshold: float = 0.5) -> int:
        """
        Get student occupancy count from frame
        
        Args:
            frame: Input video frame
            conf_threshold: Confidence threshold for detection
            
        Returns:
            Number of faces detected (occupancy count)
        """
        _, count = self.detect_faces(frame, conf_threshold)
        return count
