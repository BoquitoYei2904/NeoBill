import { eq, and, ne } from "drizzle-orm";
import { payments, licitations } from "../../db/schema"; // adjust import path

export class PaymentAmountExceedsLicitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentAmountExceedsLicitationError";
  }
}

// Convert to integer cents to avoid floating point comparison issues
function toCents(amount: number | string): number {
  return Math.round(Number(amount) * 100);
}

export async function getLicitationTotalPaidCents(
  tx: any,
  licitationId: number,
  excludePaymentId?: number
): Promise<number> {
  const conditions = [eq(payments.licitationId, licitationId)];
  if (excludePaymentId !== undefined) {
    conditions.push(ne(payments.id, excludePaymentId));
  }

  const rows = await tx
    .select({ amount: payments.amount })
    .from(payments)
    .where(and(...conditions));

  return rows.reduce((sum: number, row: { amount: string }) => sum + toCents(row.amount), 0);
}


export async function validatePaymentAmount(
  tx: any,
  licitationId: number,
  newAmount: number,
  excludePaymentId?: number
): Promise<void> {
  const [licitation] = await tx.select().from(licitations).where(eq(licitations.id, licitationId));
  if (!licitation) {
    throw new Error("Licitation not found");
  }

  const licitationTotalCents = toCents(licitation.total); // <-- confirm field name
  const alreadyPaidCents = await getLicitationTotalPaidCents(tx, licitationId, excludePaymentId);
  const projectedTotalCents = alreadyPaidCents + toCents(newAmount);

  if (projectedTotalCents > licitationTotalCents) {
    const remaining = (licitationTotalCents - alreadyPaidCents) / 100;
    throw new PaymentAmountExceedsLicitationError(
      `Payment amount exceeds licitation total. Remaining balance: ${remaining.toFixed(2)}, attempted: ${newAmount.toFixed(2)}.`
    );
  }
}

/**
 * Recomputes total paid for a licitation and marks it "cobrada" if fully paid.
 */
export async function syncLicitationPaymentStatus(tx: any, licitationId: number): Promise<void> {
  const [licitation] = await tx.select().from(licitations).where(eq(licitations.id, licitationId));
  if (!licitation) return;
  if (licitation.status !== "por_cobrar") return;

  const licitationTotalCents = toCents(licitation.total); // <-- confirm field name
  const totalPaidCents = await getLicitationTotalPaidCents(tx, licitationId);

  if (totalPaidCents === licitationTotalCents) {
    await tx.update(licitations).set({ status: "cobrada" }).where(eq(licitations.id, licitationId));
  }
}