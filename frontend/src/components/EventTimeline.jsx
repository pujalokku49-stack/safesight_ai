import React from 'react';
import { Clock, AlertTriangle, AlertOctagon, CheckCircle2, ChevronRight } from 'lucide-react';

export default function EventTimeline({ events = [], onSeekToEvent, currentFrameIndex }) {
  const getBadgeStyle = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-950/80 border-red-500/50 text-red-300';
      case 'HIGH':
        return 'bg-orange-950/80 border-orange-500/50 text-orange-300';
      case 'MODERATE':
        return 'bg-amber-950/80 border-amber-500/50 text-amber-300';
      default:
        return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
    }
  };

  const getIcon = (level) => {
    if (level === 'CRITICAL') return <AlertOctagon className="w-4 h-4 text-red-400" />;
    if (level === 'HIGH' || level === 'MODERATE') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="flex flex-col rounded-2xl border border-cyan-500/20 bg-dark-850 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
            CHRONOLOGICAL DANGER TIMELINE
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {events.length} Events Detected
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Select any incident below to jump directly to the synchronized video timestamp.
      </p>

      {/* Events List */}
      <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
        {(!events || events.length === 0) ? (
          <div className="p-4 rounded-xl bg-dark-900/60 border border-slate-800 text-center text-xs text-slate-500">
            No dangerous events logged yet. Trajectories maintain safe operating distance.
          </div>
        ) : (
          events.map((ev, idx) => {
            const isNearCurrent = Math.abs(ev.frame_index - currentFrameIndex) < 15;
            return (
              <div
                key={ev.event_id || idx}
                onClick={() => onSeekToEvent && onSeekToEvent(ev.frame_index)}
                className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                  isNearCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950/50'
                    : 'bg-dark-900/60 border-slate-800 hover:border-slate-700 hover:bg-dark-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(ev.risk_level)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {ev.timestamp_str}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getBadgeStyle(ev.risk_level)}`}>
                        {ev.risk_level}
                      </span>
                      {ev.ttc_seconds && (
                        <span className="text-[10px] font-mono text-amber-300">
                          TTC: {ev.ttc_seconds}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 font-medium mt-1 group-hover:text-white">
                      {ev.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-mono">Action:</span>
                      <span className="text-[10px] text-slate-300 font-mono font-semibold">
                        {ev.recommended_action}
                      </span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors mt-2" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
