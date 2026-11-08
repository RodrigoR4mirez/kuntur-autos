import type { Notification } from '@kuntur/core';

export interface RenderedEmail {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function layout(
  heading: string,
  intro: string,
  buttonLabel: string,
  url: string,
): RenderedEmail['html'] {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#F4F6FA;font-family:Figtree,Arial,sans-serif;color:#0D1B2A">
<div style="max-width:480px;margin:0 auto;padding:32px 16px">
  <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(heading)}</h1>
  <p style="font-size:16px;line-height:24px;margin:0 0 24px">${escapeHtml(intro)}</p>
  <p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#BF3417;color:#FFFFFF;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:12px">${escapeHtml(buttonLabel)}</a></p>
  <p style="font-size:14px;line-height:20px;color:#4A5A70;margin:0">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${safeUrl}</p>
  <p style="font-size:14px;line-height:20px;color:#4A5A70;margin:24px 0 0">Si no fuiste tú, ignora este mensaje. Kuntur Autos</p>
</div></body></html>`;
}

/**
 * Plantillas de correo en español (voz de la marca: clara, directa, sin jerga).
 * Cada plantilla recibe `name` y `url` en `data`.
 */
export function renderEmail(notification: Notification): RenderedEmail {
  const name = notification.data['name']?.trim() || 'hola';
  const url = notification.data['url'];
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error(`La plantilla "${notification.template}" necesita un data.url http(s).`);
  }

  switch (notification.template) {
    case 'verify-email': {
      const intro = `Hola ${name}, confirma tu correo para activar tu cuenta en Kuntur Autos.`;
      return {
        subject: 'Confirma tu correo en Kuntur Autos',
        text: `${intro}\n\n${url}\n\nSi no fuiste tú, ignora este mensaje.`,
        html: layout('Confirma tu correo', intro, 'Confirmar correo', url),
      };
    }
    case 'reset-password': {
      const intro = `Hola ${name}, recibimos una solicitud para cambiar tu contraseña.`;
      return {
        subject: 'Cambia tu contraseña de Kuntur Autos',
        text: `${intro}\n\n${url}\n\nSi no fuiste tú, ignora este mensaje: tu contraseña no cambia.`,
        html: layout('Cambia tu contraseña', intro, 'Cambiar contraseña', url),
      };
    }
    default:
      throw new Error(`Plantilla de correo desconocida: ${notification.template}`);
  }
}
