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

    // Store tokens in tool_configs
    await supabase.from("tool_configs").upsert({
      workspace_id: workspaceId,
      tool_type: "google_calendar",
      enabled: true,
      config: { calendar_id: "primary" },
      credentials: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + tokens.expires_in * 1000,
      },
    }, { onConflict: "workspace_id,tool_type" });

    return NextResponse.redirect(new URL("/agenda?connected=1", req.url));
  } catch (err) {
    console.error("[google-callback] error:", err);
    return NextResponse.redirect(new URL("/agenda?error=auth_failed", req.url));
  }
}
