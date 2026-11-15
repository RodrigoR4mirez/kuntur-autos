import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Showroom } from '../../../components/showroom.tsx';
import { EXAMPLES, exampleShowroom, findExample } from '../../../lib/examples.ts';

/** Solo existen los 5 ejemplos: cualquier otro slug es 404. */
export const dynamicParams = false;

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const car = findExample((await params).slug);
  return { title: car ? `${car.detail.title} (ejemplo) · Kuntur Autos` : 'Ejemplo · Kuntur Autos' };
}

export default async function EjemploFicha({ params }: { params: Params }) {
  const car = findExample((await params).slug);
  if (!car) notFound();
  return (
    <>
      <p className="hint" role="note">
        Ejemplo de ficha con datos inventados: no es un anuncio real.{' '}
        <a href="/ejemplo">Ver los otros ejemplos</a>
      </p>
      <Showroom data={exampleShowroom(car)} photo={car.photo} />
    </>
  );
}
