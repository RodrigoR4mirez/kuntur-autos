import type { Notification, Notifier } from '@kuntur/core';

/**
 * Escribe el aviso en el registro en vez de enviarlo. SOLO para desarrollo local:
 * deja ver el enlace de verificación sin necesitar un proveedor de correo.
 */
export class ConsoleNotifier implements Notifier {
  private readonly log: (line: string) => void;

  constructor(log: (line: string) => void = console.log) {
    this.log = log;
  }

  send(notification: Notification): Promise<void> {
    this.log(
      JSON.stringify({
        level: 'info',
        msg: 'notification (solo desarrollo)',
        channel: notification.channel,
        to: notification.to,
        template: notification.template,
        data: notification.data,
      }),
    );
    return Promise.resolve();
  }
}
