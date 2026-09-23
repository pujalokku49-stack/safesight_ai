# SafeSight AI – Predict the Danger Before the Crash

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00ffff.svg)](https://docs.ultralytics.com)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com)

> **Predict the danger. Prevent the crash.**  
> An AI-powered predictive road-safety platform that analyzes traffic video in real time and identifies potentially dangerous situations **before** a collision occurs.

---

## 1. Project Objective & Problem Statement

Most modern road-safety and Intelligent Transportation Systems (ITS) are **reactive**:
```
Traditional System:  Accident ──> Detection ──> Emergency Response (Too Late)
SafeSight AI:        Potential Danger ──> Risk Analysis ──> Early Warning ──> Accident Prevention
```

While post-crash detection aids emergency services, it does not prevent fatalities or injuries. **SafeSight AI** shifts road safety from reactive accident detection to **proactive collision-risk prediction**.

### System Positioning & Disclaimer
SafeSight AI is positioned as a **collision-risk prediction and early-warning advisory platform** based on observable object movement, distance, direction, and trajectory extrapolation. It provides critical early awareness for drivers and smart-city infrastructure. It does **not** claim infallible future prediction, nor does it take mechanical control of physical vehicle braking systems.

---

## 2. Key Features

- 🏎️ **Real-Time YOLOv8 Detection**: Detects cars, buses, trucks, motorcycles, pedestrians, and bicycles.
- 🎯 **Multi-Object Tracking & Kinematics**: Assigns persistent IDs across frames; calculates velocity vectors $(\Delta x / \Delta t, \Delta y / \Delta t)$, heading angles, and speed proxies.
- 📐 **Predictive Trajectory Extrapolation**: Computes 2D forward trajectory rays and detects spatial Closest Point of Approach (CPA) and collision intersection zones.
- ⏱️ **Time-to-Collision (TTC) Engine**: Implements dynamic relative closing velocity and distance ratios:
  $$\text{TTC} = \frac{\text{Distance}}{\text{Relative Closing Speed}}$$
- 📊 **Multi-Factor Risk Scoring (0–100)**:
  - `0 – 30`: **LOW** (Normal road conditions)
  - `31 – 50`: **MODERATE** (Heightened awareness required)
  - `51 – 70`: **HIGH** (Imminent collision trajectory – slow down)
  - `71 – 100`: **CRITICAL** (Severe threat – emergency braking advised)
- 🚨 **Multi-Sensory Early Warning System**:
  - Animated visual flashing warning banners
  - Web Audio API synthesized acoustic radar alerts (two-tone chirps and pulsing sirens)
  - Web Speech API Text-to-Speech (TTS) voice announcements
- 🕹️ **Dual Processing Pipeline**:
  - **LIVE AI ANALYSIS**: Real-time YOLOv8 inference + multi-object tracking.
  - **DEMO / SIMULATION MODE**: 5 built-in scenarios with verified kinematics for high-FPS presentations on any hardware.
- 🛣️ **Danger Scenario Taxonomy (Scenarios A through F)**:
  1. *Scenario A – Pedestrian Collision Risk*: Vehicle on converging path with crosswalk pedestrian.
  2. *Scenario B – Rear-End Collision Risk*: Rapidly closing trailing vehicle on lead vehicle.
  3. *Scenario C – Vehicle-to-Vehicle Converging Risk*: Orthogonal converging paths at intersection.
  4. *Scenario D – Unsafe Following Distance*: Dangerous headway gap ($< 1.8\text{s}$) maintained at speed.
  5. *Scenario E – Wrong-Way Movement*: Head-on collision hazard from vehicle driving against traffic.
  6. *Scenario F – Sudden Obstacle*: Rapid approach toward stationary stopped vehicle.
- 📈 **Real-Time Risk vs. Time Graph**: Recharts timeline demonstrating that danger peaks before the near-miss and drops upon braking.
- ⏱️ **Chronological Event Timeline**: Click any recorded hazard event to seek the video player to that exact timestamp.
- 📄 **Official Incident Report Generator**: Comprehensive post-inspection audit summary with printable PDF layout and downloadable Markdown export.
- 📹 **Flexible Input Modes**: Pre-bundled demo scenarios, custom MP4/AVI/MOV video upload, and live webcam feed.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Audio / TTS** | Web Audio API (Synthesizer), Web Speech API (Voice Warnings) |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, WebSockets |
| **AI / ML** | YOLOv8 (Ultralytics), PyTorch, OpenCV, NumPy, SciPy |
| **Data & Reports**| Pydantic v2, Markdown export, JSON telemetry |

---

## 4. System Architecture

```
                       Traffic Video / Live Webcam
                                   │
                                   ▼
                        Frame Extraction & Resizing
                                   │
                                   ▼
                      YOLOv8 Object Detection
                      (Cars, Pedestrians, Bikes)
                                   │
                                   ▼
                     Multi-Object Tracker (IDs)
                    [Velocity, Heading, History]
                                   │
                                   ▼
                    Predictive Trajectory Modeling
                    [Forward Rays, CPA, Intersect]
                                   │
                                   ▼
                        Collision-Risk Engine
               [TTC, Proximity, Scenarios A-F, Score]
                                   │
                                   ▼
        ┌──────────────────────────┴──────────────────────────┐
        ▼                                                     ▼
  Early Warning System                                 Risk Dashboard
(Acoustic Tone, TTS, Banner)                   (Score Gauge, TTC, Metrics)
        │                                                     │
        └──────────────────────────┬──────────────────────────┘
                                   │
                                   ▼
                      Analytics & Incident Report
                    (Timeline, Charts, Markdown/PDF)
```

---

## 5. Quick Start & Installation

### Prerequisites
- Python 3.10 or higher
- Node.js v18 or higher (v20+ recommended)
- npm / npx

### Step 1: Clone or Navigate to Project Directory
```powershell
cd C:\Users\pujal\.gemini\antigravity\scratch\safesight-ai
```

### Step 2: Set Up Backend
```powershell
cd backend
python -m pip install -r requirements.txt
```

Generate the 5 demo traffic videos:
```powershell
python app/demo/generator.py
```

Run backend unit tests:
```powershell
python -m pytest tests -v
```

Start the FastAPI backend server:
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API docs available at: `http://localhost:8000/docs`*

### Step 3: Set Up Frontend
In a new terminal window:
```powershell
cd ../frontend
npm install
npm run dev
```
*Open your browser at: `http://localhost:5173`*

---

## 6. College Project Expo: 3-Minute Demonstration Script

Follow this step-by-step walkthrough during your presentation:

1. **Open SafeSight AI**: Highlight the tagline: *"Predict the danger before the crash."* Explain the problem statement: Traditional systems only react after damage is done.
2. **Select Scenario 1 ("Pedestrian Crosswalk Interaction")**: Click Scenario 1 on the top carousel.
3. **Start Live Analysis**: Press Play. Point out:
   - YOLOv8 bounding boxes
   - Assigned object IDs (`CAR #1`, `PERSON #2`)
   - Velocity direction arrows pointing along movement vectors
   - Dashed projected trajectory lines extending forward
4. **Observe Trajectory Convergence**: Notice that the car's forward ray crosses the pedestrian's path. The system highlights the **POTENTIAL COLLISION ZONE**.
5. **Watch the Risk Score Climb**: Show how the gauge climbs: `32` (LOW) $\rightarrow$ `48` (MODERATE) $\rightarrow$ `76` (HIGH) $\rightarrow$ `84` (CRITICAL).
6. **Trigger Early Warnings**:
   - The red **CRITICAL COLLISION RISK** banner pulses.
   - An acoustic radar warning sound plays.
   - The Text-to-Speech voice announces: *"Critical collision risk detected. Brake immediately."*
   - Calculated TTC displays: **2.1 seconds**.
7. **Observe Hazard De-escalation**: As the vehicle yields and the pedestrian safely finishes crossing, the risk score immediately drops back to **18 / 100 (LOW)**.
8. **Test the Event Timeline**: Click any event in the chronological timeline to seek the video player to that exact frame.
9. **Open Analytics & Incident Report**:
   - Navigate to **Analytics** to show the Risk Score Over Time graph and Scenario Distributions.
   - Navigate to **Incident Report** to review the audit summary, test **Export .MD**, and view the print/PDF preview.

---

## 7. Mathematical Collision Risk Formulation

### Relative Closing Speed
Given two objects $A$ and $B$ with positions $\vec{p}_A, \vec{p}_B$ and velocities $\vec{v}_A, \vec{v}_B$:
$$d_{AB} = \|\vec{p}_A - \vec{p}_B\|$$
$$v_{rel} = \frac{(\vec{p}_A - \vec{p}_B) \cdot (\vec{v}_B - \vec{v}_A)}{d_{AB}}$$
*(A positive $v_{rel}$ indicates that the distance between the objects is shrinking.)*

### Time-to-Collision (TTC)
$$\text{TTC} = \begin{cases} \frac{d_{AB}}{v_{rel}} & \text{if } v_{rel} > v_{min} \\ \infty & \text{otherwise} \end{cases}$$

### Multi-Factor Compound Risk Score ($0 - 100$)
$$\text{Score} = w_{TTC} \cdot S_{TTC} + w_{dist} \cdot S_{dist} + w_{traj} \cdot S_{traj} + w_{scen} \cdot S_{scen}$$
Where weights are calibrated to: $w_{TTC} = 0.40$, $w_{dist} = 0.25$, $w_{traj} = 0.20$, $w_{scen} = 0.15$.

---

## 8. Limitations & Future Scope

### Current Limitations
- **Camera Calibration**: Distances in monocular video are estimated via pixel scale proxies; true metric depth requires stereo cameras, LiDAR, or camera calibration matrices.
- **Weather & Occlusion**: Severe rain, fog, or night-time conditions can degrade visual bounding box accuracy.

### Future Scope
- **V2X (Vehicle-to-Everything) Communication**: Broadcasting collision warnings directly to connected roadside infrastructure and neighboring vehicles.
- **LiDAR & Radar Sensor Fusion**: Integrating depth point clouds with camera streams using extended Kalman filters.
- **ADAS Vehicle CAN-Bus Integration**: Interfacing with Automotive Ethernet / CAN-bus to trigger automated emergency braking (AEB) systems.

---

## 9. License
MIT License. Built for education, safety research, and academic exhibition.
