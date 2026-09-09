import { create } from 'zustand';
import { 
  Agent, 
  ChatMessage, 
  MemoryVector, 
  SystemHealthMetrics, 
  Task, 
  TaskStatus, 
  ViewType 
} from '../types';
import { 
  AVAILABLE_MODELS, 
  INITIAL_AGENTS, 
  INITIAL_MEMORY_VECTORS, 
  INITIAL_TASKS, 
  SYSTEM_METRICS 
} from '../data/mockData';

interface AgentState {
  // Navigation & Layout
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // System Health
  systemMetrics: SystemHealthMetrics;
  updateMetrics: (partial: Partial<SystemHealthMetrics>) => void;

  // Active Agents
  agents: Agent[];
  selectedAgentId: string;
  selectAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  toggleAgentStatus: (id: string) => void;

  // Agent Forge (Builder & Configuration)
  draftAgent: Agent;
  setDraftAgent: (agent: Agent) => void;
  updateDraftAgent: (updates: Partial<Agent>) => void;
  toggleDraftTool: (toolId: string) => void;
  forgeChatHistory: ChatMessage[];
  isSimulating: boolean;
  sendSimulationMessage: (userText: string) => void;
  clearSimulationChat: () => void;
  saveDraftToAgentList: () => void;

  // Task Orchestrator
  tasks: Task[];
  taskViewMode: 'table' | 'kanban';
  setTaskViewMode: (mode: 'table' | 'kanban') => void;
  taskFilterStatus: 'all' | TaskStatus;
  setTaskFilterStatus: (status: 'all' | TaskStatus) => void;
  taskSearchQuery: string;
  setTaskSearchQuery: (query: string) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  createNewTask: (prompt: string, agentId?: string) => void;

  // Cognitive Memory
  memoryVectors: MemoryVector[];
  selectedVector: MemoryVector | null;
  setSelectedVector: (vector: MemoryVector | null) => void;
  memorySearchQuery: string;
  setMemorySearchQuery: (query: string) => void;
  selectedCluster: string;
  setSelectedCluster: (cluster: string) => void;
  deleteVector: (id: string) => void;
}

const DEFAULT_SIMULATION_CHAT: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'system',
    content: 'Simulation sandbox initialized with Gemini 1.5 Pro kernel. Memory vectors and microVM tool execution mounted.',
    timestamp: '12:44:00',
  },
  {
    id: 'msg-2',
    sender: 'user',
    content: 'Inspect the Envoy gateway routing tables and identify why EU-West p95 latency spiked by 35ms.',
    timestamp: '12:44:12',
  },
  {
    id: 'msg-3',
    sender: 'agent',
    content: `I've analyzed the routing matrix and telemetry logs. The root cause is a skewed ingress load distribution following cluster node failover in eu-west-1b. 

I've dynamically rebalanced the weight allocations to shift 25% of synthetic and non-critical traffic to the Frankfurt backup gateway.`,
    timestamp: '12:44:16',
    thoughts: [
      'Decomposing telemetry into 5-minute rolling percentiles across 3 regions',
      'Querying pgvector for prior incident runbook on Envoy ingress failover (cosine similarity: 0.942)',
      'Identified node eu-west-1b CPU throttle threshold reached (88.4%)',
    ],
    toolCalls: [
      {
        toolName: 'bash-kernel',
        args: 'curl -s http://gateway-internal/telemetry?metric=p95',
        result: '{"eu-west": 142.3, "us-east": 18.2, "ap-se": 24.1}',
        status: 'success',
      },
      {
        toolName: 'pgvector-search',
        args: 'SELECT * FROM agent_memory WHERE similarity > 0.85 LIMIT 2',
        result: 'Found VEC-0982 (Dynamic weighted routing algorithm)',
        status: 'success',
      }
    ],
    tokens: 428,
  }
];

export const useAgentStore = create<AgentState>((set, get) => ({
  // Navigation
  currentView: 'command-center',
  setCurrentView: (view) => set({ currentView: view }),
  isSidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  // System Health
  systemMetrics: SYSTEM_METRICS,
  updateMetrics: (partial) => set((s) => ({ systemMetrics: { ...s.systemMetrics, ...partial } })),

  // Agents
  agents: INITIAL_AGENTS,
  selectedAgentId: INITIAL_AGENTS[0].id,
  selectAgent: (id) => {
    const found = get().agents.find((a) => a.id === id);
    if (found) {
      set({ 
        selectedAgentId: id,
        draftAgent: JSON.parse(JSON.stringify(found)),
      });
    }
  },
  updateAgent: (id, updates) => set((s) => ({
    agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  })),
  toggleAgentStatus: (id) => set((s) => ({
    agents: s.agents.map((a) => {
      if (a.id !== id) return a;
      const nextStatus = a.status === 'paused' ? 'reasoning' : 'paused';
      return { ...a, status: nextStatus };
    }),
  })),

  // Agent Forge
  draftAgent: JSON.parse(JSON.stringify(INITIAL_AGENTS[0])),
  setDraftAgent: (agent) => set({ draftAgent: agent }),
  updateDraftAgent: (updates) => set((s) => ({
    draftAgent: { ...s.draftAgent, ...updates },
  })),
  toggleDraftTool: (toolId) => set((s) => ({
    draftAgent: {
      ...s.draftAgent,
      tools: s.draftAgent.tools.map((t) => 
        t.id === toolId ? { ...t, enabled: !t.enabled } : t
      ),
    },
  })),
  forgeChatHistory: DEFAULT_SIMULATION_CHAT,
  isSimulating: false,
  sendSimulationMessage: (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    set((s) => ({
      forgeChatHistory: [...s.forgeChatHistory, userMsg],
      isSimulating: true,
    }));

    // Realistic multi-step simulated agent reasoning execution
    setTimeout(() => {
      const activeModel = AVAILABLE_MODELS.find(m => m.id === get().draftAgent.model) || AVAILABLE_MODELS[0];
      const hasBash = get().draftAgent.tools.some(t => t.id === 'bash-kernel' && t.enabled);
      const hasVector = get().draftAgent.tools.some(t => t.id === 'pgvector-search' && t.enabled);

      const agentMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        content: `Executed directive under **${get().draftAgent.name}** [${activeModel.name}].\n\n1. Evaluated system constraints against active parameters.\n2. Ingested operational context and verified security bounds.\n3. Verified output against defined criteria with 0 integrity warnings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        thoughts: [
          `Parsing input tokens with ${activeModel.name} context processor`,
          `Checking execution policy: temperature=${get().draftAgent.temperature}, topP=${get().draftAgent.topP}`,
          hasVector ? 'Synthesizing relevant memories via cosine similarity (1536 dims)' : 'Vector search disabled in configuration',
          hasBash ? 'Sandboxed shell environment ready for isolated execution' : 'Shell tool disabled',
        ],
        toolCalls: hasBash ? [
          {
            toolName: 'bash-kernel',
            args: `agentos-exec --agent ${get().draftAgent.id} --eval --safe`,
            result: 'Exit code: 0 [OK]. Output verified in 34ms.',
            status: 'success',
          },
        ] : undefined,
        tokens: Math.floor(180 + Math.random() * 220),
      };

      set((s) => ({
        forgeChatHistory: [...s.forgeChatHistory, agentMsg],
        isSimulating: false,
      }));
    }, 1200);
  },
  clearSimulationChat: () => set({
    forgeChatHistory: [
      {
        id: `msg-${Date.now()}`,
        sender: 'system',
        content: 'Simulation environment reset. Sandbox state refreshed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
    ]
  }),
  saveDraftToAgentList: () => {
    const draft = get().draftAgent;
    set((s) => {
      const existing = s.agents.find(a => a.id === draft.id);
      if (existing) {
        return {
          agents: s.agents.map(a => a.id === draft.id ? draft : a),
        };
      }
      return {
        agents: [draft, ...s.agents],
      };
    });
  },

  // Task Orchestrator
  tasks: INITIAL_TASKS,
  taskViewMode: 'table',
  setTaskViewMode: (mode) => set({ taskViewMode: mode }),
  taskFilterStatus: 'all',
  setTaskFilterStatus: (status) => set({ taskFilterStatus: status }),
  taskSearchQuery: '',
  setTaskSearchQuery: (query) => set({ taskSearchQuery: query }),
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  createNewTask: (prompt: string, agentId?: string) => {
    const targetAgent = get().agents.find(a => a.id === agentId) || get().agents[0];
    const newTask: Task = {
      id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
      agentId: targetAgent.id,
      agentName: targetAgent.name,
      promptSnippet: prompt.slice(0, 75) + (prompt.length > 75 ? '...' : ''),
      fullPrompt: prompt,
      status: 'processing',
      priority: 'high',
      enqueuedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      durationSeconds: 1,
      tokensUsed: 450,
      costUsd: 0.0009,
      logs: [
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          level: 'info',
          message: `Task assigned to agent ${targetAgent.name} via Supabase queue`,
        },
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          level: 'trace',
          message: 'Spinning up isolated microVM container',
        }
      ]
    };

    set((s) => ({
      tasks: [newTask, ...s.tasks],
      selectedTask: newTask,
    }));
  },

  // Cognitive Memory
  memoryVectors: INITIAL_MEMORY_VECTORS,
  selectedVector: INITIAL_MEMORY_VECTORS[0],
  setSelectedVector: (vector) => set({ selectedVector: vector }),
  memorySearchQuery: '',
  setMemorySearchQuery: (query) => set({ memorySearchQuery: query }),
  selectedCluster: 'all',
  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  deleteVector: (id) => set((s) => ({
    memoryVectors: s.memoryVectors.filter(v => v.id !== id),
    selectedVector: s.selectedVector?.id === id ? null : s.selectedVector,
  })),
}));
