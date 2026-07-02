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

function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pw = "";
  for (let i = 0; i < length; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

/** Invite a user by email (admin only). Creates user with temp password and sends credentials via email. */
export async function inviteUserByEmail(
  email: string,
  workspaceId: string,
  role: UserRole = "agent"
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { workspace_id: workspaceId, role },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "No se pudo crear el usuario" };

  // Insert into public.users
  await admin.from("users").insert({
    id: data.user.id,
    workspace_id: workspaceId,
    email,
    role,
  });

  // Send credentials email via Brevo SMTP
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Charlia" <${process.env.BREVO_SMTP_FROM ?? process.env.BREVO_SMTP_USER}>`,
    to: email,
    subject: "Tu acceso a Charlia",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#6c4cf6;">Bienvenido/a a Charlia</h2>
        <p>Se creó una cuenta para vos con el siguiente rol: <strong>${role}</strong></p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Contraseña temporal:</strong></p>
        <p style="background:#f4f4f8;padding:12px 16px;border-radius:8px;font-family:monospace;font-size:18px;letter-spacing:2px;">${tempPassword}</p>
        <p>Ingresá en <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#6c4cf6;">${process.env.NEXT_PUBLIC_APP_URL}</a> con estos datos y cambiá tu contraseña desde tu perfil.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:12px;">Si no esperabas este email, podés ignorarlo.</p>
      </div>
    `,
  });

  return { error: null };
}
