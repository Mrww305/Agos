import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { AgentForge } from './components/forge/AgentForge';
import { TaskOrchestrator } from './components/orchestrator/TaskOrchestrator';
import { CognitiveMemory } from './components/memory/CognitiveMemory';
import { useAgentStore } from './store/useAgentStore';
import { initSupabaseRealtime } from './lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { currentView, systemMetrics, updateMetrics } = useAgentStore();

  // Initialize Supabase Realtime WebSocket connection if configured
  useEffect(() => {
    const cleanup = initSupabaseRealtime();
    return () => {
      cleanup?.();
    };
  }, []);

  // Subtle real-time telemetry simulation fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      const cpuDelta = (Math.random() - 0.5) * 1.5;
      const latencyDelta = (Math.random() - 0.5) * 2;
      updateMetrics({
        cpuKernelUsage: parseFloat(Math.max(12, Math.min(85, systemMetrics.cpuKernelUsage + cpuDelta)).toFixed(1)),
        apiLatencyMs: Math.max(16, Math.min(65, Math.round(systemMetrics.apiLatencyMs + latencyDelta))),
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [systemMetrics, updateMetrics]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0B] text-[#FAFAFA] antialiased select-none font-sans">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <Header />

        {/* View Surface with smooth page transition */}
        <main className="flex-1 overflow-y-auto relative bg-[#0A0A0B]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {currentView === 'command-center' && <CommandCenter />}
              {currentView === 'agent-forge' && <AgentForge />}
              {currentView === 'task-orchestrator' && <TaskOrchestrator />}
              {currentView === 'cognitive-memory' && <CognitiveMemory />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
