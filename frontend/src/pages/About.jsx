import React from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  Clock, 
  AlertOctagon,
  Layers,
  HelpCircle,
  Eye
} from 'lucide-react';

export default function About({ setActiveTab }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
      
      {/* Hero Intro */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>COLLEGE AI/ML PROJECT EXPO 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
          SafeSight AI – Predict the Danger Before the Crash
        </h1>
        <p className="text-base text-slate-300 mt-2 leading-relaxed">
          A proactive, AI-powered predictive road-safety system that evaluates kinematic trajectory vectors in real time to generate early warnings before accidents happen.
        </p>
      </div>

      {/* 1. The Core Paradigm Shift */}
      <div className="rounded-3xl border border-cyan-500/20 bg-dark-850 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
        <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-5 h-5" />
          1. The Paradigm Shift: Reactive vs. Proactive Road Safety
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Traditional Reactive Systems */}
          <div className="p-5 rounded-2xl bg-dark-900 border border-red-500/30 flex flex-col gap-3">
            <span className="text-xs font-mono font-bold text-red-400 uppercase">
              Traditional Systems (Reactive)
            </span>
            <div className="flex items-center gap-2 text-sm font-mono text-slate-300">
              <span>Accident</span>
              <ArrowRight className="w-4 h-4 text-red-400" />
              <span>Detection</span>
              <ArrowRight className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-bold">Response</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Most existing ITS (Intelligent Transportation Systems) trigger alerts only after an impact or crash is detected. While useful for dispatching emergency services, it comes too late to protect human life.
            </p>
          </div>

          {/* SafeSight AI Proactive Paradigm */}
          <div className="p-5 rounded-2xl bg-dark-900 border border-emerald-500/40 flex flex-col gap-3 shadow-lg shadow-emerald-950/40">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
              SafeSight AI (Proactive)
            </span>
            <div className="flex items-center gap-2 text-sm font-mono text-emerald-300">
              <span>Potential Danger</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span>Risk Analysis</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Accident Prevention</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              SafeSight AI continuously assesses object closing speed, trajectory intersections, and Time-to-Collision (TTC) to warn drivers and roadside infrastructure 2 to 4 seconds before potential impact.
            </p>
          </div>

        </div>

        {/* Positioning Disclaimer */}
        <div className="p-4 rounded-xl bg-dark-900/60 border border-slate-700/60 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">System Positioning:</strong> SafeSight AI is designed as a <em>collision-risk prediction and early-warning advisory system</em> based on observable visual motion, distance, and trajectory extrapolation. It does not claim 100% infallible future prophecy, nor does it override mechanical vehicle controls.
        </div>
      </div>

      {/* 2. AI/ML Architecture Pipeline */}
      <div className="rounded-3xl border border-cyan-500/20 bg-dark-850 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
        <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-5 h-5" />
          2. End-to-End AI/ML Architecture
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { step: '1', title: 'Video Capture', desc: 'CCTV / Dashcam / Webcam 25 FPS stream' },
            { step: '2', title: 'YOLOv8 Detection', desc: 'Vehicles, pedestrians, bicycles, trucks' },
            { step: '3', title: 'Multi-Object Tracking', desc: 'Persistent IDs, Kalman & velocity vectors' },
            { step: '4', title: 'Trajectory Prediction', desc: 'Forward ray extrapolation (1.5s horizon)' },
            { step: '5', title: 'Relational Kinematics', desc: 'Relative closing speed & spatial CPA' },
            { step: '6', title: 'TTC Calculation', desc: 'TTC = Distance / Relative Closing Speed' },
            { step: '7', title: 'Scenario Classification', desc: 'Scenarios A through F detection' },
            { step: '8', title: 'Early Warning & Alerts', desc: 'HUD overlays, acoustic tone, TTS voice' },
          ].map((item) => (
            <div key={item.step} className="p-3 rounded-xl bg-dark-900 border border-slate-800 flex flex-col items-center">
              <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-mono text-xs font-bold flex items-center justify-center mb-2">
                {item.step}
              </span>
              <h4 className="text-xs font-bold text-white">{item.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. The 6 Danger Scenarios */}
      <div className="rounded-3xl border border-cyan-500/20 bg-dark-850 p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
        <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <AlertOctagon className="w-5 h-5" />
          3. Evaluated Danger Scenarios (A through F)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {[
            { tag: 'Scenario A', name: 'Pedestrian Collision Risk', desc: 'Vehicle and pedestrian heading on converging crosswalk trajectories with decreasing TTC.' },
            { tag: 'Scenario B', name: 'Rear-End Collision Risk', desc: 'Trailing vehicle approaching decelerating lead vehicle with unsafe closing speed margin.' },
            { tag: 'Scenario C', name: 'Vehicle-to-Vehicle Converging Risk', desc: 'Two vehicles approaching an intersection or merge zone on non-parallel crossing vectors.' },
            { tag: 'Scenario D', name: 'Unsafe Following Distance', desc: 'Vehicle remaining dangerously close behind lead vehicle (tailgating headway under 1.8s).' },
            { tag: 'Scenario E', name: 'Wrong-Way Movement', desc: 'Object driving against the dominant flow of traffic in the corridor (head-on collision hazard).' },
            { tag: 'Scenario F', name: 'Sudden Obstacle', desc: 'Vehicle closing fast on stationary stopped vehicle or obstacle in travel lane.' },
          ].map((sc) => (
            <div key={sc.tag} className="p-4 rounded-xl bg-dark-900 border border-slate-800 flex flex-col">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{sc.tag}</span>
              <h4 className="text-xs font-bold text-white mt-0.5">{sc.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{sc.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. The 3-Minute College Project Expo Demonstration Script */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-dark-850 via-dark-850 to-amber-950/20 p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-mono text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5" />
            4. The 3-Minute Project Expo Demonstration Script
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300">
            JUDGES WALKTHROUGH
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Follow this 9-step demonstration during your presentation to clearly showcase the project's technical innovation to examiners and judges:
        </p>

        <div className="space-y-3 mt-2">
          {[
            { step: 'Step 1', title: 'Open SafeSight AI', desc: 'Present the homepage and state the problem: Traditional systems react after collisions; SafeSight AI warns before impact.' },
            { step: 'Step 2', title: 'Select "Pedestrian Crosswalk" Scenario', desc: 'Click Scenario 1 from the scenario selector carousel to load the video and telemetry stream.' },
            { step: 'Step 3', title: 'Start Analysis', desc: 'Press Play and point out the real-time YOLOv8 bounding boxes and assigned object tracking IDs.' },
            { step: 'Step 4', title: 'Show Motion Vectors & Trajectories', desc: 'Draw judges\' attention to the directional arrows and dashed future trajectory projections.' },
            { step: 'Step 5', title: 'Watch Risk Score Climb', desc: 'Observe the gauge dynamically climb: 32 (LOW) → 48 (MODERATE) → 68 (HIGH) → 84 (CRITICAL).' },
            { step: 'Step 6', title: 'Point out Early Warning & TTC', desc: 'Show the flashing 🚨 CRITICAL COLLISION RISK banner, the acoustic radar alert, and TTC: ~2.1 seconds.' },
            { step: 'Step 7', title: 'Observe Risk Drop on Vehicle Yielding', desc: 'Show that when the car brakes and the pedestrian clears, the risk score drops back to LOW (18/100).' },
            { step: 'Step 8', title: 'Interact with Event Timeline', desc: 'Click any event in the chronological danger timeline to seek the video player to that exact moment.' },
            { step: 'Step 9', title: 'Open Analytics & Incident Report', desc: 'Review the Risk Score vs Time graph and download the official Markdown/PDF incident audit report.' },
          ].map((item) => (
            <div key={item.step} className="p-3 rounded-xl bg-dark-900/80 border border-slate-800 flex items-start gap-3">
              <span className="px-2 py-1 rounded bg-amber-950 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold whitespace-nowrap">
                {item.step}
              </span>
              <div>
                <strong className="text-xs font-bold text-white block">{item.title}</strong>
                <span className="text-xs text-slate-400">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white font-mono text-xs font-bold tracking-wider uppercase shadow-lg shadow-amber-950/80"
          >
            LAUNCH DEMO NOW →
          </button>
        </div>
      </div>

    </div>
  );
}
