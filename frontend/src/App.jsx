import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import VideoAnalysis from './pages/VideoAnalysis';
import RiskEvents from './pages/RiskEvents';
import Analytics from './pages/Analytics';
import IncidentReport from './pages/IncidentReport';
import About from './pages/About';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedVideoForReport, setSelectedVideoForReport] = useState('pedestrian_crossing');
  const [activeVideoId, setActiveVideoId] = useState(null);

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top HUD Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main App Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedVideoForReport={setSelectedVideoForReport}
            activeVideoId={activeVideoId}
            setActiveVideoId={setActiveVideoId}
          />
        )}
        {activeTab === 'video_analysis' && (
          <VideoAnalysis 
            setActiveTab={setActiveTab} 
            setSelectedVideoForReport={setSelectedVideoForReport}
            activeVideoId={activeVideoId}
            setActiveVideoId={setActiveVideoId}
          />
        )}
        {activeTab === 'risk_events' && (
          <RiskEvents 
            setActiveTab={setActiveTab} 
          />
        )}
        {activeTab === 'analytics' && (
          <Analytics />
        )}
        {activeTab === 'incident_report' && (
          <IncidentReport 
            selectedVideoId={selectedVideoForReport} 
          />
        )}
        {activeTab === 'about' && (
          <About 
            setActiveTab={setActiveTab} 
          />
        )}
      </main>

      {/* Futuristic HUD Footer */}
      <footer className="border-t border-slate-800/80 bg-dark-950 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-slate-400 font-semibold">SafeSight AI</span>
            <span>– Predictive Road Safety & Early Collision-Risk Warning Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>YOLOv8 Object Detection</span>
            <span>•</span>
            <span>Time-to-Collision Kinematics</span>
            <span>•</span>
            <span>College AI/ML Expo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
