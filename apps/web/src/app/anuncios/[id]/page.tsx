import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Showroom } from '../../../components/showroom.tsx';
import { fetchCatalogOptions } from '../../../lib/api.ts';
import { apiGet } from '../../../lib/listings.ts';
import { buildShowroom, parseCatalogOptions, parseListingDetail } from '../../../lib/showroom.ts';

export const dynamic = 'force-dynamic';

export default async function Anuncio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, options] = await Promise.all([
    apiGet(`/listings/${encodeURIComponent(id)}`),
    fetchCatalogOptions(),
  ]);

  if (!listing.ok && listing.status === 404) notFound();
  if (!listing.ok) {
    return (
      <main className="narrow">
        <h1 className="h-page">No pudimos cargar este anuncio</h1>
        <p className="hint">
          El servicio está despertando o no responde. Inténtalo de nuevo en unos segundos.
        </p>
        <a className="btn btn-primary" href={`/anuncios/${encodeURIComponent(id)}`}>
          Reintentar
        </a>
      </main>
    );
  }

  const detail = parseListingDetail(listing.data);
  if (!detail) notFound();

  const data = buildShowroom(detail, parseCatalogOptions(options));
  return <Showroom data={data} />;
}
