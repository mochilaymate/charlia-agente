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

-- ── Triggers ─────────────────────────────────────────────────────────
create trigger setter_configs_updated_at before update on setter_configs
  for each row execute function set_updated_at();

create trigger templates_updated_at before update on templates
  for each row execute function set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────
alter table setter_configs enable row level security;
alter table templates enable row level security;

create policy "setter_configs: workspace isolation"
  on setter_configs for all using (workspace_id = current_workspace_id());

create policy "templates: workspace isolation"
  on templates for all using (workspace_id = current_workspace_id());

-- ── Indexes ──────────────────────────────────────────────────────────
create index templates_workspace_status_idx on templates(workspace_id, status);
create index templates_meta_id_idx on templates(meta_template_id) where meta_template_id is not null;
