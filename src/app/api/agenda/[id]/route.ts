import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateEvent, deleteEvent, refreshAccessToken } from "@/lib/integrations/google-calendar";

async function getValidToken(workspaceId: string) {
  const supabase = createAdminClient();
  const { data: ws } = await supabase
    .from("workspaces").select("settings").eq("id", workspaceId).single();
  if (!ws) return null;
  const gcal = (ws.settings as Record<string, unknown>)?.google_calendar as Record<string, unknown> | undefined;
  if (!gcal?.access_token) return null;
  if (Date.now() > (gcal.expires_at as number) - 60_000) {
    const r = await refreshAccessToken(gcal.refresh_token as string);
    const currentSettings = (ws.settings as Record<string, unknown>) ?? {};
    await supabase.from("workspaces").update({
      settings: { ...currentSettings, google_calendar: { ...gcal, access_token: r.access_token, expires_at: Date.now() + r.expires_in * 1000 } },
    }).eq("id", workspaceId);
    return r.access_token;
  }
  return gcal.access_token as string;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  const token = await getValidToken(u!.workspace_id);
  if (!token) return NextResponse.json({ error: "Not connected" }, { status: 400 });
  const body = await req.json();
  const event = await updateEvent(token, id, body);
  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  const token = await getValidToken(u!.workspace_id);
  if (!token) return NextResponse.json({ error: "Not connected" }, { status: 400 });
  await deleteEvent(token, id);
  return NextResponse.json({ ok: true });
}
