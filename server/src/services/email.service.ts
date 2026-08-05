import nodemailer from 'nodemailer';

import { env } from '@src/config/env';

export interface OrderEmailPayload {
  to: string;
  customerName: string;
  orderReference: string;
  total: number;
  estimatedDeliveryMinutes: number;
  items: Array<{ name: string; quantity: number; price: number }>;
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

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload): Promise<EmailSendResult> {
  const itemLines = payload.items
    .map((item) => `• ${item.quantity}× ${item.name} — ${formatInr(item.price * item.quantity)}`)
    .join('\n');

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

  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.smtpFrom) {
    console.info('[email] SMTP not configured. Order confirmation preview:');
    console.info(`To: ${payload.to}`);
    console.info(`Subject: ${subject}`);
    console.info(text);

    return {
      sent: false,
      skipped: true,
      message: 'Order placed. Email preview logged because SMTP is not configured.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });

    await transporter.sendMail({
      from: env.smtpFrom,
      to: payload.to,
      subject,
      text,
    });

    return {
      sent: true,
      skipped: false,
      message: `Confirmation email sent to ${payload.to}`,
    };
  } catch (error) {
    console.error('[email] Failed to send order confirmation:', error);
    return {
      sent: false,
      skipped: false,
      message: 'Order placed, but the confirmation email could not be sent.',
    };
  }
}
