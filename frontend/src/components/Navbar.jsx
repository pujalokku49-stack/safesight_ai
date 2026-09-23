import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Video, 
  AlertTriangle, 
  BarChart3, 
  FileText, 
  Info, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff,
  Cpu
} from 'lucide-react';
import { soundService } from '../services/soundService';

export default function Navbar({ activeTab, setActiveTab, liveStatus }) {
  const [soundOn, setSoundOn] = useState(soundService.soundEnabled);
  const [ttsOn, setTtsOn] = useState(soundService.ttsEnabled);

  const toggleSound = () => {
    const newState = soundService.toggleSound();
    setSoundOn(newState);
  };

  const toggleTts = () => {
    const newState = soundService.toggleTts();
    setTtsOn(newState);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'video_analysis', label: 'Video Analysis', icon: Video },
    { id: 'risk_events', label: 'Risk Events', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'incident_report', label: 'Incident Report', icon: FileText },
    { id: 'about', label: 'About & Expo', icon: Info },
  ];

  return (
    <header className="border-b border-cyan-500/20 bg-dark-850/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-dark-900 rounded-full animate-pulse"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  SafeSight<span className="text-cyan-400 font-extrabold">.AI</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold tracking-wider">
                  PREDICTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Predict the Danger Before the Crash
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools: Sound, Voice & AI Engine Status */}
          <div className="flex items-center gap-3">
            
            {/* Audio Synth Toggle */}
            <button
              onClick={toggleSound}
              title={soundOn ? "Mute Acoustic Radar Beeps" : "Enable Acoustic Radar Beeps"}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                soundOn
                  ? 'bg-dark-800 border-cyan-500/30 text-cyan-300 hover:bg-dark-700'
                  : 'bg-dark-800 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline text-[11px]">Audio</span>
            </button>

            {/* Voice TTS Toggle */}
            <button
              onClick={toggleTts}
              title={ttsOn ? "Mute Voice Warning Announcements" : "Enable Voice Warnings"}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                ttsOn
                  ? 'bg-dark-800 border-cyan-500/30 text-cyan-300 hover:bg-dark-700'
                  : 'bg-dark-800 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {ttsOn ? <Mic className="w-4 h-4 text-cyan-400" /> : <MicOff className="w-4 h-4" />}
              <span className="hidden lg:inline text-[11px]">Voice</span>
            </button>

            {/* Engine Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-slate-700/80">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[11px] font-mono text-slate-200 font-medium leading-none">
                    YOLOv8 + KINEMATICS
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 bg-dark-900 border-t border-slate-800 gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded text-xs ${
              activeTab === item.id
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
