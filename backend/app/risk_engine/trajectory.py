"""
SafeSight AI - Trajectory Extrapolation & Convergence Analysis
Computes closest point of approach (CPA) and collision intersection zones.
"""

import math
from typing import List, Tuple, Optional, Dict, Any


def compute_cpa_time_and_distance(
    p1: List[float], v1: List[float],
    p2: List[float], v2: List[float],
    max_time_horizon: float = 6.0
) -> Tuple[float, float, List[float]]:
    """
    Computes Closest Point of Approach (CPA) between two moving objects.
    
    Position: p(t) = p0 + v * t
    Relative position: r(t) = (p1 - p2) + (v1 - v2) * t = dp + dv * t
    Distance squared: D(t)^2 = |dp|^2 + 2*(dp . dv)*t + |dv|^2 * t^2
    Minimum occurs at: t_cpa = -(dp . dv) / |dv|^2
    
    Returns:
        (t_cpa, min_distance, collision_point_approx)
    """
    dp_x = p1[0] - p2[0]
    dp_y = p1[1] - p2[1]
    
    dv_x = v1[0] - v2[0]
    dv_y = v1[1] - v2[1]
    
    dv_sq = dv_x ** 2 + dv_y ** 2
    
    # If relative velocity is near zero, objects are moving in tandem or stationary
    if dv_sq < 1.0:
        current_dist = math.hypot(dp_x, dp_y)
        mid_point = [(p1[0] + p2[0]) / 2.0, (p1[1] + p2[1]) / 2.0]
        return 0.0, current_dist, mid_point

    # Time to closest point of approach
    t_cpa = -(dp_x * dv_x + dp_y * dv_y) / dv_sq

    # If t_cpa < 0, objects are diverging
    if t_cpa < 0:
        current_dist = math.hypot(dp_x, dp_y)
        mid_point = [(p1[0] + p2[0]) / 2.0, (p1[1] + p2[1]) / 2.0]
        return -1.0, current_dist, mid_point

    # Clamp to max horizon
    effective_t = min(t_cpa, max_time_horizon)

    # Minimum distance at t_cpa
    cpa_p1_x = p1[0] + v1[0] * effective_t
    cpa_p1_y = p1[1] + v1[1] * effective_t
    cpa_p2_x = p2[0] + v2[0] * effective_t
    cpa_p2_y = p2[1] + v2[1] * effective_t

    min_dist = math.hypot(cpa_p1_x - cpa_p2_x, cpa_p1_y - cpa_p2_y)
    
    # Collision zone center
    collision_center = [
        round((cpa_p1_x + cpa_p2_x) / 2.0, 1),
        round((cpa_p1_y + cpa_p2_y) / 2.0, 1)
    ]

    return round(effective_t, 2), round(min_dist, 1), collision_center


def segments_intersect(p1: List[float], p2: List[float], p3: List[float], p4: List[float]) -> Optional[List[float]]:
    """Compute 2D line segment intersection point if segments p1-p2 and p3-p4 intersect."""
    def ccw(A, B, C):
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

    # Check bounding box first
    if not (min(p1[0], p2[0]) <= max(p3[0], p4[0]) and min(p3[0], p4[0]) <= max(p1[0], p2[0]) and
            min(p1[1], p2[1]) <= max(p3[1], p4[1]) and min(p3[1], p4[1]) <= max(p1[1], p2[1])):
        return None

    # Line 1: A1*x + B1*y = C1
    A1 = p2[1] - p1[1]
    B1 = p1[0] - p2[0]
    C1 = A1 * p1[0] + B1 * p1[1]

    # Line 2: A2*x + B2*y = C2
    A2 = p4[1] - p3[1]
    B2 = p3[0] - p4[0]
    C2 = A2 * p3[0] + B2 * p3[1]

    det = A1 * B2 - A2 * B1
    if abs(det) < 1e-6:
        return None  # Parallel

    ix = (B2 * C1 - B1 * C2) / det
    iy = (A1 * C2 - A2 * C1) / det

    # Check if intersection point lies on both segments (with small epsilon)
    eps = 2.0
    on_seg1 = (min(p1[0], p2[0]) - eps <= ix <= max(p1[0], p2[0]) + eps and
               min(p1[1], p2[1]) - eps <= iy <= max(p1[1], p2[1]) + eps)
    on_seg2 = (min(p3[0], p4[0]) - eps <= ix <= max(p3[0], p4[0]) + eps and
               min(p3[1], p4[1]) - eps <= iy <= max(p3[1], p4[1]) + eps)

    if on_seg1 and on_seg2:
        return [round(ix, 1), round(iy, 1)]
    return None


def check_trajectory_intersection(
    traj1: List[List[float]],
    traj2: List[List[float]],
    threshold_dist_px: float = 45.0
) -> Optional[Dict[str, Any]]:
    """
    Check if two projected trajectories intersect spatially or reach dangerous proximity.
    
    Returns:
        Dict with 'intersects': bool, 'intersection_point': [x, y], 'step_index': int
    """
    if not traj1 or not traj2 or len(traj1) < 2 or len(traj2) < 2:
        return None

    # 1. Check time-synchronized step proximity
    min_steps = min(len(traj1), len(traj2))
    for step in range(min_steps):
        pt1 = traj1[step]
        pt2 = traj2[step]
        dist = math.hypot(pt1[0] - pt2[0], pt1[1] - pt2[1])
        if dist <= threshold_dist_px:
            mid_x = (pt1[0] + pt2[0]) / 2.0
            mid_y = (pt1[1] + pt2[1]) / 2.0
            return {
                "intersects": True,
                "intersection_point": [round(mid_x, 1), round(mid_y, 1)],
                "step_index": step,
                "distance": round(dist, 1)
            }

    # 2. Check spatial 2D geometric segment intersections
    for i in range(len(traj1) - 1):
        for j in range(len(traj2) - 1):
            ipt = segments_intersect(traj1[i], traj1[i + 1], traj2[j], traj2[j + 1])
            if ipt is not None:
                return {
                    "intersects": True,
                    "intersection_point": ipt,
                    "step_index": max(i, j),
                    "distance": 0.0
                }

    return None
