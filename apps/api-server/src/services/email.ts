/**
 * Transactional email via Resend's HTTP API (no SDK needed).
 * Configure RESEND_API_KEY and EMAIL_FROM (e.g. "Aangan <no-reply@yourdomain.com>").
 * Without a key, messages are logged instead of sent, so local dev never emails anyone.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isEmailConfigured(): boolean {
  return !!process.env["RESEND_API_KEY"] && !!process.env["EMAIL_FROM"];
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EMAIL_FROM"];

  if (!apiKey || !from) {
    if (process.env["NODE_ENV"] === "production") {
      console.warn(`Email not sent (RESEND_API_KEY / EMAIL_FROM unset): "${message.subject}"`);
    } else {
      console.log(`[email:dev] To: ${message.to}\n  Subject: ${message.subject}\n  ${message.text}`);
    }
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email provider responded ${res.status}: ${detail.slice(0, 200)}`);
  }
}

/** Base URL of the web app, used for links in emails. */
export function appUrl(): string {
  return (process.env["APP_URL"] ?? "http://localhost:3001").replace(/\/+$/, "");
}

/** Minimal branded layout so every email reads as the same product. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#EAEFE4;font-family:Arial,Helvetica,sans-serif;color:#1B241F">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#F8FAF4;border:1px solid #C4D2BE">
<tr><td style="padding:28px 32px 8px;font-family:Georgia,serif;font-size:22px;color:#2F5D3A">Aangan</td></tr>
<tr><td style="padding:8px 32px 0;font-family:Georgia,serif;font-size:24px;line-height:1.25">${escapeHtml(title)}</td></tr>
<tr><td style="padding:16px 32px 28px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
</table></td></tr></table></body></html>`;
}
