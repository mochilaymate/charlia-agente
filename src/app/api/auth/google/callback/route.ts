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

    const payload = {
      workspace_id: workspaceId,
      tool_type: "google_calendar",
      enabled: true,
      config: { calendar_id: "primary" },
      credentials: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + tokens.expires_in * 1000,
      },
    };

    const { data: existing } = await supabase.from("tool_configs")
      .select("id").eq("workspace_id", workspaceId).eq("tool_type", "google_calendar").single();

    if (existing) {
      const { error } = await supabase.from("tool_configs")
        .update({ enabled: true, config: payload.config, credentials: payload.credentials })
        .eq("id", existing.id);
      if (error) console.error("[google-callback] update error:", error);
    } else {
      const { error } = await supabase.from("tool_configs").insert(payload);
      if (error) console.error("[google-callback] insert error:", error);
    }

    return NextResponse.redirect(new URL("/agenda?connected=1", req.url));
  } catch (err) {
    console.error("[google-callback] error:", err);
    return NextResponse.redirect(new URL("/agenda?error=auth_failed", req.url));
  }
}
