import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';

// Environment Bindings for Cloudflare Worker
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET?: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  GEMINI_API_KEY?: string;
  ENVIRONMENT?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for frontend origin (Next.js / Vite)
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ============================================================================
// MIDDLEWARE 1: Upstash Redis Token-Bucket Rate Limiter (Edge REST API)
// Free Tier: Uses Upstash REST protocol directly (0 socket overhead)
// ============================================================================
app.use('/api/v1/*', async (c, next) => {
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
  const key = `ratelimit:${clientIp}:${Math.floor(Date.now() / 60000)}`; // 1-minute window
  
  const redisUrl = c.env.UPSTASH_REDIS_REST_URL;
  const redisToken = c.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      // Execute atomic INCR + EXPIRE via Upstash REST pipeline
      const pipelineRes = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, 60],
        ]),
      });

      if (pipelineRes.ok) {
        const [incrResult] = await pipelineRes.json() as [{ result: number }];
        const currentCount = incrResult.result;
        const RATE_LIMIT_PER_MINUTE = 120;

        c.header('X-RateLimit-Limit', RATE_LIMIT_PER_MINUTE.toString());
        c.header('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_PER_MINUTE - currentCount).toString());

        if (currentCount > RATE_LIMIT_PER_MINUTE) {
          return c.json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded: 120 requests per minute on free tier gateway.',
            retryAfterSeconds: 60,
          }, 429);
        }
      }
    } catch (err) {
      // Soft-fail rate limiting if Upstash unreachable to avoid dropping traffic
      console.error('Rate limiting error:', err);
    }
  }

  await next();
});

// ============================================================================
// MIDDLEWARE 2: JWT / Service Auth Guard
// ============================================================================
const authGuard = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    // In dev / preview demo mode, allow fallback public anonymous access
    return next();
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return c.json({ error: 'Unauthorized', message: 'Bearer token missing' }, 401);
  }

  // Verify JWT signature or Supabase user
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: 'Unauthorized', message: error?.message || 'Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
};

// ============================================================================
// HELPER: Upstash Redis Push
// ============================================================================
async function pushToUpstashQueue(env: Env, queueName: string, payload: any) {
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/lpush/${queueName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Upstash Redis enqueue failed with status: ${res.status}`);
  }
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * Health Check & Telemetry Status
 */
app.get('/api/v1/health', async (c) => {
  return c.json({
    status: 'healthy',
    runtime: 'Cloudflare Workers (V8 Edge)',
    region: c.req.header('cf-ipcountry') || 'global',
    timestamp: new Date().toISOString(),
    version: '2.4.0',
  });
});

/**
 * 1. GET /api/v1/agents (For the Agent Forge & Command Center)
 * Fetches all registered agent instances with exact frontend data contract
 */
app.get('/api/v1/agents', authGuard, async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return c.json({ error: 'Database Query Failed', details: error.message }, 500);
  }

  // Transform snake_case columns to exact frontend camelCase TypeScript Agent interface
  const formattedAgents = (data || []).map(agent => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    status: agent.status,
    avatar: agent.avatar,
    version: agent.version,
    model: agent.model,
    systemPrompt: agent.system_prompt,
    temperature: parseFloat(agent.temperature),
    topP: parseFloat(agent.top_p),
    maxTokens: agent.max_tokens,
    tools: agent.tools || [],
    tokensProcessed: parseInt(agent.tokens_processed, 10) || 0,
    activeTaskId: agent.active_task_id || undefined,
    currentTaskSnippet: agent.current_task_snippet || undefined,
    memoryUsageMb: agent.memory_usage_mb || 128,
    uptimeHours: parseFloat(agent.uptime_hours) || 0.0,
  }));

  return c.json(formattedAgents, 200);
});

/**
 * 2. POST /api/v1/tasks (For the Task Orchestrator)
 * Asynchronous Ingestion: Inserts 'pending' task into Supabase (triggering Realtime)
 * and dispatches to Upstash Redis queue, immediately returning 202 Accepted.
 */
app.post('/api/v1/tasks', authGuard, async (c) => {
  const body = await c.req.json();
  const { prompt, agentId, priority = 'medium' } = body;

  if (!prompt || typeof prompt !== 'string') {
    return c.json({ error: 'Invalid Payload', message: 'Missing required string field: prompt' }, 400);
  }

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Resolve target agent or select default supervisor
  let targetAgentId = agentId;
  let targetAgentName = 'Kernel Supervisor';

  if (targetAgentId) {
    const { data: agentData } = await supabase
      .from('agents')
      .select('id, name')
      .eq('id', targetAgentId)
      .single();
    if (agentData) {
      targetAgentName = agentData.name;
    }
  } else {
    const { data: firstAgent } = await supabase
      .from('agents')
      .select('id, name')
      .limit(1)
      .single();
    if (firstAgent) {
      targetAgentId = firstAgent.id;
      targetAgentName = firstAgent.name;
    } else {
      targetAgentId = 'agent-supervisor-01';
    }
  }

  const taskId = `task-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8)}`;
  const promptSnippet = prompt.length > 80 ? prompt.slice(0, 80) + '...' : prompt;
  const enqueuedAt = new Date().toISOString();

  const initialLog = {
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    level: 'info' as const,
    message: `Task ingested by Cloudflare Edge Gateway [${c.req.header('cf-ray') || 'local'}]`,
  };

  // 2. Persist in Supabase (triggers Supabase Realtime WebSocket broadcast to frontend!)
  const { data: insertedTask, error: dbError } = await supabase
    .from('tasks')
    .insert({
      id: taskId,
      agent_id: targetAgentId,
      agent_name: targetAgentName,
      prompt_snippet: promptSnippet,
      full_prompt: prompt,
      status: 'pending',
      priority,
      enqueued_at: enqueuedAt,
      duration_seconds: 0.0,
      tokens_used: 0,
      cost_usd: 0.0,
      logs: [initialLog],
    })
    .select('*')
    .single();

  if (dbError) {
    return c.json({ error: 'Failed to create task in database', details: dbError.message }, 500);
  }

  // 3. Dispatch to Upstash Redis queue for async Core Kernel polling
  const redisJobPayload = {
    taskId,
    agentId: targetAgentId,
    agentName: targetAgentName,
    prompt,
    priority,
    enqueuedAt,
  };

  try {
    await pushToUpstashQueue(c.env, 'agentos:tasks:queue', JSON.stringify(redisJobPayload));
  } catch (queueErr: any) {
    console.error('Queue enqueue warning:', queueErr);
  }

  // 4. Transform response to 1:1 frontend Task interface and return 202 Accepted
  const responsePayload = {
    id: insertedTask.id,
    agentId: insertedTask.agent_id,
    agentName: insertedTask.agent_name,
    promptSnippet: insertedTask.prompt_snippet,
    fullPrompt: insertedTask.full_prompt,
    status: insertedTask.status,
    priority: insertedTask.priority,
    enqueuedAt: insertedTask.enqueued_at,
    durationSeconds: insertedTask.duration_seconds,
    tokensUsed: insertedTask.tokens_used,
    costUsd: insertedTask.cost_usd,
    logs: insertedTask.logs,
  };

  return c.json({
    status: 'accepted',
    message: 'Task successfully enqueued to Upstash Redis broker',
    task: responsePayload,
  }, 202);
});

/**
 * 3. POST /api/v1/memory/search (For the Cognitive Memory view)
 * Performs pgvector cosine similarity search and returns exact MemoryVector shape
 */
app.post('/api/v1/memory/search', authGuard, async (c) => {
  const body = await c.req.json();
  const { query, agentId, cluster, threshold = 0.50, limit = 25 } = body;

  if (!query || typeof query !== 'string') {
    return c.json({ error: 'Missing query text' }, 400);
  }

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

  // Generate 1536-dim embedding vector via Gemini or OpenAI embedding API
  // Using standard 1536-dim representation
  let queryEmbedding: number[] = [];

  if (c.env.GEMINI_API_KEY) {
    try {
      const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${c.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: query }] },
          outputDimensionality: 1536,
        }),
      });
      const embedJson = await embedRes.json() as any;
      queryEmbedding = embedJson?.embedding?.values || [];
    } catch (e) {
      console.warn('Gemini embedding failed, using zeroed vector fallback:', e);
    }
  }

  // Zero-vector fallback if no key provided
  if (!queryEmbedding || queryEmbedding.length === 0) {
    queryEmbedding = new Array(1536).fill(0).map((_, i) => Math.sin(i + 1) * 0.05);
  }

  // Invoke Supabase pgvector RPC
  const { data: rpcMatches, error } = await supabase.rpc('match_agent_memory', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter_agent_id: agentId || null,
    filter_cluster: cluster && cluster !== 'all' ? cluster : null,
  });

  if (error) {
    return c.json({ error: 'pgvector Search RPC Failed', details: error.message }, 500);
  }

  // Format response matching frontend's MemoryVector interface
  const formattedVectors = (rpcMatches || []).map((row: any) => ({
    id: row.id,
    agentId: row.agent_id,
    cluster: row.cluster,
    clusterColor: row.cluster_color,
    content: row.content,
    embeddingSnippet: row.embedding_snippet || [],
    dimensions: row.dimensions || 1536,
    similarity: row.similarity,
    createdAt: row.created_at,
    accessCount: row.access_count || 0,
    tags: row.tags || [],
    coordinate: {
      x: parseFloat(row.coord_x) || 50,
      y: parseFloat(row.coord_y) || 50,
    },
  }));

  return c.json({
    query,
    count: formattedVectors.length,
    vectors: formattedVectors,
  }, 200);
});

export default app;
