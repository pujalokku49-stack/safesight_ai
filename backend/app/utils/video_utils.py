"""
SafeSight AI - Video Utilities
Frame decoding, encoding, base64 conversion, and webcam image processing.
"""

import cv2
import numpy as np
import base64
import os
from typing import Optional, Tuple, Generator


def decode_base64_image(base64_str: str) -> Optional[np.ndarray]:
    """Decodes a base64 JPEG/PNG string into an OpenCV BGR numpy image."""
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        return None


def encode_frame_to_base64(frame: np.ndarray, quality: int = 75) -> str:
    """Encodes an OpenCV image to base64 JPEG string."""
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, buffer = cv2.imencode('.jpg', frame, encode_param)
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{b64_str}"


_METADATA_CACHE = {}

def get_video_metadata(video_path: str) -> dict:
    """Extract metadata from video file with in-memory caching."""
    if video_path in _METADATA_CACHE:
        return _METADATA_CACHE[video_path]

    if not os.path.exists(video_path):
        return {"error": "File does not exist"}

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "Failed to open video file"}

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps > 0 else 0

    cap.release()
    res = {
        "fps": round(fps, 2),
        "frame_count": frame_count,
        "width": width,
        "height": height,
        "duration_sec": round(duration, 2)
    }
    _METADATA_CACHE[video_path] = res
    return res
