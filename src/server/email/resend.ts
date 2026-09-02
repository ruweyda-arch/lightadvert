import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

/** Null when Resend is not configured — callers fall back to logging in dev. */
export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Light Advert <noreply@lightadvert.example>";

export interface PasswordEmailInput {
  to: string;
  subject: string;
  url: string;
}

/**
 * Phase 1 sends only two transactional emails: set-password and reset-password
 * (docs/architecture.md §10). Both share this sender.
 */
export async function sendPasswordEmail({ to, subject, url }: PasswordEmailInput): Promise<void> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY unset — would send "${subject}" to ${to}: ${url}`);
    return;
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    text: `Open this link to ${subject.toLowerCase()}:\n\n${url}\n\nThis link expires soon and can be used once.`,
  });
}
