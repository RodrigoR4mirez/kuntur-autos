import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

interface ListingResponse {
  title: string;
  price: { amountMinor: number; currency: 'PEN' | 'USD' };
  department: string;
  city: string;
  year: number;
  mileageKm: number;
  transmission: string;
  fuel: string;
  plate?: string;
  access: string;
}

export default async function Anuncio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = process.env['KUNTUR_API_URL'];
  if (!base) notFound();
  let listing: ListingResponse | null = null;
  try {
    const res = await fetch(new URL(`/listings/${encodeURIComponent(id)}`, base), {
      headers: { cookie: (await cookies()).toString() },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) listing = (await res.json()) as ListingResponse;
  } catch {
    listing = null;
  }
  if (!listing) notFound();

  const price = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: listing.price.currency,
  }).format(listing.price.amountMinor / 100);

  return (
    <>
      <main className="narrow">
        <h1 className="h-page">{listing.title}</h1>
        <p className="price">{price}</p>
        <ul className="facts">
          <li>{listing.year}</li>
          <li>{listing.mileageKm.toLocaleString('es-PE')} km</li>
          <li>
            {listing.city}, {listing.department}
          </li>
        </ul>
        {listing.plate ? (
          <p className="plate" aria-label="Placa">
            {listing.plate}
          </p>
        ) : (
          <p className="hint">La placa se muestra cuando reservas tu visita con un asesor.</p>
        )}
      </main>
    </>
  );
}
