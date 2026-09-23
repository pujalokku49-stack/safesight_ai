"""
SafeSight AI - Pydantic Data Models
"""

from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field


class TrackedObject(BaseModel):
    id: int
    label: str
    confidence: float
    bbox: List[float] = Field(..., description="[x1, y1, x2, y2] bounding box")
    center: List[float] = Field(..., description="[cx, cy] center point")
    velocity: List[float] = Field(default_factory=lambda: [0.0, 0.0], description="[vx, vy] in px/sec")
    speed_kmh: float = Field(default=0.0, description="Estimated speed proxy in km/h")
    direction_deg: float = Field(default=0.0, description="Angle in degrees (0 = East, 90 = South, 180 = West, 270 = North)")
    direction_arrow: str = Field(default="→", description="Arrow representation")
    trajectory_history: List[List[float]] = Field(default_factory=list, description="Past (x, y) coordinates")
    predicted_trajectory: List[List[float]] = Field(default_factory=list, description="Future projected (x, y) coordinates")
    risk_level: str = Field(default="LOW")
    risk_score: float = Field(default=0.0)


class DangerScenario(BaseModel):
    scenario_type: str = Field(..., description="e.g. pedestrian_collision_risk, rear_end_risk")
    scenario_name: str = Field(..., description="Human readable name")
    severity: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    risk_score: float = Field(default=0.0)
    description: str
    involved_objects: List[int]
    ttc_seconds: Optional[float] = None
    distance_px: Optional[float] = None
    relative_speed_px: Optional[float] = None
    recommended_action: str
    collision_zone: Optional[List[float]] = Field(default=None, description="[center_x, center_y, radius]")


class FrameAnalysis(BaseModel):
    frame_index: int
    timestamp_sec: float
    timestamp_formatted: str
    overall_risk_score: float
    overall_risk_level: str
    active_scenarios: List[DangerScenario] = Field(default_factory=list)
    objects: List[TrackedObject] = Field(default_factory=list)
    primary_warning: Optional[str] = None
    recommended_action: Optional[str] = None
    min_ttc: Optional[float] = None
    closest_distance_px: Optional[float] = None
    relative_speed_kmh: Optional[float] = None
    vehicle_count: int = 0
    pedestrian_count: int = 0
    total_objects: int = 0
    collision_zone: Optional[List[float]] = None
    video_width: int = 854
    video_height: int = 480


class RiskEvent(BaseModel):
    event_id: str
    timestamp_sec: float
    timestamp_str: str
    frame_index: int
    scenario_type: str
    scenario_name: str
    risk_score: float
    risk_level: str
    description: str
    involved_objects: List[int]
    ttc_seconds: Optional[float] = None
    recommended_action: str


class IncidentReport(BaseModel):
    video_name: str
    analysis_duration_sec: float
    total_frames_analyzed: int
    total_unique_objects: int
    vehicle_count: int
    pedestrian_count: int
    max_risk_score: float
    avg_risk_score: float
    total_risky_events: int
    critical_events_count: int
    high_risk_events_count: int
    most_dangerous_timestamp_sec: float
    most_dangerous_timestamp_str: str
    primary_scenario_detected: str
    min_ttc_recorded_sec: Optional[float] = None
    recommended_safety_action: str
    events: List[RiskEvent] = Field(default_factory=list)
    risk_timeline: List[Dict[str, Any]] = Field(default_factory=list)
    scenario_distribution: Dict[str, int] = Field(default_factory=dict)
    risk_level_distribution: Dict[str, int] = Field(default_factory=dict)
    object_type_distribution: Dict[str, int] = Field(default_factory=dict)


class DemoScenarioInfo(BaseModel):
    id: str
    name: str
    tag: str
    description: str
    key_danger: str
    expected_peak_risk: float
    expected_scenario: str
    video_url: str
