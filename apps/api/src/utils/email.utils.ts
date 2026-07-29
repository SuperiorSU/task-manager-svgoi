import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../config/env.js';

// ─── Transporter (lazy singleton) ─────────────────────────────────────────────
// Built once on first send. Port 465 = implicit TLS; 587/others = STARTTLS.
let _transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return _transporter;
};

/**
 * Verifies SMTP credentials at boot so a bad app-password surfaces immediately
 * in the logs instead of silently failing on the first invite. Never throws.
 */
export const verifyEmailTransport = async (): Promise<boolean> => {
  try {
    await getTransporter().verify();
    return true;
  } catch (err) {
    console.error('[email] SMTP transport verification failed:', (err as Error).message);
    return false;
  }
};

type SendArgs = { to: string; subject: string; html: string; text: string };

/**
 * Sends an email. Never throws — email is a side effect that must not fail the
 * request that triggered it (a new hire is still created even if SMTP hiccups;
 * the admin also gets the link in-app). Returns whether it was delivered.
 */
export const sendEmail = async ({ to, subject, html, text }: SendArgs): Promise<boolean> => {
  try {
    await getTransporter().sendMail({ from: env.FROM_EMAIL, to, subject, html, text });
    return true;
  } catch (err) {
    console.error(`[email] failed to send "${subject}" to ${to}:`, (err as Error).message);
    return false;
  }
};

// ─── Shared HTML shell ────────────────────────────────────────────────────────
const shell = (heading: string, body: string, cta: { label: string; url: string }, footer: string) => `
  <div style="margin:0;padding:24px;background:#F4F6FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #E2E8F0;">
      <div style="background:#1A5CF8;padding:20px 24px;">
        <span style="color:#FFFFFF;font-size:16px;font-weight:700;letter-spacing:.2px;">SVGOI Tasks</span>
      </div>
      <div style="padding:28px 24px;">
        <h1 style="margin:0 0 12px;font-size:19px;color:#0F172A;">${heading}</h1>
        <p style="margin:0 0 22px;font-size:14px;line-height:22px;color:#475569;">${body}</p>
        <a href="${cta.url}" style="display:inline-block;background:#1A5CF8;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;">${cta.label}</a>
        <p style="margin:22px 0 0;font-size:12px;line-height:18px;color:#94A3B8;">If the button doesn't work, copy this link into your browser:<br/><span style="color:#475569;word-break:break-all;">${cta.url}</span></p>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #E2E8F0;">
        <p style="margin:0;font-size:11px;line-height:17px;color:#94A3B8;">${footer}</p>
      </div>
    </div>
  </div>`;

// ─── Templated sends ──────────────────────────────────────────────────────────

/** New-member setup invite (valid 7 days). */
export const sendInviteEmail = (to: string, name: string, link: string): Promise<boolean> =>
  sendEmail({
    to,
    subject: 'Set up your SVGOI Tasks account',
    text:
      `Hi ${name},\n\nYou've been added to SVGOI Tasks. Open the link below to set your password ` +
      `and sign in. It expires in 7 days.\n\n${link}\n\nYou'll sign in with your Employee ID.`,
    html: shell(
      `Welcome, ${name}`,
      `You've been added to <strong>SVGOI Tasks</strong>. Set your password to finish setting up your account, then sign in with your Employee ID.`,
      { label: 'Set your password', url: link },
      `This invite expires in 7 days. If you weren't expecting it, you can ignore this email.`
    ),
  });

/** Login two-factor code (valid 5 min). Code-based, not a link. */
export const sendLoginOtpEmail = (to: string, name: string, code: string): Promise<boolean> =>
  sendEmail({
    to,
    subject: `${code} is your SVGOI Tasks sign-in code`,
    text:
      `Hi ${name},\n\nYour sign-in verification code is ${code}. It expires in 5 minutes.\n\n` +
      `If you didn't try to sign in, someone may have your password — reset it immediately.`,
    html: `
      <div style="margin:0;padding:24px;background:#F4F6FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #E2E8F0;">
          <div style="background:#1A5CF8;padding:20px 24px;"><span style="color:#FFFFFF;font-size:16px;font-weight:700;">SVGOI Tasks</span></div>
          <div style="padding:28px 24px;text-align:center;">
            <p style="margin:0 0 8px;font-size:14px;color:#475569;">Hi ${name}, your sign-in code is</p>
            <div style="margin:8px 0 14px;font-size:34px;font-weight:800;letter-spacing:10px;color:#0F172A;">${code}</div>
            <p style="margin:0;font-size:12px;color:#94A3B8;">Expires in 5 minutes. If you didn't try to sign in, reset your password immediately.</p>
          </div>
        </div>
      </div>`,
  });

/** Password reset link (valid 15 min). */
export const sendPasswordResetEmail = (to: string, name: string, link: string): Promise<boolean> =>
  sendEmail({
    to,
    subject: 'Reset your SVGOI Tasks password',
    text:
      `Hi ${name},\n\nWe received a request to reset your password. Open the link below to choose a ` +
      `new one. It expires in 15 minutes.\n\n${link}\n\nIf you didn't request this, ignore this email.`,
    html: shell(
      `Reset your password`,
      `Hi ${name}, we received a request to reset your password. Choose a new one using the button below.`,
      { label: 'Reset password', url: link },
      `This link expires in 15 minutes. If you didn't request a reset, you can safely ignore this email.`
    ),
  });
