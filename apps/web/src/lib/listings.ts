/** Anuncios y cuenta desde la API. La interfaz nunca asume que la API responde ni que responde bien. */
import { cookies } from 'next/headers';
import { DEPARTMENTS } from './peru.ts';

export interface Money {
  readonly amountMinor: number;
  readonly currency: 'PEN' | 'USD';
}

export interface ListingCardData {
  readonly id: string;
  readonly title: string;
  readonly price: Money;
  readonly department: string;
  readonly city: string;
  readonly year: number;
  readonly mileageKm: number;
}

export type ListingStatus =
  'draft' | 'pending_review' | 'published' | 'reserved' | 'sold' | 'rejected' | 'archived';

export interface OwnListing {
  readonly id: string;
  readonly title: string;
  readonly status: ListingStatus;
  readonly price: Money;
  readonly department: string;
  readonly city: string;
}

export interface PendingVehicle {
  readonly year: number;
  readonly mileageKm: number;
  readonly transmission: string;
  readonly fuel: string;
  readonly plate: string;
}

export interface PendingListing extends OwnListing {
  readonly vehicle: PendingVehicle | null;
}

export const STATUS_LABEL: Record<ListingStatus, string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  published: 'Publicado',
  reserved: 'Reservado',
  sold: 'Vendido',
  rejected: 'Rechazado',
  archived: 'Archivado',
};

const STATUSES = Object.keys(STATUS_LABEL);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function parseMoney(v: unknown): Money | null {
  if (!isObj(v) || typeof v['amountMinor'] !== 'number') return null;
  if (v['currency'] !== 'PEN' && v['currency'] !== 'USD') return null;
  return { amountMinor: v['amountMinor'], currency: v['currency'] };
}

/** "S/ 52,900" o "US$ 14,500": el dinero llega en céntimos y se muestra sin decimales. */
export function formatMoney(m: Money): string {
  const symbol = m.currency === 'PEN' ? 'S/' : 'US$';
  return `${symbol} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(m.amountMinor / 100)}`;
}

export function parseListingCards(payload: unknown): ListingCardData[] {
  const items = isObj(payload) && Array.isArray(payload['items']) ? payload['items'] : [];
  const out: ListingCardData[] = [];
  for (const it of items) {
    if (!isObj(it)) continue;
    const price = parseMoney(it['price']);
    if (
      price &&
      typeof it['id'] === 'string' &&
      typeof it['title'] === 'string' &&
      typeof it['department'] === 'string' &&
      typeof it['city'] === 'string' &&
      typeof it['year'] === 'number' &&
      typeof it['mileageKm'] === 'number'
    ) {
      out.push({
        id: it['id'],
        title: it['title'],
        price,
        department: it['department'],
        city: it['city'],
        year: it['year'],
        mileageKm: it['mileageKm'],
      });
    }
  }
  return out;
}

function parseOwn(it: unknown): OwnListing | null {
  if (!isObj(it)) return null;
  const price = parseMoney(it['price']);
  if (
    !price ||
    typeof it['id'] !== 'string' ||
    typeof it['title'] !== 'string' ||
    typeof it['status'] !== 'string' ||
    !STATUSES.includes(it['status']) ||
    typeof it['department'] !== 'string' ||
    typeof it['city'] !== 'string'
  ) {
    return null;
  }
  return {
    id: it['id'],
    title: it['title'],
    status: it['status'] as ListingStatus,
    price,
    department: it['department'],
    city: it['city'],
  };
}

export function parseOwnListings(payload: unknown): OwnListing[] {
  const items = isObj(payload) && Array.isArray(payload['items']) ? payload['items'] : [];
  return items.map(parseOwn).filter((l): l is OwnListing => l !== null);
}

export function parsePendingListings(payload: unknown): PendingListing[] {
  const items = isObj(payload) && Array.isArray(payload['items']) ? payload['items'] : [];
  const out: PendingListing[] = [];
  for (const it of items) {
    const base = parseOwn(it);
    if (!base || !isObj(it)) continue;
    const v = it['vehicle'];
    const vehicle =
      isObj(v) &&
      typeof v['year'] === 'number' &&
      typeof v['mileageKm'] === 'number' &&
      typeof v['transmission'] === 'string' &&
      typeof v['fuel'] === 'string' &&
      typeof v['plate'] === 'string'
        ? {
            year: v['year'],
            mileageKm: v['mileageKm'],
            transmission: v['transmission'],
            fuel: v['fuel'],
            plate: v['plate'],
          }
        : null;
    out.push({ ...base, vehicle });
  }
  return out;
}

export interface SearchParams {
  readonly brandId?: number;
  readonly maxPricePen?: number;
  readonly minYear?: number;
  readonly department?: string;
}

/** Arma la query de GET /listings. Los filtros vacíos o inválidos se omiten. */
export function buildListingsQuery(p: SearchParams, limit = 24): string {
  const q = new URLSearchParams({ limit: String(limit) });
  if (p.brandId && Number.isInteger(p.brandId) && p.brandId > 0)
    q.set('brandId', String(p.brandId));
  if (p.maxPricePen && Number.isFinite(p.maxPricePen) && p.maxPricePen > 0) {
    q.set('maxPriceMinor', String(Math.round(p.maxPricePen * 100)));
  }
  if (p.minYear && Number.isInteger(p.minYear) && p.minYear >= 1950)
    q.set('minYear', String(p.minYear));
  if (p.department && DEPARTMENTS.includes(p.department)) q.set('department', p.department);
  return q.toString();
}

export type Fetched<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly status: number };

/**
 * GET a la API reenviando la cookie de sesión. La espera es larga a propósito: en staging la API
 * escala a cero y su primera respuesta puede tardar. Devuelve el estado HTTP si falla.
 */
export async function apiGet(
  path: string,
  baseUrl: string | undefined = process.env['KUNTUR_API_URL'],
  timeoutMs = 30000,
): Promise<Fetched<unknown>> {
  if (!baseUrl) return { ok: false, status: 503 };
  try {
    const cookie = (await cookies()).toString();
    const res = await fetch(new URL(path, baseUrl), {
      headers: cookie ? { cookie } : {},
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, status: 502 };
  }
}
