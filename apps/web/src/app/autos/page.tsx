import { ListingCard } from '../../components/listing-card.tsx';
import { fetchBrands } from '../../lib/api.ts';
import { apiGet, buildListingsQuery, parseListingCards } from '../../lib/listings.ts';

export const metadata = { title: 'Autos — Kuntur Autos' };
export const dynamic = 'force-dynamic';

type Search = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
const num = (v: string): number | undefined => {
  const n = Number(v);
  return v !== '' && Number.isFinite(n) ? n : undefined;
};

export default async function Autos({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const brandId = num(one(sp['marca']));
  const maxPricePen = num(one(sp['precio']));
  const minYear = num(one(sp['desde']));
  const filtered = brandId !== undefined || maxPricePen !== undefined || minYear !== undefined;

  const [brands, result] = await Promise.all([
    fetchBrands(),
    apiGet(
      '/listings?' +
        buildListingsQuery({
          ...(brandId !== undefined ? { brandId } : {}),
          ...(maxPricePen !== undefined ? { maxPricePen } : {}),
          ...(minYear !== undefined ? { minYear } : {}),
        }),
    ),
  ]);
  const items = result.ok ? parseListingCards(result.data) : [];
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => thisYear - i);

  return (
    <main className="page">
      <section className="panel">
        <h1 className="h-page">Autos publicados</h1>
        <p className="lead-sm">
          Cada anuncio lo revisa un asesor de Kuntur antes de aparecer aquí.
        </p>

        <form className="filters" method="get" action="/autos">
          <label>
            Marca
            <select name="marca" defaultValue={brandId ? String(brandId) : ''}>
              <option value="">Todas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Precio máximo (S/)
            <input
              name="precio"
              type="number"
              inputMode="numeric"
              min="1"
              step="1000"
              placeholder="Ej. 50000"
              defaultValue={maxPricePen ?? ''}
            />
          </label>
          <label>
            Año desde
            <select name="desde" defaultValue={minYear ? String(minYear) : ''}>
              <option value="">Cualquiera</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-dark" type="submit">
            Buscar
          </button>
          {filtered && (
            <a className="btn btn-ghost" href="/autos">
              Limpiar
            </a>
          )}
        </form>
      </section>

      {!result.ok ? (
        <section className="panel state" role="status">
          <h2>Estamos despertando el servicio</h2>
          <p>Tarda unos segundos la primera vez. Recarga la página para ver los autos.</p>
          <a className="btn btn-dark" href="/autos">
            Recargar
          </a>
        </section>
      ) : items.length === 0 ? (
        <section className="panel state">
          <h2>{filtered ? 'No hay autos con esos filtros' : 'Aún no hay autos publicados'}</h2>
          <p>
            {filtered
              ? 'Prueba con otro precio o quita algún filtro.'
              : 'Sé el primero: publica tu auto y un asesor lo revisa.'}
          </p>
          <a className="btn btn-primary" href={filtered ? '/autos' : '/vender'}>
            {filtered ? 'Ver todos' : 'Vender mi auto'}
          </a>
          {!filtered && (
            <p className="hint">
              ¿Quieres ver cómo se ve? <a href="/ejemplo">Mira cinco autos de ejemplo</a>.
            </p>
          )}
        </section>
      ) : (
        <ul className="car-grid" aria-label="Resultados">
          {items.map((item) => (
            <li key={item.id}>
              <ListingCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
