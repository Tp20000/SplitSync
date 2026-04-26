// FILE: apps/server/src/shared/utils/emailTemplates.ts
// PURPOSE: HTML email templates for all notification types
// DEPENDS ON: env
// LAST UPDATED: F30 - Email Notifications

import { env } from "../../config/env";

const APP_URL = env.APP_URL ?? "http://localhost:3000";
const BRAND_COLOR = "#3b82f6";
const BRAND_NAME = "SplitSync";

// ─────────────────────────────────────────────
// Base layout wrapper
// ─────────────────────────────────────────────

function baseLayout(content: string, previewText: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
  <meta name="description" content="${previewText}" />
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${previewText}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:${BRAND_COLOR};border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
                  <span style="color:white;font-size:20px;font-weight:bold;line-height:1;">S</span>
                </div>
                <span style="font-size:22px;font-weight:700;color:#0f172a;">${BRAND_NAME}</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:36px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;color:#94a3b8;font-size:12px;line-height:1.6;">
              <p style="margin:0 0 4px;">© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
              <p style="margin:0;">You received this email because you are a member of a ${BRAND_NAME} group.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ─────────────────────────────────────────────
// Button helper
// ─────────────────────────────────────────────

function ctaButton(text: string, url: string): string {
  return `
<div style="text-align:center;margin:28px 0;">
  <a href="${url}" target="_blank"
     style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;">
    ${text}
  </a>
</div>`;
}

// ─────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
}

// ─────────────────────────────────────────────
// Info row (key: value)
// ─────────────────────────────────────────────

function infoRow(label: string, value: string): string {
  return `
<tr>
  <td style="padding:6px 0;color:#64748b;font-size:14px;">${label}</td>
  <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;text-align:right;">${value}</td>
</tr>`;
}

// ─────────────────────────────────────────────
// WELCOME EMAIL
// ─────────────────────────────────────────────

export function welcomeEmail(data: {
  name: string;
}): { subject: string; html: string } {
  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
  Welcome to ${BRAND_NAME}! 🎉
</h1>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Hi ${data.name}, your account is all set up and ready to go.
</p>

<p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
  With ${BRAND_NAME} you can:
</p>
<ul style="margin:0 0 24px;padding-left:20px;color:#475569;font-size:15px;line-height:1.8;">
  <li>Create groups for trips, home expenses, and more</li>
  <li>Split expenses equally, by percentage, shares, or exact amounts</li>
  <li>Track balances and settle up with smart suggestions</li>
  <li>See real-time updates when group members add expenses</li>
</ul>

${ctaButton("Get Started", APP_URL + "/dashboard")}

<p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
  Need help? Reply to this email and we'll get back to you.
</p>`;

  return {
    subject: `Welcome to ${BRAND_NAME}!`,
    html: baseLayout(content, `Hi ${data.name}, your ${BRAND_NAME} account is ready.`),
  };
}

// ─────────────────────────────────────────────
// PASSWORD RESET EMAIL
// ─────────────────────────────────────────────

export function passwordResetEmail(data: {
  name: string;
  resetToken: string;
}): { subject: string; html: string } {
  const resetUrl = `${APP_URL}/reset-password?token=${data.resetToken}`;

  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
  Reset your password
</h1>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Hi ${data.name}, we received a request to reset your password.
</p>

<p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
  Click the button below to set a new password. This link expires in
  <strong>1 hour</strong>.
</p>

${ctaButton("Reset Password", resetUrl)}

${divider()}

<p style="margin:0 0 8px;color:#64748b;font-size:13px;">
  Or copy this URL into your browser:
</p>
<p style="margin:0;word-break:break-all;color:#3b82f6;font-size:12px;font-family:monospace;background:#f1f5f9;padding:10px;border-radius:6px;">
  ${resetUrl}
</p>

${divider()}

<p style="margin:0;color:#94a3b8;font-size:13px;">
  If you did not request this, you can safely ignore this email.
  Your password will not change.
</p>`;

  return {
    subject: `Reset your ${BRAND_NAME} password`,
    html: baseLayout(content, "Reset your SplitSync password — link valid for 1 hour."),
  };
}

// ─────────────────────────────────────────────
// EXPENSE CREATED EMAIL
// ─────────────────────────────────────────────

export function expenseCreatedEmail(data: {
  recipientName: string;
  payerName: string;
  expenseTitle: string;
  amount: string;
  groupName: string;
  yourShare: string;
  groupId: string;
}): { subject: string; html: string } {
  const groupUrl = `${APP_URL}/groups/${data.groupId}`;

  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
  New expense added 💰
</h1>
<p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
  Hi ${data.recipientName}, <strong>${data.payerName}</strong> added a new expense
  in <strong>${data.groupName}</strong>.
</p>

<div style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;padding:20px;margin-bottom:24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    ${infoRow("Expense", data.expenseTitle)}
    ${infoRow("Total Amount", data.amount)}
    ${infoRow("Your Share", data.yourShare)}
    ${infoRow("Group", data.groupName)}
    ${infoRow("Paid by", data.payerName)}
  </table>
</div>

${ctaButton("View Expense", groupUrl)}`;

  return {
    subject: `${data.payerName} added "${data.expenseTitle}" in ${data.groupName}`,
    html: baseLayout(content, `${data.payerName} added ${data.expenseTitle} (${data.amount}) in ${data.groupName}.`),
  };
}

// ─────────────────────────────────────────────
// SETTLEMENT RECEIVED EMAIL
// ─────────────────────────────────────────────

export function settlementReceivedEmail(data: {
  recipientName: string;
  payerName: string;
  amount: string;
  groupName: string;
  groupId: string;
  note?: string;
}): { subject: string; html: string } {
  const groupUrl = `${APP_URL}/groups/${data.groupId}`;

  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
  Payment received ✅
</h1>
<p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
  Hi ${data.recipientName}, <strong>${data.payerName}</strong> has settled up with you.
</p>

<div style="background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;padding:20px;margin-bottom:24px;text-align:center;">
  <p style="margin:0 0 4px;color:#15803d;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Amount Received</p>
  <p style="margin:0;color:#166534;font-size:32px;font-weight:700;">${data.amount}</p>
  <p style="margin:4px 0 0;color:#15803d;font-size:14px;">from ${data.payerName} · ${data.groupName}</p>
</div>

${data.note ? `<p style="margin:0 0 24px;color:#475569;font-size:15px;font-style:italic;">"${data.note}"</p>` : ""}

${ctaButton("View Group Balances", groupUrl)}`;

  return {
    subject: `${data.payerName} paid you ${data.amount}`,
    html: baseLayout(content, `${data.payerName} settled ${data.amount} with you in ${data.groupName}.`),
  };
}

// ─────────────────────────────────────────────
// PAYMENT REMINDER EMAIL
// ─────────────────────────────────────────────

export function paymentReminderEmail(data: {
  debtorName: string;
  creditorName: string;
  amount: string;
  groupName: string;
  groupId: string;
}): { subject: string; html: string } {
  const groupUrl = `${APP_URL}/groups/${data.groupId}`;

  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
  Friendly payment reminder ⏰
</h1>
<p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
  Hi ${data.debtorName}, just a quick reminder that you owe
  <strong>${data.creditorName}</strong> in <strong>${data.groupName}</strong>.
</p>

<div style="background:#fffbeb;border-radius:8px;border:1px solid #fde68a;padding:20px;margin-bottom:24px;text-align:center;">
  <p style="margin:0 0 4px;color:#92400e;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Amount Owed</p>
  <p style="margin:0;color:#78350f;font-size:32px;font-weight:700;">${data.amount}</p>
  <p style="margin:4px 0 0;color:#92400e;font-size:14px;">to ${data.creditorName} · ${data.groupName}</p>
</div>

${ctaButton("Settle Up Now", groupUrl)}

<p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
  Settling up is easy — just click the button above and record your payment.
</p>`;

  return {
    subject: `Reminder: You owe ${data.creditorName} ${data.amount} in ${data.groupName}`,
    html: baseLayout(content, `You owe ${data.creditorName} ${data.amount} in ${data.groupName}.`),
  };
}

// ─────────────────────────────────────────────
// COMMENT ADDED EMAIL
// ─────────────────────────────────────────────

export function commentAddedEmail(data: {
  recipientName: string;
  commenterName: string;
  expenseTitle: string;
  commentContent: string;
  groupName: string;
  groupId: string;
}): { subject: string; html: string } {
  const groupUrl = `${APP_URL}/groups/${data.groupId}`;

  const content = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">
  New comment 💬
</h1>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
  Hi ${data.recipientName}, <strong>${data.commenterName}</strong> commented on
  <strong>"${data.expenseTitle}"</strong> in ${data.groupName}.
</p>

<div style="background:#f8fafc;border-left:4px solid ${BRAND_COLOR};padding:16px 20px;margin-bottom:24px;border-radius:0 8px 8px 0;">
  <p style="margin:0;color:#1e293b;font-size:15px;line-height:1.6;font-style:italic;">
    "${data.commentContent}"
  </p>
  <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">
    — ${data.commenterName}
  </p>
</div>

${ctaButton("Reply in App", groupUrl)}`;

  return {
    subject: `${data.commenterName} commented on "${data.expenseTitle}"`,
    html: baseLayout(content, `${data.commenterName}: "${data.commentContent}"`),
  };
}