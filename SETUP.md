# Setup Guide — WhatsApp AI Inbox

## 1. Requisitos previos

- Node.js 18+ + npm
- Cuenta de Supabase (free tier OK)
- Claves API: OpenRouter, YCloud, HighLevel (opcionales en v1)
- Vercel account (para deploy)

## 2. Instalación local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus keys de Supabase, OpenRouter, etc.

# 3. Crear proyecto Supabase
# - Ve a supabase.com → New Project
# - Copia URL y ANON_KEY a .env.local
# - Ejecuta migrations (schema en CLAUDE.md)

# 4. Correr dev server
npm run dev
# → http://localhost:3000
```

## 3. Estructura del proyecto

Ver [CLAUDE.md](./CLAUDE.md) para arquitectura detallada.

Directorios clave:
- `src/app/` → Páginas + API routes
- `src/lib/types/` → Tipos TypeScript
- `src/lib/supabase/` → Clientes Supabase
- `src/lib/constants/` → Enums y defaults

## 4. Supabase Setup

### 4.1 Crear tablas

Ejecuta el siguiente SQL en el editor de Supabase:

```sql
-- Ver schema completo en CLAUDE.md (sección Database Schema)
-- Para v1, prioridad:
-- 1. workspaces, users (core tenancy)
-- 2. contacts, conversations, messages (inbox)
-- 3. business_info, prompt_versions (config)
-- 4. templates (compliance Meta)
-- 5. logs (observability)
```

### 4.2 RLS (Row Level Security)

Habilita RLS en todas las tablas y define políticas para que cada usuario/workspace solo vea sus datos.

Ejemplo:
```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access contacts in their workspace"
  ON contacts FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));
```

### 4.3 Auth

Configura en Supabase:
- Email/password provider (default)
- (Opcional) OAuth providers (Google, GitHub)

## 5. Configurar MCP para Supabase

El archivo `.mcp.json` ya está creado. Para usar MCP en Claude Code:

1. Asegúrate de que variables de entorno están en `.env.local`
2. Usa Claude Code con MCP para queries a Supabase:
   ```
   /claude-search "fetch all conversations from workspace X"
   ```

## 6. Roadmap inicial (milestones)

### MVP v0.1
- [x] Setup Next.js + Supabase + Tailwind
- [ ] Autenticación (login/signup)
- [ ] Dashboard básico (redirect a inbox)
- [ ] Inbox (mock data)

### v0.2
- [ ] Real-time messages (Supabase Realtime)
- [ ] AI toggle (UI only, no backend)
- [ ] Handoff UI (no lógica)

### v0.3
- [ ] Agent runtime (buffer + OpenRouter)
- [ ] YCloud webhook ingestion
- [ ] 24-hour window enforcement

### v0.4
- [ ] Template management + Meta sync
- [ ] HighLevel integration
- [ ] Setter mode

### v1.0
- [ ] Full compliance + performance testing
- [ ] Deploy a staging
- [ ] Documentation para onboarding

## 7. Comandos útiles

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check

# Supabase CLI (opcional, si instalado)
supabase start       # Local Supabase emulator
supabase status      # Check connection
supabase migrations list
```

## 8. Solución de problemas

**Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"**
- Revisa `.env.local` y reinicia el dev server

**Error: "Invalid login"**
- Verifica que Supabase Auth esté habilitado en tu proyecto

**Error: "Template error during build"**
- Revisa `tsconfig.json` y que no haya imports faltantes

## 9. Próximos pasos

1. Leer [BRIEF.md](./BRIEF.md) para especificación completa del producto
2. Leer [CLAUDE.md](./CLAUDE.md) para arquitectura y patrones
3. Crear schema Supabase (SQL en CLAUDE.md)
4. Implementar autenticación
5. Construir inbox base (UI)
6. Integrar YCloud (webhooks)

---

¡Listo para empezar! 🚀
