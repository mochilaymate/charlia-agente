// Core domain types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  settings: AnyRecord;
  created_at: string;
}

export interface User {
  id: string;
  workspace_id: string;
  email: string;
  role: "admin" | "manager" | "agent" | "viewer";
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  phone: string;
  name?: string;
  email?: string;
  tags: string[];
  custom_fields: AnyRecord;
  stage?: string;
  source?: string;
  owner_id?: string;
  highlevel_contact_id?: string;
  last_interaction?: string;
  consent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  contact_id: string;
  ycloud_conversation_id?: string;
  ai_enabled: boolean;
  human_assigned_id?: string;
  status: "active" | "paused" | "closed" | "handoff_pending";
  state: "ia_active" | "human_active" | "handoff" | "waiting" | "paused" | "closed";
  window_open: boolean;
  tags: string[];
  priority: number;
  internal_notes?: string;
  buffer_messages?: Message[];
  last_buffer_time?: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "contact" | "ai" | "human";
  content: string;
  media_urls?: string[];
  media_type?: "text" | "audio" | "image" | "document" | "video";
  template_id?: string;
  tool_calls?: AnyRecord;
  metadata?: AnyRecord;
  created_at: string;
}

export interface BusinessInfo {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  services: string[];
  faqs: Record<string, string>[];
  hours: Record<string, string>;
  service_zones: string[];
  pricing: AnyRecord;
  policies: string;
  common_objections: Record<string, string>[];
  allowed_claims: string[];
  forbidden_claims: string[];
  brand_tone: string;
  links: Record<string, string>;
  primary_cta: string;
  updated_at: string;
}

export interface PromptVersion {
  id: string;
  workspace_id: string;
  scope: "global" | "by_number" | "by_campaign" | "by_label" | "by_mode";
  scope_value?: string;
  system_prompt: string;
  variables: Record<string, string>;
  guardrails: AnyRecord;
  status: "draft" | "published";
  version_number: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ToolConfig {
  id: string;
  workspace_id: string;
  tool_type: string;
  enabled: boolean;
  credentials: Record<string, string>;
  config: AnyRecord;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  workspace_id: string;
  meta_template_id?: string;
  name: string;
  language: string;
  content: string;
  components: AnyRecord;
  variables: string[];
  status: "draft" | "submitted" | "approved" | "rejected" | "paused";
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentExecution {
  id: string;
  conversation_id: string;
  prompt_version_id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  decision: "respond" | "wait" | "handoff" | "abstain";
  tools_used: string[];
  buffer_group_id?: string;
  error?: string;
  created_at: string;
}

export interface ApiLog {
  id: string;
  workspace_id: string;
  conversation_id?: string;
  event_type: string;
  level: "info" | "warn" | "error";
  details: AnyRecord;
  created_at: string;
}
