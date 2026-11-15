import type { Metadata } from 'next';
import { Showroom } from '../../components/showroom.tsx';
import { buildShowroom, type ListingDetail } from '../../lib/showroom.ts';

export const metadata: Metadata = { title: 'Ejemplo de ficha · Kuntur Autos' };

/** Datos inventados para mostrar cómo se ve una ficha. No es un anuncio real. */
const EXAMPLE: ListingDetail = {
  id: 'ejemplo',
  title: 'Chevrolet Bel Air 1957',
  price: { amountMinor: 8_500_000, currency: 'PEN' },
  department: 'Lima',
  city: 'Miraflores',
  year: 1957,
  mileageKm: 82_000,
  access: 'registered',
  transmission: 'manual',
  fuel: 'gasoline',
  bodyTypeId: 1,
  colorId: 1,
  previousOwners: 1,
  hasServiceHistory: true,
  soatValid: true,
  technicalReviewValid: true,
  hasSpareKey: true,
  hasLiens: false,
  hasAccidents: false,
  description: 'Ejemplo: clásico restaurado, motor V8 original y llantas de franja blanca.',
};

export default function Ejemplo() {
  const data = buildShowroom(EXAMPLE, {
    bodyTypes: [{ id: 1, name: 'Clásico' }],
    colors: [{ id: 1, name: 'Rojo' }],
  });
  return (
    <>
      <p className="hint" role="note">
        Ejemplo de ficha con datos inventados: no es un anuncio real.
      </p>
      <Showroom
        data={data}
        photo={{
          src: '/ejemplo/chevrolet-1957.jpg',
          alt: 'Chevrolet Bel Air rojo de 1957 en una exhibición de autos clásicos',
          credit: 'Foto de ejemplo de Pexels (licencia gratuita). No es un anuncio real.',
        }}
      />
    </>
  );
}
