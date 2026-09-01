import { BrevoClient } from "@getbrevo/brevo";

if (!process.env.BREVO_API_KEY) {
  throw new Error("Missing BREVO_API_KEY environment variable");
}

export const EMAIL_FROM = process.env.BREVO_FROM_EMAIL;
export const EMAIL_FROM_NAME = "NeoBill";

if (!EMAIL_FROM) {
  throw new Error("Missing BREVO_FROM_EMAIL environment variable");
}

export const client = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
});