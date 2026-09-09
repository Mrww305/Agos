import React, { useState } from 'react';
import { 
  Table, 
  Kanban, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  Hourglass, 
  Layers, 
  X, 
  Copy, 
  RefreshCw, 
  Terminal, 
  ChevronRight, 
  Sparkles,
  Zap,
  ArrowUpDown
} from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const TaskOrchestrator: React.FC = () => {
  const { 
    tasks, 
    taskViewMode, 
    setTaskViewMode, 
    taskFilterStatus, 
    setTaskFilterStatus, 
    taskSearchQuery, 
    setTaskSearchQuery, 
    selectedTask, 
    setSelectedTask,
    createNewTask
  } = useAgentStore();

  const [copiedLog, setCopiedLog] = useState(false);

  // Filter tasks based on query and status
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = taskFilterStatus === 'all' || t.status === taskFilterStatus;
    const matchesQuery = 
      t.promptSnippet.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      t.agentName.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(taskSearchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Hourglass className="w-3 h-3 text-amber-400" />
            Pending
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">CRITICAL</span>;
      case 'high':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">HIGH</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">MEDIUM</span>;
      case 'low':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">LOW</span>;
    }
  };

  const copyTaskLogs = (task: Task) => {
    const formatted = JSON.stringify(task, null, 2);
    navigator.clipboard.writeText(formatted);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121216]/80 border border-white/[0.07] backdrop-blur-xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={taskSearchQuery}
            onChange={(e) => setTaskSearchQuery(e.target.value)}
            placeholder="Filter tasks by prompt, ID, or agent..."
            className="w-full bg-[#18181E] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[#18181E] border border-white/[0.06] text-xs font-mono">
            {(['all', 'processing', 'pending', 'completed', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setTaskFilterStatus(st)}
                className={cn(
                  "px-2.5 py-1 rounded-lg capitalize transition-colors text-xs",
                  taskFilterStatus === st
                    ? "bg-white/[0.1] text-white font-medium"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          {/* View Mode Toggle (Table vs Kanban) */}
          <div className="flex items-center p-1 rounded-xl bg-[#18181E] border border-white/[0.06]">
            <button
              onClick={() => setTaskViewMode('table')}
              title="Data Table View"
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                taskViewMode === 'table' ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTaskViewMode('kanban')}
              title="Kanban Board View"
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                taskViewMode === 'kanban' ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: DATA TABLE */}
      {taskViewMode === 'table' && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#121216]/80 backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-medium">Task ID</th>
                  <th className="py-3.5 px-4 font-medium">Agent</th>
                  <th className="py-3.5 px-4 font-medium">Prompt Snippet</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium">Priority</th>
                  <th className="py-3.5 px-4 font-medium">Duration</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                      No tasks found matching your filter query.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "hover:bg-white/[0.03] transition-colors cursor-pointer group",
                        selectedTask?.id === task.id && "bg-indigo-950/20"
                      )}
                    >
                      {/* Task ID */}
                      <td className="py-3.5 px-4 font-mono text-indigo-400 font-medium">
                        {task.id}
                      </td>

                      {/* Agent */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="font-medium text-zinc-200">{task.agentName}</span>
                          <span className="text-[10px] font-mono text-zinc-500">({task.agentId})</span>
                        </div>
                      </td>

                      {/* Prompt Snippet */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-zinc-300 truncate font-mono text-xs">
                          {task.promptSnippet}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(task.status)}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        {task.durationSeconds > 0 ? `${task.durationSeconds}s` : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] transition-colors"
                        >
                          Inspect Logs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN BOARD */}
      {taskViewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['pending', 'processing', 'completed', 'failed'] as const).map((statusCol) => {
            const colTasks = filteredTasks.filter(t => t.status === statusCol);

            return (
              <div
                key={statusCol}
                className="p-4 rounded-2xl bg-[#121216]/80 border border-white/[0.07] backdrop-blur-xl flex flex-col min-h-[450px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-xs font-semibold text-white">
                      {statusCol}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.12] transition-all cursor-pointer space-y-2.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-indigo-400">{task.id}</span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                        {task.promptSnippet}
                      </p>

                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span className="truncate max-w-[100px] text-zinc-300 font-medium">
                          {task.agentName}
                        </span>
                        <span>{task.durationSeconds}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLIDE-OVER DRAWER: Detailed Execution Logs & Diagnostics */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute inset-y-0 right-0 max-w-2xl w-full bg-[#0E0E12] border-l border-[#1F1F23] shadow-2xl flex flex-col z-50 text-[#FAFAFA]"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#1F1F23] flex items-center justify-between shrink-0 bg-[#121216]/90">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-white">{selectedTask.id}</h2>
                      {getStatusBadge(selectedTask.status)}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Assigned to <strong className="text-zinc-200">{selectedTask.agentName}</strong> ({selectedTask.agentId})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyTaskLogs(selectedTask)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    title="Copy Full JSON Payload"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1">Duration</span>
                    <span className="font-mono text-sm text-white font-semibold">{selectedTask.durationSeconds}s</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1">Tokens Used</span>
                    <span className="font-mono text-sm text-indigo-400 font-semibold">{selectedTask.tokensUsed}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1">Cost (USD)</span>
                    <span className="font-mono text-sm text-emerald-400 font-semibold">${selectedTask.costUsd.toFixed(4)}</span>
                  </div>
                </div>

                {/* Full Prompt Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                    Full Prompt Directives
                  </h3>
                  <div className="p-4 rounded-xl bg-[#09090B] border border-white/[0.06] text-zinc-300 font-mono text-xs leading-relaxed">
                    {selectedTask.fullPrompt}
                  </div>
                </div>

                {/* Output Summary (if completed/failed) */}
                {selectedTask.outputSummary && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                      Execution Output & Result
                    </h3>
                    <div className={cn(
                      "p-4 rounded-xl font-mono text-xs leading-relaxed border",
                      selectedTask.status === 'failed' 
                        ? "bg-rose-950/20 border-rose-500/30 text-rose-300"
                        : "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    )}>
                      {selectedTask.outputSummary}
                    </div>
                  </div>
                )}

                {/* Execution Telemetry Log Stream */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                      Sequential Execution Log Stream ({selectedTask.logs.length} entries)
                    </h3>
                    {copiedLog && (
                      <span className="text-[10px] font-mono text-emerald-400">Copied to clipboard!</span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-[#08080A] border border-white/[0.08] font-mono text-[11px] space-y-2 max-h-80 overflow-y-auto">
                    {selectedTask.logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-zinc-600 shrink-0 select-none">{log.timestamp}</span>
                        <span className={cn(
                          "px-1 rounded text-[9px] uppercase font-bold shrink-0",
                          log.level === 'info' && "bg-blue-500/20 text-blue-300",
                          log.level === 'warn' && "bg-amber-500/20 text-amber-300",
                          log.level === 'error' && "bg-rose-500/20 text-rose-300",
                          log.level === 'trace' && "bg-purple-500/20 text-purple-300"
                        )}>
                          {log.level}
                        </span>
                        <span className={cn(
                          "text-zinc-300 break-all",
                          log.level === 'error' && "text-rose-400 font-semibold"
                        )}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-[#1F1F23] bg-[#121216]/90 flex items-center justify-between">
                <button
                  onClick={() => createNewTask(selectedTask.fullPrompt, selectedTask.agentId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/[0.08] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-dispatch Task</span>
                </button>

                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
