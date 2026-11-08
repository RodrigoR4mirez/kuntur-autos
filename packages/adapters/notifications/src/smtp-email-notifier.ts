import { createTransport } from 'nodemailer';
import type { Notification, Notifier } from '@kuntur/core';
import { renderEmail } from './email-templates.ts';

/** Lo mínimo que necesitamos de un transporte SMTP. Facilita probar sin enviar correos reales. */
export interface MailTransport {
  sendMail(message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
}

/**
 * Envía correos por SMTP, que habla casi cualquier proveedor (Brevo, Resend, Gmail, Amazon SES...).
 * Cambiar de proveedor es cambiar `SMTP_URL`, no el código.
 */
export class SmtpEmailNotifier implements Notifier {
  private readonly transport: MailTransport;
  private readonly from: string;

  constructor(transport: MailTransport, from: string) {
    this.transport = transport;
    this.from = from;
  }

  async send(notification: Notification): Promise<void> {
    if (notification.channel !== 'email') {
      throw new Error(`SmtpEmailNotifier solo envía correo, no "${notification.channel}".`);
    }
    const { subject, text, html } = renderEmail(notification);
    await this.transport.sendMail({ from: this.from, to: notification.to, subject, text, html });
  }
}

/** Crea el transporte a partir de una URL como `smtps://usuario:clave@smtp.proveedor.com:465`. */
export function createSmtpTransport(smtpUrl: string): MailTransport {
  return createTransport(smtpUrl);
}
