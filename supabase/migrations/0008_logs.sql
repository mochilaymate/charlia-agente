-- 0008: Observability logs

create table logs (
  id               uuid primary key default uuid_generate_v4(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  conversation_id  uuid references conversations(id) on delete set null,
  event_type       log_event_type not null,
  level            log_level not null default 'info',
  -- No PII or raw message content; only structured metadata
  details          jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

alter table logs enable row level security;

create policy "logs: workspace isolation"
  on logs for all using (workspace_id = current_workspace_id());

-- Partition-friendly indexes
create index logs_workspace_created_at_idx on logs(workspace_id, created_at desc);
create index logs_conversation_id_idx on logs(conversation_id) where conversation_id is not null;
create index logs_event_type_idx on logs(workspace_id, event_type);
