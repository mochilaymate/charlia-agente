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

-- ── Trigger: update conversation on new message ───────────────────────
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

-- ── Triggers ──────────────────────────────────────────────────────────
create trigger contacts_updated_at before update on contacts
  for each row execute function set_updated_at();

create trigger conversations_updated_at before update on conversations
  for each row execute function set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────
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

-- ── Indexes ───────────────────────────────────────────────────────────
create index contacts_workspace_phone_idx on contacts(workspace_id, phone);
create index contacts_workspace_id_idx on contacts(workspace_id);
create index contacts_highlevel_idx on contacts(highlevel_contact_id) where highlevel_contact_id is not null;
create index conversations_workspace_id_idx on conversations(workspace_id);
create index conversations_contact_id_idx on conversations(contact_id);
create index conversations_buffer_group_id_idx on conversations(buffer_group_id) where buffer_group_id is not null;
create index messages_conversation_id_idx on messages(conversation_id);
create index messages_wamid_idx on messages(wamid) where wamid is not null;
create index messages_ycloud_event_id_idx on messages(ycloud_event_id) where ycloud_event_id is not null;
