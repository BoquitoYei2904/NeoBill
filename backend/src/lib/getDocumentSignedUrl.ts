import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { licitations } from "../db/schema.js";
import { supabaseStorage } from "./supabaseStorage.js";

const DEFAULT_DOCUMENT_URL_TTL_SECONDS = 60 * 60 * 24; // 1 day

export class LicitationNotFoundError extends Error {
  constructor() {
    super("Licitation not found");
    this.name = "LicitationNotFoundError";
  }
}

export class NoDocumentError extends Error {
  constructor() {
    super("No document uploaded for this licitation");
    this.name = "NoDocumentError";
  }
}

export async function getDocumentSignedUrl(
  licitationId: number,
  ttlSeconds: number = DEFAULT_DOCUMENT_URL_TTL_SECONDS
) {
  const [licitation] = await db
    .select()
    .from(licitations)
    .where(eq(licitations.id, licitationId));

  if (!licitation) {
    throw new LicitationNotFoundError();
  }

  if (!licitation.document) {
    throw new NoDocumentError();
  }

  const { data, error } = await supabaseStorage.storage
    .from("licitations")
    .createSignedUrl(licitation.document, ttlSeconds);

  if (error || !data) {
    console.error("Supabase Storage signed URL error:", error);
    throw new Error("Failed to generate document URL");
  }

  return { url: data.signedUrl, expiresIn: ttlSeconds };
}