import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS.
 * Use ONLY in server-side code (webhooks, agent runner, migrations).
 * Never expose to the browser or import from client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
