"""
Test Emotion Model
Verifies that the emotion detection model can be loaded and makes predictions
"""

import cv2
import numpy as np
import os

# Suppress TensorFlow messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Emotion labels (FER2013 standard order)
EMOTION_LABELS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

def test_model():
    """Test if the emotion model can be loaded and used"""
    
    print("=" * 60)
    print("EMOTION MODEL TEST")
    print("=" * 60)
    
    # Try to import TensorFlow
    try:
        from tensorflow import keras
        import tensorflow as tf
        print(f"✓ TensorFlow version: {tf.__version__}")
    except ImportError as e:
        print(f"✗ TensorFlow not available: {e}")
        return
    
    # Try to load model
    model_paths = [
        'static/model/emotion_model.h5',
        'static/model/model.weights.h5'
    ]
    
    model = None
    for path in model_paths:
        if os.path.exists(path):
            try:
                print(f"\nTrying to load model from: {path}")
                model = keras.models.load_model(path, compile=False)
                
                # Recompile
                model.compile(
                    optimizer='adam',
                    loss='categorical_crossentropy',
                    metrics=['accuracy']
                )
                
                print(f"✓ Model loaded successfully!")
                print(f"  Input shape: {model.input_shape}")
                print(f"  Output shape: {model.output_shape}")
                print(f"  Expected: (None, 48, 48, 1) -> (None, 7)")
                break
            except Exception as e:
                print(f"✗ Failed to load from {path}: {e}")
                continue
    
    if model is None:
        print("\n✗ Could not load model from any path")
        return
    
    # Test with dummy input
    print("\n" + "=" * 60)
    print("Testing with dummy input...")
    print("=" * 60)
    
    # Create a random 48x48 grayscale image
    test_image = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    
    # Normalize
    test_normalized = test_image.astype('float32') / 255.0
    
    # Add batch and channel dimensions
    test_input = np.expand_dims(test_normalized, axis=0)
    test_input = np.expand_dims(test_input, axis=-1)
    
    print(f"Test input shape: {test_input.shape}")
    
    # Make prediction
    try:
        predictions = model.predict(test_input, verbose=0)
        print(f"\n✓ Prediction successful!")
        print(f"Raw predictions: {predictions[0]}")
        print(f"Sum of probabilities: {np.sum(predictions[0]):.4f} (should be ~1.0)")
        
        # Get emotion
        emotion_idx = np.argmax(predictions[0])
        confidence = predictions[0][emotion_idx]
        emotion = EMOTION_LABELS[emotion_idx]
        
        print(f"\nDetected emotion: {emotion} ({confidence*100:.1f}%)")
        
        # Show all probabilities
        print("\nAll emotion probabilities:")
        for i, label in enumerate(EMOTION_LABELS):
            print(f"  {label:10s}: {predictions[0][i]*100:5.2f}%")
            
    except Exception as e:
        print(f"✗ Prediction failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Test with webcam if available
    print("\n" + "=" * 60)
    print("Testing with webcam (Press 'q' to quit)...")
    print("=" * 60)
    
    try:
        # Load face detector
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        if face_cascade.empty():
            print("✗ Could not load face detector")
            return
        
        # Open webcam
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("✗ Could not open webcam")
            return
        
        print("✓ Webcam opened. Show your face to the camera!")
        print("  Press 'q' to quit")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Detect faces
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.equalizeHist(gray)
            faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(48, 48))
            
            # Process each face
            for (x, y, w, h) in faces:
                # Extract face
                face_roi = gray[y:y+h, x:x+w]
                
                # Resize and preprocess
                face_resized = cv2.resize(face_roi, (48, 48), interpolation=cv2.INTER_AREA)
                face_normalized = face_resized.astype('float32') / 255.0
                face_input = np.expand_dims(face_normalized, axis=0)
                face_input = np.expand_dims(face_input, axis=-1)
                
                # Predict
                predictions = model.predict(face_input, verbose=0)
                emotion_idx = np.argmax(predictions[0])
                confidence = predictions[0][emotion_idx]
                emotion = EMOTION_LABELS[emotion_idx]
                
                # Draw on frame
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                text = f"{emotion} ({confidence*100:.1f}%)"
                cv2.putText(frame, text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 
                           0.9, (0, 255, 0), 2)
            
            # Show frame
            cv2.imshow('Emotion Detection Test', frame)
            
            # Quit on 'q'
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        
    except Exception as e:
        print(f"✗ Webcam test failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)


if __name__ == '__main__':
    test_model()
