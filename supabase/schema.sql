-- Schema for AI Agents Workbench
create extension if not exists "pgcrypto";
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null check (type in ('chat', 'form', 'workflow', 'custom')),
  icon text,
  config_json jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  agent_id uuid references public.agents (id) on delete cascade,
  title text not null,
  session_state jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions (id) on delete cascade,
  agent_id uuid references public.agents (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  input_json jsonb,
  output_json jsonb,
  tokens_used integer,
  cost_estimate numeric(10,4),
  created_at timestamptz not null default now()
);

-- Row Level Security policies (enable as needed in Supabase dashboard)
alter table public.sessions enable row level security;
alter table public.agent_runs enable row level security;

create policy "Users manage their sessions" on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users view their agent runs" on public.agent_runs
  for select using (auth.uid() = user_id);

create policy "Users insert agent runs" on public.agent_runs
  for insert with check (auth.uid() = user_id);

-- Sample seed data
insert into public.agents (id, name, description, type, icon, config_json) values
  (
    '00000000-0000-0000-0000-000000000001',
    'Strategy Copilot',
    'Chat-driven assistant for brainstorming product ideas and strategy iterations.',
    'chat',
    '🧠',
    '{"system_prompt":"You are Strategy Copilot, an experienced product strategist."}'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Go-To-Market Designer',
    'Dynamic brief builder that captures launch plans and resources.',
    'form',
    '📝',
    '{"submitLabel":"Save GTM Plan","fields":[{"name":"product","label":"Product name","type":"text","placeholder":"Acme Rocket"},{"name":"target_audience","label":"Target audience","type":"textarea","placeholder":"Who are we launching to?"},{"name":"channels","label":"Primary channels","type":"select","options":[{"label":"Email","value":"email"},{"label":"Paid social","value":"paid_social"},{"label":"Events","value":"events"}]}],"submitFunction":"gtm-form-handler"}'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Weather Visualizer',
    'Example of a custom-coded experience embedded into the workbench.',
    'custom',
    '🌦️',
    '{"component":"WeatherVisualizer"}'
  );

-- Example user + session seed (replace email)
insert into public.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'founder@example.com')
  on conflict (email) do nothing;

insert into public.sessions (id, user_id, agent_id, title, session_state)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Strategy Copilot kickoff',
  '{"messages":[{"id":"m1","role":"assistant","content":"How can I help you today?","created_at":"2024-01-01T00:00:00Z"}]}'
) on conflict do nothing;
