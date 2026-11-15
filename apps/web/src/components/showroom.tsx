'use client';

import { useState } from 'react';
import type { ShowroomData, Tile } from '../lib/showroom.ts';
import { CarArt } from './car-art.tsx';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className="lock-icon">
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  return (
    <li className={`show-tile show-tile-${tile.tone}${tile.locked ? ' show-tile-locked' : ''}`}>
      <small>{tile.label}</small>
      <strong className={tile.key === 'plate' || tile.key === 'mileage' ? 'mono' : undefined}>
        {tile.locked && <LockIcon />}
        {tile.value}
      </strong>
    </li>
  );
}

function pick(tiles: readonly Tile[], keys: readonly string[]): Tile[] {
  return keys.flatMap((k) => tiles.filter((t) => t.key === k));
}

/**
 * Sala de exhibición: el auto al centro y la información en tarjetas alrededor.
 * "Ver auto en detalle" oculta las tarjetas (sin mover nada: no hay salto de diseño).
 */
export function Showroom({ data }: { data: ShowroomData }) {
  const [focus, setFocus] = useState(false);
  const all = [...data.specs, ...data.history, data.plate];

  return (
    <>
      <section className={`show${focus ? ' show-focus' : ''}`} aria-label="Ficha del auto">
        <header className="show-head">
          <div>
            <h1 className="show-title">{data.title}</h1>
            <p className="show-place">{data.place}</p>
          </div>
          <div className="show-head-right">
            <p className="show-price mono">{data.priceText}</p>
            <button
              type="button"
              className="btn btn-dark btn-sm"
              aria-pressed={focus}
              aria-controls="show-info"
              onClick={() => setFocus((v) => !v)}
            >
              {focus ? 'Mostrar información' : 'Ver auto en detalle'}
            </button>
          </div>
        </header>

        <div className="show-stage">
          <div className="show-car">
            <CarArt />
            <div className="show-platform" aria-hidden="true" />
            <small className="show-photo-note">Ilustración. Fotos reales próximamente.</small>
          </div>
        </div>

        <div id="show-info" className="show-info" aria-hidden={focus}>
          <ul className="show-group show-left">
            {pick(data.specs, ['mileage', 'year']).map((t) => (
              <TileCard key={t.key} tile={t} />
            ))}
            {pick(data.history, ['owners']).map((t) => (
              <TileCard key={t.key} tile={t} />
            ))}
          </ul>
          <ul className="show-group show-right">
            {pick(data.specs, ['transmission', 'fuel', 'body', 'color']).map((t) => (
              <TileCard key={t.key} tile={t} />
            ))}
          </ul>
          <ul className="show-group show-bottom">
            {pick(data.history, ['soat', 'review', 'service', 'liens', 'accidents', 'key']).map(
              (t) => (
                <TileCard key={t.key} tile={t} />
              ),
            )}
          </ul>
          <div className="show-side">
            <div className="show-tile show-tile-plate">
              <small>Placa</small>
              <span className="plate-chip mono">{data.plate.value}</span>
              {data.plate.locked && <small>Se muestra al reservar tu visita con un asesor.</small>}
            </div>
            <div className="panel-dark show-reserve">
              <strong>Reservar visita con un asesor</strong>
              <small>Un asesor Kuntur te acompaña a ver el auto.</small>
              <button type="button" className="btn btn-gold" disabled>
                Reservar visita
              </button>
              <small>Disponible cuando se active el depósito.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="panel show-detail" aria-label="Detalle completo">
        <h2>Todo sobre este auto</h2>
        {!data.signedIn && (
          <p className="show-banner">
            <LockIcon /> <a href="/ingresar">Ingresa</a> para ver dueños anteriores, SOAT,
            gravámenes y más.
          </p>
        )}
        <dl className="show-list">
          {all.map((t) => (
            <div key={t.key} className="show-row">
              <dt>{t.label}</dt>
              <dd className={`tone-${t.tone}`}>{t.value}</dd>
            </div>
          ))}
        </dl>
        {data.description && (
          <>
            <h3>Descripción del vendedor</h3>
            <p>{data.description}</p>
          </>
        )}
        <p className="hint">
          Los datos de dueños, SOAT, revisión, gravámenes y choques los declara el vendedor. Un
          asesor Kuntur los revisa antes de publicar, pero aún no se verifican con el historial por
          placa.
        </p>
      </section>
    </>
  );
}
