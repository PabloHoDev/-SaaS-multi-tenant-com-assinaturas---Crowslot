import "server-only";

import { Resend } from "resend";

import { env } from "@/env";

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Envia e-mail via Resend. Sem RESEND_API_KEY (ambiente local), apenas imprime
 * a mensagem no terminal — assim o projeto roda sem nenhuma conta externa.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!resend) {
    console.info(
      `\n📧 [e-mail simulado] Para: ${message.to}\nAssunto: ${message.subject}\n\n${message.text}\n`,
    );
    return;
  }

  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, ...message });
  if (error) throw new Error(`Falha ao enviar e-mail: ${error.message}`);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function emailLayout(title: string, body: string, cta: { label: string; url: string }) {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#f6f6f7;padding:32px">
  <table role="presentation" width="100%" style="max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:32px">
    <tr><td>
      <p style="font-weight:700;font-size:18px;margin:0 0 24px">Crowslot</p>
      <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>
      <p style="color:#444;line-height:1.5;margin:0 0 24px">${body}</p>
      <a href="${cta.url}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${escapeHtml(cta.label)}</a>
      <p style="color:#888;font-size:12px;margin:24px 0 0">Se você não esperava este e-mail, pode ignorá-lo.</p>
    </td></tr>
  </table></body></html>`;
}
