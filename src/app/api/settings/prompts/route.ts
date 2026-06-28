import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("prompt_versions").select("*").order("version_number", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  const body = await req.json();
  const { data: latest } = await supabase.from("prompt_versions").select("version_number").order("version_number", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase.from("prompt_versions").insert({
    workspace_id: u!.workspace_id, scope: body.scope ?? "global",
    scope_value: body.scope_value, system_prompt: body.system_prompt ?? "",
    variables: body.variables ?? {}, guardrails: body.guardrails ?? {},
    status: body.status ?? "draft", version_number: (latest?.version_number ?? 0) + 1,
    created_by: user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
