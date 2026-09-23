import React from 'react';
import { 
  Car, 
  Users, 
  Layers, 
  Clock, 
  Maximize2, 
  Gauge, 
  AlertOctagon, 
  CheckCircle2, 
  Compass, 
  TrendingUp 
} from 'lucide-react';

export default function RiskDashboard({ analysis }) {
  const score = analysis?.overall_risk_score ?? 0;
  const level = analysis?.overall_risk_level || 'LOW';
  const minTtc = analysis?.min_ttc;
  const closestDist = analysis?.closest_distance_px;
  const relSpeed = analysis?.relative_speed_kmh;
  const vehicles = analysis?.vehicle_count ?? 0;
  const pedestrians = analysis?.pedestrian_count ?? 0;
  const total = analysis?.total_objects ?? 0;
  const action = analysis?.recommended_action || 'MAINTAIN CURRENT SPEED';

  // Risk Level Color Styling
  const getLevelStyle = (lvl) => {
    switch (lvl) {
      case 'CRITICAL':
        return {
          badge: 'bg-red-950/80 text-red-400 border-red-500',
          text: 'text-red-400',
          gauge: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
        };
      case 'HIGH':
        return {
          badge: 'bg-orange-950/80 text-orange-400 border-orange-500',
          text: 'text-orange-400',
          gauge: '#f97316',
          bg: 'rgba(249, 115, 22, 0.1)',
        };
      case 'MODERATE':
        return {
          badge: 'bg-amber-950/80 text-amber-400 border-amber-500',
          text: 'text-amber-400',
          gauge: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
        };
      default:
        return {
          badge: 'bg-emerald-950/80 text-emerald-400 border-emerald-500',
          text: 'text-emerald-400',
          gauge: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
        };
    }
  };

  const style = getLevelStyle(level);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-cyan-500/20 bg-dark-850 p-5 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
            LIVE ROAD SAFETY ANALYSIS
          </h2>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
          KINEMATIC TELEMETRY
        </span>
      </div>

      {/* Main Gauge & Primary Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-dark-900/80 rounded-xl p-4 border border-slate-800">
        
        {/* Risk Score Gauge */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Circular Gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#1e2942"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={style.gauge}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * Math.min(score, 100)) / 100}
                strokeLinecap="round"
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-mono font-black text-white leading-none">
                {Math.round(score)}
              </span>
              <span className="text-[9px] font-mono text-slate-400 uppercase">/ 100</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              CURRENT RISK LEVEL
            </span>
            <div className="mt-1">
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-mono font-bold border tracking-wider ${style.badge}`}>
                {level}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {score > 70 ? 'Immediate collision threat detected' : score > 50 ? 'Significant hazard closing' : score > 30 ? 'Heightened alertness required' : 'Optimal safety parameters'}
            </p>
          </div>
        </div>

        {/* Action Callout */}
        <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            RECOMMENDED ADVISORY ACTION
          </span>
          <div className={`mt-1.5 p-2.5 rounded-lg border font-mono font-bold text-xs tracking-wide ${
            level === 'CRITICAL' 
              ? 'bg-red-950/60 border-red-500/50 text-red-200 animate-pulse' 
              : level === 'HIGH'
              ? 'bg-orange-950/60 border-orange-500/50 text-orange-200'
              : 'bg-dark-800 border-slate-700 text-slate-200'
          }`}>
            {action}
          </div>
          <span className="text-[9px] text-slate-400 mt-1">
            *SafeSight AI early warning advisory – Driver retains vehicle control
          </span>
        </div>

      </div>

      {/* Numerical Metrics Cards (TTC, Distance, Relative Speed) */}
      <div className="grid grid-cols-3 gap-2.5">
        
        {/* Time To Collision */}
        <div className="p-3 rounded-xl bg-dark-900/60 border border-slate-800 flex flex-col">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Time-To-Collision</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className={`text-xl font-mono font-black ${
              minTtc && minTtc <= 2.2 ? 'text-red-400 animate-pulse' : minTtc && minTtc <= 4.0 ? 'text-orange-400' : 'text-slate-100'
            }`}>
              {minTtc ? minTtc.toFixed(1) : '--'}
            </span>
            <span className="text-xs font-mono text-slate-400">{minTtc ? 'sec' : ''}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            {minTtc ? (minTtc <= 2.2 ? 'Imminent impact' : 'Closing margin') : 'Paths clear'}
          </span>
        </div>

        {/* Closest Object Distance */}
        <div className="p-3 rounded-xl bg-dark-900/60 border border-slate-800 flex flex-col">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Closest Gap</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-mono font-black text-slate-100">
              {closestDist ? Math.round(closestDist) : '--'}
            </span>
            <span className="text-xs font-mono text-slate-400">{closestDist ? 'px' : ''}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            {closestDist && closestDist < 80 ? 'Critical proximity' : 'Separation gap'}
          </span>
        </div>

        {/* Relative Closing Speed */}
        <div className="p-3 rounded-xl bg-dark-900/60 border border-slate-800 flex flex-col">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Relative Speed</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-mono font-black text-slate-100">
              {relSpeed ? relSpeed.toFixed(0) : '0'}
            </span>
            <span className="text-xs font-mono text-slate-400">km/h</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            Closing rate
          </span>
        </div>

      </div>

      {/* Detected Entity Counters */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-800/80 border border-slate-800">
          <Car className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-400 font-mono">Vehicles</div>
            <div className="text-sm font-mono font-bold text-white">{vehicles}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-800/80 border border-slate-800">
          <Users className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400 font-mono">Pedestrians</div>
            <div className="text-sm font-mono font-bold text-white">{pedestrians}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-dark-800/80 border border-slate-800">
          <Layers className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400 font-mono">Total Tracked</div>
            <div className="text-sm font-mono font-bold text-white">{total}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
