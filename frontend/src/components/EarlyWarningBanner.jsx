import React, { useEffect } from 'react';
import { AlertCircle, AlertOctagon, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { soundService } from '../services/soundService';

export default function EarlyWarningBanner({ analysis }) {
  const level = analysis?.overall_risk_level || 'LOW';
  const score = analysis?.overall_risk_score || 0;
  const warning = analysis?.primary_warning;
  const action = analysis?.recommended_action;
  const minTtc = analysis?.min_ttc;

  useEffect(() => {
    if (level === 'CRITICAL') {
      soundService.playRiskSound('CRITICAL');
      soundService.speakWarning(
        `Critical collision risk detected. ${action || 'Brake immediately.'}`,
        'CRITICAL'
      );
    } else if (level === 'HIGH') {
      soundService.playRiskSound('HIGH');
      soundService.speakWarning(
        `High collision risk. ${action || 'Slow down.'}`,
        'HIGH'
      );
    }
  }, [level, action]);

  if (level === 'CRITICAL') {
    return (
      <div className="relative overflow-hidden rounded-xl border border-red-500/60 bg-gradient-to-r from-red-950/90 via-red-900/80 to-dark-900 p-4 shadow-xl shadow-red-950/60 animate-pulse-fast">
        <div className="absolute top-0 right-0 w-48 h-full bg-red-600/10 blur-xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-600/30 border border-red-500 text-red-400">
              <AlertOctagon className="w-7 h-7 text-red-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white shadow-sm">
                  CRITICAL THREAT
                </span>
                <span className="text-xs text-red-300 font-mono">
                  RISK SCORE: <strong className="text-white text-sm">{score}/100</strong>
                </span>
                {minTtc && (
                  <span className="text-xs text-amber-300 font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40">
                    TTC: <strong className="text-white">{minTtc}s</strong>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide mt-1">
                🚨 CRITICAL COLLISION RISK – POTENTIAL COLLISION DETECTED
              </h2>
              <p className="text-xs sm:text-sm text-red-200 font-medium">
                {warning || 'Immediate evasive or braking action required to avert impending impact.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Recommended Action</span>
            <div className="px-4 py-2 mt-0.5 rounded-lg bg-red-600 text-white font-mono font-bold text-sm tracking-wide shadow-md shadow-red-950/80 border border-red-400">
              {action || 'SLOW DOWN / BRAKE'}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 italic">
              *Advisory only – Not physical vehicle actuation
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (level === 'HIGH') {
    return (
      <div className="relative overflow-hidden rounded-xl border border-orange-500/50 bg-gradient-to-r from-orange-950/80 via-amber-950/60 to-dark-900 p-4 shadow-lg shadow-orange-950/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-500/20 border border-orange-500/50 text-orange-400">
              <AlertCircle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-600 text-white">
                  HIGH COLLISION RISK
                </span>
                <span className="text-xs text-orange-300 font-mono">
                  RISK SCORE: <strong className="text-white">{score}/100</strong>
                </span>
                {minTtc && (
                  <span className="text-xs text-amber-200 font-mono px-2 py-0.5 rounded bg-dark-800 border border-amber-500/30">
                    TTC: <strong className="text-white">{minTtc}s</strong>
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white mt-1">
                ⚠️ HIGH RISK: {warning || 'Converging trajectories detected ahead'}
              </h3>
            </div>
          </div>

          <div className="flex flex-col items-end w-full sm:w-auto">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Recommended Action</span>
            <div className="px-3.5 py-1.5 mt-0.5 rounded-lg bg-orange-500/20 border border-orange-400 text-orange-200 font-mono font-semibold text-xs tracking-wide">
              {action || 'REDUCE SPEED / PREPARE TO BRAKE'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (level === 'MODERATE') {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-dark-850/80 p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                MODERATE CAUTION
              </span>
              <span className="text-xs text-slate-400 font-mono">Risk: {score}/100</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {warning || 'Proximity or closing speed above normal cruising margins.'}
            </p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Advisory</span>
          <p className="text-xs text-amber-300 font-mono font-semibold">{action || 'MONITOR AHEAD'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-dark-850/60 p-3 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="font-mono text-emerald-400 font-semibold tracking-wide">
          NORMAL ROAD SAFETY CONDITIONS
        </span>
        <span className="text-slate-400 font-mono">| Risk Score: {score}/100 (LOW)</span>
      </div>
      <span className="text-slate-400 font-mono hidden sm:inline">
        Trajectories stable • Safe following distance maintained
      </span>
    </div>
  );
}
