"""
Test script to verify EfficientNet emotion detection model loading and inference
"""

import cv2
import numpy as np
import os

def test_model_loading():
    """Test if EfficientNet model loads correctly"""
    print("=" * 60)
    print("TESTING EFFICIENTNET EMOTION DETECTION MODEL")
    print("=" * 60)
    
    try:
        # Test 1: Import model module
        print("\n1. Testing module import...")
        from camera_system.efficientnet_model import EfficientNetEmotionDetector
        print("✓ EfficientNet module imported successfully")
        
        # Test 2: Initialize detector
        print("\n2. Testing model initialization...")
        model_path = 'static/model/final_effnet_fer_state.pth'
        if not os.path.exists(model_path):
            print(f"⚠ Warning: Model file not found at {model_path}")
            print("  Trying alternative path...")
            model_path = 'static/model/best_resemotenet_model.pth'
        
        detector = EfficientNetEmotionDetector(model_path=model_path)
        print(f"✓ Model loaded from: {model_path}")
        print(f"  Device: {detector.device}")
        print(f"  Emotion labels: {detector.emotion_labels}")
        
        # Test 3: Create sample image
        print("\n3. Testing prediction with sample image...")
        # Create a grayscale sample face image (48x48)
        sample_face = np.random.randint(0, 255, (48, 48, 3), dtype=np.uint8)
        
        # Test 4: Predict emotion
        print("\n4. Testing emotion prediction...")
        raw_emotion, engagement_state, confidence, all_predictions = detector.predict_emotion(sample_face)
        
        print(f"✓ Prediction successful!")
        print(f"  Raw Emotion: {raw_emotion}")
        print(f"  Engagement State: {engagement_state}")
        print(f"  Confidence: {confidence:.2%}")
        print(f"\n  All Predictions:")
        for emotion, prob in all_predictions.items():
            print(f"    {emotion:10s}: {prob*100:5.1f}%")
        
        # Test 5: Test EmotionDetector integration
        print("\n5. Testing EmotionDetector integration...")
        from camera_system.emotion_detector import EmotionDetector
        emotion_detector = EmotionDetector()
        print("✓ EmotionDetector initialized successfully")
        
        # Test prediction through EmotionDetector
        engagement, conf = emotion_detector.predict_emotion(sample_face)
        print(f"  EmotionDetector result: {engagement} ({conf:.2%})")
        
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED ✓")
        print("=" * 60)
        print("\nModel is ready for use in the Smart Classroom system!")
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("\n" + "=" * 60)
        print("TESTS FAILED ✗")
        print("=" * 60)

if __name__ == "__main__":
    test_model_loading()
