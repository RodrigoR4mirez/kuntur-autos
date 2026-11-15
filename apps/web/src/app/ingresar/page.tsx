import { GoogleButton } from './google-button.tsx';

export const metadata = { title: 'Ingresar — Kuntur Autos' };
export const dynamic = 'force-dynamic';

export default function Ingresar() {
  return (
    <>
      <main className="narrow">
        <h1 className="h-page">Ingresa a Kuntur</h1>
        <p className="lead-sm">
          Con tu cuenta puedes publicar tu auto y agendar visitas. No guardamos contraseñas de
          Google.
        </p>
        <GoogleButton />
        <p className="hint">El ingreso con correo y contraseña llega pronto.</p>
      </main>
    </>
  );
}
