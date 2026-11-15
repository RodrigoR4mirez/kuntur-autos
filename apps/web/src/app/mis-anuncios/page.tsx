import { redirect } from 'next/navigation';
import { ActionButton } from '../../components/action-button.tsx';
import { apiGet, formatMoney, parseOwnListings, STATUS_LABEL } from '../../lib/listings.ts';
import { currentUser } from '../../lib/session.ts';

export const metadata = { title: 'Mis anuncios — Kuntur Autos' };
export const dynamic = 'force-dynamic';

const HELP: Record<string, string> = {
  draft: 'Envíalo a revisión para que un asesor lo verifique.',
  pending_review: 'Un asesor de Kuntur lo está revisando.',
  published: 'Ya se muestra en la vitrina.',
  rejected: 'El asesor no lo aprobó. Publica uno nuevo con los datos corregidos.',
};

export default async function MisAnuncios() {
  const user = await currentUser();
  if (!user) redirect('/ingresar');
  const [mine, me] = await Promise.all([apiGet('/me/listings'), apiGet('/me')]);
  const items = mine.ok ? parseOwnListings(mine.data) : [];
  const role =
    me.ok && typeof me.data === 'object' && me.data !== null
      ? (me.data as { role?: unknown }).role
      : null;
  const isReviewer = role === 'advisor' || role === 'admin';

  return (
    <main className="page">
      <section className="panel">
        <div className="card-head">
          <div>
            <h1 className="h-page">Mis anuncios</h1>
            <p className="lead-sm">Hola, {user.name}.</p>
          </div>
          <a className="btn btn-primary btn-sm" href="/vender">
            Publicar un auto
          </a>
        </div>
        {isReviewer && (
          <p className="hint">
            Eres asesor de Kuntur: <a href="/asesor">abre el panel de revisión</a>.
          </p>
        )}
      </section>

      {!mine.ok ? (
        <section className="panel state" role="status">
          <h2>No pudimos cargar tus anuncios</h2>
          <p>Puede que el servicio esté despertando. Recarga en unos segundos.</p>
          <a className="btn btn-dark" href="/mis-anuncios">
            Recargar
          </a>
        </section>
      ) : items.length === 0 ? (
        <section className="panel state">
          <h2>Todavía no publicaste nada</h2>
          <p>Cuéntanos de tu auto y lo verificamos con un asesor.</p>
          <a className="btn btn-primary" href="/vender">
            Publicar mi primer auto
          </a>
        </section>
      ) : (
        <ul className="rows">
          {items.map((l) => (
            <li key={l.id} className="panel row-card">
              <div>
                <span className={`status status-${l.status}`}>{STATUS_LABEL[l.status]}</span>
                <h2>{l.title}</h2>
                <p className="car-card-meta">
                  {formatMoney(l.price)} · {l.city}, {l.department}
                </p>
                <p className="hint">{HELP[l.status] ?? ''}</p>
              </div>
              <div className="row-actions">
                {l.status === 'draft' && (
                  <ActionButton url={`/api/listings/${l.id}/submit`} label="Enviar a revisión" />
                )}
                {l.status === 'published' && (
                  <a className="btn btn-ghost btn-sm" href={`/anuncios/${l.id}`}>
                    Ver anuncio
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
