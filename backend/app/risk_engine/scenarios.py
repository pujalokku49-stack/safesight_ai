"""
SafeSight AI - Danger Scenario Evaluators
Modular scenario evaluation engine detecting Scenarios A through F.
"""

import math
from typing import List, Optional, Tuple, Dict, Any
from app.models.schemas import TrackedObject, DangerScenario
from app.config import (
    TTC_CRITICAL,
    TTC_HIGH,
    TTC_MODERATE,
    PROXIMITY_IMMINENT_PX,
    PROXIMITY_CLOSE_PX,
    PROXIMITY_WARNING_PX
)


class BaseScenarioEvaluator:
    """Base class for modular road safety scenario detectors."""
    
    scenario_type: str = "base_scenario"
    scenario_name: str = "Base Scenario"

    def evaluate(self, obj_a: TrackedObject, obj_b: TrackedObject, pair_metrics: Dict[str, Any]) -> Optional[DangerScenario]:
        raise NotImplementedError


class PedestrianCollisionRiskEvaluator(BaseScenarioEvaluator):
    """
    Scenario A – Pedestrian Collision Risk:
    A vehicle and pedestrian are moving toward an intersecting trajectory.
    """
    scenario_type = "pedestrian_collision_risk"
    scenario_name = "Pedestrian Collision Risk"

    def evaluate(self, obj_a: TrackedObject, obj_b: TrackedObject, pair_metrics: Dict[str, Any]) -> Optional[DangerScenario]:
        # Check if one is pedestrian/bicycle and one is vehicle
        is_a_ped = obj_a.label in ["person", "bicycle"]
        is_b_ped = obj_b.label in ["person", "bicycle"]
        is_a_veh = obj_a.label in ["car", "motorcycle", "bus", "truck"]
        is_b_veh = obj_b.label in ["car", "motorcycle", "bus", "truck"]

        if not ((is_a_ped and is_b_veh) or (is_b_ped and is_a_veh)):
            return None

        ped = obj_a if is_a_ped else obj_b
        veh = obj_b if is_a_ped else obj_a

        dist = pair_metrics["distance"]
        ttc = pair_metrics["ttc"]
        closing_speed = pair_metrics["closing_speed"]
        intersects = pair_metrics["intersects"]

        # Pedestrian vulnerability multiplier
        if (ttc is not None and ttc <= TTC_HIGH) or (dist < PROXIMITY_CLOSE_PX and closing_speed > 10) or (intersects and dist < PROXIMITY_WARNING_PX):
            if (ttc is not None and ttc <= TTC_CRITICAL) or dist < PROXIMITY_IMMINENT_PX:
                severity = "CRITICAL"
                risk_score = 92.0
                rec_action = "EMERGENCY BRAKE – PEDESTRIAN IN PATH"
            elif (ttc is not None and ttc <= TTC_HIGH) or dist < PROXIMITY_CLOSE_PX:
                severity = "HIGH"
                risk_score = 75.0
                rec_action = "SLOW DOWN – YIELD TO PEDESTRIAN"
            else:
                severity = "MODERATE"
                risk_score = 48.0
                rec_action = "CAUTION – PEDESTRIAN NEARBY"

            desc = f"Vehicle #{veh.id} on converging course with {ped.label.title()} #{ped.id} (TTC: {f'{ttc:.1f}s' if ttc else 'N/A'}, Dist: {dist:.0f}px)"
            return DangerScenario(
                scenario_type=self.scenario_type,
                scenario_name=self.scenario_name,
                severity=severity,
                risk_score=risk_score,
                description=desc,
                involved_objects=[veh.id, ped.id],
                ttc_seconds=ttc,
                distance_px=dist,
                relative_speed_px=closing_speed,
                recommended_action=rec_action,
                collision_zone=pair_metrics.get("collision_point")
            )
        return None


class RearEndCollisionRiskEvaluator(BaseScenarioEvaluator):
    """
    Scenario B – Rear-End Collision Risk:
    A vehicle approaches another vehicle too quickly from behind.
    """
    scenario_type = "rear_end_collision_risk"
    scenario_name = "Rear-End Collision Risk"

    def evaluate(self, obj_a: TrackedObject, obj_b: TrackedObject, pair_metrics: Dict[str, Any]) -> Optional[DangerScenario]:
        is_a_veh = obj_a.label in ["car", "motorcycle", "bus", "truck"]
        is_b_veh = obj_b.label in ["car", "motorcycle", "bus", "truck"]

        if not (is_a_veh and is_b_veh):
            return None

        # Check alignment of movement vectors (similar direction, e.g. angle diff < 45 deg)
        angle_diff = abs((obj_a.direction_deg - obj_b.direction_deg + 180) % 360 - 180)
        if angle_diff > 45.0:
            return None  # Converging at angles is handled by Scenario C

        dist = pair_metrics["distance"]
        ttc = pair_metrics["ttc"]
        closing_speed = pair_metrics["closing_speed"]

        if closing_speed > 20.0 and ttc is not None and ttc <= TTC_HIGH:
            if ttc <= TTC_CRITICAL or dist < PROXIMITY_IMMINENT_PX:
                severity = "CRITICAL"
                risk_score = 88.0
                rec_action = "HARD BRAKE – REAR-END COLLISION IMMINENT"
            else:
                severity = "HIGH"
                risk_score = 68.0
                rec_action = "APPLY BRAKES – HIGH CLOSING SPEED"

            desc = f"Vehicle #{obj_a.id} approaching #{obj_b.id} rapidly from rear (Closing speed: {closing_speed:.0f}px/s, TTC: {ttc:.1f}s)"
            return DangerScenario(
                scenario_type=self.scenario_type,
                scenario_name=self.scenario_name,
                severity=severity,
                risk_score=risk_score,
                description=desc,
                involved_objects=[obj_a.id, obj_b.id],
                ttc_seconds=ttc,
                distance_px=dist,
                relative_speed_px=closing_speed,
                recommended_action=rec_action,
                collision_zone=pair_metrics.get("collision_point")
            )
        return None


class VehicleToVehicleCollisionRiskEvaluator(BaseScenarioEvaluator):
    """
    Scenario C – Vehicle-to-Vehicle Converging Risk:
    Two vehicles have converging trajectories at an angle/intersection.
    """
    scenario_type = "vehicle_to_vehicle_risk"
    scenario_name = "Converging Vehicles Risk"

    def evaluate(self, obj_a: TrackedObject, obj_b: TrackedObject, pair_metrics: Dict[str, Any]) -> Optional[DangerScenario]:
        is_a_veh = obj_a.label in ["car", "motorcycle", "bus", "truck"]
        is_b_veh = obj_b.label in ["car", "motorcycle", "bus", "truck"]

        if not (is_a_veh and is_b_veh):
            return None

        # Trajectories must be intersecting or heading towards each other
        angle_diff = abs((obj_a.direction_deg - obj_b.direction_deg + 180) % 360 - 180)
        if angle_diff <= 45.0:
            return None  # Parallel following is Scenario B or D

        dist = pair_metrics["distance"]
        ttc = pair_metrics["ttc"]
        closing_speed = pair_metrics["closing_speed"]
        intersects = pair_metrics["intersects"]

        if (intersects and dist < PROXIMITY_WARNING_PX) or (ttc is not None and ttc <= TTC_HIGH and closing_speed > 15):
            if (ttc is not None and ttc <= TTC_CRITICAL) or dist < PROXIMITY_IMMINENT_PX:
                severity = "CRITICAL"
                risk_score = 86.0
                rec_action = "CRITICAL: BRAKE OR STEER CLEAR OF MERGING PATH"
            elif (ttc is not None and ttc <= TTC_HIGH):
                severity = "HIGH"
                risk_score = 66.0
                rec_action = "YIELD RIGHT OF WAY – CONVERGING PATH"
            else:
                severity = "MODERATE"
                risk_score = 45.0
                rec_action = "MONITOR CONVERGING VEHICLE TRAJECTORY"

            desc = f"Vehicle #{obj_a.id} and Vehicle #{obj_b.id} converging at angle ({angle_diff:.0f}°)"
            return DangerScenario(
                scenario_type=self.scenario_type,
                scenario_name=self.scenario_name,
                severity=severity,
                risk_score=risk_score,
                description=desc,
                involved_objects=[obj_a.id, obj_b.id],
                ttc_seconds=ttc,
                distance_px=dist,
                relative_speed_px=closing_speed,
                recommended_action=rec_action,
                collision_zone=pair_metrics.get("collision_point")
            )
        return None


class UnsafeFollowingDistanceEvaluator(BaseScenarioEvaluator):
    """
    Scenario D – Unsafe Following Distance:
    A vehicle remains dangerously close to another vehicle without adequate headway.
    """
    scenario_type = "unsafe_following_distance"
    scenario_name = "Unsafe Following Distance"

    def evaluate(self, obj_a: TrackedObject, obj_b: TrackedObject, pair_metrics: Dict[str, Any]) -> Optional[DangerScenario]:
        is_a_veh = obj_a.label in ["car", "motorcycle", "bus", "truck"]
        is_b_veh = obj_b.label in ["car", "motorcycle", "bus", "truck"]

        if not (is_a_veh and is_b_veh):
            return None

        dist = pair_metrics["distance"]
        closing_speed = pair_metrics["closing_speed"]
        angle_diff = abs((obj_a.direction_deg - obj_b.direction_deg + 180) % 360 - 180)

        # Both moving forward along similar direction at close distance
        if angle_diff <= 35.0 and dist < PROXIMITY_CLOSE_PX and max(obj_a.speed_kmh, obj_b.speed_kmh) > 15.0:
            if dist < PROXIMITY_IMMINENT_PX:
                severity = "HIGH"
                risk_score = 64.0
                rec_action = "INCREASE FOLLOWING DISTANCE (TAILGATING DETECTED)"
            else:
                severity = "MODERATE"
                risk_score = 42.0
                rec_action = "MAINTAIN 2-SECOND SAFETY GAP"

            desc = f"Vehicle #{obj_a.id} tailgating Vehicle #{obj_b.id} (Distance: {dist:.0f}px)"
            return DangerScenario(
                scenario_type=self.scenario_type,
                scenario_name=self.scenario_name,
                severity=severity,
                risk_score=risk_score,
                description=desc,
                involved_objects=[obj_a.id, obj_b.id],
                distance_px=dist,
                relative_speed_px=closing_speed,
                recommended_action=rec_action
            )
        return None


class WrongWayMovementEvaluator(BaseScenarioEvaluator):
    """
    Scenario E – Wrong-Way Movement:
    An object moves opposite to the expected/dominant lane traffic direction.
    """
    scenario_type = "wrong_way_movement"
    scenario_name = "Wrong-Way Vehicle"

    def evaluate(self, obj_a: TrackedObject, obj_b: TrackedObject, pair_metrics: Dict[str, Any]) -> Optional[DangerScenario]:
        # If two vehicles are heading directly at each other head-on (angle diff ~ 180)
        angle_diff = abs((obj_a.direction_deg - obj_b.direction_deg + 180) % 360 - 180)
        dist = pair_metrics["distance"]
        closing_speed = pair_metrics["closing_speed"]
        ttc = pair_metrics["ttc"]

        # Head-on collision trajectory (angle diff > 140 deg and closing)
        if angle_diff >= 140.0 and closing_speed > 25.0 and dist < PROXIMITY_WARNING_PX:
            if (ttc is not None and ttc <= TTC_CRITICAL) or dist < PROXIMITY_CLOSE_PX:
                severity = "CRITICAL"
                risk_score = 95.0
                rec_action = "HEAD-ON COLLISION / WRONG-WAY THREAT: BRAKE & EVADE"
            else:
                severity = "HIGH"
                risk_score = 72.0
                rec_action = "CAUTION: ONCOMING VEHICLE IN SAME CORRIDOR"

            desc = f"Vehicle #{obj_a.id} on head-on trajectory with Vehicle #{obj_b.id} (Closing: {closing_speed:.0f}px/s)"
            return DangerScenario(
                scenario_type=self.scenario_type,
                scenario_name=self.scenario_name,
                severity=severity,
                risk_score=risk_score,
                description=desc,
                involved_objects=[obj_a.id, obj_b.id],
                ttc_seconds=ttc,
                distance_px=dist,
                relative_speed_px=closing_speed,
                recommended_action=rec_action,
                collision_zone=pair_metrics.get("collision_point")
            )
        return None


class SuddenObstacleEvaluator(BaseScenarioEvaluator):
    """
    Scenario F – Sudden Obstacle:
    A vehicle approaches a stationary or unexpected object.
    """
    scenario_type = "sudden_obstacle"
    scenario_name = "Sudden Stationary Obstacle"

    def evaluate(self, obj_a: TrackedObject, obj_b: TrackedObject, pair_metrics: Dict[str, Any]) -> Optional[DangerScenario]:
        # One is moving at speed, other is stationary/stopped
        is_a_stationary = obj_a.speed_kmh < 4.0
        is_b_stationary = obj_b.speed_kmh < 4.0

        if not (is_a_stationary ^ is_b_stationary):
            return None

        moving_obj = obj_b if is_a_stationary else obj_a
        stopped_obj = obj_a if is_a_stationary else obj_b

        dist = pair_metrics["distance"]
        closing_speed = pair_metrics["closing_speed"]
        ttc = pair_metrics["ttc"]

        if closing_speed > 20.0 and dist < PROXIMITY_CLOSE_PX:
            if (ttc is not None and ttc <= TTC_CRITICAL) or dist < PROXIMITY_IMMINENT_PX:
                severity = "CRITICAL"
                risk_score = 85.0
                rec_action = "STATIONARY OBSTACLE AHEAD – STOP"
            else:
                severity = "HIGH"
                risk_score = 65.0
                rec_action = "SLOW DOWN – STOPPED VEHICLE IN LANE"

            desc = f"Vehicle #{moving_obj.id} closing fast on stationary object #{stopped_obj.id} ({dist:.0f}px)"
            return DangerScenario(
                scenario_type=self.scenario_type,
                scenario_name=self.scenario_name,
                severity=severity,
                risk_score=risk_score,
                description=desc,
                involved_objects=[moving_obj.id, stopped_obj.id],
                ttc_seconds=ttc,
                distance_px=dist,
                relative_speed_px=closing_speed,
                recommended_action=rec_action,
                collision_zone=stopped_obj.center
            )
        return None


class ScenarioRegistry:
    """Registry coordinating all scenario evaluators."""

    def __init__(self):
        self.evaluators: List[BaseScenarioEvaluator] = [
            PedestrianCollisionRiskEvaluator(),
            RearEndCollisionRiskEvaluator(),
            VehicleToVehicleCollisionRiskEvaluator(),
            UnsafeFollowingDistanceEvaluator(),
            WrongWayMovementEvaluator(),
            SuddenObstacleEvaluator()
        ]

    def add_evaluator(self, evaluator: BaseScenarioEvaluator):
        """Allows extension with custom scenario evaluators."""
        self.evaluators.append(evaluator)

    def evaluate_pair(self, obj_a: TrackedObject, obj_b: TrackedObject, pair_metrics: Dict[str, Any]) -> List[DangerScenario]:
        """Run all scenario detectors against a pair of objects."""
        scenarios = []
        for eval_inst in self.evaluators:
            res = eval_inst.evaluate(obj_a, obj_b, pair_metrics)
            if res is not None:
                scenarios.append(res)
        return scenarios
