export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyYCloudSignature, parseInboundWebhook, parseStatusWebhook } from "@/lib/integrations/ycloud";
import { normalizeE164 } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sigHeader = req.headers.get("ycloud-signature") ?? "";

  // Resolve workspace by target number before signature check
  // (we need the webhook_secret stored per workspace)
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Find workspace by phone number in settings
  const to = (payload.to ?? (payload.data as Record<string, string> | undefined)?.to ?? "") as string;
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, settings");

  const workspace = workspaces?.find(ws => {
    const s = ws.settings as Record<string, string> | null;
    return s?.phone_number && normalizeE164(s.phone_number) === normalizeE164(to);
  });

  if (!workspace) {
    // Unknown target number — reject (do not expose 404 to probers)
    return NextResponse.json({ error: "Not found" }, { status: 401 });
  }

  const settings = workspace.settings as Record<string, string>;
  const secret = settings.webhook_secret;

  if (!secret) {
    console.error(`[ycloud-webhook] Workspace ${workspace.id} has no webhook_secret configured`);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 401 });
  }

  if (!verifyYCloudSignature(rawBody, sigHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Return 200 immediately; process async
  const response = NextResponse.json({ ok: true });

  // Async processing
  (async () => {
    try {
      const type = payload.type as string;

      if (type === "whatsapp.inbound_message.received") {
        const inbound = parseInboundWebhook(payload);
        if (!inbound) return;

        const { wamid, from, timestamp, type: msgType, text, mediaLink } = inbound;

        // Idempotency — skip if wamid already exists
        const { data: existing } = await supabase
          .from("messages")
          .select("id")
          .eq("metadata->>'wamid'", wamid)
          .maybeSingle();
        if (existing) return;

        // Upsert contact
        const phone = normalizeE164(from);
        const { data: contact } = await supabase
          .from("contacts")
          .upsert({ workspace_id: workspace.id, phone }, { onConflict: "workspace_id,phone" })
          .select("id")
          .single();
        if (!contact) return;

        // Find or create conversation
        let { data: conv } = await supabase
          .from("conversations")
          .select("id, buffer_messages")
          .eq("workspace_id", workspace.id)
          .eq("contact_id", contact.id)
          .maybeSingle();

        if (!conv) {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({
              workspace_id: workspace.id,
              contact_id: contact.id,
              ai_enabled: true,
              status: "active",
              state: "ia_active",
              window_open: true,
              last_inbound_at: timestamp.toISOString(),
              last_message_at: timestamp.toISOString(),
            })
            .select("id, buffer_messages")
            .single();
          conv = newConv;
        } else {
          await supabase
            .from("conversations")
            .update({
              window_open: true,
              last_inbound_at: timestamp.toISOString(),
              last_message_at: timestamp.toISOString(),
              last_buffer_time: timestamp.toISOString(),
            })
            .eq("id", conv.id);
        }

        if (!conv) return;

        // Insert message
        const content = text ?? (msgType !== "text" ? `[${msgType}]` : "");
        await supabase.from("messages").insert({
          conversation_id: conv.id,
          sender_id: phone,
          sender_type: "contact",
          content,
          media_type: msgType,
          metadata: { wamid, ycloud_timestamp: timestamp.toISOString() },
        });

        // Append to buffer
        const currentBuffer = (conv.buffer_messages as unknown[]) ?? [];
        await supabase.from("conversations").update({
          buffer_messages: [...currentBuffer, { wamid, content, type: msgType, ts: timestamp.toISOString() }],
          last_buffer_time: new Date().toISOString(),
        }).eq("id", conv.id);

        await supabase.from("logs").insert({
          workspace_id: workspace.id,
          conversation_id: conv.id,
          event_type: "message_inbound",
          level: "info",
          details: { wamid, from, type: msgType },
        });

      } else if (type === "whatsapp.message.updated") {
        const status = parseStatusWebhook(payload);
        if (!status) return;
        // Update message delivery status via raw SQL through admin client
        await supabase.rpc("update_message_status", { p_wamid: status.wamid, p_status: status.status }).maybeSingle();
      }
    } catch (err) {
      console.error("[ycloud-webhook] async processing error", err);
    }
  })();

  return response;
}
