-- 0001: Extensions and enums (aligned to src/lib/constants/index.ts)

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Enums ─────────────────────────────────────────────────────────────

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
