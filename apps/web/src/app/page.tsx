import Link from 'next/link';
import { CarArt } from '../components/car-art.tsx';
import {
  IconArrow,
  IconCoin,
  IconGauge,
  IconRoute,
  IconShield,
  IconSpark,
  IconTag,
} from '../components/icons.tsx';
import { fetchBrands } from '../lib/api.ts';
import { apiGet, formatMoney, parseListingCards } from '../lib/listings.ts';

const steps = [
  {
    title: 'Busca',
    text: 'Filtra por marca, modelo, precio y ciudad. Ves el auto, su kilometraje y lo esencial sin crear cuenta.',
  },
  {
    title: 'Verificamos la placa',
    text: 'Consultamos el historial con un proveedor autorizado y revisamos los documentos antes de mostrar el sello.',
  },
  {
    title: 'Agenda tu visita',
    text: 'Pagas S/ 10 para reservar. Te los devolvemos cuando asistas. Un asesor de Kuntur te acompaña.',
  },
];

const controls = ['Placa consultada', 'Documentos revisados', 'Visita del asesor hecha'];

const tiles = [
  {
    href: '/vender',
    title: 'Vender mi auto',
    text: 'Publica y lo verificamos',
    icon: <IconTag />,
    dark: true,
  },
  {
    href: '/#como-funciona',
    title: 'Cómo funciona',
    text: 'Tres pasos claros',
    icon: <IconRoute />,
  },
  {
    href: '/#como-funciona',
    title: 'Depósito S/ 10',
    text: 'Reembolsable si asistes',
    icon: <IconCoin />,
  },
  { href: '/#confianza', title: 'Sello Kuntur', text: 'Qué significa', icon: <IconShield /> },
];

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Espera corta: la portada nunca debe quedar esperando a una API que está despertando.
  const [brands, recent] = await Promise.all([
    fetchBrands(),
    apiGet('/listings?limit=2', undefined, 4000),
  ]);
  const latest = recent.ok ? parseListingCards(recent.data) : [];
  return (
    <main className="board">
      <section className="panel hero" aria-labelledby="titulo">
        <div className="hero-head">
          <span className="chip">Ejemplo de ficha</span>
          <span className="chip-ghost">Todo el Perú</span>
        </div>
        <h1 id="titulo">El auto con historial claro.</h1>
        <p className="lead">
          Verificamos la placa y presentamos cada auto con un asesor propio. Ves desde arriba, como
          el cóndor, antes de comprar.
        </p>

        <div className="specs">
          <div className="spec">
            <span className="spec-icon">
              <IconShield />
            </span>
            <div>
              <small>Placa verificada</small>
              <strong className="mono">KNT-482</strong>
            </div>
          </div>
          <div className="spec">
            <span className="spec-icon">
              <IconGauge />
            </span>
            <div>
              <small>Kilometraje real</small>
              <strong>48,200 km</strong>
            </div>
          </div>
        </div>

        <div className="car-wrap">
          <CarArt />
        </div>

        <div className="hero-bar">
          <span className="swatches" aria-hidden="true">
            <i style={{ background: '#070b11' }} />
            <i style={{ background: '#bf3417' }} />
            <i style={{ background: '#e0a82e' }} />
          </span>
          <div className="hero-bar-text">
            <strong>Ejemplo: Toyota Corolla 2019</strong>
            <small>Tres controles listos · S/ 52,900</small>
          </div>
          <Link className="btn btn-dark" href="/#como-funciona">
            Cómo funciona <IconArrow />
          </Link>
        </div>
      </section>

      <aside className="panel side-panel" aria-labelledby="asesor">
        <div className="side-head">
          <span className="spec-icon">
            <IconSpark />
          </span>
          <div>
            <h2 id="asesor">Tu asesor Kuntur</h2>
            <small>Te acompaña en cada visita</small>
          </div>
        </div>
        <div className="tiles">
          {tiles.map((t) => (
            <Link key={t.title} href={t.href} className={t.dark ? 'tile tile-dark' : 'tile'}>
              <span className="tile-icon">{t.icon}</span>
              <strong>{t.title}</strong>
              <small>{t.text}</small>
            </Link>
          ))}
        </div>
        <div className="recent">
          <div className="recent-head">
            <h3>Recién publicados</h3>
            <Link href="/autos">Ver todos</Link>
          </div>
          {latest.length > 0 ? (
            <ul>
              {latest.map((l) => (
                <li key={l.id}>
                  <Link href={`/anuncios/${encodeURIComponent(l.id)}`}>
                    <span>
                      <strong>{l.title}</strong>
                      <small>
                        {l.year} · {l.city}
                      </small>
                    </span>
                    <span className="mono">{formatMoney(l.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="recent-empty">
              Aún no hay autos publicados. <Link href="/vender">Publica el tuyo</Link> y un asesor
              lo revisa.
            </p>
          )}
        </div>
        <div className="note">
          <p>“Pagas S/ 10 para reservar tu visita. Te los devolvemos cuando asistas.”</p>
          <Link className="btn btn-gold btn-sm" href="/ingresar">
            Ingresar <IconArrow />
          </Link>
        </div>
      </aside>

      <section id="como-funciona" className="panel steps-card" aria-labelledby="como">
        <div className="card-head">
          <h2 id="como">Cómo funciona</h2>
          <span className="circle-arrow">
            <IconArrow />
          </span>
        </div>
        <ol className="steps">
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="num">{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="confianza" className="panel panel-dark seal-card" aria-labelledby="sello">
        <div className="card-head">
          <h2 id="sello">Verificado por Kuntur</h2>
          <span className="circle-arrow circle-arrow-dark">
            <IconArrow />
          </span>
        </div>
        <span className="seal">★ El sello se gana, no se compra</span>
        <ul className="checks">
          {controls.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <small>Si falta un control, no mostramos el sello.</small>
      </section>

      {brands.length > 0 && (
        <section className="panel brands-card" aria-labelledby="marcas">
          <h2 id="marcas">Marcas que ya puedes encontrar</h2>
          <ul className="chips">
            {brands.map((b) => (
              <li key={b.id}>{b.name}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
