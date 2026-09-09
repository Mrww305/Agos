import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useAgentStore } from '../store/useAgentStore';
import { Task, Agent, TaskStatus } from '../types';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

let realtimeChannel: RealtimeChannel | null = null;

/**
 * Initializes Supabase Realtime WebSocket subscriptions for AgentOS
 * Binds directly to the PostgreSQL publication: `supabase_realtime`
 */
export function initSupabaseRealtime() {
  if (!supabase) {
    console.info('[AgentOS Realtime] No VITE_SUPABASE_URL provided. Operating in Edge Emulation mode.');
    return () => {};
  }

  const store = useAgentStore.getState();

  // Create unified Realtime channel
  realtimeChannel = supabase.channel('agentos-live-telemetry')
    // 1. Subscribe to Task table changes (INSERT & UPDATE)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      (payload) => {
        const { eventType, new: newRecord } = payload;
        if (!newRecord) return;

        if (eventType === 'INSERT') {
          const incomingTask: Task = {
            id: newRecord.id,
            agentId: newRecord.agent_id,
            agentName: newRecord.agent_name,
            promptSnippet: newRecord.prompt_snippet,
            fullPrompt: newRecord.full_prompt,
            status: newRecord.status as TaskStatus,
            priority: newRecord.priority,
            enqueuedAt: newRecord.enqueued_at,
            startedAt: newRecord.started_at,
            completedAt: newRecord.completed_at,
            durationSeconds: parseFloat(newRecord.duration_seconds) || 0,
            outputSummary: newRecord.output_summary,
            tokensUsed: newRecord.tokens_used || 0,
            costUsd: parseFloat(newRecord.cost_usd) || 0,
            logs: newRecord.logs || [],
          };

          // Prepend new task to queue
          useAgentStore.setState((state) => ({
            tasks: [incomingTask, ...state.tasks.filter((t) => t.id !== incomingTask.id)],
          }));
        } else if (eventType === 'UPDATE') {
          useAgentStore.setState((state) => ({
            tasks: state.tasks.map((task) => {
              if (task.id === newRecord.id) {
                return {
                  ...task,
                  status: newRecord.status as TaskStatus,
                  startedAt: newRecord.started_at || task.startedAt,
                  completedAt: newRecord.completed_at || task.completedAt,
                  durationSeconds: parseFloat(newRecord.duration_seconds) || task.durationSeconds,
                  outputSummary: newRecord.output_summary || task.outputSummary,
                  tokensUsed: newRecord.tokens_used || task.tokensUsed,
                  costUsd: parseFloat(newRecord.cost_usd) || task.costUsd,
                  logs: newRecord.logs || task.logs,
                };
              }
              return task;
            }),
          }));
        }
      }
    )
    // 2. Subscribe to Agent table changes (Agent status & token metrics)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'agents' },
      (payload) => {
        const { new: newAgent } = payload;
        if (!newAgent) return;

        store.updateAgent(newAgent.id, {
          status: newAgent.status,
          activeTaskId: newAgent.active_task_id || undefined,
          currentTaskSnippet: newAgent.current_task_snippet || undefined,
          tokensProcessed: parseInt(newAgent.tokens_processed, 10) || 0,
        });
      }
    )
    // 3. Subscribe to System Health Metrics broadcasts
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'system_health_metrics' },
      (payload) => {
        const { new: metrics } = payload;
        if (!metrics) return;

        store.updateMetrics({
          cpuKernelUsage: parseFloat(metrics.cpu_kernel_usage),
          memoryUsedGb: parseFloat(metrics.memory_used_gb),
          apiLatencyMs: metrics.api_latency_ms,
          gatewayStatus: metrics.gateway_status,
        });
      }
    )
    .subscribe((status) => {
      console.info(`[AgentOS Realtime] Subscription status: ${status}`);
    });

  return () => {
    if (realtimeChannel) {
      supabase?.removeChannel(realtimeChannel);
    }
  };
}
