import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.NOTIFICATION_FROM_EMAIL;

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendNotificationEmail(
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  if (!resend || !fromEmail) return;

  await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    text: body,
  });
}
