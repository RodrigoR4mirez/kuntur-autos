import { redirect } from 'next/navigation';
import { currentUser } from '../../lib/session.ts';
import { SellForm } from './sell-form.tsx';

export const metadata = { title: 'Vender mi auto — Kuntur Autos' };
export const dynamic = 'force-dynamic';

export default async function Vender() {
  if (!(await currentUser())) redirect('/ingresar');
  return (
    <>
      <main className="narrow">
        <h1 className="h-page">Publica tu auto</h1>
        <p className="lead-sm">
          Guardamos tu anuncio como borrador y lo enviamos a revisión. Un asesor de Kuntur lo
          verifica antes de mostrarlo.
        </p>
        <SellForm />
      </main>
    </>
  );
}
