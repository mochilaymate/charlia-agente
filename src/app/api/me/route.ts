import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("users")
    .select("id, workspace_id, email, role, permissions")
    .eq("id", user.id)
    .single();

  if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug, settings")
    .eq("id", data.workspace_id)
    .single();

  return NextResponse.json({ user: data, workspace });
}
