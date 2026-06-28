import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel cron — sweeps conversations with pending buffer that weren't flushed by QStash
// Called every minute by Vercel Cron (vercel.json). Protected by CRON_SECRET.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const BUFFER_DELAY_MS = 30_000; // 30s silence window before flush

  // Find conversations with pending buffer older than BUFFER_DELAY_MS
  const cutoff = new Date(Date.now() - BUFFER_DELAY_MS).toISOString();
  const { data: pending } = await supabase
    .from("conversations")
    .select("id, workspace_id, buffer_messages, ai_enabled, state")
    .not("buffer_messages", "is", null)
    .not("buffer_messages", "eq", "[]")
    .is("buffer_group_id", null)
    .lte("last_buffer_time", cutoff)
    .eq("ai_enabled", true)
    .eq("state", "ia_active")
    .limit(20);

  if (!pending?.length) {
    return NextResponse.json({ swept: 0 });
  }

  // Atomic claim — set buffer_group_id to prevent double-run
  const { v4: uuidv4 } = await import("uuid");
  let swept = 0;

  for (const conv of pending) {
    const groupId = uuidv4();
    const { data: claimed } = await supabase
      .from("conversations")
      .update({ buffer_group_id: groupId })
      .eq("id", conv.id)
      .is("buffer_group_id", null)
      .select("id")
      .maybeSingle();

    if (!claimed) continue; // Another instance claimed it first

    swept++;
    // TODO Fase 3: trigger agent runner for conv.id with groupId
    // await runAgent(conv.id, groupId);

    await supabase.from("logs").insert({
      workspace_id: conv.workspace_id,
      conversation_id: conv.id,
      event_type: "buffer_group",
      level: "info",
      details: { buffer_group_id: groupId, source: "cron", messages_count: (conv.buffer_messages as unknown[])?.length ?? 0 },
    });
  }

  return NextResponse.json({ swept });
}
