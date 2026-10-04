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

// Like sendNotificationEmail, but reports whether the email was actually
// accepted so callers can fall back to something else when it wasn't.
export async function sendEmailChecked(to: string, subject: string, body: string): Promise<boolean> {
  if (!resend || !fromEmail) return false;
  try {
    const { error } = await resend.emails.send({ from: fromEmail, to, subject, text: body });
    return !error;
  } catch {
    return false;
  }
}
