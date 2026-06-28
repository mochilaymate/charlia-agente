import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data } = await supabase.from("business_info").select("*").eq("workspace_id", u.workspace_id).maybeSingle();
  return NextResponse.json(data ?? {});
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const { data, error } = await supabase
    .from("business_info")
    .upsert({ ...body, workspace_id: u.workspace_id }, { onConflict: "workspace_id" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
