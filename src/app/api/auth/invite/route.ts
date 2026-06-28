import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inviteUserByEmail } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["manager", "agent", "viewer"]).default("agent"),
});

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role check — only admin can invite
  const { data: dbUser } = await supabase
    .from("users")
    .select("role, workspace_id")
    .eq("id", user.id)
    .single();

  const isAdmin =
    dbUser?.role === "admin" ||
    user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Solo el administrador puede invitar usuarios" }, { status: 403 });
  }

  // Parse body
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const workspaceId = dbUser?.workspace_id ?? "";
  const { error } = await inviteUserByEmail(
    parsed.data.email,
    workspaceId,
    parsed.data.role
  );

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: `Invitación enviada a ${parsed.data.email}` });
}
