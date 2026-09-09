import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Sparkles, 
  Play, 
  Pause, 
  ArrowUpRight, 
  Clock, 
  TrendingUp, 
  HardDrive, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Server,
  Zap
} from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { THROUGHPUT_HISTORY } from '../../data/mockData';
import { Agent, AgentStatus } from '../../types';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export const CommandCenter: React.FC = () => {
  const { 
    systemMetrics, 
    agents, 
    setCurrentView, 
    selectAgent, 
    toggleAgentStatus, 
    tasks,
    setSelectedTask
  } = useAgentStore();

  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ time: string; tasks: number; latency: number } | null>(null);

  const throughputData = THROUGHPUT_HISTORY[timeRange] || THROUGHPUT_HISTORY['1h'];

  // Calculate SVG coordinates for the minimalist chart
  const maxTasks = Math.max(...throughputData.map(d => d.tasks), 100);
  const minTasks = Math.min(...throughputData.map(d => d.tasks), 0);
  const chartHeight = 140;
  const chartWidth = 500;

  const points = throughputData.map((d, index) => {
    const x = (index / (throughputData.length - 1)) * chartWidth;
    const y = chartHeight - ((d.tasks - minTasks) / (maxTasks - minTasks || 1)) * (chartHeight - 30) - 15;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    // smooth bezier curve
    const prev = points[i - 1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${p.x},${p.y}`;
  }, '');

  const areaD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'reasoning':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            Reasoning
          </span>
        );
      case 'executing':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Executing
          </span>
        );
      case 'waiting':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Waiting
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Paused
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Idle
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Kernel CPU */}
        <div className="p-4 rounded-2xl bg-[#121216]/80 border border-white/[0.07] backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2 font-mono">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Kernel CPU Quota
            </span>
            <span className="text-emerald-400 flex items-center text-[10px]">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Normal
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-white font-mono">
              {systemMetrics.cpuKernelUsage}%
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">2.0 VCPUs</span>
          </div>
          <div className="mt-3 w-full bg-zinc-800/80 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              style={{ width: `${systemMetrics.cpuKernelUsage}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Memory Allocated */}
        <div className="p-4 rounded-2xl bg-[#121216]/80 border border-white/[0.07] backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2 font-mono">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              Isolated Memory
            </span>
            <span className="text-zinc-500 text-[10px] font-mono">cgroups v2</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-white font-mono">
              {systemMetrics.memoryUsedGb}
            </span>
            <span className="text-xs text-zinc-500 font-mono">/ {systemMetrics.memoryTotalGb} GB</span>
          </div>
          <div className="mt-3 w-full bg-zinc-800/80 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              style={{ width: `${(systemMetrics.memoryUsedGb / systemMetrics.memoryTotalGb) * 100}%` }}
            />
          </div>
        </div>

        {/* Metric 3: API Gateway Latency */}
        <div className="p-4 rounded-2xl bg-[#121216]/80 border border-white/[0.07] backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2 font-mono">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Gateway Ingress
            </span>
            <span className="text-emerald-400 text-[10px] font-mono">p95: {systemMetrics.p95LatencyMs}ms</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-emerald-400 font-mono">
              {systemMetrics.apiLatencyMs}ms
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">p99: {systemMetrics.p99LatencyMs}ms</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>0 dropped packets</span>
            <span className="text-emerald-400/90 font-medium">99.98% SLA</span>
          </div>
        </div>

        {/* Metric 4: Tasks Success Rate */}
        <div className="p-4 rounded-2xl bg-[#121216]/80 border border-white/[0.07] backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.14] transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Task Execution SLA
            </span>
            <span className="text-zinc-500 text-[10px] font-mono">24h rolling</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-white font-mono">
              {systemMetrics.tasksSuccessRate}%
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">{systemMetrics.tasksCompletedToday} tasks</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>Active Workers: {systemMetrics.activeAgentsCount}</span>
            <span className="text-indigo-400">0 Critical Errors</span>
          </div>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Task Throughput Chart + Fleet Quick Stats */}
        <div className="lg:col-span-8 space-y-6">
          {/* Bento Cell 1: Sleek Minimalist Line Chart */}
          <div className="p-6 rounded-2xl bg-[#121216]/80 border border-white/[0.07] backdrop-blur-xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white tracking-tight">
                    Task Throughput & Execution Dynamics
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Autonomous agent jobs executed and committed to Supabase storage.
                </p>
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center p-1 rounded-lg bg-zinc-900/90 border border-white/[0.08] self-start sm:self-auto">
                {(['1h', '6h', '24h', '7d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors",
                      timeRange === range
                        ? "bg-white/[0.1] text-white font-medium shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Minimalist Chart */}
            <div className="relative w-full h-[170px] select-none">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="throughputAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                    <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="throughputLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="60%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                {[0.25, 0.5, 0.75].map((frac) => (
                  <line
                    key={frac}
                    x1="0"
                    y1={chartHeight * frac}
                    x2={chartWidth}
                    y2={chartHeight * frac}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Area fill */}
                <path d={areaD} fill="url(#throughputAreaGradient)" />

                {/* Main line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#throughputLineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="fill-indigo-500 stroke-[#0A0A0B] stroke-2 hover:r-6 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredDataPoint(p.data)}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    />
                  </g>
                ))}
              </svg>

              {/* Hover tooltip */}
              {hoveredDataPoint && (
                <div className="absolute top-2 right-4 px-3 py-2 rounded-xl bg-zinc-900/95 border border-white/[0.12] shadow-xl text-xs font-mono space-y-0.5 pointer-events-none">
                  <div className="text-zinc-400 text-[10px]">{hoveredDataPoint.time}</div>
                  <div className="text-indigo-300 font-semibold">{hoveredDataPoint.tasks} tasks / interval</div>
                  <div className="text-emerald-400 text-[10px]">avg latency: {hoveredDataPoint.latency}ms</div>
                </div>
              )}
            </div>

            {/* Bottom Chart Axis Labels */}
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mt-2 px-1">
              {throughputData.map((d, i) => (
                <span key={i}>{d.time}</span>
              ))}
            </div>
          </div>

          {/* Bento Cell 2: Live Agent Ingress & Execution Queue Ticker */}
          <div className="p-6 rounded-2xl bg-[#121216]/80 border border-white/[0.07] backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Live Kernel Task Dispatcher</h3>
              </div>
              <button
                onClick={() => setCurrentView('task-orchestrator')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition-colors"
              >
                <span>Inspect All ({tasks.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Recent Tasks List */}
            <div className="divide-y divide-white/[0.04] text-xs">
              {tasks.slice(0, 4).map((task) => (
                <div 
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setCurrentView('task-orchestrator');
                  }}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[11px] text-zinc-500 shrink-0">
                      {task.id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] text-zinc-300 border border-white/[0.08] shrink-0">
                      {task.agentName}
                    </span>
                    <p className="text-zinc-300 truncate text-xs">
                      {task.promptSnippet}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px]",
                      task.status === 'processing' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                      task.status === 'completed' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                      task.status === 'failed' && "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                      task.status === 'pending' && "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    )}>
                      {task.status}
                    </span>
                    <span className="text-zinc-500 hidden sm:inline">
                      {task.durationSeconds}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Active Agents List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-[#121216]/80 border border-white/[0.07] backdrop-blur-xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Active Agent Fleet</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {agents.length} provisioned
              </span>
            </div>

            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/90 border border-white/[0.08] flex items-center justify-center text-indigo-400 font-mono text-xs font-semibold">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-medium text-white">{agent.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-500">{agent.version}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block truncate max-w-[150px]">
                          {agent.role}
                        </span>
                      </div>
                    </div>

                    {getStatusBadge(agent.status)}
                  </div>

                  {/* Current task snippet */}
                  <div className="bg-[#0A0A0B]/60 p-2 rounded-lg border border-white/[0.04] text-[11px] text-zinc-400 font-mono mb-2.5 truncate">
                    <span className="text-indigo-400 mr-1">$</span>
                    {agent.currentTaskSnippet || 'Idle. Awaiting execution trigger.'}
                  </div>

                  {/* Micro stats & Controls */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/[0.04]">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {(agent.tokensProcessed / 1000).toFixed(0)}k toks
                    </span>
                    <span>{agent.memoryUsageMb} MB</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleAgentStatus(agent.id)}
                        title={agent.status === 'paused' ? 'Resume Agent' : 'Pause Agent'}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        {agent.status === 'paused' ? (
                          <Play className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Pause className="w-3 h-3 text-amber-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          selectAgent(agent.id);
                          setCurrentView('agent-forge');
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Create new agent CTA */}
            <button
              onClick={() => setCurrentView('agent-forge')}
              className="mt-4 w-full py-2 px-3 rounded-xl border border-dashed border-white/[0.15] hover:border-indigo-500/50 hover:bg-indigo-500/[0.04] text-xs font-mono text-zinc-400 hover:text-indigo-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Forge New Autonomous Agent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
