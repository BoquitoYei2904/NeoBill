import { eq, inArray } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { licitations, licitationItems, taxes, discounts } from "../db/schema.js";

/**
  Recalculates and persists a licitation's base/discount/taxes/total columns based on its items.
*/

export async function recalcLicitationTotals(tx: PgTransaction<any, any, any>, licitationId: number) {
  const items = await tx
    .select()
    .from(licitationItems)
    .where(eq(licitationItems.licitationId, licitationId));

  if (items.length === 0) {
    await tx
      .update(licitations)
      .set({ base: "0.00", discount: "0.00", taxes: "0.00", total: "0.00" })
      .where(eq(licitations.id, licitationId));
    return;
  }

  const taxIds = [...new Set(items.map((i) => i.taxId))];
  const discountIds = [...new Set(items.map((i) => i.discountId))];

  const [taxRows, discountRows] = await Promise.all([
    tx.select().from(taxes).where(inArray(taxes.id, taxIds)),
    tx.select().from(discounts).where(inArray(discounts.id, discountIds)),
  ]);

  const taxById = new Map(taxRows.map((t) => [t.id, Number(t.percentage)]));
  const discountById = new Map(discountRows.map((d) => [d.id, Number(d.percentage)]));

  let base = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    const lineBase = Number(item.price) * item.quantity;
    const discountPct = discountById.get(item.discountId) ?? 0;
    const taxPct = taxById.get(item.taxId) ?? 0;

    const lineDiscount = lineBase * (discountPct / 100);
    const lineTaxable = lineBase - lineDiscount;
    const lineTax = lineTaxable * (taxPct / 100);

    base += lineBase;
    discountTotal += lineDiscount;
    taxTotal += lineTax;
  }

  const total = base - discountTotal + taxTotal;

  await tx
    .update(licitations)
    .set({
      base: base.toFixed(2),
      discount: discountTotal.toFixed(2),
      taxes: taxTotal.toFixed(2),
      total: total.toFixed(2),
    })
    .where(eq(licitations.id, licitationId));
}
