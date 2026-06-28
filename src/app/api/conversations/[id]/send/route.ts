import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isWithinWhatsAppWindow } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  content: z.string().min(1).max(4096),
  media_type: z.enum(["text", "audio", "image", "document", "video"]).default("text"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Fetch conversation to check 24h window
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, last_inbound_at, window_open")
    .eq("id", id)
    .single();

  if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const windowOpen = isWithinWhatsAppWindow(conv.last_inbound_at);
  if (!windowOpen && parsed.data.media_type === "text") {
    return NextResponse.json(
      { error: "WINDOW_CLOSED", message: "La ventana de 24h está cerrada. Solo se pueden enviar plantillas aprobadas." },
      { status: 403 }
    );
  }

  // Get user DB record for sender_id
  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  // Insert message
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: dbUser?.id ?? user.id,
      sender_type: "human",
      content: parsed.data.content,
      media_type: parsed.data.media_type,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // TODO Fase 1: send via YCloud here

  return NextResponse.json(message);
}
