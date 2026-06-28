import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: conv } = await supabase
    .from("conversations")
    .select("ai_enabled, state")
    .eq("id", id)
    .single();

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newAiEnabled = !conv.ai_enabled;
  const newState = newAiEnabled ? "ia_active" : "human_active";

  const { data, error } = await supabase
    .from("conversations")
    .update({ ai_enabled: newAiEnabled, state: newState })
    .eq("id", id)
    .select("id, ai_enabled, state")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
