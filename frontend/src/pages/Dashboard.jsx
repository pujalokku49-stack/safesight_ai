import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Play, 
  Sparkles, 
  Car, 
  Users, 
  Crosshair, 
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Upload,
  Video,
  Layers,
  Film,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import RiskDashboard from '../components/RiskDashboard';
import EarlyWarningBanner from '../components/EarlyWarningBanner';
import RiskChart from '../components/RiskChart';
import EventTimeline from '../components/EventTimeline';
import { getScenarios, getScenarioTelemetry, getVideos, uploadVideo } from '../services/api';

export default function Dashboard({ 
  setActiveTab, 
  setSelectedVideoForReport, 
  activeVideoId, 
  setActiveVideoId 
}) {
  const [scenarios, setScenarios] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [sourceTab, setSourceTab] = useState('predefined'); // 'predefined' or 'uploaded'
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [currentFrameAnalysis, setCurrentFrameAnalysis] = useState(null);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [mode, setMode] = useState('ai'); // 'ai' or 'demo'

  const fileInputRef = useRef(null);

  const mapUploadToScenario = (v) => ({
    id: v.id,
    name: v.filename,
    tag: 'Custom Traffic Video',
    category: 'Live AI Analysis',
    description: `User-defined traffic video (${v.metadata?.width || 'HD'}x${v.metadata?.height || ''} @ ${v.metadata?.fps || 25}fps, ${v.metadata?.duration_sec || 10}s)`,
    key_danger: 'Real-world multi-object road interaction & predictive collision assessment',
    expected_peak_risk: 'Dynamic',
    video_filename: v.filename,
    video_url: v.url,
    metadata: v.metadata
  });

  // Load scenarios & uploaded videos on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [scData, vidData] = await Promise.all([
          getScenarios(),
          getVideos().catch(() => [])
        ]);
        
        setScenarios(scData || []);
        const uploads = (vidData || []).filter((v) => v.type === 'upload');
        setUploadedVideos(uploads);

        // Check if activeVideoId was requested
        if (activeVideoId) {
          const matchUpload = uploads.find((u) => u.id === activeVideoId || u.filename === activeVideoId);
          if (matchUpload) {
            setSourceTab('uploaded');
            await handleSelectScenario(mapUploadToScenario(matchUpload));
            return;
          }
          const matchSc = (scData || []).find((s) => s.id === activeVideoId);
          if (matchSc) {
            setSourceTab('predefined');
            await handleSelectScenario(matchSc);
            return;
          }
        }

        // Default to first predefined scenario
        if (scData && scData.length > 0) {
          await handleSelectScenario(scData[0]);
        }
      } catch (e) {
        console.error('Failed to load scenarios or videos', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeVideoId]);

  const handleSelectScenario = async (sc) => {
    setSelectedScenario(sc);
    if (setSelectedVideoForReport) {
      setSelectedVideoForReport(sc.id);
    }
    if (setActiveVideoId) {
      setActiveVideoId(sc.id);
    }
    setIsAnalyzing(true);
    try {
      const telem = await getScenarioTelemetry(sc.id);
      setTelemetry(telem || []);
      if (telem && telem.length > 0) {
        setCurrentFrameAnalysis(telem[0]);
        setCurrentFrameIdx(0);
      } else {
        setCurrentFrameAnalysis(null);
      }
    } catch (e) {
      console.error('Failed to fetch telemetry for scenario', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDirectUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Immediately show the video on the player from local blob
    const localUrl = URL.createObjectURL(file);
    const previewScenario = {
      id: '__uploading__',
      name: file.name,
      tag: 'Custom Traffic Video',
      category: 'Uploading...',
      description: 'Uploading and running YOLOv8 AI inference pipeline...',
      key_danger: 'Processing...',
      expected_peak_risk: 'Pending',
      video_filename: file.name,
      video_url: localUrl,
    };
    setSelectedScenario(previewScenario);
    setSourceTab('uploaded');

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadVideo(file);
      const vids = await getVideos();
      const uploads = (vids || []).filter((v) => v.type === 'upload');
      setUploadedVideos(uploads);

      // Use the server-provided ID (already correctly formatted with replaceAll)
      const targetId = res.id || res.filename.replaceAll('.', '_');
      const newScenario = {
        id: targetId,
        name: res.filename,
        tag: 'Custom Traffic Video',
        category: 'Live AI Analysis',
        description: `User-defined traffic video (${res.metadata?.width || 'HD'}x${res.metadata?.height || ''} @ ${res.metadata?.fps || 25}fps)`,
        key_danger: 'Real-world multi-object road interaction & predictive collision assessment',
        expected_peak_risk: 'Dynamic',
        video_filename: res.filename,
        video_url: res.url,
        metadata: res.metadata
      };

      await handleSelectScenario(newScenario);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFrameUpdate = (analysis, fIdx) => {
    setCurrentFrameAnalysis(analysis);
    setCurrentFrameIdx(fIdx);
  };

  const handleSeek = (fIdx) => {
    setCurrentFrameIdx(fIdx);
  };

  // Compile timeline events from telemetry
  const timelineEvents = React.useMemo(() => {
    if (!telemetry) return [];
    const events = [];
    let prevLevel = 'LOW';
    let minTtcFound = false;

    telemetry.forEach((f) => {
      const level = f.overall_risk_level;
      if (level === 'CRITICAL' && prevLevel !== 'CRITICAL') {
        events.push({
          event_id: `ev-${f.frame_index}`,
          timestamp_str: f.timestamp_formatted,
          frame_index: f.frame_index,
          risk_level: 'CRITICAL',
          description: f.primary_warning || 'CRITICAL collision threat detected',
          ttc_seconds: f.min_ttc,
          recommended_action: f.recommended_action || 'EMERGENCY BRAKE'
        });
      } else if (level === 'HIGH' && prevLevel === 'LOW') {
        events.push({
          event_id: `ev-${f.frame_index}`,
          timestamp_str: f.timestamp_formatted,
          frame_index: f.frame_index,
          risk_level: 'HIGH',
          description: f.primary_warning || 'High collision risk detected',
          ttc_seconds: f.min_ttc,
          recommended_action: f.recommended_action || 'SLOW DOWN'
        });
      } else if (f.min_ttc && f.min_ttc <= 2.2 && !minTtcFound) {
        events.push({
          event_id: `ev-ttc-${f.frame_index}`,
          timestamp_str: f.timestamp_formatted,
          frame_index: f.frame_index,
          risk_level: 'CRITICAL',
          description: `TTC decreased to dangerous threshold: ${f.min_ttc}s`,
          ttc_seconds: f.min_ttc,
          recommended_action: 'APPLY MAXIMUM BRAKING'
        });
        minTtcFound = true;
      } else if (prevLevel === 'CRITICAL' && level === 'LOW') {
        events.push({
          event_id: `ev-clr-${f.frame_index}`,
          timestamp_str: f.timestamp_formatted,
          frame_index: f.frame_index,
          risk_level: 'LOW',
          description: 'Objects safely separated. Risk returned to LOW.',
          ttc_seconds: null,
          recommended_action: 'NORMAL DRIVING CONDITIONS'
        });
        minTtcFound = false;
      }
      prevLevel = level;
    });
    return events;
  }, [telemetry]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-dark-850 via-dark-800 to-dark-900 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>COLLEGE AI/ML PROJECT EXPO 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            SafeSight AI
            <span className="block text-xl sm:text-3xl font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent mt-1">
              Predict the danger. Prevent the crash.
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            An AI-powered predictive road-safety platform that analyzes traffic video in real time. 
            Test with our <strong>5 pre-configured demonstration scenarios</strong> or 
            <strong> upload your own custom dashcam / CCTV traffic video</strong> to predict collision risks before impact occurs.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI IS ANALYZING YOUR VIDEO...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>UPLOAD YOUR TRAFFIC VIDEO</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveTab('video_analysis')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs tracking-wider uppercase shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all"
            >
              <span>INSPECTION & WEBCAM FEED</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 font-mono text-xs border border-slate-700 flex items-center gap-2 transition-all"
            >
              <span>EXPO GUIDE & METHODOLOGY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Direct Dashboard Upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/mp4,video/avi,video/quicktime,video/mkv"
        onChange={handleDirectUpload}
      />

      {uploadError && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center gap-3 text-red-300 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>Upload Error: {uploadError}</span>
        </div>
      )}

      {/* Video Source Navigation Header: Predefined vs Uploaded */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                SELECT VIDEO FOOTAGE FOR LIVE RISK ASSESSMENT
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose a pre-configured scenario or any custom user-uploaded traffic recording
              </p>
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex p-1 rounded-xl bg-dark-850 border border-slate-700">
              <button
                onClick={() => setSourceTab('predefined')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  sourceTab === 'predefined'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>PREDEFINED SCENARIOS ({scenarios.length})</span>
              </button>

              <button
                onClick={() => setSourceTab('uploaded')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  sourceTab === 'uploaded'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>MY UPLOADED VIDEOS ({uploadedVideos.length})</span>
              </button>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Upload custom traffic video"
              className="px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-emerald-500/40 transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ UPLOAD</span>
            </button>
          </div>
        </div>

        {/* Tab Content 1: Predefined Scenarios */}
        {sourceTab === 'predefined' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {scenarios.map((sc) => {
              const isSelected = selectedScenario?.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-400/80 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400/50'
                      : 'bg-dark-850/80 border-slate-800 hover:border-slate-700 hover:bg-dark-850'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                    {sc.category}
                  </span>
                  <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1">
                    {sc.tag}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {sc.key_danger}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
                    <span>Peak: <strong className="text-amber-300">{sc.expected_peak_risk}</strong></span>
                    <span className="text-cyan-400 font-semibold">{isSelected ? 'ACTIVE' : 'SELECT'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab Content 2: User Uploaded Custom Videos */}
        {sourceTab === 'uploaded' && (
          <div>
            {uploadedVideos.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-700 bg-dark-850/50 flex flex-col items-center justify-center text-center">
                <Film className="w-10 h-10 text-slate-500 mb-2" />
                <h4 className="text-sm font-bold text-white">No Custom Videos Uploaded Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Upload your own dashcam, junction, or roadway traffic clips to run real-time YOLOv8 object detection and collision warning.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>UPLOAD YOUR FIRST VIDEO</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {uploadedVideos.map((v) => {
                  const isSelected = selectedScenario?.id === v.id || selectedScenario?.video_filename === v.filename;
                  const resText = v.metadata?.width ? `${v.metadata.width}x${v.metadata.height}` : 'HD Video';
                  const fpsText = v.metadata?.fps ? `${v.metadata.fps} FPS` : '25 FPS';
                  const durText = v.metadata?.duration_sec ? `${v.metadata.duration_sec}s` : '10s';

                  return (
                    <button
                      key={v.id}
                      onClick={() => handleSelectScenario(mapUploadToScenario(v))}
                      className={`flex flex-col text-left p-3 rounded-xl border transition-all relative ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-400/80 shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/50'
                          : 'bg-dark-850/80 border-slate-800 hover:border-slate-700 hover:bg-dark-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                          USER VIDEO
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {durText}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-white mt-1 line-clamp-1 break-all" title={v.filename}>
                        {v.filename}
                      </h4>

                      <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-dark-900 border border-slate-800">
                          {resText}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-dark-900 border border-slate-800">
                          {fpsText}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>YOLOv8 Ready</span>
                        </span>
                        <span className={isSelected ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                          {isSelected ? 'ACTIVE' : 'ANALYZE'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Real-time AI Pipeline Processing Indicator */}
      {isAnalyzing && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-between gap-3 shadow-lg shadow-cyan-950/40 animate-pulse">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
            <div>
              <div className="text-xs font-mono font-bold text-cyan-200">
                PROCESSING FOOTAGE WITH YOLOv8 DETECTOR & KINEMATIC RISK ENGINE...
              </div>
              <div className="text-[11px] text-cyan-400/80">
                Executing multi-object tracking, velocity vectors, closest-point-of-approach (CPA), and Time-to-Collision (TTC) calculations.
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-cyan-900/60 border border-cyan-400/40 text-[10px] font-mono text-cyan-300">
            COMPUTING RISK
          </span>
        </div>
      )}

      {/* Prominent Early Warning Banner */}
      <EarlyWarningBanner analysis={currentFrameAnalysis} />

      {/* Main Analysis Stage: Video with Canvas Overlay + Live Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Video Player with Dynamic Radar Overlay (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <VideoPlayer
            videoUrl={selectedScenario?.video_url}
            telemetryData={telemetry}
            currentFrameIndex={currentFrameIdx}
            onFrameUpdate={handleFrameUpdate}
            onSeek={handleSeek}
            mode={mode}
            setMode={setMode}
          />
        </div>

        {/* Right Column: Live Road Safety Dashboard (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <RiskDashboard analysis={currentFrameAnalysis} />
        </div>

      </div>

      {/* Secondary Stage: Real-Time Risk Chart + Event Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Risk Score vs Time Chart (7 Cols) */}
        <div className="lg:col-span-7">
          <RiskChart 
            telemetryData={telemetry} 
            currentFrameIndex={currentFrameIdx} 
          />
        </div>

        {/* Chronological Danger Timeline (5 Cols) */}
        <div className="lg:col-span-5">
          <EventTimeline 
            events={timelineEvents} 
            onSeekToEvent={handleSeek} 
            currentFrameIndex={currentFrameIdx} 
          />
        </div>

      </div>

    </div>
  );
}
