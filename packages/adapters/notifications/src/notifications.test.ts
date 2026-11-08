import { createTransport } from 'nodemailer';
import { describe, expect, it, vi } from 'vitest';
import type { Notification } from '@kuntur/core';
import { ConsoleNotifier } from './console-notifier.ts';
import { renderEmail } from './email-templates.ts';
import { SmtpEmailNotifier } from './smtp-email-notifier.ts';

const verify: Notification = {
  channel: 'email',
  to: 'ana@example.com',
  template: 'verify-email',
  data: { name: 'Ana', url: 'https://api.kunturautos.pe/auth/verify-email?token=abc' },
};

describe('renderEmail', () => {
  it('renders the verification email in Spanish with the link in both formats', () => {
    const mail = renderEmail(verify);
    expect(mail.subject).toBe('Confirma tu correo en Kuntur Autos');
    expect(mail.text).toContain('Hola Ana');
    expect(mail.text).toContain(verify.data['url']);
    expect(mail.html).toContain(`href="${verify.data['url']}"`);
  });

  it('renders the password reset email', () => {
    const mail = renderEmail({ ...verify, template: 'reset-password' });
    expect(mail.subject).toBe('Cambia tu contraseña de Kuntur Autos');
  });

  it('escapes HTML coming from the user name and the link', () => {
    const mail = renderEmail({
      ...verify,
      data: { name: '<script>alert(1)</script>', url: 'https://x.test/?a="b"&c=d' },
    });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('?a=&quot;b&quot;&amp;c=d');
  });

  it('refuses links that are not http(s) (no javascript: links in emails)', () => {
    expect(() =>
      renderEmail({ ...verify, data: { name: 'Ana', url: 'javascript:alert(1)' } }),
    ).toThrow(/http/);
    expect(() => renderEmail({ ...verify, data: { name: 'Ana' } })).toThrow(/http/);
  });

  it('refuses unknown templates', () => {
    expect(() => renderEmail({ ...verify, template: 'no-existe' })).toThrow(/desconocida/);
  });
});

describe('SmtpEmailNotifier', () => {
  it('sends the rendered email through the transport', async () => {
    // jsonTransport arma el mensaje completo pero no abre ninguna conexión.
    const transport = createTransport({ jsonTransport: true });
    const spy = vi.spyOn(transport, 'sendMail');
    await new SmtpEmailNotifier(transport, 'Kuntur Autos <no-responder@kunturautos.pe>').send(
      verify,
    );

    expect(spy).toHaveBeenCalledTimes(1);
    const sent = spy.mock.calls[0]?.[0] as { from: string; to: string; subject: string };
    expect(sent).toMatchObject({
      from: 'Kuntur Autos <no-responder@kunturautos.pe>',
      to: 'ana@example.com',
      subject: 'Confirma tu correo en Kuntur Autos',
    });
  });

  it('refuses channels it cannot serve', async () => {
    const notifier = new SmtpEmailNotifier({ sendMail: vi.fn() }, 'a@b.c');
    await expect(notifier.send({ ...verify, channel: 'sms' })).rejects.toThrow(/solo envía correo/);
  });

  it('lets transport failures reach the caller', async () => {
    const notifier = new SmtpEmailNotifier(
      { sendMail: () => Promise.reject(new Error('smtp caído')) },
      'a@b.c',
    );
    await expect(notifier.send(verify)).rejects.toThrow('smtp caído');
  });
});

describe('ConsoleNotifier', () => {
  it('logs the notification so the link can be clicked in development', async () => {
    const lines: string[] = [];
    await new ConsoleNotifier((l) => lines.push(l)).send(verify);
    expect(JSON.parse(lines[0] ?? '{}')).toMatchObject({
      to: 'ana@example.com',
      template: 'verify-email',
    });
  });
});
