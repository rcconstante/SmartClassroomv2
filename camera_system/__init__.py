"""
Camera System Package
Provides camera detection and ML model integration for Smart Classroom
"""

from .camera_detector import CameraDetector, CameraStream, get_system_info
from .emotion_detector import EmotionDetector
from .yolo_face_detector import YOLOFaceDetector
from .ml_models import (
    YOLODetector,
    CNNClassifier,
    ModelEnsemble
)

__all__ = [
    'CameraDetector',
    'CameraStream',
    'get_system_info',
    'EmotionDetector',
    'YOLOFaceDetector',
    'YOLODetector',
    'CNNClassifier',
    'ModelEnsemble'
]
