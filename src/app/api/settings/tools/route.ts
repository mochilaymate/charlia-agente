import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("tool_configs").select("id, tool_type, enabled, config");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  const { tool_type, enabled, config } = await req.json();
  const { data, error } = await supabase.from("tool_configs")
    .upsert({ workspace_id: u!.workspace_id, tool_type, enabled, config: config ?? {}, credentials: {} }, { onConflict: "workspace_id,tool_type" })
    .select("id, tool_type, enabled, config").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
