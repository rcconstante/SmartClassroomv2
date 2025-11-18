"""
Camera Detection Module
Detects available cameras on the system and provides camera access
"""

import cv2
import platform
from typing import List, Dict, Optional


class CameraDetector:
    """Detects and manages available cameras including software cameras like DroidCam"""
    
    def __init__(self):
        self.available_cameras = []
        self.max_cameras_to_check = 10  # Check up to 10 indices to find all cameras including virtual ones
        
    def detect_cameras(self) -> List[Dict[str, any]]:
        """
        Detect all available cameras on the system including:
        - Built-in webcams
        - USB cameras
        - Software cameras (DroidCam, OBS Virtual Camera, etc.)
        - Network cameras
        
        Returns:
            List of dictionaries containing camera information
        """
        self.available_cameras = []
        
        # On Windows, try multiple backends to find all cameras
        # On other platforms, use default backend
        if platform.system() == 'Windows':
            backends = [cv2.CAP_DSHOW, cv2.CAP_MSMF]  # Try DirectShow and Media Foundation
        else:
            backends = [cv2.CAP_ANY]
        
        detected_indices = set()  # Track which camera indices we've already found
        
        # Try each backend
        for backend in backends:
            # Scan camera indices
            for index in range(self.max_cameras_to_check):
                # Skip if we already detected this camera with another backend
                if index in detected_indices:
                    continue
                    
                try:
                    # Try to open camera
                    cap = cv2.VideoCapture(index, backend)
                    
                    if cap.isOpened():
                        # Try to read a frame to verify camera actually works
                        ret, frame = cap.read()
                        
                        if ret and frame is not None:
                            # Get camera properties
                            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                            fps = int(cap.get(cv2.CAP_PROP_FPS))
                            backend_name = cap.getBackendName()
                            
                            # Detect camera type based on properties
                            camera_type = self._detect_camera_type(index, width, height, backend_name)
                            
                            camera_info = {
                                'id': index,
                                'name': camera_type,
                                'resolution': f'{width}x{height}',
                                'fps': fps if fps > 0 else 30,
                                'status': 'available',
                                'width': width,
                                'height': height,
                                'backend': backend_name,
                                'type': camera_type
                            }
                            
                            self.available_cameras.append(camera_info)
                            detected_indices.add(index)
                            print(f"✓ Found camera {index}: {camera_type} ({width}x{height}) via {backend_name}")
                        
                        cap.release()
                except Exception as e:
                    # Silently continue on errors
                    continue
        
        return self.available_cameras
    
    def _detect_camera_type(self, index: int, width: int, height: int, backend: str) -> str:
        """Detect the type of camera based on properties"""
        # Common software camera resolutions and patterns
        if 'dshow' in backend.lower():
            if width == 1920 and height == 1080:
                return f'HD Camera {index} (possibly DroidCam/Virtual)'
            elif width == 1280 and height == 720:
                return f'HD Camera {index} (possibly Software Camera)'
            elif width == 640 and height == 480:
                return f'Camera {index} (Standard/Virtual)'
        
        return f'Camera {index}'
    
    def get_camera_info(self, camera_id: int) -> Optional[Dict[str, any]]:
        """Get information about a specific camera"""
        for camera in self.available_cameras:
            if camera['id'] == camera_id:
                return camera
        return None
    
    def test_camera(self, camera_id: int) -> bool:
        """Test if a camera is working"""
        cap = cv2.VideoCapture(camera_id)
        if cap.isOpened():
            ret, frame = cap.read()
            cap.release()
            return ret
        return False
    
    def get_system_info(self) -> Dict[str, str]:
        """Get system information for camera compatibility"""
        return {
            'platform': platform.system(),
            'platform_version': platform.version(),
            'opencv_version': cv2.__version__
        }


class CameraStream:
    """Manages camera stream for video capture"""
    
    def __init__(self, camera_id: int = 0):
        self.camera_id = camera_id
        self.capture = None
        self.is_running = False
        
    def start(self) -> bool:
        """Start camera capture"""
        try:
            self.capture = cv2.VideoCapture(self.camera_id)
            if self.capture.isOpened():
                self.is_running = True
                return True
            return False
        except Exception as e:
            print(f"Error starting camera: {e}")
            return False
    
    def stop(self):
        """Stop camera capture and release resources"""
        self.is_running = False
        if self.capture:
            try:
                self.capture.release()
                # Wait briefly to ensure resources are released
                import time
                time.sleep(0.1)
            except Exception as e:
                print(f"Warning: Error releasing camera: {e}")
            finally:
                self.capture = None
    
    def read_frame(self):
        """Read a single frame from camera"""
        if self.capture and self.is_running:
            ret, frame = self.capture.read()
            if ret:
                return frame
        return None
    
    def __del__(self):
        """Destructor to ensure camera is released"""
        self.stop()
    
    def get_frame_dimensions(self) -> tuple:
        """Get current frame width and height"""
        if self.capture:
            width = int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
            return (width, height)
        return (0, 0)
    
    def set_resolution(self, width: int, height: int):
        """Set camera resolution"""
        if self.capture:
            self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, width)
            self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, height)


def get_system_info() -> Dict[str, str]:
    """Get system information for camera compatibility"""
    return {
        'platform': platform.system(),
        'platform_version': platform.version(),
        'opencv_version': cv2.__version__
    }
