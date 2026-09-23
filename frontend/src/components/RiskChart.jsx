import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function RiskChart({ telemetryData = [], currentFrameIndex = 0 }) {
  // Sample telemetry data for clean chart display (e.g. 50-60 points)
  const chartData = React.useMemo(() => {
    if (!telemetryData || telemetryData.length === 0) return [];

    const step = Math.max(1, Math.floor(telemetryData.length / 50));
    const points = [];

    for (let i = 0; i < telemetryData.length; i += step) {
      const item = telemetryData[i];
      points.push({
        time: item.timestamp_sec,
        timeStr: `${item.timestamp_sec.toFixed(1)}s`,
        risk: Math.round(item.overall_risk_score),
        ttc: item.min_ttc,
        frameIndex: i,
      });
    }
    return points;
  }, [telemetryData]);

  const currentTime = (currentFrameIndex / 25.0).toFixed(1);

  return (
    <div className="flex flex-col rounded-2xl border border-cyan-500/20 bg-dark-850 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold font-mono tracking-wider text-slate-100 uppercase">
            REAL-TIME RISK TRAJECTORY (RISK SCORE VS TIME)
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span>T = <strong className="text-cyan-300">{currentTime}s</strong></span>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <XAxis 
              dataKey="timeStr" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              fontFamily="monospace"
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              fontFamily="monospace"
              ticks={[0, 30, 50, 70, 100]}
            />
            
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-2 rounded bg-dark-900 border border-slate-700 text-xs font-mono shadow-xl">
                      <div className="text-slate-400">Timestamp: <span className="text-white">{data.timeStr}</span></div>
                      <div className="text-cyan-400 font-bold">Risk Score: {data.risk}/100</div>
                      {data.ttc && <div className="text-amber-400">TTC: {data.ttc}s</div>}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Threshold Reference Lines */}
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={50} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.3} />

            {/* Current Playhead Cursor */}
            <ReferenceLine x={`${currentTime}s`} stroke="#06b6d4" strokeWidth={2} />

            <Area 
              type="monotone" 
              dataKey="risk" 
              stroke="#ef4444" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#riskGrad)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 0-30 LOW</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 31-50 MODERATE</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> 51-70 HIGH</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> 71-100 CRITICAL</span>
        </div>
        <span>PREDICTIVE ACCUMULATION PROFILE</span>
      </div>
    </div>
  );
}
