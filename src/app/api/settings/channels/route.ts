import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  const { data: ws } = await supabase.from("workspaces").select("settings").eq("id", u!.workspace_id).single();
  // Never expose raw api key to client — return masked version
  const settings = ws?.settings ?? {};
  return NextResponse.json({
    ycloud_api_key: settings.ycloud_api_key ? "***" : "",
    phone_number: settings.phone_number ?? "",
    webhook_secret: settings.webhook_secret ? "***" : "",
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase.from("users").select("workspace_id, role").eq("id", user.id).single();
  if (u?.role !== "admin") return NextResponse.json({ error: "Solo el admin puede modificar canales" }, { status: 403 });
  const { ycloud_api_key, phone_number, webhook_secret } = await req.json();
  const { data: ws } = await supabase.from("workspaces").select("settings").eq("id", u.workspace_id).single();
  const current = ws?.settings ?? {};
  const updated = {
    ...current,
    ...(ycloud_api_key && ycloud_api_key !== "***" ? { ycloud_api_key } : {}),
    ...(phone_number ? { phone_number } : {}),
    ...(webhook_secret && webhook_secret !== "***" ? { webhook_secret } : {}),
  };
  const { error } = await supabase.from("workspaces").update({ settings: updated }).eq("id", u.workspace_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
