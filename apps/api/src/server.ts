import { createServer, type Server } from 'node:http';

/** Servidor mínimo de la Fase 0. El framework HTTP se decide en la Fase 1 y queda detrás de este módulo. */
export function createApp(): Server {
  return createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
  });
}
