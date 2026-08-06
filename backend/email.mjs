import { config } from './config.mjs';

/**
 * Transactional email via Resend.
 *
 * Firebase can send password-reset mail itself, but the template is theirs and
 * says "firebaseapp.com". Here the backend asks the Admin SDK for the reset
 * *link* and delivers it in our own branded email instead.
 *
 * Uses Resend's REST API directly — one fetch call, no SDK dependency.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const BRAND = {
  green: '#2E6A5C',
  cream: '#F4F1EA',
  ink: '#16211C',
  muted: '#5B6961',
};

export function isEmailConfigured() {
  return Boolean(config.resendApiKey);
}

async function send({ to, subject, html, text }) {
  if (!config.resendApiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: config.resendFrom, to: [to], subject, html, text }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    // Never let the key itself surface in an error string.
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 300)}`);
  }

  return response.json();
}

/** Shared shell so every message looks like it came from the same place. */
function layout({ heading, body, ctaLabel, ctaUrl, footer }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FEFDF9;border:1px solid #D7E0DA;border-radius:20px;overflow:hidden;">
          <tr><td style="padding:32px 32px 8px;">
            <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${BRAND.green};">Rooted</p>
            <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-weight:400;font-size:26px;line-height:1.25;color:${BRAND.ink};">${heading}</h1>
          </td></tr>
          <tr><td style="padding:12px 32px 0;">
            <p style="margin:0;font-size:15px;line-height:1.65;color:${BRAND.muted};">${body}</p>
          </td></tr>
          ${
            ctaUrl
              ? `<tr><td style="padding:24px 32px 8px;">
                   <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.green};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:999px;">${ctaLabel}</a>
                 </td></tr>
                 <tr><td style="padding:8px 32px 0;">
                   <p style="margin:0;font-size:12px;line-height:1.6;color:#7D8A83;">If the button does not work, paste this into your browser:<br><span style="word-break:break-all;color:${BRAND.green};">${ctaUrl}</span></p>
                 </td></tr>`
              : ''
          }
          <tr><td style="padding:24px 32px 32px;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#7D8A83;">${footer}</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#7D8A83;">Rooted — growing deep in the Word.</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendPasswordResetEmail(to, resetLink, displayName = '') {
  const greeting = displayName ? `Hi ${displayName},` : 'Hi,';

  return send({
    to,
    subject: 'Reset your Rooted password',
    text: `${greeting}\n\nUse this link to set a new password:\n${resetLink}\n\nThe link expires in one hour. If you did not ask for it, you can ignore this email.`,
    html: layout({
      heading: 'Reset your password',
      body: `${greeting} we received a request to reset the password on your Rooted account. Choose a new one using the button below.`,
      ctaLabel: 'Set a new password',
      ctaUrl: resetLink,
      footer:
        'This link expires in one hour. If you did not request a reset, you can safely ignore this email — your password will not change.',
    }),
  });
}

export async function sendWelcomeEmail(to, displayName = '') {
  const greeting = displayName ? `Welcome, ${displayName}.` : 'Welcome.';

  return send({
    to,
    subject: 'Welcome to Rooted',
    text: `${greeting}\n\nYour account is ready. Your notes, prayers, and reading progress now follow you across devices.`,
    html: layout({
      heading: greeting,
      body: 'Your account is ready. Your study notes, prayer journal, and reading progress now follow you on every device you sign in on — and the full Bible text works offline.',
      ctaLabel: 'Open Rooted',
      ctaUrl: config.appPublicUrl,
      footer: 'You are receiving this because an account was created with this email address.',
    }),
  });
}
