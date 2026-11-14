import type { FastifyInstance } from 'fastify';

/**
 * TEMPORAL (solo pruebas en staging, ver docs/11-google-login.md). Página con un botón "Entrar con Google".
 * El botón inicia el proceso DESDE el navegador, así la cookie de inicio llega junto con la vuelta de Google.
 * Se activa solo con LOGIN_TEST_PAGE=true. Se retira cuando exista la web.
 */
export const LOGIN_TEST_PAGE_HTML = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prueba de inicio con Google</title></head>
<body style="font-family:system-ui,sans-serif;max-width:420px;margin:48px auto;padding:0 16px">
  <h1>Prueba de inicio con Google</h1>
  <p>Página temporal de pruebas de Kuntur Autos (staging).</p>
  <button id="go" style="font-size:16px;padding:12px 20px;cursor:pointer">Entrar con Google</button>
  <p id="msg" role="status"></p>
  <script>
    document.getElementById('go').addEventListener('click', async function () {
      var msg = document.getElementById('msg');
      msg.textContent = 'Preparando el inicio de sesión...';
      var res = await fetch('/auth/sign-in/social', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: 'google', callbackURL: location.origin + '/auth/get-session' })
      });
      var data = await res.json().catch(function () { return null; });
      if (!res.ok || !data || !data.url) {
        msg.textContent = 'No se pudo iniciar: ' + (data && data.error ? data.error.message : res.status);
        return;
      }
      window.location.href = data.url;
    });
  </script>
</body>
</html>`;

export function loginTestRoute(app: FastifyInstance): void {
  app.get('/login-test', async (_request, reply) =>
    reply.type('text/html; charset=utf-8').send(LOGIN_TEST_PAGE_HTML),
  );
}
