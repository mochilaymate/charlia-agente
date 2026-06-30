import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCode } from "@/lib/integrations/google-calendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const workspaceId = searchParams.get("state");

  if (!code || !workspaceId) {
    return NextResponse.redirect(new URL("/settings/agenda?error=missing_code", req.url));
  }

  try {
    const tokens = await exchangeCode(code);
    const supabase = createAdminClient();

    // Store Google Calendar tokens in workspaces.settings (avoids tool_type enum issues)
    const { data: ws, error: wsErr } = await supabase.from("workspaces")
      .select("settings").eq("id", workspaceId).single();
    if (wsErr) console.error("[google-callback] fetch workspace error:", wsErr);

    const currentSettings = (ws?.settings as Record<string, unknown>) ?? {};
    const { error: updateErr } = await supabase.from("workspaces")
      .update({
        settings: {
          ...currentSettings,
          google_calendar: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + tokens.expires_in * 1000,
          },
        },
      })
      .eq("id", workspaceId);
    if (updateErr) console.error("[google-callback] update workspace error:", updateErr);

    return NextResponse.redirect(new URL("/agenda?connected=1", req.url));
  } catch (err) {
    console.error("[google-callback] error:", err);
    return NextResponse.redirect(new URL("/agenda?error=auth_failed", req.url));
  }
}
