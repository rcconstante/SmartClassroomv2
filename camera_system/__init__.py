"""
Camera System Package
Provides camera detection and ML model integration for Smart Classroom
"""

from .camera_detector import CameraDetector, CameraStream, get_system_info
from .emotion_detector import EmotionDetector
from .ml_models import (
    YOLODetector,
    CNNClassifier,
    LSTMPredictor,
    RandomForestClassifier,
    ModelEnsemble
)

__all__ = [
    'CameraDetector',
    'CameraStream',
    'get_system_info',
    'EmotionDetector',
    'YOLODetector',
    'CNNClassifier',
    'LSTMPredictor',
    'RandomForestClassifier',
    'ModelEnsemble'
]
