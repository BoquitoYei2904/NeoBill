import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set to use the admin client. " +
      "Find the service_role key in: Supabase dashboard > Project Settings > API > Project API keys. " +
      "Treat it like a master password — it bypasses all security rules. Backend only, never in frontend code."
  );
}

/*
 Admin-privileged Supabase client. Can create/delete auth users directly
 (supabaseAdmin.auth.admin.*), bypassing normal sign-up.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
