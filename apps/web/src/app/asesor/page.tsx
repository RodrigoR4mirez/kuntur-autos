import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ActionButton } from '../../components/action-button.tsx';
import { apiGet, formatMoney, parsePendingListings } from '../../lib/listings.ts';
import { currentUser } from '../../lib/session.ts';

export const metadata = { title: 'Panel del asesor — Kuntur Autos' };
export const dynamic = 'force-dynamic';

export default async function Asesor() {
  if (!(await currentUser())) redirect('/ingresar');
  const queue = await apiGet('/review/listings');

  if (!queue.ok && queue.status === 403) {
    return (
      <main className="page">
        <section className="panel state">
          <h1 className="h-page">Solo para asesores</h1>
          <p>Tu cuenta no tiene permiso para revisar anuncios.</p>
          <Link className="btn btn-dark" href="/mis-anuncios">
            Volver a mis anuncios
          </Link>
        </section>
      </main>
    );
  }
  if (!queue.ok) {
    return (
      <main className="page">
        <section className="panel state" role="status">
          <h1 className="h-page">No pudimos cargar la cola</h1>
          <p>Puede que el servicio esté despertando. Recarga en unos segundos.</p>
          <a className="btn btn-dark" href="/asesor">
            Recargar
          </a>
        </section>
      </main>
    );
  }
  const items = parsePendingListings(queue.data);

  return (
    <main className="page">
      <section className="panel">
        <h1 className="h-page">Panel del asesor</h1>
        <p className="lead-sm">
          Anuncios esperando revisión, del más antiguo al más reciente. Verifica la placa y los
          datos antes de aprobar.
        </p>
      </section>
      {items.length === 0 ? (
        <section className="panel state">
          <h2>No hay anuncios pendientes</h2>
          <p>Cuando alguien envíe un anuncio a revisión, aparecerá aquí.</p>
        </section>
      ) : (
        <ul className="rows">
          {items.map((l) => (
            <li key={l.id} className="panel row-card">
              <div>
                <h2>{l.title}</h2>
                <p className="car-card-meta">
                  {formatMoney(l.price)} · {l.city}, {l.department}
                </p>
                {l.vehicle ? (
                  <p className="review-facts">
                    <span className="plate plate-sm">{l.vehicle.plate}</span>
                    <span>{l.vehicle.year}</span>
                    <span>{l.vehicle.mileageKm.toLocaleString('en-US')} km</span>
                    <span>{l.vehicle.transmission}</span>
                    <span>{l.vehicle.fuel}</span>
                  </p>
                ) : (
                  <p className="error">Faltan los datos del vehículo.</p>
                )}
              </div>
              <div className="row-actions">
                <ActionButton
                  url={`/api/listings/${l.id}/review`}
                  body={{ decision: 'approve' }}
                  label="Aprobar"
                  className="btn btn-dark btn-sm"
                />
                <ActionButton
                  url={`/api/listings/${l.id}/review`}
                  body={{ decision: 'reject' }}
                  label="Rechazar"
                  className="btn btn-ghost btn-sm"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
