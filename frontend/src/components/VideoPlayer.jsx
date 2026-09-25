import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, FastForward, Shield, Zap, Sparkles } from 'lucide-react';
import { getVideoUrl } from '../services/api';

export default function VideoPlayer({ 
  videoUrl, 
  telemetryData = [], 
  onFrameUpdate, 
  currentFrameIndex = 0,
  onSeek,
  mode = 'ai',
  setMode
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [internalFrameIdx, setInternalFrameIdx] = useState(0);
  const [videoHasError, setVideoHasError] = useState(false);

  // Sync external seek requests (e.g. from Event Timeline clicks)
  useEffect(() => {
    if (currentFrameIndex !== undefined) {
      const targetTime = currentFrameIndex / 25.0;
      setCurrentTime(targetTime);
      setInternalFrameIdx(currentFrameIndex);
      if (videoRef.current && Math.abs(videoRef.current.currentTime - targetTime) > 0.3) {
        try {
          videoRef.current.currentTime = targetTime;
        } catch (e) {}
      }
    }
  }, [currentFrameIndex]);

  // Sync and auto-reload whenever videoUrl changes
  useEffect(() => {
    setVideoHasError(false);
    setCurrentTime(0);
    setInternalFrameIdx(0);
    setIsPlaying(true);
    if (videoRef.current) {
      try {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      } catch (e) {}
    }
  }, [videoUrl]);

  // Autonomous animation clock: guarantees continuous playback regardless of browser video policies
  useEffect(() => {
    let timerId = null;
    if (isPlaying) {
      timerId = setInterval(() => {
        // If video element is actively updating, let handleTimeUpdate drive.
        // Otherwise, advance internal frame clock smoothly at 25 FPS:
        const video = videoRef.current;
        if (!video || video.paused || video.ended || videoHasError) {
          setCurrentTime((prev) => {
            const next = prev + 0.04 * playbackSpeed;
            const maxDur = duration || 10.0;
            const looped = next >= maxDur ? 0 : next;
            const fIdx = Math.floor(looped * 25.0);
            setInternalFrameIdx(fIdx);

            if (telemetryData && telemetryData.length > 0) {
              const frameAnalysis = telemetryData[Math.min(fIdx, telemetryData.length - 1)];
              if (frameAnalysis && onFrameUpdate) {
                onFrameUpdate(frameAnalysis, fIdx);
              }
            }
            return looped;
          });
        }
      }, 40);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying, playbackSpeed, duration, telemetryData, onFrameUpdate, videoHasError]);

  const togglePlay = () => {
    if (isPlaying) {
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch (e) {}
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (videoRef.current && !videoHasError) {
        videoRef.current.play().catch((err) => {
          console.warn('HTML5 video play deferred; autonomous canvas simulation running smoothly:', err);
        });
      }
    }
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setInternalFrameIdx(0);
    setIsPlaying(true);
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      } catch (e) {}
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      try { videoRef.current.playbackRate = speed; } catch (e) {}
    }
  };

  // Video time update event: sync frame and telemetry
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curTime = videoRef.current.currentTime;
    setCurrentTime(curTime);
    const fps = 25.0;
    const fIdx = Math.floor(curTime * fps);
    setInternalFrameIdx(fIdx);

    if (telemetryData && telemetryData.length > 0) {
      const frameAnalysis = telemetryData[Math.min(fIdx, telemetryData.length - 1)];
      if (frameAnalysis && onFrameUpdate) {
        onFrameUpdate(frameAnalysis, fIdx);
      }
    }
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const curFrame = telemetryData && telemetryData.length > 0 
      ? telemetryData[Math.min(internalFrameIdx, telemetryData.length - 1)] 
      : null;

    // Scale factors between video native resolution (e.g., 2K/4K/1080p/480p) and canvas display
    const baseW = (curFrame && curFrame.video_width) ? curFrame.video_width : (videoRef.current?.videoWidth || 854.0);
    const baseH = (curFrame && curFrame.video_height) ? curFrame.video_height : (videoRef.current?.videoHeight || 480.0);
    const scaleX = width / baseW;
    const scaleY = height / baseH;

    // If video has error or not playing video stream, render procedural roadway
    if (videoHasError) {
      ctx.fillStyle = '#2d372e';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#37373c';
      ctx.fillRect(0, 100 * (height / 480.0), width, 280 * (height / 480.0));
      ctx.fillStyle = '#a0a0a5';
      ctx.fillRect(0, 88 * (height / 480.0), width, 12 * (height / 480.0));
      ctx.fillRect(0, 380 * (height / 480.0), width, 12 * (height / 480.0));
      ctx.strokeStyle = '#e6c828';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(0, 240 * (height / 480.0));
      ctx.lineTo(width, 240 * (height / 480.0));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (!curFrame || !curFrame.objects) return;

    // 1. Draw collision zone if present
    if (curFrame.collision_zone) {
      const [czX, czY, czR] = curFrame.collision_zone;
      const drawX = czX * scaleX;
      const drawY = czY * scaleY;
      const drawR = (czR || 40) * Math.min(scaleX, scaleY);

      // Radar glow circle
      const gradient = ctx.createRadialGradient(drawX, drawY, 5, drawX, drawY, drawR * 1.4);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      gradient.addColorStop(0.7, 'rgba(239, 68, 68, 0.2)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.beginPath();
      ctx.arc(drawX, drawY, drawR * 1.4, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Outer pulsating ring
      ctx.beginPath();
      ctx.arc(drawX, drawY, drawR, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Collision Zone Badge
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillStyle = '#ef4444';
      const label = 'POTENTIAL COLLISION ZONE';
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(30, 10, 10, 0.85)';
      ctx.fillRect(drawX - textWidth / 2 - 6, drawY - drawR - 22, textWidth + 12, 18);
      ctx.strokeStyle = '#ef4444';
      ctx.strokeRect(drawX - textWidth / 2 - 6, drawY - drawR - 22, textWidth + 12, 18);
      ctx.fillStyle = '#fca5a5';
      ctx.fillText(label, drawX - textWidth / 2, drawY - drawR - 9);
    }

    // 2. Draw objects (boxes, labels, velocity arrows, trajectories)
    curFrame.objects.forEach((obj) => {
      const [x1, y1, x2, y2] = obj.bbox.map((v, i) => (i % 2 === 0 ? v * scaleX : v * scaleY));
      const cx = obj.center[0] * scaleX;
      const cy = obj.center[1] * scaleY;
      const boxW = x2 - x1;
      const boxH = y2 - y1;

      // Color mapping based on risk level
      let color = '#10b981'; // Green
      let bgColor = 'rgba(16, 185, 129, 0.15)';
      if (obj.risk_level === 'CRITICAL' || curFrame.overall_risk_level === 'CRITICAL') {
        color = '#ef4444';
        bgColor = 'rgba(239, 68, 68, 0.2)';
      } else if (obj.risk_level === 'HIGH' || curFrame.overall_risk_level === 'HIGH') {
        color = '#f97316';
        bgColor = 'rgba(249, 115, 22, 0.2)';
      } else if (obj.risk_level === 'MODERATE') {
        color = '#f59e0b';
        bgColor = 'rgba(245, 158, 11, 0.15)';
      }

      // Past Trajectory Tail
      if (obj.trajectory_history && obj.trajectory_history.length > 1) {
        ctx.beginPath();
        obj.trajectory_history.forEach((pt, i) => {
          const px = pt[0] * scaleX;
          const py = pt[1] * scaleY;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 3]);
        ctx.globalAlpha = 0.55;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
      }

      // Future Projected Trajectory Ray
      if (obj.predicted_trajectory && obj.predicted_trajectory.length > 1) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        obj.predicted_trajectory.forEach((pt) => {
          ctx.lineTo(pt[0] * scaleX, pt[1] * scaleY);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.0;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ray tip marker
        const lastPt = obj.predicted_trajectory[obj.predicted_trajectory.length - 1];
        ctx.beginPath();
        ctx.arc(lastPt[0] * scaleX, lastPt[1] * scaleY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Bounding Box
      ctx.fillStyle = bgColor;
      ctx.fillRect(x1, y1, boxW, boxH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.strokeRect(x1, y1, boxW, boxH);

      // Corner Accents (High-tech HUD look)
      const cLen = Math.min(10, boxW / 3, boxH / 3);
      ctx.lineWidth = 3.0;
      // Top Left
      ctx.beginPath(); ctx.moveTo(x1, y1 + cLen); ctx.lineTo(x1, y1); ctx.lineTo(x1 + cLen, y1); ctx.stroke();
      // Top Right
      ctx.beginPath(); ctx.moveTo(x2 - cLen, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + cLen); ctx.stroke();
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(x1, y2 - cLen); ctx.lineTo(x1, y2); ctx.lineTo(x1 + cLen, y2); ctx.stroke();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(x2 - cLen, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - cLen); ctx.stroke();
      ctx.lineWidth = 2.0;

      // Center Point
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Velocity Direction Arrow
      if (obj.velocity && (Math.abs(obj.velocity[0]) > 5 || Math.abs(obj.velocity[1]) > 5)) {
        const arrowLen = 26;
        const rad = (obj.direction_deg * Math.PI) / 180.0;
        const endX = cx + Math.cos(rad) * arrowLen;
        const endY = cy + Math.sin(rad) * arrowLen;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Arrow head
        const headLen = 6;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(rad - Math.PI / 6),
          endY - headLen * Math.sin(rad - Math.PI / 6)
        );
        ctx.lineTo(
          endX - headLen * Math.cos(rad + Math.PI / 6),
          endY - headLen * Math.sin(rad + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }

      // HUD Entity Tag Label
      const objTag = `${obj.label.toUpperCase()} #${obj.id}`;
      const speedTag = `${obj.speed_kmh} km/h ${obj.direction_arrow || ''}`;
      const riskTag = `RISK: ${obj.risk_level}`;

      ctx.font = 'bold 10px JetBrains Mono, monospace';
      const tagText = `${objTag} | ${speedTag}`;
      const textW = ctx.measureText(tagText).width;

      // Label background box
      ctx.fillStyle = 'rgba(13, 19, 34, 0.9)';
      ctx.fillRect(x1, Math.max(0, y1 - 20), textW + 10, 18);
      ctx.strokeStyle = color;
      ctx.strokeRect(x1, Math.max(0, y1 - 20), textW + 10, 18);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(tagText, x1 + 5, Math.max(12, y1 - 7));
    });

  }, [internalFrameIdx, telemetryData]);

  // Sync seek bar
  const handleSeekChange = (e) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      const fIdx = Math.floor(val * 25.0);
      setInternalFrameIdx(fIdx);
      if (onSeek) onSeek(fIdx);
    }
  };

  const currentAnalysis = telemetryData && telemetryData.length > 0 
    ? telemetryData[Math.min(internalFrameIdx, telemetryData.length - 1)] 
    : null;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-cyan-500/20 bg-dark-850 shadow-2xl">
      
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-dark-900/90 border-b border-cyan-500/15">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-mono font-semibold text-slate-200 tracking-wider">
            OPTICAL RADAR TELEMETRY FEED
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            [854x480 • 25 FPS]
          </span>
        </div>

        {/* Mode Selector Toggle: LIVE AI vs DEMO */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-dark-800 border border-slate-700/80">
          <button
            onClick={() => setMode && setMode('ai')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
              mode === 'ai'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ LIVE AI ANALYSIS
          </button>
          <button
            onClick={() => setMode && setMode('demo')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
              mode === 'demo'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎮 DEMO/SIMULATION
          </button>
        </div>
      </div>

      {/* Main Video & Canvas Container */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl ? getVideoUrl(videoUrl) : undefined}
          className="w-full h-full object-contain"
          playsInline
          muted
          autoPlay
          loop
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            setVideoHasError(false);
            if (videoRef.current) {
              setDuration(videoRef.current.duration || 10);
            }
          }}
          onError={(e) => {
            console.warn('Video element could not load codec/file, switching to canvas simulation engine:', e);
            setVideoHasError(true);
          }}
        />

        {/* Dynamic Canvas Overlay for Bounding Boxes, Arrows, and Predicted Trajectories */}
        <canvas
          ref={canvasRef}
          width={854}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Upper Left HUD Telemetry Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          <div className="px-2.5 py-1 rounded bg-dark-900/85 backdrop-blur-sm border border-cyan-500/30 font-mono text-[11px] text-cyan-300">
            FRAME: <span className="text-white font-bold">{internalFrameIdx}</span> / {telemetryData.length || 250}
          </div>
          {currentAnalysis && currentAnalysis.active_scenarios && currentAnalysis.active_scenarios.length > 0 && (
            <div className="px-2.5 py-1 rounded bg-red-950/85 backdrop-blur-sm border border-red-500/40 font-mono text-[11px] text-red-300">
              TARGET INTERSECTION: <strong className="text-white">CONVERGING</strong>
            </div>
          )}
        </div>

        {/* Upper Right TTC Overlay */}
        {currentAnalysis && currentAnalysis.min_ttc && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-dark-900/90 backdrop-blur-md border border-amber-500/40 flex items-center gap-2 pointer-events-none">
            <span className="text-[10px] font-mono text-slate-400 uppercase">TTC ESTIMATE:</span>
            <span className="text-sm font-mono font-extrabold text-amber-300">
              {currentAnalysis.min_ttc}s
            </span>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="p-3 bg-dark-900/95 border-t border-slate-800 flex flex-col gap-2">
        {/* Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-12 text-right">
            {currentTime.toFixed(1)}s
          </span>
          <input
            type="range"
            min="0"
            max={duration || 10}
            step="0.04"
            value={currentTime}
            onChange={handleSeekChange}
            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
          <span className="text-xs font-mono text-slate-400 w-12">
            {(duration || 10).toFixed(1)}s
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button
              onClick={handleRestart}
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-700"
              title="Restart Video"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Playback speed buttons */}
            <div className="flex items-center rounded-lg bg-dark-800 border border-slate-700 p-0.5 ml-2">
              {[0.5, 1.0, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-2 py-0.5 text-xs font-mono rounded ${
                    playbackSpeed === spd
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>MODE:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              mode === 'ai' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
            }`}>
              {mode === 'ai' ? 'LIVE YOLOv8 INFERENCE' : 'SYNCHRONIZED SIMULATION'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
