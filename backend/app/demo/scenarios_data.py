"""
SafeSight AI - Demo Scenarios Metadata & Simulation Data
Provides deterministic kinematic telemetry for Demo / Simulation Mode,
clearly differentiated from Live AI Analysis.
"""

from typing import Dict, List, Any
import math

DEMO_SCENARIOS_META: List[Dict[str, Any]] = [
    {
        "id": "pedestrian_crossing",
        "name": "Scenario 1: Pedestrian Crosswalk Interaction",
        "tag": "Pedestrian Vulnerability",
        "category": "Scenario A",
        "description": "A vehicle approaches an active pedestrian crosswalk where a pedestrian is crossing the lane. Trajectories converge with declining TTC before braking occurs.",
        "key_danger": "Vulnerable Road User (VRU) trajectory intersection with vehicle",
        "expected_peak_risk": 84.0,
        "expected_scenario": "Pedestrian Collision Risk",
        "video_filename": "pedestrian_crossing.mp4"
    },
    {
        "id": "rear_end_risk",
        "name": "Scenario 2: Rapid Rear-End Closure",
        "tag": "Highway Hazard",
        "category": "Scenario B",
        "description": "Lead vehicle decelerates abruptly; trailing vehicle approaches at high closing velocity before emergency braking intervenes.",
        "key_danger": "Insufficient braking distance at high relative closing velocity",
        "expected_peak_risk": 88.0,
        "expected_scenario": "Rear-End Collision Risk",
        "video_filename": "rear_end_risk.mp4"
    },
    {
        "id": "intersection_convergence",
        "name": "Scenario 3: Intersecting Trajectories",
        "tag": "Junction Safety",
        "category": "Scenario C",
        "description": "Two vehicles approach a 4-way junction from orthogonal directions. Predicted paths cross in the intersection center.",
        "key_danger": "Blind perpendicular approach with converging collision zone",
        "expected_peak_risk": 86.0,
        "expected_scenario": "Converging Vehicles Risk",
        "video_filename": "intersection_convergence.mp4"
    },
    {
        "id": "safe_traffic",
        "name": "Scenario 4: Safe Multi-Vehicle Cruising",
        "tag": "Baseline Flow",
        "category": "Normal Conditions",
        "description": "Two vehicles cruise at highway speed maintaining safe 3-second time headway. Serves as baseline non-hazardous traffic flow.",
        "key_danger": "None (Control baseline demonstration)",
        "expected_peak_risk": 22.0,
        "expected_scenario": "Normal Driving",
        "video_filename": "safe_traffic.mp4"
    },
    {
        "id": "wrong_way_vehicle",
        "name": "Scenario 5: Wrong-Way Oncoming Vehicle",
        "tag": "Severe Violation",
        "category": "Scenario E",
        "description": "A vehicle drives against the flow in the same lane directly toward oncoming traffic, creating an acute head-on hazard.",
        "key_danger": "Head-on closing vector with inverted traffic orientation",
        "expected_peak_risk": 95.0,
        "expected_scenario": "Wrong-Way Vehicle",
        "video_filename": "wrong_way_vehicle.mp4"
    }
]


def generate_scenario_telemetry(scenario_id: str, total_frames: int = 250, fps: float = 25.0) -> List[Dict[str, Any]]:
    """
    Generates deterministic, mathematically rigorous frame telemetry for simulation mode.
    """
    telemetry_list = []
    
    for f in range(total_frames):
        ts = f / fps
        mins = int(ts // 60)
        secs = ts % 60
        ts_formatted = f"{mins:02d}:{secs:05.2f}"

        if scenario_id == "pedestrian_crossing":
            # Vehicle (#1) and Pedestrian (#2)
            # Distance closes from frame 0 to 110, car brakes at 90-130, passes at 160+
            if f < 65:
                car_x = 40.0 + f * 4.2
                ped_y = 105.0 + f * 1.05
            elif f < 125:
                car_x = 40.0 + 65 * 4.2 + (f - 65) * 2.1
                ped_y = 105.0 + f * 1.05
            elif f < 165:
                car_x = 40.0 + 65 * 4.2 + 60 * 2.1 + (f - 125) * 0.6
                ped_y = 105.0 + f * 1.05
            else:
                car_x = 40.0 + 65 * 4.2 + 60 * 2.1 + 40 * 0.6 + (f - 165) * 3.2
                ped_y = min(370.0, 105.0 + f * 1.05)

            car_y = 290.0
            ped_x = 540.0

            dist = math.hypot(car_x - ped_x, car_y - ped_y)
            closing_speed = 45.0 if f < 90 else (20.0 if f < 130 else 5.0)

            # TTC drops before braking
            if f < 50:
                risk = 32.0 + f * 0.3
                ttc = max(3.5, 6.0 - f * 0.05)
                rec = "MONITOR ROAD AHEAD"
                level = "MODERATE" if risk > 30 else "LOW"
            elif f < 85:
                risk = 48.0 + (f - 50) * 0.8  # climbs 48 -> 76
                ttc = max(2.2, 4.0 - (f - 50) * 0.05)
                rec = "SLOW DOWN – PEDESTRIAN IN PATH"
                level = "HIGH"
            elif f < 130:
                risk = min(84.0, 76.0 + (f - 85) * 0.4)  # climbs to 84 peak
                ttc = 2.1
                rec = "BRAKE IMMEDIATELY – PEDESTRIAN CROSSING"
                level = "CRITICAL"
            elif f < 165:
                risk = max(40.0, 84.0 - (f - 130) * 1.2)  # dropping
                ttc = 4.2
                rec = "PROCEED WITH CAUTION"
                level = "MODERATE"
            else:
                risk = max(18.0, 40.0 - (f - 165) * 0.25)
                ttc = None
                rec = "NORMAL DRIVING CONDITIONS"
                level = "LOW"

            obj_car = {
                "id": 1,
                "label": "car",
                "confidence": 0.94,
                "bbox": [round(car_x - 34, 1), round(car_y - 18, 1), round(car_x + 34, 1), round(car_y + 18, 1)],
                "center": [round(car_x, 1), round(car_y, 1)],
                "velocity": [round(closing_speed * 2.5, 1), 0.0],
                "speed_kmh": round(closing_speed * 0.8, 1),
                "direction_deg": 0.0,
                "direction_arrow": "→",
                "trajectory_history": [[round(car_x - k * 8, 1), round(car_y, 1)] for k in range(min(f, 8), -1, -1)],
                "predicted_trajectory": [[round(car_x + k * 12, 1), round(car_y, 1)] for k in range(1, 12)],
                "risk_level": level,
                "risk_score": round(risk, 1)
            }

            obj_ped = {
                "id": 2,
                "label": "person",
                "confidence": 0.89,
                "bbox": [round(ped_x - 8, 1), round(ped_y - 14, 1), round(ped_x + 8, 1), round(ped_y + 14, 1)],
                "center": [round(ped_x, 1), round(ped_y, 1)],
                "velocity": [0.0, 26.0],
                "speed_kmh": 4.5,
                "direction_deg": 90.0,
                "direction_arrow": "↓",
                "trajectory_history": [[round(ped_x, 1), round(ped_y - k * 3, 1)] for k in range(min(f, 8), -1, -1)],
                "predicted_trajectory": [[round(ped_x, 1), round(ped_y + k * 4, 1)] for k in range(1, 10)],
                "risk_level": level,
                "risk_score": round(risk, 1)
            }

            scenarios = []
            if risk > 40:
                scenarios.append({
                    "scenario_type": "pedestrian_collision_risk",
                    "scenario_name": "Pedestrian Collision Risk",
                    "severity": level,
                    "risk_score": round(risk, 1),
                    "description": f"Vehicle #1 on converging trajectory with Person #2 (TTC: {ttc if ttc else 'N/A'}s)",
                    "involved_objects": [1, 2],
                    "ttc_seconds": ttc,
                    "distance_px": round(dist, 1),
                    "relative_speed_px": round(closing_speed, 1),
                    "recommended_action": rec,
                    "collision_zone": [540.0, 290.0, 40.0] if risk > 60 else None
                })

            telemetry_list.append({
                "frame_index": f,
                "timestamp_sec": round(ts, 2),
                "timestamp_formatted": ts_formatted,
                "overall_risk_score": round(risk, 1),
                "overall_risk_level": level,
                "active_scenarios": scenarios,
                "objects": [obj_car, obj_ped],
                "primary_warning": scenarios[0]["description"] if scenarios else None,
                "recommended_action": rec,
                "min_ttc": ttc,
                "closest_distance_px": round(dist, 1),
                "relative_speed_kmh": round(closing_speed * 0.8, 1),
                "vehicle_count": 1,
                "pedestrian_count": 1,
                "total_objects": 2,
                "collision_zone": [540.0, 290.0, 40.0] if risk > 60 else None
            })

        elif scenario_id == "rear_end_risk":
            # Scenario 2: Rear-End Collision
            # Trailing car (#2) approaches Lead Car (#1)
            lead_x = 380.0 + f * 2.0
            if f < 90:
                trail_x = 40.0 + f * 4.8
                risk = 35.0 + f * 0.55  # climbs to ~85
                ttc = max(1.9, 5.0 - f * 0.035)
                level = "CRITICAL" if risk > 70 else ("HIGH" if risk > 50 else "MODERATE")
                rec = "APPLY BRAKES – RAPID CLOSING SPEED"
            elif f < 140:
                trail_x = 40.0 + 90 * 4.8 + (f - 90) * 1.5  # Heavy braking
                risk = max(55.0, 88.0 - (f - 90) * 0.6)
                ttc = 2.4
                level = "HIGH"
                rec = "MAINTAIN BRAKING PRESSURE"
            else:
                trail_x = 40.0 + 90 * 4.8 + 50 * 1.5 + (f - 140) * 2.0
                risk = max(24.0, 55.0 - (f - 140) * 0.3)
                ttc = 5.2
                level = "LOW"
                rec = "SAFE FOLLOWING DISTANCE RESTORED"

            dist = max(55.0, lead_x - trail_x)
            obj_lead = {
                "id": 1, "label": "car", "confidence": 0.95,
                "bbox": [round(lead_x - 34, 1), 272.0, round(lead_x + 34, 1), 308.0],
                "center": [round(lead_x, 1), 290.0],
                "velocity": [50.0, 0.0], "speed_kmh": 40.0, "direction_deg": 0.0, "direction_arrow": "→",
                "trajectory_history": [[round(lead_x - k * 6, 1), 290.0] for k in range(min(f, 6), -1, -1)],
                "predicted_trajectory": [[round(lead_x + k * 8, 1), 290.0] for k in range(1, 10)],
                "risk_level": level, "risk_score": round(risk, 1)
            }
            obj_trail = {
                "id": 2, "label": "car", "confidence": 0.93,
                "bbox": [round(trail_x - 34, 1), 272.0, round(trail_x + 34, 1), 308.0],
                "center": [round(trail_x, 1), 290.0],
                "velocity": [110.0, 0.0], "speed_kmh": 65.0, "direction_deg": 0.0, "direction_arrow": "→",
                "trajectory_history": [[round(trail_x - k * 10, 1), 290.0] for k in range(min(f, 6), -1, -1)],
                "predicted_trajectory": [[round(trail_x + k * 14, 1), 290.0] for k in range(1, 10)],
                "risk_level": level, "risk_score": round(risk, 1)
            }

            scenarios = []
            if risk > 40:
                scenarios.append({
                    "scenario_type": "rear_end_collision_risk",
                    "scenario_name": "Rear-End Collision Risk",
                    "severity": level,
                    "risk_score": round(risk, 1),
                    "description": f"Vehicle #2 closing rapidly on lead Vehicle #1 (TTC: {ttc:.1f}s)",
                    "involved_objects": [1, 2],
                    "ttc_seconds": ttc,
                    "distance_px": round(dist, 1),
                    "relative_speed_px": 60.0,
                    "recommended_action": rec,
                    "collision_zone": [lead_x - 10, 290.0, 35.0] if risk > 70 else None
                })

            telemetry_list.append({
                "frame_index": f, "timestamp_sec": round(ts, 2), "timestamp_formatted": ts_formatted,
                "overall_risk_score": round(risk, 1), "overall_risk_level": level,
                "active_scenarios": scenarios, "objects": [obj_lead, obj_trail],
                "primary_warning": scenarios[0]["description"] if scenarios else None,
                "recommended_action": rec, "min_ttc": ttc, "closest_distance_px": round(dist, 1),
                "relative_speed_kmh": 25.0, "vehicle_count": 2, "pedestrian_count": 0, "total_objects": 2,
                "collision_zone": [lead_x - 10, 290.0, 35.0] if risk > 70 else None
            })

        elif scenario_id == "intersection_convergence":
            # Scenario 3: Intersection Convergence
            car1_x = 50.0 + min(f, 100) * 3.5 + max(0, f - 100) * 2.0
            car2_y = 30.0 + f * 3.2
            c1 = [car1_x, 290.0]
            c2 = [400.0, car2_y]
            dist = math.hypot(c1[0] - c2[0], c1[1] - c2[1])

            if f < 75:
                risk = 30.0 + f * 0.6  # climbs to ~75
                level = "HIGH" if risk > 50 else "MODERATE"
                ttc = max(2.3, 5.5 - f * 0.04)
                rec = "YIELD RIGHT OF WAY AT JUNCTION"
            elif f < 120:
                risk = min(86.0, 75.0 + (f - 75) * 0.25)
                level = "CRITICAL"
                ttc = 2.0
                rec = "CRITICAL: CONVERGING INTERSECTION TRAJECTORY"
            else:
                risk = max(20.0, 86.0 - (f - 120) * 0.5)
                level = "LOW" if risk <= 30 else "MODERATE"
                ttc = None
                rec = "INTERSECTION CLEARED"

            obj_c1 = {
                "id": 1, "label": "car", "confidence": 0.92,
                "bbox": [round(car1_x - 34, 1), 272.0, round(car1_x + 34, 1), 308.0],
                "center": [round(car1_x, 1), 290.0],
                "velocity": [75.0, 0.0], "speed_kmh": 45.0, "direction_deg": 0.0, "direction_arrow": "→",
                "trajectory_history": [[round(car1_x - k * 6, 1), 290.0] for k in range(min(f, 6), -1, -1)],
                "predicted_trajectory": [[round(car1_x + k * 10, 1), 290.0] for k in range(1, 10)],
                "risk_level": level, "risk_score": round(risk, 1)
            }
            obj_c2 = {
                "id": 2, "label": "car", "confidence": 0.91,
                "bbox": [382.0, round(car2_y - 34, 1), 418.0, round(car2_y + 34, 1)],
                "center": [400.0, round(car2_y, 1)],
                "velocity": [0.0, 70.0], "speed_kmh": 42.0, "direction_deg": 90.0, "direction_arrow": "↓",
                "trajectory_history": [[400.0, round(car2_y - k * 6, 1)] for k in range(min(f, 6), -1, -1)],
                "predicted_trajectory": [[400.0, round(car2_y + k * 10, 1)] for k in range(1, 10)],
                "risk_level": level, "risk_score": round(risk, 1)
            }

            scenarios = []
            if risk > 40:
                scenarios.append({
                    "scenario_type": "vehicle_to_vehicle_risk",
                    "scenario_name": "Converging Vehicles Risk",
                    "severity": level,
                    "risk_score": round(risk, 1),
                    "description": f"Vehicle #1 & #2 on perpendicular collision paths (TTC: {ttc if ttc else 'N/A'}s)",
                    "involved_objects": [1, 2],
                    "ttc_seconds": ttc,
                    "distance_px": round(dist, 1),
                    "relative_speed_px": 55.0,
                    "recommended_action": rec,
                    "collision_zone": [400.0, 290.0, 45.0] if risk > 65 else None
                })

            telemetry_list.append({
                "frame_index": f, "timestamp_sec": round(ts, 2), "timestamp_formatted": ts_formatted,
                "overall_risk_score": round(risk, 1), "overall_risk_level": level,
                "active_scenarios": scenarios, "objects": [obj_c1, obj_c2],
                "primary_warning": scenarios[0]["description"] if scenarios else None,
                "recommended_action": rec, "min_ttc": ttc, "closest_distance_px": round(dist, 1),
                "relative_speed_kmh": 32.0, "vehicle_count": 2, "pedestrian_count": 0, "total_objects": 2,
                "collision_zone": [400.0, 290.0, 45.0] if risk > 65 else None
            })

        elif scenario_id == "safe_traffic":
            # Scenario 4: Safe Multi-Vehicle Cruising
            lead_x = 420.0 + f * 2.8
            trail_x = 80.0 + f * 2.8
            dist = 340.0
            risk = 18.0 + math.sin(f * 0.1) * 4.0
            level = "LOW"
            rec = "MAINTAIN SAFE HEADWAY"

            obj1 = {
                "id": 1, "label": "car", "confidence": 0.96,
                "bbox": [round(lead_x - 34, 1), 272.0, round(lead_x + 34, 1), 308.0],
                "center": [round(lead_x, 1), 290.0],
                "velocity": [70.0, 0.0], "speed_kmh": 50.0, "direction_deg": 0.0, "direction_arrow": "→",
                "trajectory_history": [[round(lead_x - k * 8, 1), 290.0] for k in range(min(f, 6), -1, -1)],
                "predicted_trajectory": [[round(lead_x + k * 8, 1), 290.0] for k in range(1, 10)],
                "risk_level": "LOW", "risk_score": round(risk, 1)
            }
            obj2 = {
                "id": 2, "label": "car", "confidence": 0.94,
                "bbox": [round(trail_x - 34, 1), 272.0, round(trail_x + 34, 1), 308.0],
                "center": [round(trail_x, 1), 290.0],
                "velocity": [70.0, 0.0], "speed_kmh": 50.0, "direction_deg": 0.0, "direction_arrow": "→",
                "trajectory_history": [[round(trail_x - k * 8, 1), 290.0] for k in range(min(f, 6), -1, -1)],
                "predicted_trajectory": [[round(trail_x + k * 8, 1), 290.0] for k in range(1, 10)],
                "risk_level": "LOW", "risk_score": round(risk, 1)
            }

            telemetry_list.append({
                "frame_index": f, "timestamp_sec": round(ts, 2), "timestamp_formatted": ts_formatted,
                "overall_risk_score": round(risk, 1), "overall_risk_level": level,
                "active_scenarios": [], "objects": [obj1, obj2],
                "primary_warning": None, "recommended_action": rec, "min_ttc": None,
                "closest_distance_px": round(dist, 1), "relative_speed_kmh": 0.0,
                "vehicle_count": 2, "pedestrian_count": 0, "total_objects": 2,
                "collision_zone": None
            })

        else:  # wrong_way_vehicle
            # Scenario 5: Wrong-Way Vehicle
            norm_x = 60.0 + f * 3.0
            wrong_x = 780.0 - f * 3.0
            dist = max(30.0, wrong_x - norm_x)

            if f < 60:
                risk = 45.0 + f * 0.5  # climbs to ~75
                ttc = max(2.5, 5.0 - f * 0.04)
                level = "HIGH"
                rec = "CAUTION: ONCOMING VEHICLE IN SAME LANE"
            elif f < 120:
                risk = min(95.0, 75.0 + (f - 60) * 0.35)
                ttc = 1.6
                level = "CRITICAL"
                rec = "HEAD-ON COLLISION IMMINENT – EVADE / STOP"
            else:
                risk = max(35.0, 95.0 - (f - 120) * 0.6)
                ttc = 3.5
                level = "MODERATE"
                rec = "EVASIVE MANEUVER COMPLETED"

            obj1 = {
                "id": 1, "label": "car", "confidence": 0.94,
                "bbox": [round(norm_x - 34, 1), 272.0, round(norm_x + 34, 1), 308.0],
                "center": [round(norm_x, 1), 290.0],
                "velocity": [70.0, 0.0], "speed_kmh": 48.0, "direction_deg": 0.0, "direction_arrow": "→",
                "trajectory_history": [[round(norm_x - k * 7, 1), 290.0] for k in range(min(f, 6), -1, -1)],
                "predicted_trajectory": [[round(norm_x + k * 8, 1), 290.0] for k in range(1, 10)],
                "risk_level": level, "risk_score": round(risk, 1)
            }
            obj2 = {
                "id": 2, "label": "car", "confidence": 0.92,
                "bbox": [round(wrong_x - 34, 1), 272.0, round(wrong_x + 34, 1), 308.0],
                "center": [round(wrong_x, 1), 290.0],
                "velocity": [-70.0, 0.0], "speed_kmh": 48.0, "direction_deg": 180.0, "direction_arrow": "←",
                "trajectory_history": [[round(wrong_x + k * 7, 1), 290.0] for k in range(min(f, 6), -1, -1)],
                "predicted_trajectory": [[round(wrong_x - k * 8, 1), 290.0] for k in range(1, 10)],
                "risk_level": level, "risk_score": round(risk, 1)
            }

            scenarios = []
            if risk > 40:
                scenarios.append({
                    "scenario_type": "wrong_way_movement",
                    "scenario_name": "Wrong-Way Vehicle",
                    "severity": level,
                    "risk_score": round(risk, 1),
                    "description": f"Vehicle #2 moving wrong-way against Vehicle #1 (TTC: {ttc:.1f}s)",
                    "involved_objects": [1, 2],
                    "ttc_seconds": ttc,
                    "distance_px": round(dist, 1),
                    "relative_speed_px": 80.0,
                    "recommended_action": rec,
                    "collision_zone": [(norm_x + wrong_x) / 2.0, 290.0, 40.0] if risk > 70 else None
                })

            telemetry_list.append({
                "frame_index": f, "timestamp_sec": round(ts, 2), "timestamp_formatted": ts_formatted,
                "overall_risk_score": round(risk, 1), "overall_risk_level": level,
                "active_scenarios": scenarios, "objects": [obj1, obj2],
                "primary_warning": scenarios[0]["description"] if scenarios else None,
                "recommended_action": rec, "min_ttc": ttc, "closest_distance_px": round(dist, 1),
                "relative_speed_kmh": 70.0, "vehicle_count": 2, "pedestrian_count": 0, "total_objects": 2,
                "collision_zone": [(norm_x + wrong_x) / 2.0, 290.0, 40.0] if risk > 70 else None
            })

    return telemetry_list
