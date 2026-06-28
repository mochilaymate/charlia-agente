-- 0006: Tool configs and knowledge base

create table tool_configs (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  tool_type     tool_type not null,
  enabled       boolean not null default false,
  -- credentials stored encrypted; never select from client
  credentials   jsonb not null default '{}',
  config        jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, tool_type)
);

create table kb_documents (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  title          text not null,
  content        text not null,
  document_type  text not null check (document_type in ('faq', 'url', 'snippet', 'upload')),
  version        integer not null default 1,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Triggers ─────────────────────────────────────────────────────────
create trigger tool_configs_updated_at before update on tool_configs
  for each row execute function set_updated_at();

create trigger kb_documents_updated_at before update on kb_documents
  for each row execute function set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────
alter table tool_configs enable row level security;
alter table kb_documents enable row level security;

-- credentials column must only be read server-side via admin client;
-- client RLS allows reading but the API layer strips credentials before returning
create policy "tool_configs: workspace isolation"
  on tool_configs for all using (workspace_id = current_workspace_id());

create policy "kb_documents: workspace isolation"
  on kb_documents for all using (workspace_id = current_workspace_id());

-- ── Indexes ──────────────────────────────────────────────────────────
create index tool_configs_workspace_id_idx on tool_configs(workspace_id);
create index kb_documents_workspace_active_idx on kb_documents(workspace_id, active) where active = true;
