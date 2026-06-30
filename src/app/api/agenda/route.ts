import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listEvents, createEvent, refreshAccessToken } from "@/lib/integrations/google-calendar";

async function getValidToken(workspaceId: string) {
  const supabase = createAdminClient();
  const { data: ws } = await supabase
    .from("workspaces").select("settings").eq("id", workspaceId).single();

  if (!ws) return null;
  const gcal = (ws.settings as Record<string, unknown>)?.google_calendar as Record<string, unknown> | undefined;
  if (!gcal?.access_token) return null;

  if (Date.now() > (gcal.expires_at as number) - 60_000) {
    const refreshed = await refreshAccessToken(gcal.refresh_token as string);
    const currentSettings = (ws.settings as Record<string, unknown>) ?? {};
    await supabase.from("workspaces").update({
      settings: {
        ...currentSettings,
        google_calendar: {
          ...gcal,
          access_token: refreshed.access_token,
          expires_at: Date.now() + refreshed.expires_in * 1000,
        },
      },
    }).eq("id", workspaceId);
    return refreshed.access_token;
  }

  return gcal.access_token as string;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  if (!u) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const token = await getValidToken(u.workspace_id);
  if (!token) return NextResponse.json({ connected: false, events: [] });

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin") ?? new Date().toISOString();
  const timeMax = searchParams.get("timeMax") ?? new Date(Date.now() + 30 * 86400000).toISOString();

  try {
    const data = await listEvents(token, timeMin, timeMax);
    return NextResponse.json({ connected: true, events: data.items ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  if (!u) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const token = await getValidToken(u.workspace_id);
  if (!token) return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 });

  const body = await req.json();
  try {
    const event = await createEvent(token, body);
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
