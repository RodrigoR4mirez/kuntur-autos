import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import '@fontsource/jetbrains-mono/500.css';
import '@kuntur/design-tokens/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kuntur Autos — El auto con historial claro',
  description:
    'Compra y vende autos en todo el Perú con placa verificada y un asesor de Kuntur en cada visita.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F6FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1B2A' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE">
      <body>{children}</body>
    </html>
  );
}
