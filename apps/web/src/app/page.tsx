import { SiteFooter } from '../components/site-footer.tsx';
import { SiteHeader } from '../components/site-header.tsx';
import { fetchBrands } from '../lib/api.ts';

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

export const dynamic = 'force-dynamic';

export default async function Home() {
  const brands = await fetchBrands();
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">Autos de segunda mano y nuevos en todo el Perú</p>
            <h1>
              El auto con <em>historial claro.</em>
            </h1>
            <p className="lead">
              Verificamos la placa y presentamos cada auto con un asesor propio. Ves desde arriba,
              como el cóndor, antes de comprar.
            </p>
            <div className="actions">
              <a className="btn btn-primary" href="/vender">
                Vender mi auto
              </a>
              <a className="btn btn-ghost" href="#como-funciona">
                Cómo funciona
              </a>
            </div>
            <ul className="perks">
              <li>Placa verificada</li>
              <li>Asesor propio</li>
              <li>S/ 10 reembolsables</li>
            </ul>
          </div>

          <article className="sample" aria-label="Ejemplo de ficha de un auto verificado">
            <div className="sample-top">
              <span className="sample-tag">Ejemplo de ficha</span>
              <svg viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M0 90V58l40-26 34 20 52-42 46 40 38-22 58 36 40-24 54 28 38-18v60Z"
                  fill="#1F4FD8"
                  opacity=".35"
                />
                <path d="M0 90V70l52-22 40 18 56-34 50 30 44-14 66 26 92-20v36Z" fill="#16283D" />
              </svg>
              <span className="plate">KNT-482</span>
            </div>
            <div className="sample-body">
              <span className="seal">★ Verificado por Kuntur</span>
              <h3>Toyota Corolla 2019</h3>
              <p className="sample-meta">Automático · Gasolina · Lima</p>
              <p className="sample-price">S/ 52,900</p>
              <ul className="checks">
                {controls.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        <section id="como-funciona" className="section">
          <h2>Cómo funciona</h2>
          <p className="section-lead">Tres pasos, sin sorpresas y sin pagar por adelantado.</p>
          <ol className="steps">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className="num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="confianza" className="section trust">
          <div>
            <span className="seal">★ Verificado por Kuntur</span>
            <h2>El sello se gana, no se compra</h2>
            <p>
              Solo lo lleva el auto que pasó tres controles. Si falta uno, no lo mostramos. Así
              sabes qué estás mirando antes de ir a verlo.
            </p>
          </div>
          <div className="trust-card">
            <h3>Los tres controles</h3>
            <ul className="checks">
              {controls.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </section>

        {brands.length > 0 && (
          <section className="section" aria-labelledby="marcas">
            <h2 id="marcas">Marcas que ya puedes encontrar</h2>
            <ul className="chips">
              {brands.map((b) => (
                <li key={b.id}>{b.name}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="cta-band" aria-labelledby="vende">
          <div>
            <h2 id="vende">¿Quieres vender tu auto?</h2>
            <p>Publícalo gratis. Nosotros verificamos la placa y lo presentamos con un asesor.</p>
          </div>
          <a className="btn btn-primary" href="/vender">
            Publicar mi auto
          </a>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
