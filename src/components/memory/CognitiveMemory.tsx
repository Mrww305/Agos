import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Sparkles, 
  Network, 
  Tag, 
  Trash2, 
  Copy, 
  Layers, 
  Compass, 
  Hash, 
  Clock, 
  Activity,
  Check,
  RefreshCw,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import { MemoryVector } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const CognitiveMemory: React.FC = () => {
  const { 
    memoryVectors, 
    selectedVector, 
    setSelectedVector, 
    memorySearchQuery, 
    setMemorySearchQuery, 
    selectedCluster, 
    setSelectedCluster,
    deleteVector
  } = useAgentStore();

  const [activeTab, setActiveTab] = useState<'graph' | 'list'>('graph');
  const [copiedEmbedding, setCopiedEmbedding] = useState(false);
  const [searchCosineContext, setSearchCosineContext] = useState('');

  // Extract unique clusters
  const clusters = ['all', ...Array.from(new Set(memoryVectors.map(v => v.cluster)))];

  // Dynamic similarity calculation if user is testing a semantic query
  const displayedVectors = memoryVectors.map(vec => {
    let effectiveSimilarity = vec.similarity;
    if (searchCosineContext.trim()) {
      const q = searchCosineContext.toLowerCase();
      const contentLower = vec.content.toLowerCase();
      const tagMatch = vec.tags.some(t => t.toLowerCase().includes(q));
      if (contentLower.includes(q) || tagMatch) {
        effectiveSimilarity = Math.min(0.99, effectiveSimilarity + 0.08);
      } else {
        effectiveSimilarity = Math.max(0.4, effectiveSimilarity - 0.15);
      }
    }
    return { ...vec, similarity: parseFloat(effectiveSimilarity.toFixed(3)) };
  }).filter(v => {
    const matchesCluster = selectedCluster === 'all' || v.cluster === selectedCluster;
    const matchesSearch = 
      v.content.toLowerCase().includes(memorySearchQuery.toLowerCase()) ||
      v.tags.some(t => t.toLowerCase().includes(memorySearchQuery.toLowerCase())) ||
      v.id.toLowerCase().includes(memorySearchQuery.toLowerCase());
    return matchesCluster && matchesSearch;
  });

  const copyEmbeddingToClipboard = (vec: MemoryVector) => {
    const json = JSON.stringify(vec.embeddingSnippet, null, 2);
    navigator.clipboard.writeText(json);
    setCopiedEmbedding(true);
    setTimeout(() => setCopiedEmbedding(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#0A0A0B]">
      {/* MAIN VIEW AREA: Visual Semantic Cluster Graph & Query Bar (65%) */}
      <div className="flex-1 flex flex-col border-r border-[#1F1F23] bg-[#0C0C0F] overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-[#1F1F23] bg-[#121216]/80 backdrop-blur-xl flex flex-col sm:flex-row gap-3 items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  agent_memory (pgvector)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                  HNSW Index
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                1536-dimensional embeddings with cosine similarity distance operator (<strong className="text-indigo-400 font-mono">&lt;=&gt;</strong>)
              </p>
            </div>
          </div>

          {/* Cluster & View Mode Toggles */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center p-1 rounded-xl bg-[#18181E] border border-white/[0.06] text-xs font-mono">
              <button
                onClick={() => setActiveTab('graph')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5",
                  activeTab === 'graph' ? "bg-white/[0.1] text-white font-medium" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Network className="w-3.5 h-3.5" />
                <span>2D Topology Graph</span>
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5",
                  activeTab === 'list' ? "bg-white/[0.1] text-white font-medium" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Vector Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Semantic Context Search & Cluster Pills */}
        <div className="px-6 py-3 border-b border-white/[0.06] bg-[#0E0E12] flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchCosineContext}
              onChange={(e) => setSearchCosineContext(e.target.value)}
              placeholder="Test cosine query: e.g. 'gateway routing'..."
              className="w-full bg-[#18181E] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
            />
          </div>

          {/* Cluster Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-mono">
            {clusters.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCluster(c)}
                className={cn(
                  "px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors text-[11px]",
                  selectedCluster === c
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                    : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-white/[0.05]"
                )}
              >
                {c === 'all' ? 'All Clusters' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Visual Presentation */}
        <div className="flex-1 p-6 relative overflow-hidden flex items-center justify-center select-none bg-grid-subtle">
          {activeTab === 'graph' ? (
            /* 2D Semantic Node Graph / Cluster Map */
            <div className="relative w-full h-full rounded-2xl bg-[#09090C]/90 border border-white/[0.06] overflow-hidden shadow-inner">
              {/* Subtle background coordinate radial glow */}
              <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />

              {/* Cluster Hull Connectors (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {displayedVectors.map((v, i) => {
                  // Connect vectors within the same cluster
                  const sibling = displayedVectors.find((o, idx) => idx !== i && o.cluster === v.cluster);
                  if (!sibling) return null;
                  return (
                    <line
                      key={`${v.id}-${sibling.id}`}
                      x1={`${v.coordinate.x}%`}
                      y1={`${v.coordinate.y}%`}
                      x2={`${sibling.coordinate.x}%`}
                      y2={`${sibling.coordinate.y}%`}
                      stroke={v.clusterColor}
                      strokeOpacity="0.25"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  );
                })}
              </svg>

              {/* Vector Nodes */}
              {displayedVectors.map((vec) => {
                const isSelected = selectedVector?.id === vec.id;

                return (
                  <motion.div
                    key={vec.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: isSelected ? 1.25 : 1, opacity: 1 }}
                    whileHover={{ scale: 1.3 }}
                    onClick={() => setSelectedVector(vec)}
                    style={{
                      left: `${vec.coordinate.x}%`,
                      top: `${vec.coordinate.y}%`,
                    }}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group",
                      isSelected && "z-30"
                    )}
                  >
                    {/* Pulsing ring for high similarity */}
                    {vec.similarity > 0.85 && (
                      <div 
                        className="absolute inset-0 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: vec.clusterColor }}
                      />
                    )}

                    <div 
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center border transition-all shadow-lg",
                        isSelected ? "ring-4 ring-indigo-500/40 scale-110" : "hover:border-white/40"
                      )}
                      style={{
                        backgroundColor: '#141418',
                        borderColor: vec.clusterColor,
                      }}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: vec.clusterColor }}
                      />
                    </div>

                    {/* Vector Node Label */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/95 border border-white/[0.12] px-2.5 py-1 rounded-lg text-[10px] font-mono shadow-2xl z-40">
                      <div className="text-white font-medium">{vec.id}</div>
                      <div className="text-zinc-400">{vec.cluster}</div>
                      <div className="text-emerald-400">similarity: {vec.similarity}</div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Map Legend Overlay */}
              <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-zinc-900/80 backdrop-blur-md border border-white/[0.08] text-[10px] font-mono space-y-1.5 pointer-events-none">
                <div className="text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                  Semantic Clusters (PCA Projected)
                </div>
                {clusters.filter(c => c !== 'all').map((c) => {
                  const sample = memoryVectors.find(v => v.cluster === c);
                  return (
                    <div key={c} className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sample?.clusterColor || '#fff' }}
                      />
                      <span className="text-zinc-300">{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Vector List / Table Mode */
            <div className="w-full h-full rounded-2xl bg-[#09090C] border border-white/[0.06] overflow-y-auto p-4 space-y-3">
              {displayedVectors.map((vec) => (
                <div
                  key={vec.id}
                  onClick={() => setSelectedVector(vec)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer",
                    selectedVector?.id === vec.id
                      ? "bg-indigo-950/30 border-indigo-500/80"
                      : "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05]"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: vec.clusterColor }}
                      />
                      <span className="font-mono text-xs font-semibold text-white">{vec.id}</span>
                      <span className="text-zinc-500 text-[10px] font-mono">({vec.cluster})</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-zinc-400">Cosine Sim:</span>
                      <span className="text-emerald-400 font-semibold">{vec.similarity}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 font-mono leading-relaxed line-clamp-2">
                    {vec.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE PANEL: Raw Text, 1536-dim Vector & Cosine Gauge (35%) */}
      <div className="w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1F1F23] bg-[#0E0E12] flex flex-col overflow-y-auto">
        {selectedVector ? (
          <div className="p-6 space-y-6">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: selectedVector.clusterColor }}
                />
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono">{selectedVector.id}</h3>
                  <span className="text-xs text-zinc-400">{selectedVector.cluster}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => deleteVector(selectedVector.id)}
                  title="Prune vector from pgvector memory"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Cosine Similarity Gauge Card */}
            <div className="p-4 rounded-2xl bg-[#14141A] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  Cosine Similarity Score
                </span>
                <span className="font-mono text-base font-semibold text-emerald-400">
                  {selectedVector.similarity}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${selectedVector.similarity * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>Threshold: 0.70</span>
                <span>Distance Metric: &lt;=&gt;</span>
              </div>
            </div>

            {/* Raw Text Content */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                Raw Chunk Payload
              </span>
              <div className="p-4 rounded-2xl bg-[#09090B] border border-white/[0.07] font-mono text-xs text-zinc-200 leading-relaxed max-h-48 overflow-y-auto">
                {selectedVector.content}
              </div>
            </div>

            {/* Embedding Dimensions Preview (1536-dim) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-400" />
                  Embedding Vector ({selectedVector.dimensions} dims)
                </span>
                <button
                  onClick={() => copyEmbeddingToClipboard(selectedVector)}
                  className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {copiedEmbedding ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Float32</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#09090B] border border-white/[0.07] font-mono text-[11px] text-zinc-400 overflow-x-auto">
                <div className="text-zinc-600 mb-1">// First 8 float32 values of 1,536 dimensions:</div>
                <div className="text-indigo-300">
                  [{selectedVector.embeddingSnippet.join(', ')}, ...]
                </div>
              </div>
            </div>

            {/* Semantic Tags & Metadata */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                Semantic Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedVector.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-white/[0.04] text-zinc-300 border border-white/[0.06]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Access Telemetry */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs font-mono text-zinc-400 space-y-2">
              <div className="flex justify-between">
                <span>Associated Agent:</span>
                <span className="text-white font-semibold">{selectedVector.agentId}</span>
              </div>
              <div className="flex justify-between">
                <span>Access Count:</span>
                <span className="text-indigo-400">{selectedVector.accessCount} queries</span>
              </div>
              <div className="flex justify-between">
                <span>Created At:</span>
                <span className="text-zinc-300">{new Date(selectedVector.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center h-full">
            <Database className="w-8 h-8 mb-3 opacity-30 text-indigo-400" />
            <p>Click any vector node on the cluster map to inspect its embeddings and similarity metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
};
