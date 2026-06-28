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

-- ── Triggers ─────────────────────────────────────────────────────────
create trigger business_info_updated_at before update on business_info
  for each row execute function set_updated_at();

create trigger prompt_versions_updated_at before update on prompt_versions
  for each row execute function set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────
alter table business_info enable row level security;
alter table prompt_versions enable row level security;

create policy "business_info: workspace isolation"
  on business_info for all using (workspace_id = current_workspace_id());

create policy "prompt_versions: workspace isolation"
  on prompt_versions for all using (workspace_id = current_workspace_id());

-- ── Indexes ──────────────────────────────────────────────────────────
create index prompt_versions_workspace_scope_idx on prompt_versions(workspace_id, scope, status);
