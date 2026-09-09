import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Bell, 
  Radio, 
  Command, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  Layers
} from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { ViewType } from '../../types';

export const Header: React.FC = () => {
  const { currentView, setCurrentView, systemMetrics, createNewTask } = useAgentStore();
  const [time, setTime] = useState<string>('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskPrompt, setNewTaskPrompt] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const getViewTitle = (view: ViewType) => {
    switch (view) {
      case 'command-center':
        return { title: 'Command Center', subtitle: 'Kernel Telemetry & Active Agent Fleet' };
      case 'agent-forge':
        return { title: 'The Agent Forge', subtitle: 'Prompt Engineering & Real-time Gemini Simulation' };
      case 'task-orchestrator':
        return { title: 'Task Orchestrator', subtitle: 'Supabase Task Queue & Execution Logs' };
      case 'cognitive-memory':
        return { title: 'Cognitive Memory', subtitle: 'pgvector Semantic Clusters & 1536-dim Inspection' };
    }
  };

  const handleQuickDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskPrompt.trim()) return;
    createNewTask(newTaskPrompt);
    setNewTaskPrompt('');
    setIsTaskModalOpen(false);
    setCurrentView('task-orchestrator');
  };

  const currentInfo = getViewTitle(currentView);

  return (
    <header className="h-16 shrink-0 border-b border-[#1F1F23] bg-[#0A0A0B]/80 backdrop-blur-xl px-6 flex items-center justify-between z-20">
      {/* Left Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-zinc-500">AgentOS</span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <h1 className="text-sm font-semibold tracking-tight text-[#FAFAFA]">
              {currentInfo.title}
            </h1>
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls & Telemetry Badges */}
      <div className="flex items-center gap-3">
        {/* Status Indicators */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gateway: 24ms</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Gemini 1.5 Pro</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1 text-zinc-400">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>{time || '12:00:00 UTC'}</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <button
          id="btn-quick-new-task"
          onClick={() => setIsTaskModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all cursor-pointer border border-white/10"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Dispatch Task</span>
        </button>

        <button
          id="btn-switch-to-forge"
          onClick={() => setCurrentView('agent-forge')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Forge Agent</span>
        </button>
      </div>

      {/* Quick Task Dispatch Dialog */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#121216] border border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Dispatch New Autonomous Task</h3>
                  <p className="text-xs text-zinc-400">Enqueues instruction into the Supabase agent scheduler</p>
                </div>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickDispatch} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  Task Prompt / Execution Directives:
                </label>
                <textarea
                  value={newTaskPrompt}
                  onChange={(e) => setNewTaskPrompt(e.target.value)}
                  placeholder="e.g. Audit security tokens in api gateway or cluster memory vectors with cosine metric..."
                  rows={4}
                  className="w-full rounded-xl bg-zinc-900/90 border border-white/[0.08] p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md"
                >
                  Enqueue to Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
