export type ViewType = 'command-center' | 'agent-forge' | 'task-orchestrator' | 'cognitive-memory';

export type AgentStatus = 'idle' | 'reasoning' | 'executing' | 'waiting' | 'paused';

export interface LLMModel {
  id: string;
  name: string;
  provider: 'Google DeepMind' | 'Anthropic' | 'OpenAI' | 'Meta';
  contextWindow: string;
  speed: 'Ultra Fast' | 'Fast' | 'Balanced';
  badge?: string;
  recommended?: boolean;
  description: string;
}

export interface ToolPermission {
  id: string;
  name: string;
  description: string;
  category: 'System' | 'Database' | 'Network' | 'File';
  enabled: boolean;
  requiresConfirmation: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  avatar: string;
  version: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  tools: ToolPermission[];
  tokensProcessed: number;
  activeTaskId?: string;
  currentTaskSnippet?: string;
  memoryUsageMb: number;
  uptimeHours: number;
}

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'trace';
  message: string;
  details?: Record<string, unknown> | string;
}

export interface Task {
  id: string;
  agentId: string;
  agentName: string;
  promptSnippet: string;
  fullPrompt: string;
  status: TaskStatus;
  priority: TaskPriority;
  enqueuedAt: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds: number;
  outputSummary?: string;
  tokensUsed: number;
  costUsd: number;
  logs: TaskLogEntry[];
}

export interface MemoryVector {
  id: string;
  agentId: string;
  cluster: string;
  clusterColor: string;
  content: string;
  embeddingSnippet: number[];
  dimensions: number;
  similarity: number; // 0 to 1
  createdAt: string;
  accessCount: number;
  tags: string[];
  coordinate: {
    x: number;
    y: number;
  };
}

export interface SystemHealthMetrics {
  cpuKernelUsage: number; // percentage
  memoryUsedGb: number;
  memoryTotalGb: number;
  apiLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  activeAgentsCount: number;
  totalAgentsCount: number;
  tasksCompletedToday: number;
  tasksSuccessRate: number; // percentage
  gatewayStatus: 'healthy' | 'degraded' | 'offline';
}

export interface ThroughputDataPoint {
  time: string;
  tasks: number;
  latency: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  thoughts?: string[];
  toolCalls?: {
    toolName: string;
    args: string;
    result: string;
    status: 'success' | 'running' | 'error';
  }[];
  tokens?: number;
}
