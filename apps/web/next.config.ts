import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  // En el monorepo, la traza de archivos parte de la raíz para incluir los paquetes del workspace.
  outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  async headers() {
    // Las fotos de ejemplo y el icono cambian muy rara vez: caché larga en el navegador y en la CDN.
    const longCache = 'public, max-age=2592000, stale-while-revalidate=86400';
    return [
      {
        source: '/ejemplo/:file*.:ext(jpg|webp)',
        headers: [{ key: 'Cache-Control', value: longCache }],
      },
      { source: '/icon.svg', headers: [{ key: 'Cache-Control', value: longCache }] },
    ];
  },
};

export default config;
