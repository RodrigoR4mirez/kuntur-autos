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

const ICONS: Record<string, string> = {
  mileage: 'M4 18a8 8 0 1 1 16 0M12 18l4-5',
  year: 'M5 6h14v13H5zM5 10h14M9 4v4M15 4v4',
  owners: 'M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20a7 7 0 0 1 14 0',
  transmission:
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2',
  fuel: 'M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11z',
  body: 'M3 15l2-6h14l2 6v3H3zM7 18v2M17 18v2M6 13h12',
  color: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2 1.5-2h2a3 3 0 0 0 3-3 9 9 0 0 0-8-11z',
  soat: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM9 12l2 2 4-4',
  review: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6',
  service: 'M14 6a4 4 0 0 0-5 5l-6 6 3 3 6-6a4 4 0 0 0 5-5l-3 3-2-2z',
  liens: 'M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6z',
  accidents: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  key: 'M8 14a4 4 0 1 1 3-6.6L20 15l-2 2-2-1-2 2-2-1-2.4-2.4A4 4 0 0 1 8 14z',
};

function TileIcon({ name }: { name: string }) {
  return (
    <span className="show-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path
          d={ICONS[name] ?? ICONS.body}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  return (
    <li
      className={`show-tile show-glass show-tile-${tile.tone}${tile.locked ? ' show-tile-locked' : ''}`}
    >
      <TileIcon name={tile.key} />
      <span className="show-tile-text">
        <small>{tile.label}</small>
        <strong className={tile.key === 'plate' || tile.key === 'mileage' ? 'mono' : undefined}>
          {tile.locked && <LockIcon />}
          {tile.value}
        </strong>
      </span>
    </li>
  );
}

function SideCards({ plate, className }: { plate: Tile; className: string }) {
  return (
    <div className={className}>
      <div className="show-plate show-glass">
        <small>Placa</small>
        <span className="plate-chip mono">{plate.value}</span>
        {plate.locked && <small>Se muestra al reservar tu visita.</small>}
      </div>
      <div className="show-reserve show-glass show-glass-dark">
        <strong>Reservar visita con un asesor</strong>
        <button type="button" className="btn btn-gold" disabled>
          Reservar visita
        </button>
        <small>Disponible cuando se active el depósito.</small>
      </div>
    </div>
  );
}

function pick(tiles: readonly Tile[], keys: readonly string[]): Tile[] {
  return keys.flatMap((k) => tiles.filter((t) => t.key === k));
}

/**
 * Sala de exhibición: el auto al centro y la información en tarjetas alrededor.
 * Las tarjetas flotan sobre la foto; "Ver solo el auto" las oculta y deja la imagen limpia.
 */
export interface ShowroomPhoto {
  readonly src: string;
  readonly alt: string;
  readonly credit: string;
}

export function Showroom({ data, photo }: { data: ShowroomData; photo?: ShowroomPhoto }) {
  const [focus, setFocus] = useState(false);
  const all = [...data.specs, ...data.history, data.plate];

  return (
    <>
      <section className={`show${focus ? ' show-focus' : ''}`} aria-label="Ficha del auto">
        <div className="show-stage">
          <div className="show-media">
            {photo ? (
              <img
                className="show-photo"
                src={photo.src}
                alt={photo.alt}
                width={1400}
                height={934}
                fetchPriority="high"
              />
            ) : (
              <>
                <CarArt />
                <div className="show-platform" aria-hidden="true" />
              </>
            )}
          </div>

          <header className="show-head show-glass">
            <h1 className="show-title">{data.title}</h1>
            <p className="show-place">{data.place}</p>
            <p className="show-price mono">{data.priceText}</p>
          </header>

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
            <SideCards plate={data.plate} className="show-side show-side-over" />
          </div>

          <button
            type="button"
            className="show-toggle show-glass"
            aria-pressed={focus}
            aria-controls="show-info"
            onClick={() => setFocus((v) => !v)}
          >
            {focus ? 'Mostrar información' : 'Ver solo el auto'}
          </button>
        </div>

        <small className="show-photo-note">
          {photo ? photo.credit : 'Ilustración. Fotos reales próximamente.'}
        </small>

        <SideCards plate={data.plate} className="show-side show-side-below" />
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
