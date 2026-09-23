"""
SafeSight AI - Multi-Object Tracker & Kinematic State Estimator
Maintains persistent IDs across frames, computes velocity vectors, heading,
smoothing, and future trajectory projections.
"""

import math
import numpy as np
from typing import List, Dict, Any, Optional
from collections import deque

from app.config import (
    TRACKING_HISTORY_LEN,
    VELOCITY_SMOOTHING_FRAMES,
    PREDICTED_TRAJECTORY_STEPS,
    DEFAULT_METERS_PER_PIXEL,
    DEFAULT_FPS
)
from app.models.schemas import TrackedObject


def get_direction_arrow(angle_deg: float, speed: float) -> str:
    """Returns directional unicode arrow based on movement angle."""
    if speed < 3.0:  # virtually stationary
        return "•"
    # Normalizing angle 0 = East (Right), 90 = South (Down), 180 = West (Left), 270 = North (Up)
    norm = angle_deg % 360
    if 337.5 <= norm or norm < 22.5:
        return "→"
    elif 22.5 <= norm < 67.5:
        return "↘"
    elif 67.5 <= norm < 112.5:
        return "↓"
    elif 112.5 <= norm < 157.5:
        return "↙"
    elif 157.5 <= norm < 202.5:
        return "←"
    elif 202.5 <= norm < 247.5:
        return "↖"
    elif 247.5 <= norm < 292.5:
        return "↑"
    else:
        return "↗"


class SingleTrack:
    """Tracks a single road entity over time."""

    def __init__(self, track_id: int, bbox: List[float], label: str, confidence: float):
        self.track_id = track_id
        self.label = label
        self.confidence = confidence
        self.bbox = [float(c) for c in bbox]
        self.center = [(bbox[0] + bbox[2]) / 2.0, (bbox[1] + bbox[3]) / 2.0]
        
        # History buffers
        self.history = deque(maxlen=TRACKING_HISTORY_LEN)
        self.history.append((self.center[0], self.center[1]))
        
        # Kinematics
        self.vx = 0.0  # px/sec
        self.vy = 0.0  # px/sec
        self.speed_px = 0.0
        self.speed_kmh = 0.0
        self.direction_deg = 0.0
        
        # State
        self.missed_frames = 0
        self.is_active = True

    def update(self, bbox: List[float], confidence: float, dt: float = 1.0 / DEFAULT_FPS):
        """Update track with newly matched detection."""
        self.bbox = [float(c) for c in bbox]
        new_cx = (bbox[0] + bbox[2]) / 2.0
        new_cy = (bbox[1] + bbox[3]) / 2.0
        self.confidence = confidence
        self.missed_frames = 0
        self.is_active = True

        # Compute instant velocity
        old_cx, old_cy = self.center
        self.center = [new_cx, new_cy]
        self.history.append((new_cx, new_cy))

        # Smoothed velocity calculation over recent frames
        if len(self.history) >= 2:
            num_samples = min(len(self.history), VELOCITY_SMOOTHING_FRAMES)
            start_pt = self.history[-num_samples]
            end_pt = self.history[-1]
            time_delta = max((num_samples - 1) * dt, 1e-4)

            self.vx = (end_pt[0] - start_pt[0]) / time_delta
            self.vy = (end_pt[1] - start_pt[1]) / time_delta
            self.speed_px = math.sqrt(self.vx ** 2 + self.vy ** 2)

            # Speed proxy in km/h (speed in px/sec * meters_per_px * 3.6)
            self.speed_kmh = round(self.speed_px * DEFAULT_METERS_PER_PIXEL * 3.6, 1)

            # Heading angle (0 degrees = positive X axis, clockwise positive in screen space)
            raw_angle = math.degrees(math.atan2(self.vy, self.vx))
            self.direction_deg = round((raw_angle + 360) % 360, 1)

    def mark_missed(self):
        """Mark track missed for this frame; extrapolate position forward using velocity."""
        self.missed_frames += 1
        dt = 1.0 / DEFAULT_FPS
        if self.missed_frames > 15:
            self.is_active = False
        else:
            # Extrapolate center forward
            new_cx = self.center[0] + self.vx * dt
            new_cy = self.center[1] + self.vy * dt
            w = self.bbox[2] - self.bbox[0]
            h = self.bbox[3] - self.bbox[1]
            self.bbox = [new_cx - w / 2.0, new_cy - h / 2.0, new_cx + w / 2.0, new_cy + h / 2.0]
            self.center = [new_cx, new_cy]
            self.history.append((new_cx, new_cy))

    def predict_future_trajectory(self, steps: int = PREDICTED_TRAJECTORY_STEPS, dt: float = 1.0 / DEFAULT_FPS) -> List[List[float]]:
        """Project future trajectory forward assuming current velocity vector."""
        if self.speed_px < 2.0:
            return [[round(self.center[0], 1), round(self.center[1], 1)]]

        projected = []
        cur_x, cur_y = self.center
        for step in range(1, steps + 1):
            future_x = cur_x + self.vx * (step * dt)
            future_y = cur_y + self.vy * (step * dt)
            projected.append([round(future_x, 1), round(future_y, 1)])
        return projected

    def to_schema(self) -> TrackedObject:
        """Convert to Pydantic schema."""
        arrow = get_direction_arrow(self.direction_deg, self.speed_px)
        future_traj = self.predict_future_trajectory()
        hist = [[round(x, 1), round(y, 1)] for x, y in self.history]

        return TrackedObject(
            id=self.track_id,
            label=self.label,
            confidence=round(self.confidence, 3),
            bbox=[round(c, 1) for c in self.bbox],
            center=[round(c, 1) for c in self.center],
            velocity=[round(self.vx, 1), round(self.vy, 1)],
            speed_kmh=self.speed_kmh,
            direction_deg=self.direction_deg,
            direction_arrow=arrow,
            trajectory_history=hist,
            predicted_trajectory=future_traj
        )


class RoadObjectTracker:
    """Manages active object tracks and matches frame detections."""

    def __init__(self, max_distance_px: float = 85.0):
        self.next_id = 1
        self.tracks: Dict[int, SingleTrack] = {}
        self.max_distance_px = max_distance_px

    def reset(self):
        """Reset all active tracks."""
        self.tracks.clear()
        self.next_id = 1

    def update(self, detections: List[Dict[str, Any]], dt: float = 1.0 / DEFAULT_FPS) -> List[TrackedObject]:
        """
        Update tracker with new detections in the current frame.
        
        detections: List of dicts with 'bbox', 'confidence', 'label'
        """
        matched_track_ids = set()
        unmatched_detections = []

        # Match existing tracks to nearest detection of compatible label
        for det in detections:
            det_bbox = det["bbox"]
            det_cx = (det_bbox[0] + det_bbox[2]) / 2.0
            det_cy = (det_bbox[1] + det_bbox[3]) / 2.0
            label = det["label"]

            best_track_id = None
            min_dist = float("inf")

            for track_id, track in self.tracks.items():
                if track_id in matched_track_ids:
                    continue
                # Same category match preference
                if track.label != label:
                    continue

                dist = math.hypot(track.center[0] - det_cx, track.center[1] - det_cy)
                if dist < self.max_distance_px and dist < min_dist:
                    min_dist = dist
                    best_track_id = track_id

            if best_track_id is not None:
                self.tracks[best_track_id].update(det_bbox, det["confidence"], dt)
                matched_track_ids.add(best_track_id)
            else:
                unmatched_detections.append(det)

        # Handle tracks that were missed this frame
        dead_tracks = []
        for track_id, track in self.tracks.items():
            if track_id not in matched_track_ids:
                track.mark_missed()
                if not track.is_active:
                    dead_tracks.append(track_id)

        for track_id in dead_tracks:
            del self.tracks[track_id]

        # Create new tracks for unmatched detections
        for det in unmatched_detections:
            new_track = SingleTrack(
                track_id=self.next_id,
                bbox=det["bbox"],
                label=det["label"],
                confidence=det["confidence"]
            )
            self.tracks[self.next_id] = new_track
            self.next_id += 1

        # Return active tracks as schemas
        return [track.to_schema() for track in self.tracks.values() if track.is_active]
