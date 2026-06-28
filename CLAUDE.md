# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: WhatsApp AI Inbox Dashboard

A **multi-tenant SaaS platform** for WhatsApp messaging with AI automation, human handoff, CRM integration, and compliance with WhatsApp/Meta rules.

---

## Quick Commands

```bash
npm run dev      # Start dev server at http://localhost:3000 (auto-reload)
npm run build    # Production build to .next/
npm run start    # Run production server
npm run lint     # ESLint check
```

## MCP & Documentation

**Context7 MCP is configured** for real-time access to library docs:

```bash
npx context7 --version                # Verify installation
npx context7 docs nextjs              # Next.js docs
npx context7 search "React hooks"     # Search React docs
```

**Configured Libraries:** Next.js 16, React 19, TypeScript, Tailwind 4, Supabase, OpenRouter, HighLevel, YCloud.

Claude Code uses Context7 automatically when you ask about libraries. See [MCP_SETUP.md](./MCP_SETUP.md) and [CONTEXT7_GUIDE.md](./CONTEXT7_GUIDE.md) for details.

## Stack & Key Dependencies

- **Frontend:** Next.js 16.2.9 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **Backend/Auth:** Supabase (PostgreSQL, Auth, Realtime)
- **API Client:** @supabase/supabase-js + @supabase/auth-helpers-nextjs
- **Forms:** @hookform/resolvers + react-hook-form (implied usage)
- **Utils:** axios, clsx, uuid
- **Deployment:** Vercel
- **Linting:** ESLint 9 (Next.js + TypeScript config)

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
OPENROUTER_API_KEY=<for_ai_models>
HIGHLEVEL_API_KEY=<for_crm_integration>
YCLOUD_API_KEY=<for_whatsapp>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Sensitive keys (SUPABASE_SERVICE_ROLE_KEY, API keys) are server-only. Use NEXT_PUBLIC_ prefix only for client-safe values.

## Architecture Overview

### High-Level Module Structure

**Core Domains** (per the product brief):

1. **Inbox Module** (`src/app/inbox/`)
   - WhatsApp Web–like UI: conversation list (left) + active conversation (right)
   - Real-time message sync via Supabase Realtime
   - Toggle AI/human mode per conversation
   - Manual handoff to human
   - Message composer: text, audio, images, documents, templates

2. **CRM Module** (`src/app/crm/`)
   - Contact management (name, phone, email, tags, custom fields)
   - Contact deduplication by phone
   - Sidebar contact preview in inbox
   - Sync bidirectional with HighLevel API

3. **AI / Agent Engine** (backend)
   - Buffer/debounce logic: collects messages in a time window before processing
   - State machine: IA active / Human active / Handoff pending / Paused / Closed
   - Tool/connector execution: KB search, contact updates, scheduling, etc.
   - Integration with OpenRouter (model selection per workspace/task)
   - Handoff detection: low confidence, objections, explicit request, capacity limits

4. **Business Info Module** (`src/app/settings/business-info`)
   - Structured company context: name, description, services, FAQ, hours, pricing, policies
   - Separate from prompt instructions; injected dynamically into agent context

5. **Custom Prompting** (`src/app/settings/prompts/`)
   - System prompt per workspace / number / campaign / label / mode
   - Dynamic variable injection: name, source, stage, owner, etc.
   - Versioning: draft vs published, history, playground
   - Guardrails: forbidden claims, tone, style, length

6. **Tools / Connectors** (`src/app/settings/tools/`)
   - Catalog: KB search, DB query, API calls, contact CRUD, scheduling, tagging, handoff, custom webhooks
   - Per-workspace enable/disable + credentials
   - Tool call logs, timeout, retry, fallback logic

7. **Setter Mode** (`src/app/settings/setter/`)
   - Qualification workflow: discovery questions + knockout questions + lead score
   - Knockout rules: budget, location, industry, headcount, language, etc.
   - Actions: send schedule link, create opportunity, escalate to human, sync to HighLevel

8. **Templates & Meta Compliance** (`src/app/settings/templates/`)
   - 24-hour window enforcement: free text allowed within <24h, blocked outside
   - Template management: create, edit, validate, submit to Meta
   - States: draft, submitted, approved, rejected, paused
   - Sync templates from Meta
   - Validate message structure (variables, components, language must match exactly)

9. **Knowledge Base** (`src/app/settings/knowledge-base/`)
   - Upload documents, FAQs, URLs, snippets
   - Versioning per workspace/agent
   - Priority order: KB > prompt > tools
   - Source citation/traceability

10. **HighLevel Integration** (backend)
    - Authenticate subcuenta connection
    - Sync contacts (bidirectional)
    - Sync tags, create/update opportunities
    - Direct appointment creation via API
    - Webhook handling (inbound/outbound)

11. **Settings & Configuration** (`src/app/settings/`)
    - WhatsApp account + YCloud credentials
    - Meta templates
    - OpenRouter model selection
    - Automation rules
    - Team/roles/permissions
    - Observability & logs

12. **Roles & Permissions**
    - Admin, Manager, Agent, Viewer
    - Granular: toggle AI, respond, edit prompts, edit templates, connect tools, view costs, force sends, handoff

13. **Observability** (logs)
    - Inbound messages, buffer grouping, agent decision, prompt used, tool calls, model response
    - 24-hour window status, template errors, IA↔human state change, HighLevel sync, scheduling results

### Database Schema (Supabase PostgreSQL)

```sql
-- Core tenancy
workspaces
  id UUID PRIMARY KEY
  slug TEXT UNIQUE
  name TEXT
  owner_id UUID FK users.id
  settings JSONB (config, branding, etc.)
  created_at TIMESTAMP

users
  id UUID PRIMARY KEY (Supabase Auth)
  workspace_id UUID FK workspaces.id
  email TEXT
  role TEXT (admin/manager/agent/viewer)
  permissions JSONB
  created_at TIMESTAMP

-- Contacts & conversations
contacts
  id UUID PRIMARY KEY
  workspace_id UUID FK workspaces.id
  phone TEXT
  name TEXT, email TEXT, tags TEXT[]
  custom_fields JSONB
  stage TEXT (lead/qualified/customer/etc.)
  source TEXT
  owner_id UUID FK users.id
  highlevel_contact_id TEXT
  last_interaction TIMESTAMP
  consent BOOLEAN
  created_at, updated_at TIMESTAMP

conversations
  id UUID PRIMARY KEY
  workspace_id UUID FK workspaces.id
  contact_id UUID FK contacts.id
  ycloud_conversation_id TEXT (external reference)
  ai_enabled BOOLEAN
  human_assigned_id UUID FK users.id
  status TEXT (active/paused/closed/handoff_pending)
  state TEXT (ia_active/human_active/handoff/waiting/paused/closed)
  window_open BOOLEAN (24-hour window status)
  tags TEXT[]
  priority INTEGER
  internal_notes TEXT
  buffer_messages JSONB (pending messages in buffer)
  last_buffer_time TIMESTAMP
  last_message_at TIMESTAMP
  created_at, updated_at TIMESTAMP

messages
  id UUID PRIMARY KEY
  conversation_id UUID FK conversations.id
  sender_id TEXT (either contact phone or user_id)
  sender_type TEXT (contact/ai/human)
  content TEXT
  media_urls TEXT[]
  media_type TEXT (text/audio/image/document/video)
  template_id UUID FK templates.id (if template-based)
  tool_calls JSONB (if AI-generated)
  metadata JSONB (transcription, confidence, etc.)
  created_at TIMESTAMP

-- AI / Agent
agent_executions
  id UUID PRIMARY KEY
  conversation_id UUID FK conversations.id
  prompt_version_id UUID FK prompt_versions.id
  model TEXT (OpenRouter model name)
  input_tokens INTEGER, output_tokens INTEGER
  cost NUMERIC
  decision TEXT (respond/wait/handoff/abstain)
  tools_used TEXT[]
  buffer_group_id UUID (which batch this belongs to)
  error TEXT (if failed)
  created_at TIMESTAMP

-- Business info
business_info
  id UUID PRIMARY KEY
  workspace_id UUID FK workspaces.id
  name TEXT
  description TEXT
  services TEXT[]
  faqs JSONB
  hours JSONB
  service_zones TEXT[]
  pricing JSONB
  policies TEXT
  common_objections JSONB
  allowed_claims TEXT[]
  forbidden_claims TEXT[]
  brand_tone TEXT
  links JSONB
  primary_cta TEXT
  updated_at TIMESTAMP

-- Prompting
prompt_versions
  id UUID PRIMARY KEY
  workspace_id UUID FK workspaces.id
  scope TEXT (global/by_number/by_campaign/by_label/by_mode)
  scope_value TEXT (number, campaign name, label, mode)
  system_prompt TEXT
  variables JSONB
  guardrails JSONB
  status TEXT (draft/published)
  version_number INTEGER
  created_at, updated_at TIMESTAMP
  created_by UUID FK users.id

-- Tools
tool_configs
  id UUID PRIMARY KEY
  workspace_id UUID FK workspaces.id
  tool_type TEXT (kb_search/db_query/api_call/contact_crud/scheduling/etc.)
  enabled BOOLEAN
  credentials JSONB (encrypted API keys)
  config JSONB (params, limits, retry logic)
  created_at, updated_at TIMESTAMP

-- Knowledge base
kb_documents
  id UUID PRIMARY KEY
  workspace_id UUID FK workspaces.id
  title TEXT
  content TEXT
  document_type TEXT (faq/url/snippet/upload)
  version INTEGER
  active BOOLEAN
  created_at, updated_at TIMESTAMP

-- Setter config
setter_configs
  id UUID PRIMARY KEY
  workspace_id UUID FK workspaces.id
  enabled BOOLEAN
  questions JSONB (required/optional, knockout rules)
  scoring_rules JSONB
  next_action TEXT (send_schedule/create_opportunity/escalate/etc.)
  created_at, updated_at TIMESTAMP

-- Templates & Meta
templates
  id UUID PRIMARY KEY
  workspace_id UUID FK workspaces.id
  meta_template_id TEXT (Meta API template ID)
  name TEXT
  language TEXT
  content TEXT
  components JSONB (text/media/buttons/location)
  variables TEXT[]
  status TEXT (draft/submitted/approved/rejected/paused)
  submitted_at TIMESTAMP
  approved_at TIMESTAMP
  created_at, updated_at TIMESTAMP

-- Logs / Observability
logs
  id UUID PRIMARY KEY
  workspace_id UUID FK workspaces.id
  conversation_id UUID FK conversations.id
  event_type TEXT (message_inbound/buffer_group/agent_decision/tool_call/sync_highlevel/etc.)
  level TEXT (info/warn/error)
  details JSONB
  created_at TIMESTAMP
  indexed_at TIMESTAMP (for search/analysis)
```

### File Structure

```
src/
  app/
    layout.tsx          # Root layout (auth wrapper, Supabase provider)
    page.tsx            # Home / dashboard redirect
    auth/
      login/            # Login page
      signup/           # Signup page
      callback/         # OAuth callback
    inbox/
      page.tsx          # Main inbox UI
      [id]/            # Individual conversation detail
      components/
        ConversationList.tsx
        ConversationDetail.tsx
        MessageComposer.tsx
        TemplateSelector.tsx (24h window logic)
    crm/
      page.tsx          # Contacts list
      [id]/            # Contact detail
      components/
        ContactCard.tsx
        ContactForm.tsx
    settings/
      page.tsx          # Settings navigation
      business-info/
      prompts/
      tools/
      templates/
      setter/
      knowledge-base/
      roles/
    api/
      webhooks/        # YCloud, HighLevel, Meta webhooks
      agent/           # Agent execution endpoint
      openrouter/      # LLM proxy
      highlevel/       # HighLevel API proxy
    lib/
      supabase/        # Client, server, admin clients
      utils/           # Helpers (formatting, validation)
      types/           # TypeScript types
      constants/       # Enums, defaults
    styles/            # Global CSS
  middleware.ts        # Auth, workspace routing
```

---

## Development Workflow

1. **Setup Supabase project:**
   - Create a new Supabase project
   - Copy URL and keys to `.env.local`
   - Run migrations (schema above; can use Supabase SQL editor or migration files)

2. **Authentication:**
   - Supabase Auth handles user signup/login
   - Middleware redirects unauthenticated users to `/auth/login`
   - User workspace assignment on signup

3. **Local dev:**
   - `npm run dev` starts Next.js server + Supabase local emulator (if using)
   - Test at http://localhost:3000
   - Realtime updates via Supabase Realtime subscription

4. **Build & deploy:**
   - `npm run build` for production build
   - Deploy to Vercel (one-click from GitHub)
   - Set environment variables in Vercel dashboard

---

## Key Patterns & Conventions

### Server vs. Client Components
- **Server by default** (React 19 + Next.js App Router)
- Use `"use client"` sparingly; only for interactivity (forms, real-time updates, state)
- Fetch data in server components; pass to client children

### API Routes
- Handlers in `src/app/api/route.ts` export named functions: `GET`, `POST`, etc.
- Use Supabase admin client (with service role key) for server-side operations
- Validate request origin, auth, permissions before processing

### Supabase
- **Client library** (`@supabase/supabase-js`) for browser-side queries
- **Auth helpers** enable middleware protection + session management
- **Realtime subscriptions** for inbox message sync
- **RLS (Row Level Security)** enforces workspace/user isolation at DB level

### Tailwind CSS 4
- Tailwind v4 simplifies config; use `@tailwindcss/postcss` plugin
- Utility-first approach; avoid custom CSS unless styling complex component

### TypeScript
- Strict mode enabled
- Define types for API payloads, DB tables, component props
- Use `types/` folder for shared types

---

## Important Notes

### ⚠️ Next.js 16 Breaking Changes
- Check `node_modules/next/dist/docs/` for current APIs before coding
- Middleware API, route handlers, ISR behavior may differ from older versions
- Read deprecation notices in Next.js docs carefully

### WhatsApp / Meta Compliance
- **24-hour window enforcement is a HARD guardrail** — block free text outside window
- Templates require Meta approval before sending
- Message structure (variables, components) must match template exactly
- YCloud webhooks for status updates, delivery receipts, errors

### Multi-Tenant Design
- All tables have `workspace_id` FK
- Database RLS policies enforce workspace isolation
- Avoid queries that leak data across workspaces

### Agent Execution
- Buffer logic: collect messages for N seconds, group by semantic intent, then process as one batch
- State machine: IA vs human mode; automatic handoff on confidence drop, explicit request, or capacity limit
- Tool calls logged; failures trigger fallback prompt or escalation

### Observability
- Log all agent decisions, tool calls, template validations, sync events
- Use structured logs (JSON) for searchability
- Track token usage + cost per conversation for billing

---

## Next Steps (Onboarding)

1. Create Supabase project and run schema migrations
2. Set up authentication (Supabase Auth or OAuth providers)
3. Build **Inbox** module (real-time conversation list + detail)
4. Integrate **YCloud** webhooks for message ingestion
5. Implement **Agent runtime** (buffer + decision + OpenRouter call)
6. Build **Settings** panels (prompts, tools, templates, business info)
7. Add **HighLevel** sync (contacts, opportunities, scheduling)
8. Enforce **24-hour window + template validation**
9. Add **Setter mode** (qualification workflow)
10. Deploy to Vercel + configure environment

---

See [BRIEF.md](./BRIEF.md) for detailed product specification and [AGENTS.md](./AGENTS.md) for Next.js version notes.
