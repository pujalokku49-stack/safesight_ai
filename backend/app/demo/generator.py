"""
SafeSight AI - Synthetic Traffic Video Generator
Generates browser-compliant H.264 (yuv420p) demo traffic MP4 videos using imageio-ffmpeg
with roads, markings, vehicles, pedestrians, and controlled kinematic danger profiles.
"""

import os
import cv2
import numpy as np
import math
import imageio
from typing import Dict, Any, List

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sample_videos")
os.makedirs(SAMPLE_DIR, exist_ok=True)

WIDTH = 854
HEIGHT = 480
FPS = 25
DURATION_SEC = 10  # 250 frames per demo clip
TOTAL_FRAMES = FPS * DURATION_SEC


def get_h264_writer(out_path: str):
    """Returns an imageio writer configured with web-compliant H.264 codec."""
    return imageio.get_writer(
        out_path,
        fps=FPS,
        codec='libx264',
        pixelformat='yuv420p',
        macro_block_size=1
    )


def draw_road_scene(frame: np.ndarray, intersection: bool = False):
    """Draws realistic asphalt roadway, lane dividers, curbs, and sidewalks."""
    # Grass / environment background
    frame[:] = (45, 60, 40)  # Dark green road verge

    if not intersection:
        # Straight 2-lane road
        road_top = 100
        road_bottom = 380
        # Asphalt
        cv2.rectangle(frame, (0, road_top), (WIDTH, road_bottom), (55, 55, 60), -1)
        # Curbs
        cv2.rectangle(frame, (0, road_top - 12), (WIDTH, road_top), (160, 160, 165), -1)
        cv2.rectangle(frame, (0, road_bottom), (WIDTH, road_bottom + 12), (160, 160, 165), -1)
        # White boundary lines
        cv2.line(frame, (0, road_top + 10), (WIDTH, road_top + 10), (230, 230, 230), 2)
        cv2.line(frame, (0, road_bottom - 10), (WIDTH, road_bottom - 10), (230, 230, 230), 2)
        # Yellow dashed center line
        for x in range(0, WIDTH, 40):
            cv2.line(frame, (x, 240), (x + 20, 240), (40, 200, 230), 3)
    else:
        # 4-way Intersection
        # Horizontal road
        cv2.rectangle(frame, (0, 140), (WIDTH, 340), (55, 55, 60), -1)
        # Vertical road
        cv2.rectangle(frame, (280, 0), (574, HEIGHT), (55, 55, 60), -1)
        # Center junction
        cv2.rectangle(frame, (280, 140), (574, 340), (60, 60, 65), -1)
        # Crosswalk stripes
        for y in range(150, 330, 25):
            cv2.rectangle(frame, (260, y), (275, y + 15), (230, 230, 230), -1)
            cv2.rectangle(frame, (579, y), (594, y + 15), (230, 230, 230), -1)


def draw_vehicle(frame: np.ndarray, x: float, y: float, w: float, h: float, color: tuple, heading_deg: float, label: str):
    """Draws a vehicle with headlights, windshield, and shadow."""
    center = (int(x), int(y))
    # Shadow
    cv2.ellipse(frame, (int(x) + 3, int(y) + 5), (int(w / 2) + 2, int(h / 2) + 2), 0, 0, 360, (25, 25, 25), -1)
    
    # Rotated vehicle body
    rect = ((x, y), (w, h), heading_deg)
    box = cv2.boxPoints(rect)
    box = np.int32(box)
    cv2.fillPoly(frame, [box], color)
    cv2.polylines(frame, [box], True, (20, 20, 20), 2)

    # Windshield
    ws_w = w * 0.4
    ws_h = h * 0.35
    ws_rect = ((x, y), (ws_w, ws_h), heading_deg)
    ws_box = np.int32(cv2.boxPoints(ws_rect))
    cv2.fillPoly(frame, [ws_box], (180, 210, 230))

    # Front headlights
    rad = math.radians(heading_deg)
    front_x = x + math.cos(rad) * (w / 2 - 4)
    front_y = y + math.sin(rad) * (h / 2 - 4)
    cv2.circle(frame, (int(front_x), int(front_y)), 4, (120, 255, 255), -1)


def draw_pedestrian(frame: np.ndarray, x: float, y: float, color: tuple, label: str = "PERSON"):
    """Draws a pedestrian figure with head and torso."""
    ix, iy = int(x), int(y)
    # Shadow
    cv2.ellipse(frame, (ix + 2, iy + 10), (8, 4), 0, 0, 360, (20, 20, 20), -1)
    # Torso
    cv2.circle(frame, (ix, iy + 3), 7, color, -1)
    # Head
    cv2.circle(frame, (ix, iy - 7), 5, (220, 190, 170), -1)
    cv2.circle(frame, (ix, iy - 7), 5, (50, 40, 30), 1)


def generate_pedestrian_crossing():
    """Scenario 1: Pedestrian crossing road in front of approaching vehicle."""
    out_path = os.path.join(SAMPLE_DIR, "pedestrian_crossing.mp4")
    writer = get_h264_writer(out_path)

    car_x = 40.0
    car_y = 290.0
    ped_x = 540.0
    ped_y = 105.0

    for f in range(TOTAL_FRAMES):
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        draw_road_scene(frame, intersection=False)

        # Crosswalk stripes at x=520-560
        for cy in range(115, 365, 22):
            cv2.rectangle(frame, (525, cy), (555, cy + 14), (220, 220, 225), -1)

        # Kinematics
        if f < 65:
            car_speed = 4.2
        elif f < 125:
            car_speed = max(0.6, 4.2 - (f - 65) * 0.06)  # Braking
        elif f < 165:
            car_speed = 0.6  # Creeping/yielding
        else:
            car_speed = min(3.8, 0.6 + (f - 165) * 0.08)  # Accelerating after pedestrian clears

        car_x += car_speed
        if ped_y < 370:
            ped_y += 1.05  # Pedestrian walks across

        # Draw entities
        draw_vehicle(frame, car_x, car_y, 68, 36, (220, 60, 40), 0, "CAR")
        draw_pedestrian(frame, ped_x, ped_y, (40, 160, 240), "PEDESTRIAN")

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        writer.append_data(rgb)

    writer.close()
    return out_path


def generate_rear_end_risk():
    """Scenario 2: Trailing car closing in rapidly on decelerating lead car."""
    out_path = os.path.join(SAMPLE_DIR, "rear_end_risk.mp4")
    writer = get_h264_writer(out_path)

    lead_x = 380.0
    trail_x = 40.0
    lane_y = 290.0

    for f in range(TOTAL_FRAMES):
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        draw_road_scene(frame, intersection=False)

        # Lead car slows down due to hazard
        if f < 50:
            lead_speed = 3.0
        elif f < 130:
            lead_speed = max(0.5, 3.0 - (f - 50) * 0.04)
        else:
            lead_speed = min(3.2, 0.5 + (f - 130) * 0.04)

        # Trailing car cruising fast, brakes late
        if f < 85:
            trail_speed = 5.2
        elif f < 140:
            trail_speed = max(0.8, 5.2 - (f - 85) * 0.08)
        else:
            trail_speed = min(3.0, 0.8 + (f - 140) * 0.04)

        lead_x += lead_speed
        trail_x += trail_speed

        draw_vehicle(frame, lead_x, lane_y, 68, 36, (60, 180, 80), 0, "LEAD CAR")
        draw_vehicle(frame, trail_x, lane_y, 68, 36, (200, 40, 40), 0, "TRAIL CAR")

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        writer.append_data(rgb)

    writer.close()
    return out_path


def generate_intersection_convergence():
    """Scenario 3: Two vehicles on perpendicular paths converging at intersection."""
    out_path = os.path.join(SAMPLE_DIR, "intersection_convergence.mp4")
    writer = get_h264_writer(out_path)

    car1_x = 50.0
    car1_y = 290.0
    car2_x = 350.0
    car2_y = 30.0

    for f in range(TOTAL_FRAMES):
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        draw_road_scene(frame, intersection=True)

        if f < 75:
            c1_speed = 3.8
            c2_speed = 3.2
        elif f < 135:
            c1_speed = max(0.8, 3.8 - (f - 75) * 0.06)  # Car 1 yields
            c2_speed = 3.2  # Car 2 proceeds
        else:
            c1_speed = min(3.5, 0.8 + (f - 135) * 0.06)
            c2_speed = 3.2

        car1_x += c1_speed
        car2_y += c2_speed

        draw_vehicle(frame, car1_x, car1_y, 68, 36, (210, 140, 30), 0, "CAR A")
        draw_vehicle(frame, car2_x, car2_y, 36, 68, (50, 120, 220), 90, "CAR B")

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        writer.append_data(rgb)

    writer.close()
    return out_path


def generate_safe_traffic():
    """Scenario 4: Two vehicles maintaining steady cruise and safe 3-second gap."""
    out_path = os.path.join(SAMPLE_DIR, "safe_traffic.mp4")
    writer = get_h264_writer(out_path)

    lead_x = 420.0
    trail_x = 80.0
    lane_y = 290.0

    for f in range(TOTAL_FRAMES):
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        draw_road_scene(frame, intersection=False)

        lead_x += 3.2
        trail_x += 3.2

        draw_vehicle(frame, lead_x, lane_y, 68, 36, (70, 190, 90), 0, "CRUISE A")
        draw_vehicle(frame, trail_x, lane_y, 68, 36, (80, 140, 210), 0, "CRUISE B")

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        writer.append_data(rgb)

    writer.close()
    return out_path


def generate_wrong_way_vehicle():
    """Scenario 5: Wrong-way oncoming vehicle in the same lane (head-on collision hazard)."""
    out_path = os.path.join(SAMPLE_DIR, "wrong_way_vehicle.mp4")
    writer = get_h264_writer(out_path)

    normal_x = 60.0
    wrong_x = 780.0
    lane_y = 290.0

    for f in range(TOTAL_FRAMES):
        frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        draw_road_scene(frame, intersection=False)

        if f < 70:
            norm_speed = 3.5
            wrong_speed = 3.5
        elif f < 125:
            norm_speed = max(0.4, 3.5 - (f - 70) * 0.06)
            wrong_speed = max(0.6, 3.5 - (f - 70) * 0.05)
        else:
            norm_speed = 0.4
            wrong_speed = 0.6

        normal_x += norm_speed
        wrong_x -= wrong_speed

        draw_vehicle(frame, normal_x, lane_y, 68, 36, (50, 160, 220), 0, "NORMAL VEHICLE")
        draw_vehicle(frame, wrong_x, lane_y, 68, 36, (230, 40, 40), 180, "WRONG WAY")

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        writer.append_data(rgb)

    writer.close()
    return out_path


def generate_all_demo_videos():
    """Generates all 5 demo scenario video files in browser-supported H.264 format."""
    results = {}
    print("Generating H.264 browser-compatible demo traffic videos...")
    results["pedestrian_crossing"] = generate_pedestrian_crossing()
    results["rear_end_risk"] = generate_rear_end_risk()
    results["intersection_convergence"] = generate_intersection_convergence()
    results["safe_traffic"] = generate_safe_traffic()
    results["wrong_way_vehicle"] = generate_wrong_way_vehicle()
    print("All H.264 demo videos successfully generated!")
    return results


if __name__ == "__main__":
    generate_all_demo_videos()
