// User roles
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
  VIEWER: "viewer",
} as const;

// Conversation states
export const CONVERSATION_STATES = {
  IA_ACTIVE: "ia_active",
  HUMAN_ACTIVE: "human_active",
  HANDOFF: "handoff",
  WAITING: "waiting",
  PAUSED: "paused",
  CLOSED: "closed",
} as const;

export const CONVERSATION_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  CLOSED: "closed",
  HANDOFF_PENDING: "handoff_pending",
} as const;

// Message types
export const MESSAGE_TYPES = {
  TEXT: "text",
  AUDIO: "audio",
  IMAGE: "image",
  DOCUMENT: "document",
  VIDEO: "video",
} as const;

export const SENDER_TYPES = {
  CONTACT: "contact",
  AI: "ai",
  HUMAN: "human",
} as const;

// Prompt scopes
export const PROMPT_SCOPES = {
  GLOBAL: "global",
  BY_NUMBER: "by_number",
  BY_CAMPAIGN: "by_campaign",
  BY_LABEL: "by_label",
  BY_MODE: "by_mode",
} as const;

// Template statuses
export const TEMPLATE_STATUSES = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAUSED: "paused",
} as const;

// Agent decisions
export const AGENT_DECISIONS = {
  RESPOND: "respond",
  WAIT: "wait",
  HANDOFF: "handoff",
  ABSTAIN: "abstain",
} as const;

// WhatsApp window (24 hours)
export const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;

// Buffer debounce timing (configurable per workspace, defaults below)
export const BUFFER_DELAY_MS = 10 * 1000; // 10 seconds default
export const MAX_BUFFER_WAIT_MS = 60 * 1000; // Max 60 seconds

// Tool types
export const TOOL_TYPES = {
  KB_SEARCH: "kb_search",
  DB_QUERY: "db_query",
  API_CALL: "api_call",
  CONTACT_CRUD: "contact_crud",
  SCHEDULING: "scheduling",
  TAGGING: "tagging",
  HANDOFF: "handoff",
  CUSTOM_WEBHOOK: "custom_webhook",
} as const;
