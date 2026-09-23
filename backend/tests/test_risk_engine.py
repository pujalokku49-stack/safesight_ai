"""
SafeSight AI - Unit Tests for Collision Risk Engine & Kinematics
"""

import pytest
import math
from app.models.schemas import TrackedObject
from app.risk_engine.trajectory import compute_cpa_time_and_distance, check_trajectory_intersection
from app.risk_engine.scenarios import ScenarioRegistry, PedestrianCollisionRiskEvaluator, RearEndCollisionRiskEvaluator
from app.risk_engine.engine import CollisionRiskEngine


def test_compute_cpa_converging():
    """Verify CPA calculation for two objects moving directly towards each other."""
    # Object 1 at (0, 0) moving East at 10 px/s
    p1 = [0.0, 0.0]
    v1 = [10.0, 0.0]
    # Object 2 at (100, 0) moving West at 10 px/s
    p2 = [100.0, 0.0]
    v2 = [-10.0, 0.0]

    t_cpa, min_dist, col_pt = compute_cpa_time_and_distance(p1, v1, p2, v2)
    
    # Expected: collision in 5 seconds at x=50, distance 0
    assert abs(t_cpa - 5.0) < 0.1
    assert min_dist < 1.0
    assert abs(col_pt[0] - 50.0) < 1.0


def test_compute_cpa_diverging():
    """Verify CPA calculation for diverging objects."""
    # Object 1 moving West away from Object 2
    p1 = [0.0, 0.0]
    v1 = [-10.0, 0.0]
    p2 = [100.0, 0.0]
    v2 = [10.0, 0.0]

    t_cpa, min_dist, col_pt = compute_cpa_time_and_distance(p1, v1, p2, v2)
    # Diverging returns t_cpa = -1.0
    assert t_cpa == -1.0


def test_trajectory_intersection():
    """Verify trajectory intersection test."""
    traj1 = [[0, 50], [20, 50], [40, 50], [60, 50]]
    traj2 = [[60, 0], [60, 25], [60, 50], [60, 75]]

    res = check_trajectory_intersection(traj1, traj2, threshold_dist_px=10.0)
    assert res is not None
    assert res["intersects"] is True
    assert abs(res["intersection_point"][0] - 60.0) < 5.0
    assert abs(res["intersection_point"][1] - 50.0) < 5.0


def test_pedestrian_collision_risk():
    """Verify Scenario A (Pedestrian Collision Risk) is triggered when vehicle converges on person."""
    engine = CollisionRiskEngine()

    car = TrackedObject(
        id=1, label="car", confidence=0.95,
        bbox=[100.0, 100.0, 160.0, 130.0],
        center=[130.0, 115.0],
        velocity=[50.0, 0.0],
        speed_kmh=40.0,
        direction_deg=0.0,
        direction_arrow="→",
        trajectory_history=[[100.0, 115.0], [130.0, 115.0]],
        predicted_trajectory=[[160.0, 115.0], [190.0, 115.0], [220.0, 115.0]]
    )

    ped = TrackedObject(
        id=2, label="person", confidence=0.90,
        bbox=[210.0, 105.0, 230.0, 135.0],
        center=[220.0, 120.0],
        velocity=[0.0, 5.0],
        speed_kmh=4.0,
        direction_deg=90.0,
        direction_arrow="↓",
        trajectory_history=[[220.0, 115.0], [220.0, 120.0]],
        predicted_trajectory=[[220.0, 125.0], [220.0, 130.0]]
    )

    analysis = engine.analyze_frame(frame_idx=10, timestamp_sec=0.4, objects=[car, ped])
    
    assert analysis.total_objects == 2
    assert analysis.vehicle_count == 1
    assert analysis.pedestrian_count == 1
    # Risk should be elevated (HIGH or CRITICAL) due to close distance (90px) and high closing speed
    assert analysis.overall_risk_score > 50.0
    assert analysis.overall_risk_level in ["HIGH", "CRITICAL"]
    assert any(sc.scenario_type == "pedestrian_collision_risk" for sc in analysis.active_scenarios)
    assert "PEDESTRIAN" in analysis.recommended_action or "BRAKE" in analysis.recommended_action


def test_safe_traffic_low_risk():
    """Verify that vehicles maintaining safe distance have LOW risk."""
    engine = CollisionRiskEngine()

    car1 = TrackedObject(
        id=1, label="car", confidence=0.95,
        bbox=[100.0, 100.0, 160.0, 130.0],
        center=[130.0, 115.0],
        velocity=[40.0, 0.0],
        speed_kmh=40.0,
        direction_deg=0.0,
        direction_arrow="→"
    )

    car2 = TrackedObject(
        id=2, label="car", confidence=0.95,
        bbox=[450.0, 100.0, 510.0, 130.0],
        center=[480.0, 115.0],
        velocity=[40.0, 0.0],
        speed_kmh=40.0,
        direction_deg=0.0,
        direction_arrow="→"
    )

    analysis = engine.analyze_frame(frame_idx=10, timestamp_sec=0.4, objects=[car1, car2])
    assert analysis.overall_risk_score <= 30.0
    assert analysis.overall_risk_level == "LOW"


def test_rear_end_collision_scenario():
    """Verify Scenario B (Rear-End Collision Risk) when trailing car approaches lead car fast."""
    engine = CollisionRiskEngine()

    lead_car = TrackedObject(
        id=1, label="car", confidence=0.95,
        bbox=[300.0, 100.0, 360.0, 130.0],
        center=[330.0, 115.0],
        velocity=[15.0, 0.0],
        speed_kmh=15.0,
        direction_deg=0.0,
        direction_arrow="→"
    )

    trail_car = TrackedObject(
        id=2, label="car", confidence=0.95,
        bbox=[200.0, 100.0, 260.0, 130.0],
        center=[230.0, 115.0],
        velocity=[85.0, 0.0],  # high closing speed
        speed_kmh=85.0,
        direction_deg=0.0,
        direction_arrow="→"
    )

    analysis = engine.analyze_frame(frame_idx=20, timestamp_sec=0.8, objects=[lead_car, trail_car])
    assert analysis.overall_risk_score > 60.0
    assert any(sc.scenario_type == "rear_end_collision_risk" for sc in analysis.active_scenarios)
    assert analysis.min_ttc is not None and analysis.min_ttc < 3.0


def test_wrong_way_movement_scenario():
    """Verify Scenario E (Wrong-Way Movement) when two cars head directly towards each other."""
    engine = CollisionRiskEngine()

    car_east = TrackedObject(
        id=1, label="car", confidence=0.95,
        bbox=[100.0, 100.0, 160.0, 130.0],
        center=[130.0, 115.0],
        velocity=[60.0, 0.0],
        speed_kmh=60.0,
        direction_deg=0.0,
        direction_arrow="→"
    )

    car_west = TrackedObject(
        id=2, label="car", confidence=0.95,
        bbox=[300.0, 100.0, 360.0, 130.0],
        center=[330.0, 115.0],
        velocity=[-60.0, 0.0],  # Head-on
        speed_kmh=60.0,
        direction_deg=180.0,
        direction_arrow="←"
    )

    analysis = engine.analyze_frame(frame_idx=30, timestamp_sec=1.2, objects=[car_east, car_west])
    assert analysis.overall_risk_score >= 70.0
    assert any(sc.scenario_type == "wrong_way_movement" for sc in analysis.active_scenarios)
    assert "HEAD-ON" in analysis.recommended_action or "WRONG-WAY" in analysis.recommended_action

