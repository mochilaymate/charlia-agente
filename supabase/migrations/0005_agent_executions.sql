-- 0005: Agent executions

create table agent_executions (
  id                  uuid primary key default uuid_generate_v4(),
  conversation_id     uuid not null references conversations(id) on delete cascade,
  prompt_version_id   uuid references prompt_versions(id) on delete set null,
  model               text not null,
  input_tokens        integer not null default 0,
  output_tokens       integer not null default 0,
  cost                numeric(12, 8) not null default 0,
  decision            agent_decision,
  tools_used          text[] not null default '{}',
  buffer_group_id     uuid,  -- matches conversations.buffer_group_id of the batch
  generation_id       text,  -- OpenRouter generation ID for cost reconciliation
  error               text,
  created_at          timestamptz not null default now()
);

-- RLS: scope via conversations (no workspace_id column)
alter table agent_executions enable row level security;

create policy "agent_executions: workspace isolation"
  on agent_executions for all using (
    exists (
      select 1 from conversations c
      where c.id = agent_executions.conversation_id
        and c.workspace_id = current_workspace_id()
    )
  );

create index agent_executions_conversation_id_idx on agent_executions(conversation_id);
create index agent_executions_buffer_group_id_idx on agent_executions(buffer_group_id) where buffer_group_id is not null;
create index agent_executions_created_at_idx on agent_executions(created_at desc);
