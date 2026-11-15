import Link from 'next/link';
import { ListingCard } from '../../components/listing-card.tsx';
import { fetchBrands } from '../../lib/api.ts';
import { apiGet, buildListingsQuery, parseListingCards } from '../../lib/listings.ts';
import { DEPARTMENTS } from '../../lib/peru.ts';

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
  const rawDepartment = one(sp['departamento']);
  const department = DEPARTMENTS.includes(rawDepartment) ? rawDepartment : undefined;
  const filtered =
    brandId !== undefined ||
    maxPricePen !== undefined ||
    minYear !== undefined ||
    department !== undefined;

  const [brands, result] = await Promise.all([
    fetchBrands(),
    apiGet(
      '/listings?' +
        buildListingsQuery({
          ...(brandId !== undefined ? { brandId } : {}),
          ...(maxPricePen !== undefined ? { maxPricePen } : {}),
          ...(minYear !== undefined ? { minYear } : {}),
          ...(department !== undefined ? { department } : {}),
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

        <form id="filtros" className="filters" method="get" action="/autos">
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
            Departamento
            <select name="departamento" defaultValue={department ?? ''}>
              <option value="">Todo el Perú</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
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
            <Link className="btn btn-ghost" href="/autos">
              Limpiar
            </Link>
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
          <Link className="btn btn-primary" href={filtered ? '/autos' : '/vender'}>
            {filtered ? 'Ver todos' : 'Vender mi auto'}
          </Link>
          {!filtered && (
            <p className="hint">
              ¿Quieres ver cómo se ve? <Link href="/ejemplo">Mira cinco autos de ejemplo</Link>.
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
