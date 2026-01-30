import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email transporter singleton
let transporter: Transporter | null = null;

/**
 * Get or create the email transporter instance
 */
export function getEmailTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Validate required environment variables
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('SMTP configuration incomplete. Email sending will be disabled.');
    // Return a mock transporter that logs instead of sending
    return {
      sendMail: async (options: any) => {
        console.log('[Email Mock] Would send email:', {
          to: options.to,
          subject: options.subject,
        });
        return { messageId: 'mock-message-id' };
      },
    } as Transporter;
  }

  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    // Return mock transporter on error
    return {
      sendMail: async (options: any) => {
        console.log('[Email Mock] Would send email:', {
          to: options.to,
          subject: options.subject,
        });
        return { messageId: 'mock-message-id' };
      },
    } as Transporter;
  }
}

/**
 * Send an email with error handling
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    const from = process.env.SMTP_FROM || 'noreply@ai-helpdesk.com';

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || undefined,
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to,
      subject,
    });
    // Don't throw - graceful degradation
    return false;
  }
}
