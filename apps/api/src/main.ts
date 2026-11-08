import { createApp } from './server.ts';

const port = Number(process.env['PORT'] ?? 3000);

createApp().listen(port, () => {
  console.log(JSON.stringify({ level: 'info', msg: 'api listening', port }));
});
