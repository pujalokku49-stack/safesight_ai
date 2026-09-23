import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Layers, 
  Car,
  ChevronDown
} from 'lucide-react';
import { getIncidentReport, getReportDownloadUrl, getScenarios } from '../services/api';

export default function IncidentReport({ selectedVideoId = 'pedestrian_crossing' }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scenariosList, setScenariosList] = useState([]);
  const [currentVideoId, setCurrentVideoId] = useState(selectedVideoId);

  useEffect(() => {
    async function loadScenarios() {
      try {
        const scs = await getScenarios();
        setScenariosList(scs);
      } catch (e) {
        console.error('Error fetching scenarios list', e);
      }
    }
    loadScenarios();
  }, []);

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await getIncidentReport(currentVideoId);
        setReport(data);
      } catch (err) {
        console.error('Failed to load incident report', err);
        setError('Could not retrieve incident report for this video session.');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [currentVideoId]);

  const handlePrint = () => {
    window.print();
  };

  const downloadUrl = getReportDownloadUrl(currentVideoId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      
      {/* Action Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-wide flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-cyan-400" />
            INCIDENT SAFETY & RISK REPORT
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official post-analysis audit log detailing trajectory risks, critical TTC metrics, and recommended safety actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scenario Selector Dropdown */}
          <select
            value={currentVideoId}
            onChange={(e) => setCurrentVideoId(e.target.value)}
            className="bg-dark-850 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 font-mono focus:outline-none"
          >
            {scenariosList.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>

          <a
            href={downloadUrl}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-slate-700 text-xs font-mono font-semibold text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT .MD</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold transition-colors shadow-md shadow-cyan-600/30"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT / PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Compiling incident kinematic report...
        </div>
      ) : error || !report ? (
        <div className="p-8 text-center text-red-400 bg-dark-850 border border-red-500/30 rounded-2xl text-xs font-mono">
          {error || 'Report unavailable'}
        </div>
      ) : (
        /* Printable Incident Report Document */
        <div className="rounded-3xl border border-cyan-500/20 bg-dark-850 p-6 sm:p-10 shadow-2xl flex flex-col gap-6 print:border-none print:bg-white print:text-black print:p-0">
          
          {/* Document Header */}
          <div className="border-b border-slate-800 print:border-slate-300 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-black font-mono">
                  SS
                </div>
                <div>
                  <h2 className="text-xl font-bold font-mono tracking-tight text-white print:text-black">
                    SafeSight AI Autonomous Safety Audit
                  </h2>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    Predictive Road Safety Early-Warning Telemetry
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-cyan-400 print:text-blue-600 uppercase font-bold px-2 py-0.5 rounded bg-cyan-950/60 print:bg-slate-100 border border-cyan-500/30">
                  OFFICIAL AUDIT REPORT
                </span>
                <div className="text-[11px] font-mono text-slate-400 print:text-slate-600 mt-1">
                  Report ID: SS-{currentVideoId.toUpperCase()}-2026
                </div>
              </div>
            </div>
          </div>

          {/* Key Executive Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl bg-dark-900/90 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-mono text-slate-400 print:text-slate-600 uppercase">
                Peak Risk Score
              </span>
              <div className="text-2xl font-mono font-black text-red-400 print:text-red-600 mt-1">
                {report.max_risk_score} / 100
              </div>
              <span className="text-[10px] font-mono text-slate-400 print:text-slate-500">
                Avg: {report.avg_risk_score} / 100
              </span>
            </div>

            <div className="p-4 rounded-xl bg-dark-900/90 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-mono text-slate-400 print:text-slate-600 uppercase">
                Primary Danger Scenario
              </span>
              <div className="text-sm font-bold text-white print:text-black mt-1 line-clamp-2">
                {report.primary_scenario_detected}
              </div>
              <span className="text-[10px] font-mono text-amber-400 print:text-amber-600 mt-0.5 block">
                {report.critical_events_count} Critical Transitions
              </span>
            </div>

            <div className="p-4 rounded-xl bg-dark-900/90 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-mono text-slate-400 print:text-slate-600 uppercase">
                Minimum TTC Margin
              </span>
              <div className="text-2xl font-mono font-black text-amber-300 print:text-amber-600 mt-1">
                {report.min_ttc_recorded_sec ? `${report.min_ttc_recorded_sec}s` : 'N/A'}
              </div>
              <span className="text-[10px] font-mono text-slate-400 print:text-slate-500">
                At {report.most_dangerous_timestamp_str}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-dark-900/90 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-mono text-slate-400 print:text-slate-600 uppercase">
                Recommended Action
              </span>
              <div className="text-xs font-mono font-bold text-cyan-300 print:text-blue-700 mt-1">
                {report.recommended_safety_action}
              </div>
              <span className="text-[10px] font-mono text-slate-400 print:text-slate-500">
                Proactive advisory
              </span>
            </div>

          </div>

          {/* Session Overview Table */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 print:text-black mb-3">
              1. FOOTAGE INSPECTION OVERVIEW
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse border border-slate-800 print:border-slate-300">
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  <tr className="bg-dark-900/50 print:bg-slate-50">
                    <td className="p-2.5 text-slate-400 print:text-slate-600 font-semibold w-1/3">Video Source File</td>
                    <td className="p-2.5 text-white print:text-black">{report.video_name}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-400 print:text-slate-600 font-semibold">Total Duration & Frames</td>
                    <td className="p-2.5 text-white print:text-black">{report.analysis_duration_sec} seconds ({report.total_frames_analyzed} frames)</td>
                  </tr>
                  <tr className="bg-dark-900/50 print:bg-slate-50">
                    <td className="p-2.5 text-slate-400 print:text-slate-600 font-semibold">Unique Detected Entities</td>
                    <td className="p-2.5 text-white print:text-black">{report.total_unique_objects} objects ({report.vehicle_count} vehicles, {report.pedestrian_count} pedestrians)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-400 print:text-slate-600 font-semibold">Most Dangerous Moment</td>
                    <td className="p-2.5 text-red-400 print:text-red-600 font-bold">{report.most_dangerous_timestamp_str} (Elapsed: {report.most_dangerous_timestamp_sec}s)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Event Timeline Table */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 print:text-black mb-3">
              2. DETECTED RISK EVENTS & TRANSITION LOG
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse border border-slate-800 print:border-slate-300">
                <thead>
                  <tr className="bg-dark-900 print:bg-slate-100 text-slate-400 print:text-slate-700">
                    <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Timestamp</th>
                    <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Risk Level</th>
                    <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Description</th>
                    <th className="p-2.5 border-b border-slate-800 print:border-slate-300">TTC</th>
                    <th className="p-2.5 border-b border-slate-800 print:border-slate-300">Advisory Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {report.events.map((ev, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-dark-900/30 print:bg-slate-50' : ''}>
                      <td className="p-2.5 text-cyan-400 print:text-blue-700 font-bold">{ev.timestamp_str}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.risk_level === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                          ev.risk_level === 'HIGH' ? 'bg-orange-950 text-orange-400' :
                          'bg-emerald-950 text-emerald-400'
                        }`}>
                          {ev.risk_level} ({Math.round(ev.risk_score)})
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-200 print:text-black">{ev.description}</td>
                      <td className="p-2.5 text-amber-300 print:text-amber-700">{ev.ttc_seconds ? `${ev.ttc_seconds}s` : '--'}</td>
                      <td className="p-2.5 text-slate-300 print:text-slate-800 font-semibold">{ev.recommended_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Disclaimer */}
          <div className="p-4 rounded-xl bg-dark-900/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-[11px] text-slate-400 print:text-slate-600 leading-relaxed">
            <strong className="text-white print:text-black">SafeSight AI System Positioning Disclaimer:</strong> SafeSight AI provides automated predictive collision-risk analysis based on observable object movement, distance, direction, and trajectory extrapolation. The system serves as an early-warning advisory and does not claim to guarantee accident prevention or take autonomous physical control of vehicle braking actuators.
          </div>

        </div>
      )}

    </div>
  );
}
