/**
 * Ficha de un auto: convierte la respuesta de la API en "datos listos para mostrar".
 * Funciones puras (sin red ni cookies) para poder probarlas. La privacidad se decide en el
 * servidor: aquí solo se muestra "Ingresa para ver" cuando la API no envió el campo.
 */
import { formatMoney, type Money } from './listings.ts';

export type Tone = 'ok' | 'warn' | 'neutral';

export interface Tile {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly tone: Tone;
  /** `true` cuando el dato existe pero este visitante aún no puede verlo. */
  readonly locked: boolean;
}

export interface ListingDetail {
  readonly id: string;
  readonly title: string;
  readonly price: Money;
  readonly department: string;
  readonly city: string;
  readonly year: number;
  readonly mileageKm: number;
  readonly access: string;
  readonly transmission?: string;
  readonly fuel?: string;
  readonly colorId?: number;
  readonly bodyTypeId?: number;
  readonly previousOwners?: number | null;
  readonly hasServiceHistory?: boolean | null | undefined;
  readonly soatValid?: boolean | null | undefined;
  readonly technicalReviewValid?: boolean | null | undefined;
  readonly hasSpareKey?: boolean | null | undefined;
  readonly hasLiens?: boolean | null | undefined;
  readonly hasAccidents?: boolean | null | undefined;
  readonly description?: string | null;
  readonly plate?: string;
}

export interface CatalogOption {
  readonly id: number;
  readonly name: string;
}

export interface CatalogOptions {
  readonly bodyTypes: readonly CatalogOption[];
  readonly colors: readonly CatalogOption[];
}

export interface ShowroomData {
  readonly id: string;
  readonly title: string;
  readonly priceText: string;
  readonly place: string;
  readonly signedIn: boolean;
  readonly specs: readonly Tile[];
  readonly history: readonly Tile[];
  readonly plate: Tile;
  readonly description: string | null;
}

const TRANSMISSION: Record<string, string> = { manual: 'Manual', automatic: 'Automática' };
const FUEL: Record<string, string> = {
  gasoline: 'Gasolina',
  diesel: 'Diésel',
  lpg: 'GLP',
  gnv: 'GNV',
  hybrid: 'Híbrido',
  electric: 'Eléctrico',
};

export const LOCKED_TEXT = 'Ingresa para ver';
export const MASKED_PLATE = '••• •••';

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function triState(o: Record<string, unknown>, key: string): boolean | null | undefined {
  const v = o[key];
  return typeof v === 'boolean' || v === null ? v : undefined;
}

export function parseListingDetail(payload: unknown): ListingDetail | null {
  if (!isObj(payload)) return null;
  const price = payload['price'];
  if (
    typeof payload['id'] !== 'string' ||
    typeof payload['title'] !== 'string' ||
    !isObj(price) ||
    typeof price['amountMinor'] !== 'number' ||
    (price['currency'] !== 'PEN' && price['currency'] !== 'USD') ||
    typeof payload['year'] !== 'number' ||
    typeof payload['mileageKm'] !== 'number'
  ) {
    return null;
  }
  const owners = payload['previousOwners'];
  const description = payload['description'];
  return {
    id: payload['id'],
    title: payload['title'],
    price: { amountMinor: price['amountMinor'], currency: price['currency'] },
    department: typeof payload['department'] === 'string' ? payload['department'] : '',
    city: typeof payload['city'] === 'string' ? payload['city'] : '',
    year: payload['year'],
    mileageKm: payload['mileageKm'],
    access: typeof payload['access'] === 'string' ? payload['access'] : 'anonymous',
    ...(typeof payload['transmission'] === 'string' && { transmission: payload['transmission'] }),
    ...(typeof payload['fuel'] === 'string' && { fuel: payload['fuel'] }),
    ...(typeof payload['colorId'] === 'number' && { colorId: payload['colorId'] }),
    ...(typeof payload['bodyTypeId'] === 'number' && { bodyTypeId: payload['bodyTypeId'] }),
    ...((typeof owners === 'number' || owners === null) && { previousOwners: owners }),
    ...(triState(payload, 'hasServiceHistory') !== undefined && {
      hasServiceHistory: triState(payload, 'hasServiceHistory'),
    }),
    ...(triState(payload, 'soatValid') !== undefined && {
      soatValid: triState(payload, 'soatValid'),
    }),
    ...(triState(payload, 'technicalReviewValid') !== undefined && {
      technicalReviewValid: triState(payload, 'technicalReviewValid'),
    }),
    ...(triState(payload, 'hasSpareKey') !== undefined && {
      hasSpareKey: triState(payload, 'hasSpareKey'),
    }),
    ...(triState(payload, 'hasLiens') !== undefined && { hasLiens: triState(payload, 'hasLiens') }),
    ...(triState(payload, 'hasAccidents') !== undefined && {
      hasAccidents: triState(payload, 'hasAccidents'),
    }),
    ...((typeof description === 'string' || description === null) && { description }),
    ...(typeof payload['plate'] === 'string' && { plate: payload['plate'] }),
  };
}

export function parseCatalogOptions(payload: unknown): CatalogOptions {
  const list = (key: string): CatalogOption[] => {
    const raw = isObj(payload) ? payload[key] : undefined;
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((x) =>
      isObj(x) && typeof x['id'] === 'number' && typeof x['name'] === 'string'
        ? [{ id: x['id'], name: x['name'] }]
        : [],
    );
  };
  return { bodyTypes: list('bodyTypes'), colors: list('colors') };
}

const NOT_INFORMED = 'No informado';

function tile(key: string, label: string, value: string, tone: Tone = 'neutral'): Tile {
  return { key, label, value, tone, locked: false };
}

function locked(key: string, label: string): Tile {
  return { key, label, value: LOCKED_TEXT, tone: 'neutral', locked: true };
}

/** Sí / No / No informado. `goodWhen` dice qué respuesta es la favorable para el comprador. */
function yesNo(
  key: string,
  label: string,
  v: boolean | null | undefined,
  goodWhen: boolean,
  yes = 'Sí',
  no = 'No',
): Tile {
  if (v === undefined) return locked(key, label);
  if (v === null) return tile(key, label, NOT_INFORMED);
  return tile(key, label, v ? yes : no, v === goodWhen ? 'ok' : 'warn');
}

export function buildShowroom(d: ListingDetail, options: CatalogOptions): ShowroomData {
  const signedIn = d.access !== 'anonymous';
  const name = (list: readonly CatalogOption[], id: number | undefined) =>
    list.find((o) => o.id === id)?.name;

  const specs: Tile[] = [
    tile('mileage', 'Kilometraje', `${d.mileageKm.toLocaleString('en-US')} km`),
    tile('year', 'Año', String(d.year)),
    d.transmission !== undefined
      ? tile('transmission', 'Transmisión', TRANSMISSION[d.transmission] ?? d.transmission)
      : locked('transmission', 'Transmisión'),
    d.fuel !== undefined
      ? tile('fuel', 'Combustible', FUEL[d.fuel] ?? d.fuel)
      : locked('fuel', 'Combustible'),
    d.bodyTypeId !== undefined
      ? tile('body', 'Carrocería', name(options.bodyTypes, d.bodyTypeId) ?? NOT_INFORMED)
      : locked('body', 'Carrocería'),
    d.colorId !== undefined
      ? tile('color', 'Color', name(options.colors, d.colorId) ?? NOT_INFORMED)
      : locked('color', 'Color'),
  ];

  const owners: Tile =
    d.previousOwners === undefined
      ? locked('owners', 'Dueños anteriores')
      : d.previousOwners === null
        ? tile('owners', 'Dueños anteriores', NOT_INFORMED)
        : tile(
            'owners',
            'Dueños anteriores',
            String(d.previousOwners),
            d.previousOwners <= 1 ? 'ok' : 'neutral',
          );

  const history: Tile[] = [
    owners,
    yesNo('soat', 'SOAT vigente', d.soatValid, true),
    yesNo('review', 'Revisión técnica', d.technicalReviewValid, true, 'Vigente', 'Vencida'),
    yesNo('service', 'Mantenimiento al día', d.hasServiceHistory, true),
    yesNo('liens', 'Gravámenes', d.hasLiens, false, 'Con gravamen', 'Sin gravamen'),
    yesNo('accidents', 'Choques declarados', d.hasAccidents, false, 'Sí, declara', 'Ninguno'),
    yesNo('key', 'Llave de repuesto', d.hasSpareKey, true),
  ];

  const plate: Tile =
    d.plate !== undefined
      ? tile('plate', 'Placa', d.plate)
      : { key: 'plate', label: 'Placa', value: MASKED_PLATE, tone: 'neutral', locked: true };

  return {
    id: d.id,
    title: d.title,
    priceText: formatMoney(d.price),
    place: [d.city, d.department].filter(Boolean).join(', '),
    signedIn,
    specs,
    history,
    plate,
    description: d.description ? d.description : null,
  };
}
