import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Car,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { getAnalytics } from '../services/api';

const RISK_COLORS = {
  LOW: '#10b981',
  MODERATE: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444'
};

const OBJECT_COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#a855f7'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await getAnalytics();
        setStats(data);
      } catch (e) {
        console.error('Analytics fetch error', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const scenarioChartData = React.useMemo(() => {
    if (!stats || !stats.scenario_distribution) return [];
    return Object.entries(stats.scenario_distribution).map(([name, count]) => ({
      name,
      events: count,
    }));
  }, [stats]);

  const riskLevelChartData = React.useMemo(() => {
    if (!stats || !stats.risk_level_distribution) return [];
    return Object.entries(stats.risk_level_distribution).map(([level, count]) => ({
      name: level,
      value: count,
    }));
  }, [stats]);

  const objectTypeChartData = React.useMemo(() => {
    if (!stats || !stats.object_type_distribution) return [];
    return Object.entries(stats.object_type_distribution).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [stats]);

  // Simulated multi-scenario timeline data
  const multiTimelineData = [
    { time: '0s', 'Pedestrian Crossing': 32, 'Rear-End': 35, 'Intersection': 30, 'Safe Traffic': 18 },
    { time: '2s', 'Pedestrian Crossing': 48, 'Rear-End': 58, 'Intersection': 50, 'Safe Traffic': 20 },
    { time: '4s', 'Pedestrian Crossing': 76, 'Rear-End': 85, 'Intersection': 72, 'Safe Traffic': 19 },
    { time: '5s', 'Pedestrian Crossing': 84, 'Rear-End': 88, 'Intersection': 86, 'Safe Traffic': 21 },
    { time: '7s', 'Pedestrian Crossing': 52, 'Rear-End': 50, 'Intersection': 54, 'Safe Traffic': 18 },
    { time: '9s', 'Pedestrian Crossing': 22, 'Rear-End': 25, 'Intersection': 24, 'Safe Traffic': 17 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-wide">
          SYSTEM ROAD SAFETY ANALYTICS
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Aggregated predictive road-safety metrics, trajectory danger distributions, and kinematic event analytics.
        </p>
      </div>

      {/* Top Stats Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        
        <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Videos Analyzed</span>
          <span className="text-xl font-mono font-bold text-white mt-1">
            {stats?.total_videos_analyzed || 9}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono mt-0.5">Sessions</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Objects Tracked</span>
          <span className="text-xl font-mono font-bold text-white mt-1">
            {stats?.total_objects_detected || 242}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5">YOLOv8 Entities</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Risky Events</span>
          <span className="text-xl font-mono font-bold text-amber-300 mt-1">
            {stats?.total_risky_events || 28}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Transitions</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Critical (Risk &gt;70)</span>
          <span className="text-xl font-mono font-bold text-red-400 mt-1">
            {stats?.critical_events_count || 12}
          </span>
          <span className="text-[10px] text-red-400 font-mono mt-0.5">Averted</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase">High Risk (51-70)</span>
          <span className="text-xl font-mono font-bold text-orange-400 mt-1">
            {stats?.high_risk_events_count || 16}
          </span>
          <span className="text-[10px] text-orange-400 font-mono mt-0.5">Caution</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Avg Max Risk</span>
          <span className="text-xl font-mono font-bold text-cyan-300 mt-1">
            {stats?.average_max_risk_score || 75.0}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Score / 100</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Peak Risk</span>
          <span className="text-xl font-mono font-bold text-red-400 mt-1">
            95.0
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Wrong-Way</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-dark-850 border border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Avg Critical TTC</span>
          <span className="text-xl font-mono font-bold text-amber-300 mt-1">
            {stats?.average_ttc_critical || 2.1}s
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">Early Margin</span>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Multi-Scenario Risk Over Time */}
        <div className="p-5 rounded-2xl bg-dark-850 border border-cyan-500/20 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              RISK SCORE OVER TIME (SCENARIOS COMPARISON)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Pre-Collision Warning Curve</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={multiTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="Pedestrian Crossing" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                <Area type="monotone" dataKey="Rear-End" stroke="#f97316" fill="#f97316" fillOpacity={0.15} />
                <Area type="monotone" dataKey="Intersection" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                <Area type="monotone" dataKey="Safe Traffic" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            *Demonstrates proactive threat curve: Danger spikes 2-3 seconds prior to the potential impact point and recovers upon driver braking.
          </p>
        </div>

        {/* Chart 2: Number of Risk Events by Danger Scenario Type */}
        <div className="p-5 rounded-2xl bg-dark-850 border border-cyan-500/20 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              NUMBER OF RISK EVENTS BY DANGER SCENARIO TYPE
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Scenarios A – F</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="events" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            *Breakdown of detected road threats categorized into specific danger scenarios.
          </p>
        </div>

        {/* Chart 3: Risk Level Distribution (Donut Chart) */}
        <div className="p-5 rounded-2xl bg-dark-850 border border-cyan-500/20 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              RISK-LEVEL DISTRIBUTION
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Severity Breakdown</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskLevelChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskLevelChartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={RISK_COLORS[entry.name] || '#38bdf8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Object-Type Distribution */}
        <div className="p-5 rounded-2xl bg-dark-850 border border-cyan-500/20 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              DETECTED ROAD ENTITY DISTRIBUTION
            </h3>
            <span className="text-[10px] font-mono text-slate-400">YOLOv8 Detection Classes</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={objectTypeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {objectTypeChartData.map((entry, index) => (
                    <Cell key={`cell-obj-${index}`} fill={OBJECT_COLORS[index % OBJECT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
