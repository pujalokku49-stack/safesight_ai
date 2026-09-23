"""
SafeSight AI - Incident Report & Timeline Event Generator
Compiles analyzed frames into timeline events, aggregate statistics,
and downloadable incident reports.
"""

from typing import List, Dict, Any, Optional
import uuid

from app.models.schemas import FrameAnalysis, RiskEvent, IncidentReport


def build_event_timeline(frames: List[FrameAnalysis]) -> List[RiskEvent]:
    """
    Extracts high-value safety transition events from continuous frame analysis.
    e.g.:
    - Vehicle approaching pedestrian
    - TTC decreased to 2.1s
    - HIGH / CRITICAL collision risk detected
    - Objects separated / Risk returned to LOW
    """
    events: List[RiskEvent] = []
    prev_level = "LOW"
    prev_scenario = None
    min_ttc_logged = False

    for fa in frames:
        curr_level = fa.overall_risk_level
        curr_scenario = fa.active_scenarios[0].scenario_name if fa.active_scenarios else None

        # Level transition up (e.g. LOW -> MODERATE/HIGH/CRITICAL)
        if curr_level in ["HIGH", "CRITICAL"] and prev_level not in ["HIGH", "CRITICAL"]:
            ev_desc = f"{curr_level} collision risk detected ({fa.primary_warning or 'Potential collision'})"
            events.append(RiskEvent(
                event_id=str(uuid.uuid4())[:8],
                timestamp_sec=fa.timestamp_sec,
                timestamp_str=fa.timestamp_formatted,
                frame_index=fa.frame_index,
                scenario_type=fa.active_scenarios[0].scenario_type if fa.active_scenarios else "general_risk",
                scenario_name=fa.active_scenarios[0].scenario_name if fa.active_scenarios else "Collision Risk",
                risk_score=fa.overall_risk_score,
                risk_level=curr_level,
                description=ev_desc,
                involved_objects=fa.active_scenarios[0].involved_objects if fa.active_scenarios else [],
                ttc_seconds=fa.min_ttc,
                recommended_action=fa.recommended_action or "SLOW DOWN"
            ))

        # TTC alert when TTC drops below 2.5s
        elif fa.min_ttc is not None and fa.min_ttc <= 2.5 and not min_ttc_logged:
            events.append(RiskEvent(
                event_id=str(uuid.uuid4())[:8],
                timestamp_sec=fa.timestamp_sec,
                timestamp_str=fa.timestamp_formatted,
                frame_index=fa.frame_index,
                scenario_type="critical_ttc",
                scenario_name="Low Time-to-Collision",
                risk_score=fa.overall_risk_score,
                risk_level=curr_level,
                description=f"Time-to-Collision (TTC) decreased to critical threshold: {fa.min_ttc:.1f} seconds",
                involved_objects=fa.active_scenarios[0].involved_objects if fa.active_scenarios else [],
                ttc_seconds=fa.min_ttc,
                recommended_action=fa.recommended_action or "IMMEDIATE BRAKE"
            ))
            min_ttc_logged = True

        # Recovery transition (HIGH/CRITICAL -> LOW)
        elif prev_level in ["HIGH", "CRITICAL"] and curr_level == "LOW":
            events.append(RiskEvent(
                event_id=str(uuid.uuid4())[:8],
                timestamp_sec=fa.timestamp_sec,
                timestamp_str=fa.timestamp_formatted,
                frame_index=fa.frame_index,
                scenario_type="risk_cleared",
                scenario_name="Hazard Cleared",
                risk_score=fa.overall_risk_score,
                risk_level="LOW",
                description="Objects safely separated. Trajectories diverged, risk returned to LOW.",
                involved_objects=[],
                ttc_seconds=None,
                recommended_action="NORMAL DRIVING CONDITIONS"
            ))
            min_ttc_logged = False

        prev_level = curr_level
        prev_scenario = curr_scenario

    return events


def compile_incident_report(video_name: str, frames: List[FrameAnalysis]) -> IncidentReport:
    """
    Compiles full session frames into a comprehensive IncidentReport.
    """
    if not frames:
        return IncidentReport(
            video_name=video_name,
            analysis_duration_sec=0.0,
            total_frames_analyzed=0,
            total_unique_objects=0,
            vehicle_count=0,
            pedestrian_count=0,
            max_risk_score=0.0,
            avg_risk_score=0.0,
            total_risky_events=0,
            critical_events_count=0,
            high_risk_events_count=0,
            most_dangerous_timestamp_sec=0.0,
            most_dangerous_timestamp_str="00:00.00",
            primary_scenario_detected="None",
            min_ttc_recorded_sec=None,
            recommended_safety_action="N/A",
            events=[],
            risk_timeline=[],
            scenario_distribution={},
            risk_level_distribution={},
            object_type_distribution={}
        )

    duration = frames[-1].timestamp_sec
    total_frames = len(frames)
    
    unique_objects = set()
    max_risk = 0.0
    risk_sum = 0.0
    most_dangerous_frame = frames[0]
    min_ttc = None
    
    scenario_counts: Dict[str, int] = {}
    level_counts: Dict[str, int] = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}
    obj_type_counts: Dict[str, int] = {"Vehicles": 0, "Pedestrians": 0, "Bicycles": 0, "Others": 0}

    timeline_points = []
    # Sample timeline points to prevent massive arrays (e.g. 1 point per 2-5 frames)
    step = max(1, total_frames // 60)

    for i, f in enumerate(frames):
        risk_sum += f.overall_risk_score
        level_counts[f.overall_risk_level] = level_counts.get(f.overall_risk_level, 0) + 1

        if f.overall_risk_score > max_risk:
            max_risk = f.overall_risk_score
            most_dangerous_frame = f

        if f.min_ttc is not None:
            if min_ttc is None or f.min_ttc < min_ttc:
                min_ttc = f.min_ttc

        for obj in f.objects:
            unique_objects.add(obj.id)
            if obj.label in ["car", "bus", "truck", "motorcycle"]:
                obj_type_counts["Vehicles"] += 1
            elif obj.label == "person":
                obj_type_counts["Pedestrians"] += 1
            elif obj.label == "bicycle":
                obj_type_counts["Bicycles"] += 1
            else:
                obj_type_counts["Others"] += 1

        for sc in f.active_scenarios:
            scenario_counts[sc.scenario_name] = scenario_counts.get(sc.scenario_name, 0) + 1

        if i % step == 0 or i == total_frames - 1:
            timeline_points.append({
                "time": f.timestamp_sec,
                "time_str": f.timestamp_formatted,
                "risk": f.overall_risk_score,
                "level": f.overall_risk_level,
                "ttc": f.min_ttc
            })

    avg_risk = round(risk_sum / total_frames, 1)
    events = build_event_timeline(frames)
    critical_count = sum(1 for e in events if e.risk_level == "CRITICAL")
    high_count = sum(1 for e in events if e.risk_level == "HIGH")

    # Primary scenario
    primary_scenario = "Normal Traffic"
    if scenario_counts:
        primary_scenario = max(scenario_counts.items(), key=lambda x: x[1])[0]

    return IncidentReport(
        video_name=video_name,
        analysis_duration_sec=round(duration, 2),
        total_frames_analyzed=total_frames,
        total_unique_objects=len(unique_objects),
        vehicle_count=max(f.vehicle_count for f in frames),
        pedestrian_count=max(f.pedestrian_count for f in frames),
        max_risk_score=round(max_risk, 1),
        avg_risk_score=avg_risk,
        total_risky_events=len(events),
        critical_events_count=critical_count,
        high_risk_events_count=high_count,
        most_dangerous_timestamp_sec=most_dangerous_frame.timestamp_sec,
        most_dangerous_timestamp_str=most_dangerous_frame.timestamp_formatted,
        primary_scenario_detected=primary_scenario,
        min_ttc_recorded_sec=round(min_ttc, 2) if min_ttc else None,
        recommended_safety_action=most_dangerous_frame.recommended_action or "NORMAL MONITORING",
        events=events,
        risk_timeline=timeline_points,
        scenario_distribution=scenario_counts,
        risk_level_distribution=level_counts,
        object_type_distribution=obj_type_counts
    )


def generate_markdown_report(report: IncidentReport) -> str:
    """Generates a formatted Markdown report ready for download."""
    md = f"""# SafeSight AI – Incident Safety & Risk Analysis Report

**System:** SafeSight AI – Collision-Risk Prediction & Early Warning Engine  
**Video Source:** {report.video_name}  
**Analysis Duration:** {report.analysis_duration_sec}s ({report.total_frames_analyzed} frames)  
**Date of Analysis:** Automated SafeSight AI Inspection Run  

---

## Executive Summary

* **Maximum Risk Score:** **{report.max_risk_score} / 100** (Peak Threat)
* **Average Risk Score:** **{report.avg_risk_score} / 100**
* **Primary Detected Scenario:** **{report.primary_scenario_detected}**
* **Minimum Time-to-Collision (TTC):** **{f'{report.min_ttc_recorded_sec:.1f}s' if report.min_ttc_recorded_sec else 'N/A'}**
* **Most Dangerous Timestamp:** **{report.most_dangerous_timestamp_str}** ({report.most_dangerous_timestamp_sec}s)
* **Recommended Action:** **{report.recommended_safety_action}**

---

## Incident Statistics

| Metric | Recorded Value |
| :--- | :--- |
| Total Unique Objects Detected | {report.total_unique_objects} |
| Peak Vehicles in Frame | {report.vehicle_count} |
| Peak Pedestrians in Frame | {report.pedestrian_count} |
| Total Hazardous Events | {report.total_risky_events} |
| Critical Events (Risk > 70) | {report.critical_events_count} |
| High Risk Events (Risk 51-70) | {report.high_risk_events_count} |

---

## Timeline of Detected Risk Events

"""
    if not report.events:
        md += "*No high-risk collision events detected during this video duration. Traffic maintained safe operating margins.*\n"
    else:
        for ev in report.events:
            md += f"- **[{ev.timestamp_str}]** `{ev.risk_level}`: {ev.description} (Risk: {ev.risk_score}/100, Action: *{ev.recommended_action}*)\n"

    md += """
---

## Technical Methodology & System Positioning

SafeSight AI shifts road safety from reactive accident detection to **proactive collision-risk prediction**. Using kinematic tracking, relative closing velocity vectors, trajectory extrapolation, and Time-to-Collision (TTC) calculations, the system alerts drivers and traffic management systems before impact occurs.

> **Disclaimer:** SafeSight AI provides predictive risk advisories based on visual trajectory modeling and does not take direct control of physical vehicle braking systems.
"""
    return md
