import type { Context } from "hono";

/**
 * Postgres error codes we handle specially. Full list:
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const FOREIGN_KEY_VIOLATION = "23503";
const UNIQUE_VIOLATION = "23505";

type PgError = Error & { code?: string; constraint_name?: string };

function isPgError(err: unknown): err is PgError {
  return err instanceof Error && "code" in err;
}

/*
Wraps a route handler's database logic. If the operation fails because of
a `restrict` foreign key (something still references the row you tried to
delete) or a unique constraint, returns a clean 409 instead of a raw 500.
Any other error is re-thrown so it surfaces normally.
 */
export async function withDbErrorHandling<T>(
  c: Context,
  fn: () => Promise<T>
): Promise<T | Response> {
  try {
    return await fn();
  } catch (err) {
    if (isPgError(err) && err.code === FOREIGN_KEY_VIOLATION) {
      return c.json(
        {
          message:
            "Can't complete this — the record is still referenced elsewhere.",
        },
        409
      );
    }
    if (isPgError(err) && err.code === UNIQUE_VIOLATION) {
      return c.json({ message: "A record with that value already exists." }, 409);
    }
    throw err;
  }
}
