import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill it in " +
      "(local Docker Postgres for dev, or your Supabase connection string for prod)."
  );
}

// Supabase's pooled connection (port 6543, pgbouncer) doesn't support prepared
// statements, so we disable them. This is harmless against local Postgres too.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
