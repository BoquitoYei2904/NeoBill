import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { profiles } from "../db/schema.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

/**
 * Creates the first admin account for a fresh environment. Run this once
 *
 * Usage:
 * ADMIN_EMAIL=you@company.com
 * ADMIN_PASSWORD=... 
 * ADMIN_NAME="Your Name" 
 * 
 * npm run seed:admin
 */

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin";

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables and try again.");
  console.error(
    'Example: ADMIN_EMAIL=you@company.com ADMIN_PASSWORD="a-strong-password" ADMIN_NAME="Your Name" npm run seed:admin'
  );
  process.exit(1);
}

if (password.length < 6) {
  console.error("ADMIN_PASSWORD must be at least 6 characters.");
  process.exit(1);
}

async function main() {
  // Idempotent: safe to re-run. If a profile with this email already
  // exists, don't create a duplicate Supabase auth user.
  const [existing] = await db.select().from(profiles).where(eq(profiles.email, email!));
  if (existing) {
    console.log(`A profile for ${email} already exists (role: ${existing.roles}, status: ${existing.status}).`);
    if (existing.roles !== "admin" || existing.status !== "approved") {
      await db
        .update(profiles)
        .set({ roles: "admin", status: "approved" })
        .where(eq(profiles.id, existing.id));
      console.log("Promoted to admin + approved.");
    } else {
      console.log("Nothing to do — already an approved admin.");
    }
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    console.error("Failed to create admin auth account:", error?.message);
    process.exit(1);
  }

  await db.insert(profiles).values({
    id: data.user.id,
    email: email!,
    name,
    roles: "admin",
    status: "approved",
  });

  console.log(`Admin account created: ${email}`);
  console.log("You can now sign in with this email/password.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
