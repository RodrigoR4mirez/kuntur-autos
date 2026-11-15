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

export default async function Home() {
  const brands = await fetchBrands();
  return (
    <>
      <header className="bar">
        <a className="brand" href="/" aria-label="Kuntur Autos, inicio">
          <img src="/icon.svg" width={36} height={36} alt="" />
          <span>Kuntur Autos</span>
        </a>
        <nav aria-label="Principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#confianza">Confianza</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Autos de segunda mano y nuevos en todo el Perú</p>
          <h1>El auto con historial claro.</h1>
          <p className="lead">
            Verificamos la placa y presentamos cada auto con un asesor propio. Ves desde arriba,
            como el cóndor, antes de comprar.
          </p>
          <div className="actions">
            <a className="btn btn-primary" href="#como-funciona">
              Ver cómo funciona
            </a>
            <a className="btn btn-ghost" href="#confianza">
              Por qué confiar
            </a>
          </div>
          <p className="plate" aria-label="Ejemplo de placa">
            KNT-482
          </p>
        </section>

        <section id="como-funciona" className="section">
          <h2>Cómo funciona</h2>
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
            <span className="seal">Verificado por Kuntur</span>
            <h2>El sello se gana, no se compra</h2>
            <p>
              Solo lo lleva el auto que pasó tres controles: consulta de placa, documentos revisados
              por el equipo y visita del asesor. Si falta uno, no lo mostramos.
            </p>
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
      </main>

      <footer className="foot">
        <p>© 2026 Kuntur Autos. Hecho en el Perú.</p>
        <p>Versión de prueba: los anuncios llegan pronto.</p>
      </footer>
    </>
  );
}
