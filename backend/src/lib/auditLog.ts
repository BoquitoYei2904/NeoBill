import type { PgTransaction } from "drizzle-orm/pg-core";
import { auditLog } from "../db/schema.js";

type Action = "insert" | "update" | "delete";

/**
 * Records a snapshot of a row's state *before* a mutation, alongside who did
 * it. Call this inside the same transaction as the mutation itself, so the
 * audit entry and the change it describes always succeed or fail together.
 */
export async function logAudit(
  
  tx: PgTransaction<any, any, any>,
  params: {
    tableName: string;
    recordId: number;
    action: Action;
    oldData: unknown;
    userId: string;
  }
) {
  await tx.insert(auditLog).values({
    tableName: params.tableName,
    recordId: params.recordId,
    action: params.action,
    oldData: params.oldData as object | null,
    modifiedBy: params.userId,
  });
}
