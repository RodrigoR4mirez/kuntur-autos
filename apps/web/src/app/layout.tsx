import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import '@fontsource/jetbrains-mono/500.css';
import '@kuntur/design-tokens/tokens.css';
import './globals.css';
import { SideNav } from '../components/side-nav.tsx';
import { SiteFooter } from '../components/site-footer.tsx';
import { SiteHeader } from '../components/site-header.tsx';

export const metadata: Metadata = {
  title: 'Kuntur Autos — El auto con historial claro',
  description:
    'Compra y vende autos en todo el Perú con placa verificada y un asesor de Kuntur en cada visita.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: [{ color: '#ECEEF2' }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE" data-theme="light">
      <body>
        <div className="shell">
          <SiteHeader />
          <SideNav />
          <div className="content">
            {children}
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
