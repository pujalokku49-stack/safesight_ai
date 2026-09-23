"""
SafeSight AI - Configuration Module
Configurable thresholds, weights, and model parameters.
"""

from typing import List, Dict

# ==========================================
# RISK THRESHOLDS (0 - 100)
# ==========================================
RISK_THRESHOLD_LOW_MAX = 30.0
RISK_THRESHOLD_MODERATE_MAX = 50.0
RISK_THRESHOLD_HIGH_MAX = 70.0
# Anything above 70.0 is CRITICAL (71 - 100)

def get_risk_level(score: float) -> str:
    """Classify risk score into category."""
    if score <= RISK_THRESHOLD_LOW_MAX:
        return "LOW"
    elif score <= RISK_THRESHOLD_MODERATE_MAX:
        return "MODERATE"
    elif score <= RISK_THRESHOLD_HIGH_MAX:
        return "HIGH"
    else:
        return "CRITICAL"


# ==========================================
# TIME-TO-COLLISION (TTC) PARAMETERS (seconds)
# ==========================================
# TTC = Distance / Relative Closing Speed
TTC_CRITICAL = 2.2      # <= 2.2 seconds triggers CRITICAL alert
TTC_HIGH = 3.8          # <= 3.8 seconds triggers HIGH alert
TTC_MODERATE = 5.5      # <= 5.5 seconds triggers MODERATE caution
TTC_MAX_CONSIDERATION = 8.0 # Above 8.0 seconds is negligible immediate risk

# Minimum closing speed (pixels/second) to consider two objects as converging
MIN_CLOSING_SPEED_PX = 15.0


# ==========================================
# PROXIMITY THRESHOLDS (Pixel distance in camera frame)
# ==========================================
PROXIMITY_IMMINENT_PX = 70.0     # Dangerously close
PROXIMITY_CLOSE_PX = 140.0       # Close proximity
PROXIMITY_WARNING_PX = 240.0     # Monitor proximity


# ==========================================
# RISK ENGINE WEIGHTS
# ==========================================
WEIGHT_TTC = 0.40          # Weight for Time-To-Collision
WEIGHT_PROXIMITY = 0.25    # Weight for absolute distance between objects
WEIGHT_TRAJECTORY = 0.20   # Weight for trajectory convergence/intersection
WEIGHT_SCENARIO = 0.15     # Weight for specific danger scenarios (pedestrian, wrong-way)


# ==========================================
# OBJECT DETECTION & TRACKING
# ==========================================
YOLO_MODEL_PATH = "yolov8n.pt"
YOLO_CONFIDENCE_THRESHOLD = 0.30
YOLO_IOU_THRESHOLD = 0.45

# COCO target classes for road safety
ROAD_SAFETY_CLASSES: Dict[int, str] = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}

# Velocity estimation smoothing window (number of frames)
TRACKING_HISTORY_LEN = 30
VELOCITY_SMOOTHING_FRAMES = 5
PREDICTED_TRAJECTORY_STEPS = 25  # Number of forward projection steps (approx 1 sec at 25 fps)

# Pixel-to-metric approximation proxy (meters per pixel at average road focal distance)
# Note: In real camera systems this requires camera calibration matrices.
DEFAULT_METERS_PER_PIXEL = 0.045
DEFAULT_FPS = 25.0
