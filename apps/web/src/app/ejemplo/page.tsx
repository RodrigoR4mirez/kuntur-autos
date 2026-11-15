import type { Metadata } from 'next';
import { ListingCard } from '../../components/listing-card.tsx';
import { EXAMPLES, exampleCardData } from '../../lib/examples.ts';

export const metadata: Metadata = { title: 'Autos de ejemplo · Kuntur Autos' };

export default function Ejemplos() {
  return (
    <main className="page">
      <section className="panel">
        <h1 className="h-page">Autos de ejemplo</h1>
        <p className="lead-sm" role="note">
          Cinco fichas con datos inventados y fotos gratuitas de Pexels para mostrar cómo se ve
          Kuntur Autos. No son anuncios reales.
        </p>
      </section>
      <ul className="car-grid" aria-label="Autos de ejemplo">
        {EXAMPLES.map((car) => {
          const c = exampleCardData(car);
          return (
            <li key={car.slug}>
              <ListingCard item={c} photo={c.photo} href={c.href} />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
