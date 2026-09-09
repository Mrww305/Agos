-- ==============================================================================
-- AgentOS Production Database Schema & Realtime Replication Configuration
-- Engine: PostgreSQL 15+ / Supabase with pgvector
-- Free Tier Optimization: Memory-safe HNSW parameters & RLS policies
-- ==============================================================================

-- 1. EXTENSIONS SETUP
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- 2. CUSTOM TYPES & ENUMS
do $$ begin
  create type agent_status as enum ('idle', 'reasoning', 'executing', 'waiting', 'paused');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type task_status as enum ('pending', 'processing', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

-- 3. AGENTS TABLE
-- Maps 1:1 to frontend 'Agent' interface
create table if not exists public.agents (
  id text primary key default ('agent-' || substr(uuid_generate_v4()::text, 1, 8)),
  name text not null,
  role text not null,
  status agent_status not null default 'idle',
  avatar text not null default 'Bot',
  version text not null default 'v2.4.0',
  model text not null default 'gemini-1.5-pro',
  system_prompt text not null,
  temperature numeric(3, 2) not null default 0.20 check (temperature >= 0 and temperature <= 2.0),
  top_p numeric(3, 2) not null default 0.95 check (top_p >= 0 and top_p <= 1.0),
  max_tokens integer not null default 8192 check (max_tokens > 0),
  tools jsonb not null default '[]'::jsonb,
  tokens_processed bigint not null default 0,
  active_task_id text,
  current_task_snippet text,
  memory_usage_mb integer not null default 128,
  uptime_hours numeric(6, 1) not null default 0.0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid references auth.users(id) on delete cascade default auth.uid()
);

-- 4. TASKS TABLE
-- Maps 1:1 to frontend 'Task' and 'TaskLogEntry' interfaces
create table if not exists public.tasks (
  id text primary key default ('task-' || to_char(now(), 'YYYYMMDD-') || substr(uuid_generate_v4()::text, 1, 6)),
  agent_id text not null references public.agents(id) on delete cascade,
  agent_name text not null,
  prompt_snippet text not null,
  full_prompt text not null,
  status task_status not null default 'pending',
  priority task_priority not null default 'medium',
  enqueued_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds numeric(6, 2) not null default 0.0,
  output_summary text,
  tokens_used integer not null default 0,
  cost_usd numeric(8, 6) not null default 0.000000,
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid references auth.users(id) on delete cascade default auth.uid()
);

-- Indexes for lightning queries & foreign keys
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_agent_id on public.tasks(agent_id);
create index if not exists idx_tasks_enqueued_at on public.tasks(enqueued_at desc);

-- 5. COGNITIVE MEMORY TABLE (pgvector)
-- Maps 1:1 to frontend 'MemoryVector' interface
create table if not exists public.agent_memory (
  id text primary key default ('vec-' || substr(uuid_generate_v4()::text, 1, 8)),
  agent_id text not null references public.agents(id) on delete cascade,
  cluster text not null default 'general',
  cluster_color text not null default '#6366F1',
  content text not null,
  embedding vector(1536) not null, -- Compatible with OpenAI text-embedding-3-small or Gemini text-embedding-004
  dimensions integer not null default 1536,
  access_count integer not null default 0,
  tags text[] not null default '{}',
  coord_x numeric(5, 2) not null default 50.0,
  coord_y numeric(5, 2) not null default 50.0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid references auth.users(id) on delete cascade default auth.uid()
);

-- 6. HNSW INDEX FOR COSINE SIMILARITY
-- Tuned for Supabase Free Tier (500MB memory ceiling): m=16, ef_construction=64
create index if not exists idx_agent_memory_hnsw_cosine 
  on public.agent_memory 
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index if not exists idx_agent_memory_cluster on public.agent_memory(cluster);
create index if not exists idx_agent_memory_agent on public.agent_memory(agent_id);

-- 7. SYSTEM TELEMETRY / HEALTH TABLE
create table if not exists public.system_health_metrics (
  id serial primary key,
  cpu_kernel_usage numeric(4, 1) not null default 34.2,
  memory_used_gb numeric(4, 2) not null default 4.20,
  memory_total_gb numeric(4, 2) not null default 16.00,
  api_latency_ms integer not null default 24,
  p95_latency_ms integer not null default 42,
  p99_latency_ms integer not null default 78,
  active_agents_count integer not null default 3,
  total_agents_count integer not null default 5,
  tasks_completed_today integer not null default 1420,
  tasks_success_rate numeric(4, 1) not null default 99.4,
  gateway_status text not null default 'healthy',
  recorded_at timestamptz not null default timezone('utc', now())
);

-- 8. VECTOR SEARCH RPC FUNCTION (COSINE SIMILARITY)
-- Returns exact payload expected by CognitiveMemory.tsx
create or replace function public.match_agent_memory(
  query_embedding vector(1536),
  match_threshold float default 0.65,
  match_count int default 20,
  filter_agent_id text default null,
  filter_cluster text default null
)
returns table (
  id text,
  agent_id text,
  cluster text,
  cluster_color text,
  content text,
  embedding_snippet float8[],
  dimensions int,
  similarity float8,
  created_at timestamptz,
  access_count int,
  tags text[],
  coord_x numeric(5, 2),
  coord_y numeric(5, 2)
)
language plpgsql
stable
as $$
begin
  return query
  select
    m.id,
    m.agent_id,
    m.cluster,
    m.cluster_color,
    m.content,
    -- Extract first 8 dimensions for frontend snippet preview
    array[
      (m.embedding[1])::float8,
      (m.embedding[2])::float8,
      (m.embedding[3])::float8,
      (m.embedding[4])::float8,
      (m.embedding[5])::float8,
      (m.embedding[6])::float8,
      (m.embedding[7])::float8,
      (m.embedding[8])::float8
    ] as embedding_snippet,
    m.dimensions,
    -- Cosine similarity: 1 - cosine_distance (<=>)
    round((1 - (m.embedding <=> query_embedding))::numeric, 3)::float8 as similarity,
    m.created_at,
    m.access_count,
    m.tags,
    m.coord_x,
    m.coord_y
  from public.agent_memory m
  where (1 - (m.embedding <=> query_embedding)) >= match_threshold
    and (filter_agent_id is null or m.agent_id = filter_agent_id)
    and (filter_cluster is null or m.cluster = filter_cluster)
  order by m.embedding <=> query_embedding asc
  limit match_count;
end;
$$;

-- 9. SUPABASE REALTIME CONFIGURATION
-- CRUCIAL: Enable Realtime publications on tables for instant WebSocket broadcasts
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.agents;
alter publication supabase_realtime add table public.system_health_metrics;

-- Set replica identity to FULL so UPDATE broadcasts contain old & new records
alter table public.tasks replica identity full;
alter table public.agents replica identity full;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.agents enable row level security;
alter table public.tasks enable row level security;
alter table public.agent_memory enable row level security;
alter table public.system_health_metrics enable row level security;

-- Free Tier / Dev + Prod Compatible RLS:
-- 1) Authenticated users can read and manage their own resources
-- 2) Service role (Core Kernel / Edge Gateway) has full bypass access
create policy "Allow service_role full access to agents" 
  on public.agents for all 
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Allow authenticated users to read agents" 
  on public.agents for select 
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Allow authenticated users to manage own agents" 
  on public.agents for all 
  using (auth.uid() = user_id or user_id is null);

create policy "Allow service_role full access to tasks" 
  on public.tasks for all 
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Allow public read of tasks" 
  on public.tasks for select 
  using (true);

create policy "Allow users to insert tasks" 
  on public.tasks for insert 
  with check (true);

create policy "Allow service_role full access to memory" 
  on public.agent_memory for all 
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Allow read on agent_memory" 
  on public.agent_memory for select 
  using (true);

create policy "Allow read on system_health_metrics" 
  on public.system_health_metrics for select 
  using (true);
