import { licitations, licitationItems, products, clients } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { sendEmail } from "../email/sendEmail.js";
import { licitationTemplate } from "../email/emailFormat.js";
import { getDocumentSignedUrl } from "../getDocumentSignedUrl.js";
import { supabaseStorage } from "../supabaseStorage.js";

export async function checkLicitationStatus(tx: any, licitationId: number) {
  const [licitation] = await tx
    .select()
    .from(licitations)
    .where(eq(licitations.id, licitationId));
  
  if (!licitation) {
    throw new Error("Licitation not found");
  }
  
  if (licitation.status == "borrador" || licitation.status == "activa") {
    //happy happy happy
    
    }
    else{
    throw new Error(
      `Cannot modify licitation. Status must be "borrador" to make changes. Current status: "${licitation.status}"`
    );
  }
  if(licitation.status == "cobrada"){
    throw new Error(
      `Cannot modify licitation. File is already closed. Current status: "${licitation.status}"`
    );
  }

  return licitation;
}

export async function onDocument(tx: any, licitationId: number, documentPath: string) {
  const [licitation] = await tx
    .select()
    .from(licitations)
    .where(eq(licitations.id, licitationId));
  
  if (!licitation) {
    throw new Error("Licitation not found");
  }
  if(licitation.isDocumentGenerated){
    const isUpdate = licitation.status == "activa" ? true : false
    await tx
    .update(licitations)
    .set({ status: "activa" })
    .where(eq(licitations.id, licitationId));

    const [clientInfo] = await tx
      .select()
      .from(clients)
      .where(eq(clients.id, licitation.clientId));

    const recordRows = await tx
      .select()
      .from(licitationItems)
      .where(eq(licitationItems.licitationId, licitationId));

    const DEFAULT_DOCUMENT_URL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
      const { data, error } = await supabaseStorage.storage
      .from("licitations")
      .createSignedUrl(documentPath, DEFAULT_DOCUMENT_URL_TTL_SECONDS);

    if (error || !data) {
      console.error("Supabase Storage signed URL error:", error);
      throw new Error("Failed to generate document URL");
    }

    const url = data.signedUrl;
      

    //LOGIC TO SEND EMAIL
    await sendEmail({
      to: clientInfo.email, 
      subject: `Licitación activada: ${licitation.reference}`,
      html: licitationTemplate({
        recipientName: clientInfo.name,
        licitationTitle: licitation.reference,
        licitationUrl: `${url}`,
        isUpdate: isUpdate,
        lineItems: recordRows.map((item:any) => ({
          descripcion: item.description,
          cantidad: item.quantity,
          precio: item.price,
        })),
        subtotal: licitation.base,
        descuento: licitation.discount,
        impuesto: licitation.taxes,
        total: licitation.total,
      }),
    });
    
  }
}

const LICITATION_TRANSITIONS: Record<string, readonly string[]> = {
  activa: ["finalizada", "perdida"],
  finalizada: ["por_cobrar"],
  // borrador, por_cobrar, cobrada, perdida: no manual outgoing transitions
  // - borrador -> activa happens via document upload, not this endpoint
  // - por_cobrar -> cobrada happens via payment matching, not this endpoint
  // - cobrada and perdida are terminal
};

// Statuses that can never be a manual target, regardless of current state
const NEVER_MANUAL_TARGET = new Set(["borrador", "activa", "cobrada"]);


export class InvalidStatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStatusTransitionError";
  }
}

export async function onStatusShift(tx: any, licitationId: number, value: string) {
  const [licitation] = await tx
    .select()
    .from(licitations)
    .where(eq(licitations.id, licitationId));

  if (!licitation) {
    throw new Error("Licitation not found");
  }

  const currentStatus = licitation.status;

  if (NEVER_MANUAL_TARGET.has(value)) {
    throw new InvalidStatusTransitionError(
      `Cannot manually set status to "${value}". This status is set automatically by other actions.`
    );
  }

  const allowedTargets = LICITATION_TRANSITIONS[currentStatus] ?? [];

  if (!allowedTargets.includes(value)) {
    throw new InvalidStatusTransitionError(
      `Cannot change status from "${currentStatus}" to "${value}". ` +
      (allowedTargets.length
        ? `Allowed transitions from "${currentStatus}": ${allowedTargets.join(", ")}.`
        : `"${currentStatus}" is a terminal or system-managed status and cannot be changed manually.`)
    );
  }

  const [updated] = await tx
    .update(licitations)
    .set({ status: value })
    .where(eq(licitations.id, licitationId))
    .returning();

  return updated;
}