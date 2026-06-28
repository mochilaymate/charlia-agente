import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "manager" | "agent" | "viewer";

/** Returns the current user's row from public.users, or null if unauthenticated */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, workspace_id, email, role, permissions")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

/** Throws 403 if the current user is not admin.
 *  Use in API route handlers that require admin access. */
export async function assertAdmin(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
}

/** Returns true if the given email matches ADMIN_EMAIL env var (fallback check before DB exists) */
export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

/** Invite a user by email (admin only). Uses service role to bypass auth limitations. */
export async function inviteUserByEmail(
  email: string,
  workspaceId: string,
  role: UserRole = "agent"
): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { workspace_id: workspaceId, role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "No se pudo crear la invitación" };

  return { error: null };
}
