import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  FileVideo, 
  Play, 
  Pause,
  RefreshCw,
  Sliders,
  Sparkles
} from 'lucide-react';
import { uploadVideo, getVideos, analyzeFrame, getVideoUrl } from '../services/api';
import EarlyWarningBanner from '../components/EarlyWarningBanner';
import RiskDashboard from '../components/RiskDashboard';

export default function VideoAnalysis({ setActiveTab, setSelectedVideoForReport, activeVideoId, setActiveVideoId }) {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' or 'webcam'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);

  // Webcam state
  const videoElemRef = useRef(null);
  const canvasRef = useRef(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const webcamIntervalRef = useRef(null);

  // Fetch available videos on mount
  useEffect(() => {
    loadVideosList();
  }, []);

  const loadVideosList = async () => {
    try {
      const vids = await getVideos();
      setUploadedVideos(vids);
    } catch (e) {
      console.error('Failed to load video list', e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Immediately preview the file locally before upload finishes
    const localUrl = URL.createObjectURL(file);
    setActiveVideo({
      id: '__preview__',
      filename: file.name,
      url: localUrl,
      type: 'upload',
      isLocalPreview: true,
    });

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadVideo(file);
      // Use replaceAll so "my.video.mp4" → "my_video_mp4" (not "my_video.mp4")
      const videoId = res.id || res.filename.replaceAll('.', '_');
      await loadVideosList();
      setActiveVideo({
        id: videoId,
        filename: res.filename,
        url: res.url,
        type: 'upload',
      });
      if (setSelectedVideoForReport) {
        setSelectedVideoForReport(videoId);
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload video. Please try again.');
      // Keep local preview so user can see the video they tried to upload
    } finally {
      setIsUploading(false);
    }
  };

  // Start Webcam stream
  const startWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: { ideal: 20 } }
      });
      if (videoElemRef.current) {
        videoElemRef.current.srcObject = stream;
        videoElemRef.current.play();
        setIsWebcamActive(true);
        startLiveInferenceLoop();
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setWebcamError('Camera access was denied or no camera device found. Please grant browser camera permissions.');
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamIntervalRef.current) {
      clearInterval(webcamIntervalRef.current);
    }
    if (videoElemRef.current && videoElemRef.current.srcObject) {
      const tracks = videoElemRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoElemRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setLiveAnalysis(null);
  };

  const startLiveInferenceLoop = () => {
    let frameCount = 0;
    webcamIntervalRef.current = setInterval(async () => {
      if (!videoElemRef.current || !canvasRef.current) return;
      const video = videoElemRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState >= 2) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 jpeg
        const b64 = canvas.toDataURL('image/jpeg', 0.7);
        try {
          const analysis = await analyzeFrame(b64, frameCount, frameCount * 0.1);
          setLiveAnalysis(analysis);
          frameCount++;
        } catch (e) {
          // Skip frame on network delay
        }
      }
    }, 200); // 5 FPS inference rate for live webcam to prevent browser freeze
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-wide">
            VIDEO ANALYSIS & LIVE CAMERA INSPECTION
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Feed custom traffic video footage or real-time camera streams through SafeSight's YOLOv8 and Kinematic Collision Risk Engine.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-dark-850 border border-slate-700">
          <button
            onClick={() => { setActiveMode('upload'); stopWebcam(); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              activeMode === 'upload'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>VIDEO UPLOAD</span>
          </button>

          <button
            onClick={() => { setActiveMode('webcam'); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              activeMode === 'webcam'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>LIVE WEBCAM</span>
          </button>
        </div>
      </div>

      {activeMode === 'upload' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Upload Dropzone & Controls (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            <div className="rounded-2xl border-2 border-dashed border-cyan-500/30 bg-dark-850 p-6 flex flex-col items-center justify-center text-center hover:border-cyan-400/60 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                <FileVideo className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-white">
                Upload Traffic Video
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Supports MP4, AVI, MOV footage (dashcam recordings, intersection CCTV, or simulated clips).
              </p>

              <label className="mt-4 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider cursor-pointer shadow-lg shadow-cyan-600/30 transition-colors">
                {isUploading ? 'UPLOADING & INDEXING...' : 'SELECT VIDEO FILE'}
                <input
                  type="file"
                  accept="video/mp4,video/avi,video/quicktime,video/mkv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>

              {uploadError && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-xs font-mono">
                  <AlertCircle className="w-4 h-4" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Video Catalog */}
            <div className="rounded-2xl border border-slate-800 bg-dark-850 p-4">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3">
                AVAILABLE FOOTAGE LIBRARY ({uploadedVideos.length})
              </h3>
              
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {uploadedVideos.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setActiveVideo(v);
                      if (setSelectedVideoForReport) setSelectedVideoForReport(v.id);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      activeVideo?.id === v.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200'
                        : 'bg-dark-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Video className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <div className="truncate">
                        <div className="text-xs font-medium truncate">{v.filename}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {v.type === 'sample' ? 'Sample Scenario Clip' : 'Uploaded Custom Clip'} • {v.metadata?.duration_sec || 10}s
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 border border-slate-700">
                      {activeVideo?.id === v.id ? 'SELECTED' : 'SELECT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Video Preview & Inspection Area (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {activeVideo ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl overflow-hidden border border-cyan-500/20 bg-dark-850 p-2">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                    <video
                      key={activeVideo.url}
                      src={activeVideo.isLocalPreview ? activeVideo.url : getVideoUrl(activeVideo.url)}
                      controls
                      autoPlay
                      muted
                      playsInline
                      loop
                      className="w-full h-full object-contain"
                    />
                    {/* Uploading overlay */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                        <p className="text-cyan-300 font-mono text-xs font-bold tracking-wider">UPLOADING & INDEXING...</p>
                        <p className="text-slate-400 font-mono text-[10px]">Running YOLOv8 inference on your video</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-dark-850 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-xs font-mono font-bold text-white uppercase">
                      {isUploading ? '⏳ UPLOADING & BUILDING AI TELEMETRY...' : '✅ READY FOR REAL-TIME ANALYSIS'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      File: <strong className="text-cyan-400">{activeVideo.filename}</strong>
                      {activeVideo.isLocalPreview && <span className="ml-2 text-amber-400">(local preview)</span>}
                    </p>
                  </div>
                  <button
                    disabled={isUploading || activeVideo.isLocalPreview}
                    onClick={() => {
                      if (activeVideo && !activeVideo.isLocalPreview) {
                        const vidId = activeVideo.id || activeVideo.filename;
                        if (setActiveVideoId) setActiveVideoId(vidId);
                        if (setSelectedVideoForReport) setSelectedVideoForReport(vidId);
                      }
                      setActiveTab('dashboard');
                    }}
                    className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-mono text-xs font-bold shadow-md shadow-cyan-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isUploading ? 'WAIT...' : 'RUN LIVE PIPELINE →'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-80 rounded-2xl border border-slate-800 bg-dark-850 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Video className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
                <p className="text-xs font-mono">Select a video from the library or upload new footage above to inspect.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* LIVE WEBCAM MODE */
        <div className="flex flex-col gap-6">
          <EarlyWarningBanner analysis={liveAnalysis} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="rounded-2xl border border-cyan-500/20 bg-dark-850 overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-dark-900 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span>LIVE WEBCAM AI OPTICAL SENSOR FEED</span>
                  </div>
                  
                  {isWebcamActive ? (
                    <button
                      onClick={stopWebcam}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold"
                    >
                      STOP CAMERA
                    </button>
                  ) : (
                    <button
                      onClick={startWebcam}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold"
                    >
                      ACTIVATE CAMERA
                    </button>
                  )}
                </div>

                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <video
                    ref={videoElemRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isWebcamActive ? '' : 'hidden'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {!isWebcamActive && (
                    <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-500">
                      <Camera className="w-12 h-12 text-slate-600 stroke-1" />
                      <p className="text-xs font-mono">
                        Camera inactive. Click "ACTIVATE CAMERA" to stream live video for real-time YOLOv8 object detection and risk estimation.
                      </p>
                    </div>
                  )}

                  {webcamError && (
                    <div className="absolute inset-4 bg-dark-950/90 rounded-xl p-6 flex flex-col items-center justify-center text-center text-red-400">
                      <AlertCircle className="w-8 h-8 mb-2" />
                      <p className="text-xs font-mono max-w-sm">{webcamError}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <RiskDashboard analysis={liveAnalysis} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
