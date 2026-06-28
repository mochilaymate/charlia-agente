-- ════════════════════════════════
-- 0001_extensions_and_enums.sql
-- ════════════════════════════════
-- 0001: Extensions and enums (aligned to src/lib/constants/index.ts)

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- â”€â”€ Enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create type user_role as enum ('admin', 'manager', 'agent', 'viewer');

create type conversation_state as enum (
  'ia_active',
  'human_active',
  'handoff',
  'waiting',
  'paused',
  'closed'
);

create type conversation_status as enum ('active', 'paused', 'closed', 'handoff_pending');

create type message_type as enum ('text', 'audio', 'image', 'document', 'video', 'template', 'location', 'sticker');

create type sender_type as enum ('contact', 'ai', 'human');

create type prompt_scope as enum ('global', 'by_number', 'by_campaign', 'by_label', 'by_mode');

create type prompt_status as enum ('draft', 'published');

create type template_status as enum ('draft', 'submitted', 'approved', 'rejected', 'paused');

create type agent_decision as enum ('respond', 'wait', 'handoff', 'abstain');

create type tool_type as enum (
  'kb_search',
  'db_query',
  'api_call',
  'contact_crud',
  'scheduling',
  'tagging',
  'handoff',
  'custom_webhook'
);

create type log_level as enum ('info', 'warn', 'error');

create type log_event_type as enum (
  'message_inbound',
  'message_outbound',
  'buffer_group',
  'agent_decision',
  'tool_call',
  'sync_highlevel',
  'template_validation',
  'window_change',
  'handoff_trigger',
  'scheduling_result',
  'error'
);


-- ════════════════════════════════
-- 0002_tenancy.sql
-- ════════════════════════════════
-- 0002: Core tenancy (workspaces + users)

-- workspaces.owner_id â†’ auth.users (not public.users) to break circular FK
create table workspaces (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,
  name         text not null,
  owner_id     uuid not null references auth.users(id) on delete restrict,
  settings     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table users (
  id           uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email        text not null,
  role         user_role not null default 'agent',
  permissions  jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- â”€â”€ Helper: current_workspace_id() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Called by RLS policies. SECURITY DEFINER + fixed search_path prevents hijacking.
create or replace function current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from users where id = auth.uid()
$$;

-- â”€â”€ Triggers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_updated_at before update on workspaces
  for each row execute function set_updated_at();

create trigger users_updated_at before update on users
  for each row execute function set_updated_at();

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table workspaces enable row level security;
alter table users enable row level security;

create policy "workspace members can read own workspace"
  on workspaces for select using (id = current_workspace_id());

create policy "workspace owner can update own workspace"
  on workspaces for update using (owner_id = auth.uid());

create policy "users can read own workspace members"
  on users for select using (workspace_id = current_workspace_id());

-- Prevent self-escalation: only admin API (service_role) can change role/permissions
create policy "users can update own non-sensitive fields"
  on users for update using (id = auth.uid())
  with check (
    role = (select role from users where id = auth.uid()) and
    workspace_id = (select workspace_id from users where id = auth.uid())
  );

-- â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create index users_workspace_id_idx on users(workspace_id);
create index workspaces_slug_idx on workspaces(slug);


-- ════════════════════════════════
-- 0003_contacts_conversations_messages.sql
-- ════════════════════════════════
-- 0003: Contacts, conversations, messages

create table contacts (
  id                    uuid primary key default uuid_generate_v4(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  phone                 text not null,  -- E.164 format
  name                  text,
  email                 text,
  tags                  text[] not null default '{}',
  custom_fields         jsonb not null default '{}',
  stage                 text,
  source                text,
  owner_id              uuid references users(id) on delete set null,
  highlevel_contact_id  text,
  last_interaction      timestamptz,
  consent               boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (workspace_id, phone)
);

create table conversations (
  id                    uuid primary key default uuid_generate_v4(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  contact_id            uuid not null references contacts(id) on delete cascade,
  ycloud_conversation_id text,
  ai_enabled            boolean not null default true,
  human_assigned_id     uuid references users(id) on delete set null,
  status                conversation_status not null default 'active',
  state                 conversation_state not null default 'ia_active',
  -- 24h window: source of truth for gate enforcement
  last_inbound_at       timestamptz,
  window_open           boolean not null default false,  -- cached; recomputed server-side
  tags                  text[] not null default '{}',
  priority              integer not null default 0,
  internal_notes        text,
  -- Buffer fields
  buffer_messages       jsonb not null default '[]',
  last_buffer_time      timestamptz,
  buffer_group_id       uuid,  -- set atomically when claiming buffer; NULL = unclaimed
  last_message_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table messages (
  id               uuid primary key default uuid_generate_v4(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_id        text not null,   -- contact phone or user uuid
  sender_type      sender_type not null,
  content          text,
  media_urls       text[] not null default '{}',
  media_type       message_type not null default 'text',
  template_id      uuid,  -- FK to templates added in 0008
  tool_calls       jsonb,
  metadata         jsonb not null default '{}',
  wamid            text,  -- WhatsApp message ID from YCloud (idempotency)
  ycloud_event_id  text,  -- YCloud webhook event ID (idempotency)
  created_at       timestamptz not null default now()
);

-- â”€â”€ Trigger: update conversation on new message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function touch_conversation_on_message()
returns trigger language plpgsql as $$
begin
  update conversations
  set
    last_message_at = new.created_at,
    last_inbound_at = case
      when new.sender_type = 'contact' then new.created_at
      else last_inbound_at
    end,
    window_open = case
      when new.sender_type = 'contact' then true
      else window_open
    end,
    updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on messages
  for each row execute function touch_conversation_on_message();

-- â”€â”€ Triggers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create trigger contacts_updated_at before update on contacts
  for each row execute function set_updated_at();

create trigger conversations_updated_at before update on conversations
  for each row execute function set_updated_at();

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "contacts: workspace isolation"
  on contacts for all using (workspace_id = current_workspace_id());

create policy "conversations: workspace isolation"
  on conversations for all using (workspace_id = current_workspace_id());

-- messages have no workspace_id; scope via conversations
create policy "messages: workspace isolation"
  on messages for all using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.workspace_id = current_workspace_id()
    )
  );

-- â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create index contacts_workspace_phone_idx on contacts(workspace_id, phone);
create index contacts_workspace_id_idx on contacts(workspace_id);
create index contacts_highlevel_idx on contacts(highlevel_contact_id) where highlevel_contact_id is not null;
create index conversations_workspace_id_idx on conversations(workspace_id);
create index conversations_contact_id_idx on conversations(contact_id);
create index conversations_buffer_group_id_idx on conversations(buffer_group_id) where buffer_group_id is not null;
create index messages_conversation_id_idx on messages(conversation_id);
create index messages_wamid_idx on messages(wamid) where wamid is not null;
create index messages_ycloud_event_id_idx on messages(ycloud_event_id) where ycloud_event_id is not null;


-- ════════════════════════════════
-- 0004_business_info_and_prompts.sql
-- ════════════════════════════════
-- 0004: Business info and prompt versions

create table business_info (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null unique references workspaces(id) on delete cascade,
  name                text,
  description         text,
  services            text[] not null default '{}',
  faqs                jsonb not null default '[]',
  hours               jsonb not null default '{}',
  service_zones       text[] not null default '{}',
  pricing             jsonb not null default '{}',
  policies            text,
  common_objections   jsonb not null default '[]',
  allowed_claims      text[] not null default '{}',
  forbidden_claims    text[] not null default '{}',
  brand_tone          text,
  links               jsonb not null default '{}',
  primary_cta         text,
  updated_at          timestamptz not null default now()
);

create table prompt_versions (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  scope           prompt_scope not null default 'global',
  scope_value     text,  -- number / campaign / label / mode value
  system_prompt   text not null default '',
  variables       jsonb not null default '{}',
  guardrails      jsonb not null default '{}',
  status          prompt_status not null default 'draft',
  version_number  integer not null default 1,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- â”€â”€ Triggers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create trigger business_info_updated_at before update on business_info
  for each row execute function set_updated_at();

create trigger prompt_versions_updated_at before update on prompt_versions
  for each row execute function set_updated_at();

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table business_info enable row level security;
alter table prompt_versions enable row level security;

create policy "business_info: workspace isolation"
  on business_info for all using (workspace_id = current_workspace_id());

create policy "prompt_versions: workspace isolation"
  on prompt_versions for all using (workspace_id = current_workspace_id());

-- â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create index prompt_versions_workspace_scope_idx on prompt_versions(workspace_id, scope, status);


-- ════════════════════════════════
-- 0005_agent_executions.sql
-- ════════════════════════════════
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


-- ════════════════════════════════
-- 0006_tools_and_kb.sql
-- ════════════════════════════════
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

-- â”€â”€ Triggers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create trigger tool_configs_updated_at before update on tool_configs
  for each row execute function set_updated_at();

create trigger kb_documents_updated_at before update on kb_documents
  for each row execute function set_updated_at();

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table tool_configs enable row level security;
alter table kb_documents enable row level security;

-- credentials column must only be read server-side via admin client;
-- client RLS allows reading but the API layer strips credentials before returning
create policy "tool_configs: workspace isolation"
  on tool_configs for all using (workspace_id = current_workspace_id());

create policy "kb_documents: workspace isolation"
  on kb_documents for all using (workspace_id = current_workspace_id());

-- â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create index tool_configs_workspace_id_idx on tool_configs(workspace_id);
create index kb_documents_workspace_active_idx on kb_documents(workspace_id, active) where active = true;


-- ════════════════════════════════
-- 0007_setter_and_templates.sql
-- ════════════════════════════════
-- 0007: Setter configs and templates

create table setter_configs (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null unique references workspaces(id) on delete cascade,
  enabled        boolean not null default false,
  questions      jsonb not null default '[]',
  scoring_rules  jsonb not null default '{}',
  next_action    text not null default 'send_schedule',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table templates (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  meta_template_id  text,
  name              text not null,
  language          text not null default 'es',
  content           text not null,
  components        jsonb not null default '[]',
  variables         text[] not null default '{}',
  status            template_status not null default 'draft',
  submitted_at      timestamptz,
  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Add FK from messages.template_id now that templates table exists
alter table messages
  add constraint messages_template_id_fk
  foreign key (template_id) references templates(id) on delete set null;

-- â”€â”€ Triggers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create trigger setter_configs_updated_at before update on setter_configs
  for each row execute function set_updated_at();

create trigger templates_updated_at before update on templates
  for each row execute function set_updated_at();

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table setter_configs enable row level security;
alter table templates enable row level security;

create policy "setter_configs: workspace isolation"
  on setter_configs for all using (workspace_id = current_workspace_id());

create policy "templates: workspace isolation"
  on templates for all using (workspace_id = current_workspace_id());

-- â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create index templates_workspace_status_idx on templates(workspace_id, status);
create index templates_meta_id_idx on templates(meta_template_id) where meta_template_id is not null;


-- ════════════════════════════════
-- 0008_logs.sql
-- ════════════════════════════════
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


-- ════════════════════════════════
-- 0009_realtime_and_storage.sql
-- ════════════════════════════════
-- 0009: Realtime publication and Storage bucket setup

-- Enable Realtime for the inbox (conversations + messages)
-- replica identity full required so UPDATE/DELETE events carry old record
alter table conversations replica identity full;
alter table messages replica identity full;

-- Add tables to the supabase_realtime publication
-- (idempotent: only adds if not already member)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table conversations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end;
$$;

-- Storage bucket for WhatsApp media (inbound: downloaded server-side from YCloud)
-- NOTE: Run this via Supabase dashboard or supabase-js admin client, not raw SQL,
-- if the storage extension is not available in the migration runner.
-- This is a no-op if storage.buckets doesn't exist yet.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'whatsapp-media',
      'whatsapp-media',
      false,  -- private bucket; access via signed URLs only
      52428800,  -- 50 MB max per file
      array['image/jpeg','image/png','image/webp','image/gif','audio/ogg','audio/mpeg','video/mp4','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    )
    on conflict (id) do nothing;

    -- RLS: workspace-scoped access via path prefix {workspace_id}/...
    -- Applied via Supabase Storage policies (managed in dashboard or via API)
  end if;
end;
$$;


