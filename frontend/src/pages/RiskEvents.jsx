import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  ShieldAlert, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Clock, 
  Car, 
  Users 
} from 'lucide-react';

const SAMPLE_EVENTS = [
  {
    id: 'EV-101',
    scenario_type: 'pedestrian_collision_risk',
    scenario_name: 'Pedestrian Collision Risk',
    severity: 'CRITICAL',
    risk_score: 84.0,
    timestamp: '00:04.80',
    ttc_seconds: 2.1,
    description: 'Vehicle #1 on direct converging trajectory with Person #2 crossing the lane at marked crosswalk.',
    involved_objects: [1, 2],
    recommended_action: 'EMERGENCY BRAKE – PEDESTRIAN CROSSING',
    scenario_category: 'Scenario A'
  },
  {
    id: 'EV-102',
    scenario_type: 'pedestrian_collision_risk',
    scenario_name: 'Pedestrian Collision Risk',
    severity: 'HIGH',
    risk_score: 68.0,
    timestamp: '00:03.20',
    ttc_seconds: 3.4,
    description: 'Vehicle #1 approaching pedestrian crossing zone while Person #2 begins lane entry.',
    involved_objects: [1, 2],
    recommended_action: 'SLOW DOWN – YIELD TO PEDESTRIAN',
    scenario_category: 'Scenario A'
  },
  {
    id: 'EV-201',
    scenario_type: 'rear_end_collision_risk',
    scenario_name: 'Rear-End Collision Risk',
    severity: 'CRITICAL',
    risk_score: 88.0,
    timestamp: '00:03.60',
    ttc_seconds: 1.9,
    description: 'Trailing Vehicle #2 closing rapidly on decelerating lead Vehicle #1 with critical differential closing rate.',
    involved_objects: [1, 2],
    recommended_action: 'HARD BRAKE – RAPID REAR-END CLOSING',
    scenario_category: 'Scenario B'
  },
  {
    id: 'EV-202',
    scenario_type: 'rear_end_collision_risk',
    scenario_name: 'Rear-End Collision Risk',
    severity: 'HIGH',
    risk_score: 64.0,
    timestamp: '00:02.40',
    ttc_seconds: 3.2,
    description: 'Vehicle #2 closing speed elevated above safety threshold behind lead Vehicle #1.',
    involved_objects: [1, 2],
    recommended_action: 'APPLY BRAKES – HIGH CLOSING SPEED',
    scenario_category: 'Scenario B'
  },
  {
    id: 'EV-301',
    scenario_type: 'vehicle_to_vehicle_risk',
    scenario_name: 'Converging Vehicles Risk',
    severity: 'CRITICAL',
    risk_score: 86.0,
    timestamp: '00:04.20',
    ttc_seconds: 2.0,
    description: 'Vehicle #1 (Eastbound) and Vehicle #2 (Southbound) entering intersection with intersecting predicted paths.',
    involved_objects: [1, 2],
    recommended_action: 'CRITICAL: YIELD RIGHT OF WAY AT JUNCTION',
    scenario_category: 'Scenario C'
  },
  {
    id: 'EV-401',
    scenario_type: 'unsafe_following_distance',
    scenario_name: 'Unsafe Following Distance',
    severity: 'HIGH',
    risk_score: 64.0,
    timestamp: '00:05.10',
    ttc_seconds: null,
    description: 'Vehicle #2 tailgating Vehicle #1 with headway under 1.2 seconds at 55 km/h.',
    involved_objects: [1, 2],
    recommended_action: 'INCREASE FOLLOWING DISTANCE (2-SEC GAP)',
    scenario_category: 'Scenario D'
  },
  {
    id: 'EV-501',
    scenario_type: 'wrong_way_movement',
    scenario_name: 'Wrong-Way Vehicle Hazard',
    severity: 'CRITICAL',
    risk_score: 95.0,
    timestamp: '00:03.80',
    ttc_seconds: 1.6,
    description: 'Vehicle #2 traveling westbound against traffic flow in eastbound corridor heading toward Vehicle #1.',
    involved_objects: [1, 2],
    recommended_action: 'HEAD-ON COLLISION THREAT – STOP & EVADE',
    scenario_category: 'Scenario E'
  },
  {
    id: 'EV-601',
    scenario_type: 'sudden_obstacle',
    scenario_name: 'Sudden Stationary Obstacle',
    severity: 'HIGH',
    risk_score: 69.0,
    timestamp: '00:06.30',
    ttc_seconds: 2.6,
    description: 'Vehicle closing fast on stationary stopped truck in right lane.',
    involved_objects: [1, 3],
    recommended_action: 'SLOW DOWN – STATIONARY HAZARD AHEAD',
    scenario_category: 'Scenario F'
  }
];

export default function RiskEvents({ setActiveTab }) {
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedScenario, setSelectedScenario] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = SAMPLE_EVENTS.filter((ev) => {
    const matchesSeverity = selectedSeverity === 'ALL' || ev.severity === selectedSeverity;
    const matchesScenario = selectedScenario === 'ALL' || ev.scenario_type === selectedScenario;
    const matchesSearch = searchQuery === '' || 
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.recommended_action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.scenario_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesScenario && matchesSearch;
  });

  const getSeverityBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-500/50';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-400 border-orange-500/50';
      case 'MODERATE':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/50';
      default:
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-wide">
          ROAD SAFETY RISK EVENTS CATALOG
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Historical record of dangerous traffic events classified across Scenarios A through F with trajectory kinematics.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-dark-850 border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search events by vehicle ID, scenario, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                selectedSeverity === sev
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-dark-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Scenario Filter */}
        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          className="bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
        >
          <option value="ALL">All Scenarios (A - F)</option>
          <option value="pedestrian_collision_risk">Scenario A – Pedestrian Risk</option>
          <option value="rear_end_collision_risk">Scenario B – Rear-End Risk</option>
          <option value="vehicle_to_vehicle_risk">Scenario C – Converging Vehicles</option>
          <option value="unsafe_following_distance">Scenario D – Unsafe Headway</option>
          <option value="wrong_way_movement">Scenario E – Wrong-Way Movement</option>
          <option value="sudden_obstacle">Scenario F – Sudden Obstacle</option>
        </select>

      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((ev) => (
          <div
            key={ev.id}
            className="p-4 rounded-2xl border border-slate-800 bg-dark-850 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {ev.id}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    [{ev.timestamp}]
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border uppercase ${getSeverityBadge(ev.severity)}`}>
                    {ev.severity} ({ev.risk_score})
                  </span>
                </div>
              </div>

              <div className="mt-2">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 bg-dark-900 px-2 py-0.5 rounded border border-slate-800">
                  {ev.scenario_category} • {ev.scenario_name}
                </span>
                <p className="text-xs sm:text-sm text-slate-200 font-medium mt-2 leading-relaxed">
                  {ev.description}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {ev.ttc_seconds && (
                  <span className="font-mono text-amber-300 text-[11px]">
                    TTC: <strong>{ev.ttc_seconds}s</strong>
                  </span>
                )}
                <span className="text-slate-400 text-[11px] font-mono">
                  Action: <strong className="text-slate-200">{ev.recommended_action}</strong>
                </span>
              </div>

              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-1.5 rounded-lg bg-dark-800 hover:bg-cyan-600 text-slate-400 hover:text-white transition-colors"
                title="View in Live Dashboard"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
