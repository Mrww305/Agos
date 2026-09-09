import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  ListTree, 
  Database, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Radio, 
  ShieldCheck,
  Terminal,
  Server
} from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { ViewType } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavItem {
  id: ViewType;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'command-center',
    label: 'Command Center',
    icon: LayoutDashboard,
    description: 'Kernel telemetry & active agents',
  },
  {
    id: 'agent-forge',
    label: 'Agent Forge',
    icon: Cpu,
    badge: 'Gemini 1.5',
    description: 'System prompts & simulation',
  },
  {
    id: 'task-orchestrator',
    label: 'Task Orchestrator',
    icon: ListTree,
    description: 'Supabase task queue & logs',
  },
  {
    id: 'cognitive-memory',
    label: 'Cognitive Memory',
    icon: Database,
    badge: 'pgvector',
    description: 'Semantic clusters & embeddings',
  },
];

export const Sidebar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    isSidebarCollapsed, 
    toggleSidebar,
    agents,
    tasks,
    systemMetrics
  } = useAgentStore();

  const activeAgentsCount = agents.filter(a => a.status !== 'paused' && a.status !== 'idle').length;
  const pendingTasksCount = tasks.filter(t => t.status === 'processing' || t.status === 'pending').length;

  return (
    <motion.aside
      id="agentos-sidebar"
      initial={false}
      animate={{ width: isSidebarCollapsed ? 76 : 270 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-30 flex flex-col h-screen shrink-0 border-r border-[#1F1F23] bg-[#0C0C0E]/90 backdrop-blur-2xl text-[#FAFAFA] select-none"
    >
      {/* Top Header / Branding */}
      <div className="h-16 flex items-center px-4 justify-between border-b border-[#1F1F23]/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-[0_0_15px_rgba(99,102,241,0.35)] shrink-0 border border-white/20">
            <Terminal className="w-5 h-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0A0A0B] animate-pulse" />
          </div>

          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold tracking-tight text-sm text-[#FAFAFA]">AgentOS</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-blue-300/90 border border-white/[0.08]">
                    v3.2
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block" />
                  Kernel Online
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle button */}
        <button
          id="sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {!isSidebarCollapsed && (
          <div className="px-3 pb-1 text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
            Platform Modules
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "group relative w-full flex items-center rounded-xl transition-all duration-200 text-left",
                isSidebarCollapsed ? "justify-center p-3" : "px-3 py-2.5 gap-3",
                isActive 
                  ? "bg-white/[0.08] text-white shadow-[0_0_20px_rgba(255,255,255,0.03)] border border-white/[0.1]" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
              )}
            >
              {/* Active glow indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <div className={cn(
                "relative flex items-center justify-center shrink-0 transition-colors",
                isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200"
              )}>
                <Icon className="w-5 h-5" />
              </div>

              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="truncate">
                    <div className="text-xs font-medium tracking-tight text-zinc-100">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {item.description}
                    </div>
                  </div>

                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium tracking-tight bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'command-center' && activeAgentsCount > 0 && !item.badge && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {activeAgentsCount}
                    </span>
                  )}
                  {item.id === 'task-orchestrator' && pendingTasksCount > 0 && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {pendingTasksCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Live System Diagnostics Mini Widget */}
        {!isSidebarCollapsed && (
          <div className="pt-6 px-1">
            <div className="p-3 rounded-xl bg-[#141418]/80 border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5 font-mono">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  Gateway Latency
                </span>
                <span className="font-mono text-emerald-400 text-[11px]">
                  {systemMetrics.apiLatencyMs}ms
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (systemMetrics.cpuKernelUsage / 100) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>CPU: {systemMetrics.cpuKernelUsage}%</span>
                <span>Mem: {systemMetrics.memoryUsedGb} / {systemMetrics.memoryTotalGb}GB</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Environment Status */}
      <div className="p-3 border-t border-[#1F1F23]/80 bg-[#0A0A0B]/60">
        <div className={cn(
          "flex items-center rounded-xl p-2 bg-white/[0.02] border border-white/[0.04]",
          isSidebarCollapsed ? "justify-center" : "gap-2.5"
        )}>
          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center border border-white/[0.08] text-zinc-300 shrink-0">
            <Server className="w-4 h-4 text-zinc-400" />
          </div>

          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-zinc-200 truncate flex items-center gap-1.5">
                <span>Isolated MicroVM</span>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-[10px] font-mono text-zinc-500 truncate">
                cgroups v2 • Sandboxed
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
