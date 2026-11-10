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

/** The bare address from NOTIFICATION_FROM_EMAIL, which may be "Name <addr>" or just "addr". */
function fromAddress(): string | null {
  if (!fromEmail) return null;
  return fromEmail.match(/<([^>]+)>/)?.[1]?.trim() ?? fromEmail.trim();
}

/**
 * An email to a visitor on an agent's behalf: our sending address, the
 * agent's name as the display name, and replies going to the agent.
 */
export async function sendVisitorEmail(
  to: string,
  subject: string,
  body: string,
  { fromName, replyTo }: { fromName: string; replyTo?: string },
): Promise<void> {
  const address = fromAddress();
  if (!resend || !address) return;

  const { error } = await resend.emails.send({
    from: `"${fromName}" <${address}>`,
    to,
    subject,
    text: body,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) throw new Error(`Visitor email not sent: ${error.message}`);
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
