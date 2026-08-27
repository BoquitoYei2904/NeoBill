import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, jwtVerify } from "jose";

const supabaseUrl = process.env.SUPABASE_URL;

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL is not set. Find it in the Supabase dashboard: " +
        "Project Settings > API > Project URL."
    );
  }
  if (!jwks) {
    // Supabase publishes its current signing public keys here. jose fetches
    // and caches them, and automatically re-fetches if a token references a
    // key id (kid) it hasn't seen yet (e.g. after Supabase rotates keys).
    jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
    );
  }
  return jwks;
}

/**
 * Verifies the `Authorization: Bearer <token>` header against Supabase's
 * public signing keys (JWKS). Supabase Auth signs tokens asymmetrically
 * (ES256), so verification only needs the public key — no shared secret
 * to manage or leak.
 */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return c.json({ message: "Missing Authorization header" }, 401);
  }

  try {
    const { payload } = await jwtVerify(token, getJwks());
    if (typeof payload.sub !== "string") {
      return c.json({ message: "Invalid token" }, 401);
    }
    c.set("userId", payload.sub);
    await next();
  } catch (err) {
    console.error("JWT verification failed:", err instanceof Error ? err.message : err);
    return c.json({ message: "Invalid or expired token" }, 401);
  }
});