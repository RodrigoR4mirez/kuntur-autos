import type { Metadata } from 'next';
import { Showroom } from '../../components/showroom.tsx';
import { buildShowroom, type ListingDetail } from '../../lib/showroom.ts';

export const metadata: Metadata = { title: 'Ejemplo de ficha · Kuntur Autos' };

/** Datos inventados para mostrar cómo se ve una ficha. No es un anuncio real. */
const EXAMPLE: ListingDetail = {
  id: 'ejemplo',
  title: 'Toyota Yaris 1.5 Sport 2019',
  price: { amountMinor: 5_290_000, currency: 'PEN' },
  department: 'Lima',
  city: 'Miraflores',
  year: 2019,
  mileageKm: 54_000,
  access: 'registered',
  transmission: 'automatic',
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
  description: 'Ejemplo: único dueño, mantenimiento en concesionaria y llantas nuevas.',
};

export default function Ejemplo() {
  const data = buildShowroom(EXAMPLE, {
    bodyTypes: [{ id: 1, name: 'Sedán' }],
    colors: [{ id: 1, name: 'Gris grafito' }],
  });
  return (
    <>
      <p className="hint" role="note">
        Ejemplo de ficha con datos inventados: no es un anuncio real.
      </p>
      <Showroom data={data} />
    </>
  );
}
