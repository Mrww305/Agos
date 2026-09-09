import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Send, 
  Terminal, 
  Database, 
  Check, 
  Trash2, 
  Sliders, 
  ShieldCheck, 
  Save, 
  Play, 
  Info, 
  FileCode, 
  Bot, 
  ArrowRight,
  RefreshCw,
  Zap,
  Globe,
  Radio
} from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { AVAILABLE_MODELS } from '../../data/mockData';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const SYSTEM_PROMPT_TEMPLATES = [
  {
    name: 'Kernel Supervisor',
    prompt: `You are Nexus Prime, the master supervisor agent of AgentOS. 
Your core imperative is orchestrating autonomous sub-agents, verifying task integrity, and maintaining kernel stability.
Always decompose complex user tasks into dependency graphs and execute in atomic stages.`
  },
  {
    name: 'Security Auditor',
    prompt: `You are Aegis Sentinel. You review all outgoing code payloads, API requests, and memory allocations for OWASP vulnerabilities, prompt injection attacks, and resource leaks. Assert timing-safe cryptographic comparisons.`
  },
  {
    name: 'pgvector Synthesizer',
    prompt: `You are Vector Scribe. You continuously ingest unstructured task logs and execution artifacts, generate 1536-dim embeddings, and reconcile semantic clusters in the agent_memory table using cosine similarity <=> operator.`
  },
  {
    name: 'DevOps Terminal Runner',
    prompt: `You are Synthetix CLI, an autonomous terminal operator specialized in compilation, test suites, and containerized deployments within isolated cgroups v2 microVMs.`
  }
];

export const AgentForge: React.FC = () => {
  const { 
    draftAgent, 
    updateDraftAgent, 
    toggleDraftTool, 
    forgeChatHistory, 
    isSimulating, 
    sendSimulationMessage, 
    clearSimulationChat,
    saveDraftToAgentList,
    agents,
    selectAgent
  } = useAgentStore();

  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'prompt' | 'model' | 'tools' | 'parameters'>('prompt');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const estimatedTokens = Math.ceil(draftAgent.systemPrompt.length / 4);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSimulating) return;
    sendSimulationMessage(inputMessage);
    setInputMessage('');
  };

  const handleSave = () => {
    saveDraftToAgentList();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#0A0A0B]">
      {/* LEFT PANE: Agent Configuration & Builder (50%) */}
      <div className="flex-1 flex flex-col border-r border-[#1F1F23] bg-[#0E0E11]/80 backdrop-blur-xl overflow-y-auto">
        {/* Top Header with Agent Identity & Quick Preset Switcher */}
        <div className="p-4 border-b border-[#1F1F23] bg-[#121216]/90 sticky top-0 z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg border border-white/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <input
                  type="text"
                  value={draftAgent.name}
                  onChange={(e) => updateDraftAgent({ name: e.target.value })}
                  className="bg-transparent font-semibold text-sm text-white focus:outline-none focus:bg-white/[0.05] px-1 rounded transition-colors"
                  placeholder="Agent Name"
                />
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="font-mono text-indigo-400">{draftAgent.id}</span>
                  <span>•</span>
                  <input
                    type="text"
                    value={draftAgent.role}
                    onChange={(e) => updateDraftAgent({ role: e.target.value })}
                    className="bg-transparent text-zinc-400 hover:text-zinc-200 focus:outline-none focus:text-white truncate max-w-[200px]"
                    placeholder="Agent Role / Purpose"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md cursor-pointer",
                  saveSuccess 
                    ? "bg-emerald-600 text-white" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                )}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Deploy to Kernel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono">
            {[
              { id: 'prompt', label: 'System Prompt' },
              { id: 'model', label: 'LLM Model', badge: 'Gemini' },
              { id: 'tools', label: 'Tool Permissions', count: draftAgent.tools.filter(t => t.enabled).length },
              { id: 'parameters', label: 'Hyperparameters' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs",
                  activeTab === tab.id 
                    ? "bg-white/[0.1] text-white font-medium shadow-sm border border-white/[0.08]" 
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                    {tab.badge}
                  </span>
                )}
                {tab.count !== undefined && (
                  <span className="text-[10px] px-1.5 rounded-full bg-zinc-800 text-zinc-300">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Areas */}
        <div className="p-6 flex-1 space-y-6">
          {/* TAB 1: System Prompt Editor */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">System Prompt Engineering</h3>
                  <p className="text-xs text-zinc-400">Defines the root behavior, boundaries, and chain-of-thought protocols.</p>
                </div>

                <span className="text-xs font-mono text-zinc-500">
                  ~{estimatedTokens} tokens
                </span>
              </div>

              {/* Template Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-500">Presets:</span>
                {SYSTEM_PROMPT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    onClick={() => updateDraftAgent({ systemPrompt: tpl.prompt })}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] transition-colors"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>

              {/* Rich-feeling Markdown / Code Textarea */}
              <div className="relative rounded-2xl bg-[#09090B] border border-white/[0.09] overflow-hidden focus-within:border-indigo-500/80 transition-colors shadow-inner">
                <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-500">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    <span>system_prompt.md</span>
                  </div>
                  <span>UTF-8 • Markdown</span>
                </div>

                <textarea
                  value={draftAgent.systemPrompt}
                  onChange={(e) => updateDraftAgent({ systemPrompt: e.target.value })}
                  rows={14}
                  className="w-full p-4 bg-transparent font-mono text-xs leading-relaxed text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none"
                  placeholder="Enter system instruction..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: Model Selector (Highlighting Gemini 1.5 Pro & Flash) */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Underlying LLM Architecture</h3>
                <p className="text-xs text-zinc-400">Select model weights optimized for your agent's reasoning depth and latency budget.</p>
              </div>

              <div className="space-y-3">
                {AVAILABLE_MODELS.map((model) => {
                  const isSelected = draftAgent.model === model.id;
                  const isGemini = model.provider === 'Google DeepMind';

                  return (
                    <div
                      key={model.id}
                      onClick={() => updateDraftAgent({ model: model.id })}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
                        isSelected 
                          ? "bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border-indigo-500/80 shadow-[0_0_25px_rgba(99,102,241,0.15)]" 
                          : "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-white/[0.12]"
                      )}
                    >
                      {/* Ambient highlight for Gemini */}
                      {isGemini && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                      )}

                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs shrink-0",
                            isGemini 
                              ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md" 
                              : "bg-zinc-800 text-zinc-300 border border-white/10"
                          )}>
                            <Sparkles className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-white tracking-tight">{model.name}</h4>
                              <span className="text-[10px] font-mono text-zinc-500">{model.provider}</span>
                            </div>
                            {model.badge && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                {model.badge}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                          isSelected ? "border-indigo-500 bg-indigo-600 text-white" : "border-zinc-700"
                        )}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {model.description}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center gap-4 text-[11px] font-mono text-zinc-500">
                        <span>Context: <strong className="text-zinc-300">{model.contextWindow}</strong></span>
                        <span>Latency: <strong className="text-zinc-300">{model.speed}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Tool Permissions Matrix */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Autonomous Tool Capabilities & Sandbox Permissions</h3>
                <p className="text-xs text-zinc-400">Grant or restrict access to system shells, databases, and network adapters.</p>
              </div>

              <div className="space-y-3">
                {draftAgent.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{tool.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                          {tool.category}
                        </span>
                        {tool.requiresConfirmation && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Requires Auth
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => toggleDraftTool(tool.id)}
                      className={cn(
                        "w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 cursor-pointer",
                        tool.enabled ? "bg-indigo-600" : "bg-zinc-800"
                      )}
                    >
                      <motion.div
                        layout
                        className={cn(
                          "w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                          tool.enabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Hyperparameters */}
          {activeTab === 'parameters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Inference Hyperparameters</h3>
                <p className="text-xs text-zinc-400">Fine-tune determinism vs stochastic creativity.</p>
              </div>

              {/* Temperature */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-300">Temperature (Creativity)</span>
                  <span className="text-indigo-400 font-semibold">{draftAgent.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={draftAgent.temperature}
                  onChange={(e) => updateDraftAgent({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>0.0 (Strict / Deterministic)</span>
                  <span>1.0 (High Variance)</span>
                </div>
              </div>

              {/* Top P */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-300">Top-P (Nucleus Sampling)</span>
                  <span className="text-indigo-400 font-semibold">{draftAgent.topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={draftAgent.topP}
                  onChange={(e) => updateDraftAgent({ topP: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Max Tokens */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-300">Max Generation Tokens</span>
                  <span className="text-indigo-400 font-semibold">{draftAgent.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="1024"
                  max="16384"
                  step="1024"
                  value={draftAgent.maxTokens}
                  onChange={(e) => updateDraftAgent({ maxTokens: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Real-time Simulation & Preview Chat Window (50%) */}
      <div className="flex-1 flex flex-col bg-[#0A0A0B] overflow-hidden">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-[#1F1F23] bg-[#0E0E11]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  MicroVM Sandbox Simulation
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {draftAgent.model}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                Isolated sandbox execution • Memory mounted
              </span>
            </div>
          </div>

          <button
            onClick={clearSimulationChat}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Sandbox</span>
          </button>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {forgeChatHistory.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[88%]",
                msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1.5 text-[10px] font-mono text-zinc-500">
                <span>
                  {msg.sender === 'user' ? 'Operator' : msg.sender === 'agent' ? draftAgent.name : 'Kernel Event'}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Body */}
              <div className={cn(
                "p-4 rounded-2xl text-xs leading-relaxed transition-all",
                msg.sender === 'user' 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md"
                  : msg.sender === 'agent'
                  ? "bg-[#141418] border border-white/[0.08] text-zinc-200 rounded-bl-none shadow-sm"
                  : "bg-zinc-900/60 border border-white/[0.04] text-zinc-400 italic text-[11px]"
              )}>
                {/* Agent Thoughts / Reasoning Collapsible Display */}
                {msg.thoughts && msg.thoughts.length > 0 && (
                  <div className="mb-3 p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] font-mono space-y-1.5">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[10px] uppercase">
                      <Sparkles className="w-3 h-3" />
                      <span>Agent Thought Process ({msg.thoughts.length} steps)</span>
                    </div>
                    {msg.thoughts.map((thought, i) => (
                      <div key={i} className="text-zinc-400 pl-3 border-l border-indigo-500/30">
                        {thought}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tool Calls Execution Badges */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {msg.toolCalls.map((call, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[#0A0A0B] border border-white/[0.08] font-mono text-[11px]">
                        <div className="flex items-center justify-between text-blue-400 text-[10px] mb-1">
                          <span className="flex items-center gap-1">
                            <Terminal className="w-3 h-3" />
                            Tool: {call.toolName}
                          </span>
                          <span className="text-emerald-400 font-medium">SUCCESS</span>
                        </div>
                        <div className="text-zinc-400 truncate">$ {call.args}</div>
                        <div className="text-zinc-500 text-[10px] mt-1 truncate">Output: {call.result}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Content */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {msg.tokens && (
                  <div className="mt-2 text-[10px] font-mono text-zinc-500 flex justify-end">
                    ⚡ {msg.tokens} tokens generated
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Reasoning Active Indicator */}
          {isSimulating && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl w-fit"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>{draftAgent.name} is synthesizing reasoning chain via {draftAgent.model}...</span>
            </motion.div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#1F1F23] bg-[#0E0E11]/90">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Send instructions or simulated query to ${draftAgent.name}...`}
              className="w-full bg-[#16161C] border border-white/[0.08] rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors shadow-inner"
              disabled={isSimulating}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSimulating}
              className="absolute right-2 p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
            <span>Press Enter to simulate</span>
            <span>MicroVM isolation active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
