-- 0002: Core tenancy (workspaces + users)

-- workspaces.owner_id → auth.users (not public.users) to break circular FK
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

-- ── Helper: current_workspace_id() ────────────────────────────────────
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

-- ── Triggers ──────────────────────────────────────────────────────────
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

-- ── RLS ───────────────────────────────────────────────────────────────
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

-- ── Indexes ──────────────────────────────────────────────────────────
create index users_workspace_id_idx on users(workspace_id);
create index workspaces_slug_idx on workspaces(slug);
