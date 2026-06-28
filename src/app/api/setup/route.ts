import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * One-time admin setup endpoint.
 * Call once with:
 *   POST /api/setup
 *   Body: { "secret": "<SETUP_SECRET>", "email": "...", "password": "..." }
 *
 * Idempotent: safe to call multiple times.
 * After setup is confirmed working, remove SETUP_SECRET from .env.local.
 */
export async function POST(request: NextRequest) {
  const setupSecret = process.env.SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json({ error: "Setup disabled" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.secret !== setupSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const { email, password } = body as { email?: string; password?: string };
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!email || !password) {
    return NextResponse.json({ error: "email y password requeridos" }, { status: 400 });
  }

  if (adminEmail && email.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "Solo se puede crear el email de admin configurado" }, { status: 403 });
  }

  const admin = createAdminClient();

  // ── 1. Ensure auth user exists ─────────────────────────────────────
  const { data: listData } = await admin.auth.admin.listUsers();
  const existing = listData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    userId = data.user!.id;
  }

  // ── 2. Ensure workspace exists ─────────────────────────────────────
  const { data: wsData } = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  let workspaceId: string;

  if (wsData) {
    workspaceId = wsData.id;
  } else {
    const { data: newWs, error: wsError } = await admin
      .from("workspaces")
      .insert({
        slug: "charlia-agency",
        name: "Charlia Agency",
        owner_id: userId,
        settings: {},
      })
      .select("id")
      .single();

    if (wsError) return NextResponse.json({ error: wsError.message }, { status: 500 });
    workspaceId = newWs.id;
  }

  // ── 3. Ensure public.users record exists ───────────────────────────
  const { data: userRow } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!userRow) {
    const { error: userError } = await admin.from("users").insert({
      id: userId,
      workspace_id: workspaceId,
      email,
      role: "admin",
      permissions: {},
    });
    if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Setup completo. Podés loguearte en /auth/login. Eliminá SETUP_SECRET de .env.local.",
    userId,
    workspaceId,
  });
}
