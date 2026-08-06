import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { env } from '@src/config/env';

export interface OrderEmailPayload {
  to: string;
  customerName: string;
  orderReference: string;
  total: number;
  estimatedDeliveryMinutes: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface OrderStatusEmailPayload {
  to: string;
  customerName: string;
  orderReference: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  remarks?: string;
}

export interface EmailSendResult {
  sent: boolean;
  skipped: boolean;
  message: string;
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

function formatItemLines(items: Array<{ name: string; quantity: number; price: number }>): string {
  return items
    .map((item) => `• ${item.quantity}× ${item.name} — ${formatInr(item.price * item.quantity)}`)
    .join('\n');
}

/** Runs email work in the background so API handlers never wait on SMTP. */
function enqueueMail(task: () => Promise<EmailSendResult>): void {
  void task().catch((error) => {
    console.error('[email] Background send failed:', error);
  });
}

async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
  previewLabel: string;
}): Promise<EmailSendResult> {
  const host = env.smtpHost?.trim();
  const user = env.smtpUser?.trim();
  const pass = env.smtpPass?.trim();
  const from = env.smtpFrom?.trim();

  // Email is optional — incomplete/empty SMTP must not block or fail requests.
  if (!host || !user || !pass || !from) {
    return {
      sent: false,
      skipped: true,
      message: `${options.previewLabel} skipped because SMTP is not configured.`,
    };
  }

  try {
    // Prefer IPv4: Render often cannot reach Gmail SMTP over IPv6 (ENETUNREACH).
    // `family` is supported by nodemailer at runtime but missing from its TS types.
    const transporter = nodemailer.createTransport({
      host,
      port: env.smtpPort,
      secure: false,
      family: 4,
      requireTLS: true,
      auth: {
        user,
        pass,
      },
    } as SMTPTransport.Options);

    await transporter.verify();
    console.log("SMTP verified successfully");

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return {
      sent: true,
      skipped: false,
      message: `Email sent to ${options.to}`,
    };
  } catch (error) {
    console.error(`[email] Failed to send ${options.previewLabel}:`, error);
    return {
      sent: false,
      skipped: false,
      message: `${options.previewLabel} could not be sent.`,
    };
  }
}

function buildHtmlEmail(params: {
  title: string;
  greeting: string;
  bodyLines: string[];
  orderReference: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  extraNote?: string;
}): string {
  const itemRows = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.quantity}× ${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatInr(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join('');

  const bodyHtml = params.bodyLines.map((line) => `<p style="margin:0 0 12px;">${line}</p>`).join('');
  const extraNoteHtml = params.extraNote
    ? `<p style="margin:16px 0 0;color:#555;">${params.extraNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:24px;color:#1a1a1a;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e8eaed;">
      <h1 style="margin:0 0 8px;font-size:22px;">${params.title}</h1>
      <p style="margin:0 0 20px;">Hi ${params.greeting},</p>
      ${bodyHtml}
      <p style="margin:0 0 4px;"><strong>Order reference:</strong> ${params.orderReference}</p>
      <p style="margin:0 0 16px;"><strong>Order total:</strong> ${formatInr(params.total)}</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 0;border-bottom:2px solid #ddd;">Item</th>
            <th style="text-align:right;padding:8px 0;border-bottom:2px solid #ddd;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${extraNoteHtml}
      <p style="margin:24px 0 0;color:#777;font-size:13px;">— FoodOrder</p>
    </div>
  </body>
</html>`;
}

export function sendOrderConfirmationEmail(payload: OrderEmailPayload): void {
  const itemLines = formatItemLines(payload.items);
  const subject = `FoodOrder confirmation — ${payload.orderReference}`;
  const text = [
    `Hi ${payload.customerName},`,
    '',
    'Thank you for ordering with FoodOrder!',
    '',
    `Your order reference number is: ${payload.orderReference}`,
    `Estimated delivery: ${payload.estimatedDeliveryMinutes} minutes`,
    `Order total: ${formatInr(payload.total)}`,
    '',
    'Items:',
    itemLines,
    '',
    'Track your order anytime in the FoodOrder app.',
    '',
    'Delicious. Fast. Delivered.',
    '— FoodOrder',
  ].join('\n');

  const html = buildHtmlEmail({
    title: 'Order confirmed',
    greeting: payload.customerName,
    bodyLines: [
      'Thank you for ordering with FoodOrder!',
      `Estimated delivery: <strong>${payload.estimatedDeliveryMinutes} minutes</strong>.`,
    ],
    orderReference: payload.orderReference,
    total: payload.total,
    items: payload.items,
    extraNote: 'Track your order anytime in the FoodOrder app.',
  });

  enqueueMail(() =>
    sendMail({
      to: payload.to,
      subject,
      text,
      html,
      previewLabel: 'Order confirmation',
    }),
  );
}

export function sendOrderDeliveredEmail(payload: OrderStatusEmailPayload): void {
  const itemLines = formatItemLines(payload.items);
  const subject = `Your FoodOrder was delivered — ${payload.orderReference}`;
  const text = [
    `Hi ${payload.customerName},`,
    '',
    'Great news — your FoodOrder has been delivered!',
    '',
    `Order reference: ${payload.orderReference}`,
    `Order total: ${formatInr(payload.total)}`,
    '',
    'Items:',
    itemLines,
    payload.remarks ? `\nNote: ${payload.remarks}` : '',
    '',
    'We hope you enjoy your meal.',
    '— FoodOrder',
  ]
    .filter((line) => line !== '')
    .join('\n');

  const html = buildHtmlEmail({
    title: 'Order delivered',
    greeting: payload.customerName,
    bodyLines: ['Great news — your FoodOrder has been delivered!', 'We hope you enjoy your meal.'],
    orderReference: payload.orderReference,
    total: payload.total,
    items: payload.items,
    ...(payload.remarks ? { extraNote: `Note: ${payload.remarks}` } : {}),
  });

  enqueueMail(() =>
    sendMail({
      to: payload.to,
      subject,
      text,
      html,
      previewLabel: 'Order delivered email',
    }),
  );
}

export function sendOrderCancelledEmail(payload: OrderStatusEmailPayload): void {
  const itemLines = formatItemLines(payload.items);
  const subject = `Your FoodOrder was cancelled — ${payload.orderReference}`;
  const text = [
    `Hi ${payload.customerName},`,
    '',
    'Your FoodOrder has been cancelled.',
    '',
    `Order reference: ${payload.orderReference}`,
    `Order total: ${formatInr(payload.total)}`,
    payload.remarks ? `Reason: ${payload.remarks}` : '',
    '',
    'Items:',
    itemLines,
    '',
    'If you have questions, please contact support or place a new order anytime.',
    '— FoodOrder',
  ]
    .filter((line) => line !== '')
    .join('\n');

  const html = buildHtmlEmail({
    title: 'Order cancelled',
    greeting: payload.customerName,
    bodyLines: [
      'Your FoodOrder has been cancelled.',
      'If you have questions, please contact support or place a new order anytime.',
    ],
    orderReference: payload.orderReference,
    total: payload.total,
    items: payload.items,
    ...(payload.remarks ? { extraNote: `Reason: ${payload.remarks}` } : {}),
  });

  enqueueMail(() =>
    sendMail({
      to: payload.to,
      subject,
      text,
      html,
      previewLabel: 'Order cancelled email',
    }),
  );
}
