import { eq, and, lte, gt, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { clients, licitations } from "../../db/schema.js";
import { sendEmail } from "../email/sendEmail.js";
import { licitationExpiringTemplate } from "../email/expirationEmail.js";
import { console } from "inspector/promises";
import { supabaseStorage } from "../supabaseStorage.js";

const REMINDER_WINDOW_HOURS = 48;

export async function sendExpirationReminders() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);//48 hours

    // Licitations that are active, whose deadline falls within the next 48h,
    const candidates = await db
        .select()
        .from(licitations)
        .where(
        and(
            eq(licitations.status, "activa"),
            eq(licitations.isDocumentGenerated, true),
            eq(licitations.reminderSent, false),
            gt(licitations.limit_date, now),
            lte(licitations.limit_date, windowEnd)
        )
        );

    console.log(`[reminders] Found ${candidates.length} licitation(s) needing a 48h reminder.`);

    for (const licitation of candidates) {
        try {
        
        const [clientInfo] = await db
        .select()
        .from(clients).where(eq(clients.id, licitation.clientId));

        const DEFAULT_DOCUMENT_URL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
        const { data, error } = await supabaseStorage.storage
        .from("licitations")
        .createSignedUrl(licitation.document!, DEFAULT_DOCUMENT_URL_TTL_SECONDS);

        if (error || !data) {
        console.error("Supabase Storage signed URL error:", error);
        throw new Error("Failed to generate document URL");
        }

        const url = data.signedUrl;
        
        if (!clientInfo.email) {
            console.warn(`[reminders] No recipient email for licitation ${licitation.id}, skipping.`);
            continue;
        }

        await sendEmail({
            to: clientInfo.email,
            subject: `Recordatorio: la licitación "${licitation.reference}" vence pronto`,
            html: licitationExpiringTemplate({
                recipientName: clientInfo.name,
                licitationTitle: licitation.reference,
                limitDate: licitation.limit_date,
                licitationUrl: `${url}`,
            }),
        });

        await db
            .update(licitations)
            .set({ reminderSent: true })
            .where(eq(licitations.id, licitation.id));

        console.log(`[reminders] Sent reminder for licitation ${licitation.id}.`);
        } catch (err) {
        console.error(`[reminders] Failed to process licitation ${licitation.id}:`, err);
        }
    }

  return { processed: candidates.length };
}

