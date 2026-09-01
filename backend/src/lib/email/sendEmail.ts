import { BrevoClient } from "@getbrevo/brevo";
import { client, EMAIL_FROM, EMAIL_FROM_NAME } from "./brevoEmail";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const recipients = Array.isArray(to) ? to : [to];

  try {
    await client.transactionalEmails.sendTransacEmail({
      subject: subject,
      htmlContent: html,
      sender: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
      to: recipients.map((email) => ({ email })),
    }
    );
  } catch (error: any) {
    console.error("Brevo send error:", error?.response?.body ?? error);
    throw new Error("Failed to send email");
  }
}