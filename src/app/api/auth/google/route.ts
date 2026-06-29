import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOAuthUrl } from "@/lib/integrations/google-calendar";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: u } = await supabase.from("users").select("workspace_id").eq("id", user.id).single();
  if (!u) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  return NextResponse.redirect(getOAuthUrl(u.workspace_id));
}
