// FILE: apps/server/src/jobs/processors/email.processor.ts
// PURPOSE: Processes email jobs — sends via Nodemailer + Resend SMTP
// DEPENDS ON: bullmq, nodemailer, emailTemplates
// LAST UPDATED: F30 - Email Notifications

import { Job } from "bullmq";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  EmailJobData,
  QUEUE_NAMES,
  Worker,
} from "../../config/queue";
import { redisConnectionOptions } from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../shared/utils/logger";
import {
  welcomeEmail,
  passwordResetEmail,
  expenseCreatedEmail,
  settlementReceivedEmail,
  paymentReminderEmail,
  commentAddedEmail,
} from "../../shared/utils/emailTemplates";

// ─────────────────────────────────────────────
// Nodemailer transporter singleton
// ─────────────────────────────────────────────

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn(
      "[EmailProcessor] SMTP not configured — using stub"
    );
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }

  // Gmail uses port 587 with TLS (starttls)
  // Resend uses port 465 with SSL
  const isGmail = host.includes("gmail");
  const isResend = host.includes("resend");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,           // true for 465 (SSL), false for 587 (TLS)
    requireTLS: isGmail,            // Gmail requires TLS
    auth: { user, pass },
    tls: {
      rejectUnauthorized: !isGmail, // Gmail uses valid certs
    },
  });

  logger.info(
    `[EmailProcessor] SMTP configured: ${host}:${port} (${isGmail ? "Gmail" : isResend ? "Resend" : "Custom"})`
  );

  return transporter;
}
// ─────────────────────────────────────────────
// Template resolver
// Maps templateName → HTML + subject
// ─────────────────────────────────────────────

function resolveTemplate(
  templateName: string,
  templateData: Record<string, unknown>
): { subject: string; html: string } | null {
  switch (templateName) {
    case "welcome":
      return welcomeEmail(
        templateData as Parameters<typeof welcomeEmail>[0]
      );

    case "password-reset":
      return passwordResetEmail(
        templateData as Parameters<typeof passwordResetEmail>[0]
      );

    case "expense-created":
      return expenseCreatedEmail(
        templateData as Parameters<typeof expenseCreatedEmail>[0]
      );

    case "settlement-received":
      return settlementReceivedEmail(
        templateData as Parameters<typeof settlementReceivedEmail>[0]
      );

    case "payment-reminder":
      return paymentReminderEmail(
        templateData as Parameters<typeof paymentReminderEmail>[0]
      );

    case "comment-added":
      return commentAddedEmail(
        templateData as Parameters<typeof commentAddedEmail>[0]
      );

    default:
      logger.warn(
        `[EmailProcessor] Unknown template: ${templateName}`
      );
      return null;
  }
}

// ─────────────────────────────────────────────
// Main processor
// ─────────────────────────────────────────────

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { to, templateName, templateData } = job.data;

  logger.info(
    `[EmailProcessor] Job ${job.id}: ${templateName} → ${to}`
  );

  // Resolve template
  const resolved = resolveTemplate(templateName, templateData);
  if (!resolved) {
    logger.warn(
      `[EmailProcessor] Skipping unknown template: ${templateName}`
    );
    return; // Don't throw — just skip
  }

  const { subject, html } = resolved;
  const from =
    env.SMTP_FROM ?? "SplitSync <onboarding@resend.dev>";

  // Dev mode — no SMTP configured
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.info(`[EmailProcessor] [DEV] Would send:`, {
      from,
      to,
      subject,
    });
    return;
  }

  try {
    const info = await getTransporter().sendMail({
      from,
      to,
      subject,
      html,
      text: subject,
    });
    logger.info(
      `[EmailProcessor] ✅ Sent: ${info.messageId} → ${to}`
    );
  } catch (err) {
    const error = err as Error;
    logger.error(
      `[EmailProcessor] ❌ Failed → ${to}: ${error.message}`
    );
    // Don't re-throw — email failure should not affect app flow
    // BullMQ will still mark job as failed for monitoring
    // but won't crash the server
  }
}

// ─────────────────────────────────────────────
// Create worker
// ─────────────────────────────────────────────

export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    QUEUE_NAMES.EMAIL,
    processEmailJob,
    {
      connection: redisConnectionOptions,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`[EmailWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `[EmailWorker] Job ${job?.id} failed:`,
      err.message
    );
  });

  worker.on("error", (err) => {
    logger.error("[EmailWorker] Worker error:", err.message);
  });

  return worker;
}