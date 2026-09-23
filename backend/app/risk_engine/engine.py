"""
SafeSight AI - Master Collision Risk Engine
Analyzes kinematic relationships between moving objects, calculates TTC,
predicts trajectory intersections, scores multi-factor risk, and generates alerts.
"""

import math
from typing import List, Dict, Tuple, Optional, Any

from app.config import (
    RISK_THRESHOLD_LOW_MAX,
    RISK_THRESHOLD_MODERATE_MAX,
    RISK_THRESHOLD_HIGH_MAX,
    get_risk_level,
    TTC_CRITICAL,
    TTC_HIGH,
    TTC_MODERATE,
    TTC_MAX_CONSIDERATION,
    MIN_CLOSING_SPEED_PX,
    PROXIMITY_IMMINENT_PX,
    PROXIMITY_CLOSE_PX,
    PROXIMITY_WARNING_PX,
    WEIGHT_TTC,
    WEIGHT_PROXIMITY,
    WEIGHT_TRAJECTORY,
    WEIGHT_SCENARIO,
    DEFAULT_METERS_PER_PIXEL
)
from app.models.schemas import TrackedObject, DangerScenario, FrameAnalysis
from app.risk_engine.trajectory import compute_cpa_time_and_distance, check_trajectory_intersection
from app.risk_engine.scenarios import ScenarioRegistry


class CollisionRiskEngine:
    """Core predictive road safety & collision risk engine."""

    def __init__(self):
        self.scenario_registry = ScenarioRegistry()

    def analyze_frame(
        self,
        frame_idx: int,
        timestamp_sec: float,
        objects: List[TrackedObject],
        video_width: int = 854,
        video_height: int = 480
    ) -> FrameAnalysis:
        """
        Perform complete relational collision risk analysis for a frame.
        """
        # Format timestamp mm:ss.ms
        mins = int(timestamp_sec // 60)
        secs = timestamp_sec % 60
        ts_formatted = f"{mins:02d}:{secs:05.2f}"

        # Count categories
        vehicle_count = sum(1 for o in objects if o.label in ["car", "motorcycle", "bus", "truck"])
        pedestrian_count = sum(1 for o in objects if o.label in ["person", "bicycle"])
        total_objects = len(objects)

        if total_objects < 2:
            # Not enough objects for inter-object collision risk
            return FrameAnalysis(
                frame_index=frame_idx,
                timestamp_sec=round(timestamp_sec, 2),
                timestamp_formatted=ts_formatted,
                overall_risk_score=0.0,
                overall_risk_level="LOW",
                active_scenarios=[],
                objects=objects,
                primary_warning=None,
                recommended_action="NORMAL DRIVING CONDITIONS",
                min_ttc=None,
                closest_distance_px=None,
                relative_speed_kmh=None,
                vehicle_count=vehicle_count,
                pedestrian_count=pedestrian_count,
                total_objects=total_objects,
                video_width=video_width,
                video_height=video_height
            )

        all_scenarios: List[DangerScenario] = []
        pair_risks: List[float] = []
        min_ttc: Optional[float] = None
        closest_distance: float = float("inf")
        max_closing_speed_kmh: float = 0.0
        primary_collision_zone: Optional[List[float]] = None

        object_max_risk: Dict[int, float] = {obj.id: 0.0 for obj in objects}

        # Analyze every pair of objects
        for i in range(len(objects)):
            for j in range(i + 1, len(objects)):
                obj_a = objects[i]
                obj_b = objects[j]

                pair_res = self._analyze_pair(obj_a, obj_b)
                pair_score = pair_res["risk_score"]
                pair_risks.append(pair_score)

                # Track max risk per object
                object_max_risk[obj_a.id] = max(object_max_risk[obj_a.id], pair_score)
                object_max_risk[obj_b.id] = max(object_max_risk[obj_b.id], pair_score)

                # Track min distance
                if pair_res["distance"] < closest_distance:
                    closest_distance = pair_res["distance"]

                # Track min TTC
                if pair_res["ttc"] is not None:
                    if min_ttc is None or pair_res["ttc"] < min_ttc:
                        min_ttc = pair_res["ttc"]

                # Track closing speed proxy
                closing_kmh = pair_res["closing_speed"] * DEFAULT_METERS_PER_PIXEL * 3.6
                if closing_kmh > max_closing_speed_kmh:
                    max_closing_speed_kmh = closing_kmh

                # Accumulate scenarios
                for sc in pair_res["scenarios"]:
                    all_scenarios.append(sc)
                    if sc.collision_zone and primary_collision_zone is None and sc.severity in ["HIGH", "CRITICAL"]:
                        primary_collision_zone = sc.collision_zone

        # Determine overall frame risk score
        overall_score = 0.0
        if pair_risks:
            # Blend highest risk with secondary hazards
            pair_risks.sort(reverse=True)
            primary_risk = pair_risks[0]
            secondary_sum = sum(pair_risks[1:3]) * 0.15
            overall_score = min(round(primary_risk + secondary_sum, 1), 100.0)

        risk_level = get_risk_level(overall_score)

        # Update risk level on individual objects
        for obj in objects:
            obj_score = object_max_risk.get(obj.id, 0.0)
            obj.risk_score = round(obj_score, 1)
            obj.risk_level = get_risk_level(obj_score)

        # Sort scenarios by risk score descending
        all_scenarios.sort(key=lambda s: s.risk_score, reverse=True)

        # Determine primary warning and action
        primary_warning = None
        recommended_action = "MAINTAIN CURRENT SPEED & DISTANCE"

        if all_scenarios:
            top_scenario = all_scenarios[0]
            primary_warning = top_scenario.description
            recommended_action = top_scenario.recommended_action
        elif risk_level == "CRITICAL":
            primary_warning = "CRITICAL PROXIMITY ALERT DETECTED"
            recommended_action = "IMMEDIATE EMERGENCY BRAKING REQUIRED"
        elif risk_level == "HIGH":
            primary_warning = "HIGH COLLISION RISK DETECTED"
            recommended_action = "SLOW DOWN / PREPARE TO BRAKE"
        elif risk_level == "MODERATE":
            primary_warning = "TRAFFIC PROXIMITY CAUTION"
            recommended_action = "REDUCE SPEED AND MONITOR DISTANCE"

        return FrameAnalysis(
            frame_index=frame_idx,
            timestamp_sec=round(timestamp_sec, 2),
            timestamp_formatted=ts_formatted,
            overall_risk_score=overall_score,
            overall_risk_level=risk_level,
            active_scenarios=all_scenarios,
            objects=objects,
            primary_warning=primary_warning,
            recommended_action=recommended_action,
            min_ttc=round(min_ttc, 2) if min_ttc is not None else None,
            closest_distance_px=round(closest_distance, 1) if closest_distance != float("inf") else None,
            relative_speed_kmh=round(max_closing_speed_kmh, 1),
            vehicle_count=vehicle_count,
            pedestrian_count=pedestrian_count,
            total_objects=total_objects,
            collision_zone=primary_collision_zone,
            video_width=video_width,
            video_height=video_height
        )

    def _analyze_pair(self, obj_a: TrackedObject, obj_b: TrackedObject) -> Dict[str, Any]:
        """Analyze physical interaction between two tracked objects."""
        # Centers
        p1 = obj_a.center
        p2 = obj_b.center

        # Distance
        dx = p1[0] - p2[0]
        dy = p1[1] - p2[1]
        dist = math.hypot(dx, dy)
        dist = max(dist, 1.0)

        # Velocities
        v1 = obj_a.velocity
        v2 = obj_b.velocity

        # Relative closing speed: negative derivative of distance
        # v_rel = ((p1 - p2) . (v2 - v1)) / |p1 - p2|
        # Positive v_rel means distance is decreasing (closing in)
        v_rel = (dx * (v2[0] - v1[0]) + dy * (v2[1] - v1[1])) / dist

        # Time-to-Collision (TTC)
        ttc = None
        if v_rel > MIN_CLOSING_SPEED_PX:
            ttc_raw = dist / v_rel
            if 0 < ttc_raw <= TTC_MAX_CONSIDERATION:
                ttc = round(ttc_raw, 2)

        # Trajectory CPA & Intersection
        t_cpa, cpa_dist, collision_pt = compute_cpa_time_and_distance(p1, v1, p2, v2)
        traj_intersect = check_trajectory_intersection(
            obj_a.predicted_trajectory,
            obj_b.predicted_trajectory
        )

        pair_metrics = {
            "distance": dist,
            "closing_speed": max(v_rel, 0.0),
            "ttc": ttc,
            "t_cpa": t_cpa,
            "cpa_dist": cpa_dist,
            "collision_point": collision_pt,
            "intersects": traj_intersect is not None
        }

        # Evaluate Scenarios
        scenarios = self.scenario_registry.evaluate_pair(obj_a, obj_b, pair_metrics)

        # Calculate Multi-Factor Risk Score (0 - 100)
        risk_score = self._compute_risk_score(dist, v_rel, ttc, cpa_dist, traj_intersect is not None, scenarios)

        return {
            "risk_score": risk_score,
            "distance": dist,
            "closing_speed": max(v_rel, 0.0),
            "ttc": ttc,
            "scenarios": scenarios
        }

    def _compute_risk_score(
        self,
        dist: float,
        closing_speed: float,
        ttc: Optional[float],
        cpa_dist: float,
        trajectories_intersect: bool,
        scenarios: List[DangerScenario]
    ) -> float:
        """
        Mathematical multi-factor risk score calculation (0 - 100).
        """
        # 1. TTC Score Component (0 - 100)
        ttc_score = 0.0
        if ttc is not None:
            if ttc <= TTC_CRITICAL:
                ttc_score = 100.0 - (ttc / TTC_CRITICAL) * 15.0  # 85 to 100
            elif ttc <= TTC_HIGH:
                ttc_score = 70.0 - ((ttc - TTC_CRITICAL) / (TTC_HIGH - TTC_CRITICAL)) * 20.0  # 50 to 70
            elif ttc <= TTC_MODERATE:
                ttc_score = 50.0 - ((ttc - TTC_HIGH) / (TTC_MODERATE - TTC_HIGH)) * 25.0  # 25 to 50
            else:
                ttc_score = 15.0

        # 2. Proximity Score Component (0 - 100)
        prox_score = 0.0
        if dist <= PROXIMITY_IMMINENT_PX:
            prox_score = 100.0 - (dist / PROXIMITY_IMMINENT_PX) * 20.0  # 80 to 100
        elif dist <= PROXIMITY_CLOSE_PX:
            prox_score = 75.0 - ((dist - PROXIMITY_IMMINENT_PX) / (PROXIMITY_CLOSE_PX - PROXIMITY_IMMINENT_PX)) * 30.0  # 45 to 75
        elif dist <= PROXIMITY_WARNING_PX:
            prox_score = 45.0 - ((dist - PROXIMITY_CLOSE_PX) / (PROXIMITY_WARNING_PX - PROXIMITY_CLOSE_PX)) * 30.0  # 15 to 45
        else:
            prox_score = max(0.0, 15.0 - (dist - PROXIMITY_WARNING_PX) * 0.05)

        # 3. Trajectory Convergence Score (0 - 100)
        traj_score = 0.0
        if trajectories_intersect:
            traj_score = 80.0
        elif cpa_dist < PROXIMITY_IMMINENT_PX and closing_speed > 10.0:
            traj_score = 70.0
        elif cpa_dist < PROXIMITY_CLOSE_PX and closing_speed > 10.0:
            traj_score = 45.0
        elif closing_speed > 25.0:
            traj_score = 30.0

        # 4. Specific Scenario Bonus
        scenario_score = 0.0
        if scenarios:
            scenario_score = max(s.risk_score for s in scenarios)

        # Compound Weighted Sum
        combined = (
            WEIGHT_TTC * ttc_score +
            WEIGHT_PROXIMITY * prox_score +
            WEIGHT_TRAJECTORY * traj_score +
            WEIGHT_SCENARIO * scenario_score
        )

        # If scenario is critical, elevate compound score
        if any(s.severity == "CRITICAL" for s in scenarios) or (ttc is not None and ttc <= TTC_CRITICAL):
            combined = max(combined, 82.0)
        elif any(s.severity == "HIGH" for s in scenarios):
            combined = max(combined, 62.0)

        return round(min(max(combined, 0.0), 100.0), 1)
