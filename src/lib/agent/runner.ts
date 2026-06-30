import { createAdminClient } from "@/lib/supabase/admin";
import { sendText } from "@/lib/integrations/ycloud";
import { normalizeE164 } from "@/lib/utils";
import { listEvents, createEvent, updateEvent, deleteEvent, checkOverlap, refreshAccessToken } from "@/lib/integrations/google-calendar";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MAX_HISTORY = 20;

function buildSystemPrompt(
  businessInfo: Record<string, unknown> | null,
  kbDocs: Array<{ title: string; content: string }>,
  contactName?: string,
  hasCalendar = false
): string {
  const biz = businessInfo ?? {};

  const kb = kbDocs.length > 0
    ? `\n\n## Base de Conocimiento\n${kbDocs.map(d => `### ${d.title}\n${d.content}`).join("\n\n")}`
    : "";

  const bizContext = biz.description
    ? `\n\n## Información del Negocio\n${biz.description}`
    : "";

  const tone = (biz.brand_tone as string) ?? "cercano, simple y empático";
  const cta = (biz.primary_cta as string) ?? "¡Hablemos cinco minutos y te contamos cómo podemos darte más tiempo libre hoy mismo!";
  const forbiddenClaims = (biz.forbidden_claims as string[]) ?? [];
  const forbiddenStr = forbiddenClaims.length > 0
    ? `\n\nCLAIMS PROHIBIDOS — nunca menciones: ${forbiddenClaims.join(", ")}`
    : `\n\nCLAIMS PROHIBIDOS — nunca menciones: Inteligencia Artificial, IA, automatización, n8n, software, código, web scraping, bots, ni ningún término técnico similar. No prometas que el cliente dejará de trabajar por completo ni que sus ganancias se duplicarán.`;

  const contactCtx = contactName ? `\nEstás hablando con: ${contactName}` : "";

  return `Eres el asistente de WhatsApp de Charlia — un servicio de asistencia operativa para negocios y empresas locales.

Tu misión: aliviar la carga administrativa del cliente y guiarlo hacia una conversación con el equipo humano.

TONO: ${tone}. Habla con el lenguaje del día a día. Nada de palabras técnicas ni corporativas. Detecta el idioma del cliente y responde siempre en ese idioma. Respuestas cortas y directas — máximo 3 párrafos.

SERVICIOS QUE OFRECEMOS:
- Gestión de tareas aburridas de oficina (formularios, archivos, datos)
- Ordenamiento de información y listas de clientes/inventario
- Búsqueda y recopilación rápida de información en internet
- Diseño de paneles visuales sencillos para monitorear el negocio
- Organización de agendas y calendarios${hasCalendar ? "\n\nAGENDA: Puedes ver, crear y cancelar citas usando las herramientas disponibles. Siempre verificá disponibilidad antes de crear una cita. Confirmá con el cliente los detalles (fecha, hora, servicio) antes de agendar." : ""}${bizContext}${kb}${forbiddenStr}

CTA DE CIERRE: Cuando el cliente muestre interés real, invítalo con: "${cta}"${contactCtx}`;
}

async function getCalendarToken(workspaceId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: ws } = await supabase
    .from("workspaces").select("settings").eq("id", workspaceId).single();
  if (!ws) return null;
  const gcal = (ws.settings as Record<string, unknown>)?.google_calendar as Record<string, unknown> | undefined;
  if (!gcal?.access_token) return null;
  if (Date.now() > (gcal.expires_at as number) - 60_000) {
    try {
      const r = await refreshAccessToken(gcal.refresh_token as string);
      const currentSettings = (ws.settings as Record<string, unknown>) ?? {};
      await supabase.from("workspaces").update({
        settings: { ...currentSettings, google_calendar: { ...gcal, access_token: r.access_token, expires_at: Date.now() + r.expires_in * 1000 } },
      }).eq("id", workspaceId);
      return r.access_token;
    } catch { return null; }
  }
  return gcal.access_token as string;
}

export async function runAgent(conversationId: string): Promise<void> {
  const supabase = createAdminClient();

  // Fetch conversation + workspace
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, workspace_id, ai_enabled, state, contact_id, window_open")
    .eq("id", conversationId)
    .single();

  if (!conv || !conv.ai_enabled || conv.state !== "ia_active") return;
  if (!conv.window_open) return; // 24h window closed — don't send free text

  // Fetch workspace settings
  const { data: ws } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", conv.workspace_id)
    .single();

  const settings = (ws?.settings ?? {}) as Record<string, string>;
  const apiKey = settings.ycloud_api_key;
  const fromNumber = settings.phone_number;

  console.log("[agent] settings apiKey:", apiKey ? "present" : "MISSING", "fromNumber:", fromNumber ?? "MISSING");

  if (!apiKey || !fromNumber) {
    console.error("[agent] Missing YCloud credentials for workspace", conv.workspace_id);
    return;
  }

  // Fetch contact
  const { data: contact } = await supabase
    .from("contacts")
    .select("phone, name")
    .eq("id", conv.contact_id)
    .single();

  if (!contact) return;

  // Fetch recent messages for context
  const { data: messages } = await supabase
    .from("messages")
    .select("sender_type, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY);

  if (!messages?.length) return;

  // Fetch business info
  const { data: bizInfo } = await supabase
    .from("business_info")
    .select("*")
    .eq("workspace_id", conv.workspace_id)
    .maybeSingle();

  // Fetch active KB documents
  const { data: kbDocs } = await supabase
    .from("kb_documents")
    .select("title, content")
    .eq("workspace_id", conv.workspace_id)
    .eq("active", true)
    .limit(10);

  // Build OpenRouter messages (reverse to chronological order)
  const history = [...messages].reverse();
  const chatMessages = history.map(m => ({
    role: m.sender_type === "contact" ? "user" : "assistant",
    content: m.content ?? "",
  })).filter(m => m.content);

  const calendarToken = await getCalendarToken(conv.workspace_id);

  const systemPrompt = buildSystemPrompt(
    bizInfo as Record<string, unknown> | null,
    kbDocs ?? [],
    contact.name ?? undefined,
    !!calendarToken
  );

  // Call OpenRouter
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    console.error("[agent] Missing OPENROUTER_API_KEY");
    return;
  }

  // Calendar tools (only if connected)
  const calendarTools = calendarToken ? [
    {
      type: "function",
      function: {
        name: "list_appointments",
        description: "Lista las citas del calendario para un rango de fechas.",
        parameters: {
          type: "object",
          properties: {
            date_from: { type: "string", description: "Fecha inicio ISO (YYYY-MM-DD)" },
            date_to: { type: "string", description: "Fecha fin ISO (YYYY-MM-DD)" },
          },
          required: ["date_from", "date_to"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_appointment",
        description: "Crea una nueva cita en el calendario. Verificar disponibilidad primero.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            date: { type: "string", description: "YYYY-MM-DD" },
            start_time: { type: "string", description: "HH:MM" },
            end_time: { type: "string", description: "HH:MM" },
            description: { type: "string" },
          },
          required: ["title", "date", "start_time", "end_time"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "cancel_appointment",
        description: "Cancela o elimina una cita existente.",
        parameters: {
          type: "object",
          properties: { event_id: { type: "string" } },
          required: ["event_id"],
        },
      },
    },
  ] : [];

  let aiResponse: string | null = null;
  let inputTokens = 0;
  let outputTokens = 0;
  let cost = 0;

  try {
    const currentMessages: Array<{ role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string }> = [
      { role: "system", content: systemPrompt },
      ...chatMessages,
    ];

    let iterations = 0;
    while (iterations < 5) {
      iterations++;
      const body: Record<string, unknown> = {
        model: process.env.OPENROUTER_DEFAULT_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free",
        models: [
          process.env.OPENROUTER_DEFAULT_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free",
          "mistralai/mistral-7b-instruct:free",
        ],
        messages: currentMessages,
        max_tokens: 400,
        usage: { include: true },
      };
      if (calendarTools.length > 0) body.tools = calendarTools;

      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://whatsappagente.vercel.app",
          "X-Title": "Charlia",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("[agent] OpenRouter error:", res.status, await res.text());
        return;
      }

      const data = await res.json();
      inputTokens += data.usage?.prompt_tokens ?? 0;
      outputTokens += data.usage?.completion_tokens ?? 0;
      cost += data.usage?.cost ?? 0;

      const choice = data.choices?.[0];
      if (!choice) break;

      const msg = choice.message;

      // If tool call requested
      if (choice.finish_reason === "tool_calls" && msg.tool_calls?.length) {
        currentMessages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });

        for (const tc of msg.tool_calls) {
          let toolResult = "";
          try {
            const args = JSON.parse(tc.function.arguments ?? "{}");
            if (tc.function.name === "list_appointments" && calendarToken) {
              const timeMin = new Date(`${args.date_from}T00:00:00`).toISOString();
              const timeMax = new Date(`${args.date_to}T23:59:59`).toISOString();
              const evts = await listEvents(calendarToken, timeMin, timeMax);
              toolResult = JSON.stringify(evts.items?.map((e: { id: string; summary: string; start: { dateTime: string }; end: { dateTime: string } }) => ({
                id: e.id, title: e.summary,
                start: e.start.dateTime, end: e.end.dateTime,
              })) ?? []);
            } else if (tc.function.name === "create_appointment" && calendarToken) {
              const timeMin = new Date(`${args.date}T00:00:00`).toISOString();
              const timeMax = new Date(`${args.date}T23:59:59`).toISOString();
              const existing = await listEvents(calendarToken, timeMin, timeMax);
              const overlaps = checkOverlap(
                existing.items ?? [],
                `${args.date}T${args.start_time}:00`,
                `${args.date}T${args.end_time}:00`
              );
              if (overlaps) {
                toolResult = JSON.stringify({ error: "Horario ocupado — hay solapamiento con una cita existente." });
              } else {
                const ev = await createEvent(calendarToken, {
                  summary: args.title,
                  description: args.description,
                  start: { dateTime: `${args.date}T${args.start_time}:00`, timeZone: "Europe/Madrid" },
                  end: { dateTime: `${args.date}T${args.end_time}:00`, timeZone: "Europe/Madrid" },
                });
                toolResult = JSON.stringify({ ok: true, event_id: ev.id, title: ev.summary });
              }
            } else if (tc.function.name === "cancel_appointment" && calendarToken) {
              await deleteEvent(calendarToken, args.event_id);
              toolResult = JSON.stringify({ ok: true });
            }
          } catch (e) {
            toolResult = JSON.stringify({ error: String(e) });
          }
          currentMessages.push({ role: "tool", tool_call_id: tc.id, name: tc.function.name, content: toolResult });
        }
        continue;
      }

      // Final text response
      aiResponse = msg.content?.trim() ?? null;
      break;
    }
  } catch (err) {
    console.error("[agent] OpenRouter fetch error:", err);
    return;
  }

  if (!aiResponse) return;

  // Send via YCloud
  try {
    await sendText(apiKey, normalizeE164(fromNumber), normalizeE164(contact.phone), aiResponse);
  } catch (err) {
    console.error("[agent] YCloud send error:", err);
    return;
  }

  // Save AI message to DB
  const { data: savedMsg } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: normalizeE164(fromNumber),
    sender_type: "ai",
    content: aiResponse,
    media_type: "text",
    metadata: { model: process.env.OPENROUTER_DEFAULT_MODEL },
  }).select("id").single();

  // Update conversation last_message_at
  await supabase.from("conversations").update({
    last_message_at: new Date().toISOString(),
  }).eq("id", conversationId);

  // Log agent execution
  await supabase.from("agent_executions").insert({
    conversation_id: conversationId,
    model: process.env.OPENROUTER_DEFAULT_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost,
    decision: "respond",
  });

  await supabase.from("logs").insert({
    workspace_id: conv.workspace_id,
    conversation_id: conversationId,
    event_type: "agent_decision",
    level: "info",
    details: { decision: "respond", tokens: inputTokens + outputTokens, cost, msg_id: savedMsg?.id },
  });

  console.log("[agent] responded to", conversationId, "tokens:", inputTokens + outputTokens);
}
