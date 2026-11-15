/** Acceso a la API de Kuntur desde el servidor de la web. La interfaz nunca asume que la API responde. */

export interface Brand {
  readonly id: number;
  readonly name: string;
}

/** Valida la forma de la respuesta de /catalog/brands; descarta lo que no cumpla. */
export function parseBrands(payload: unknown): Brand[] {
  if (typeof payload !== 'object' || payload === null || !('brands' in payload)) return [];
  const brands = (payload as { brands: unknown }).brands;
  if (!Array.isArray(brands)) return [];
  const result: Brand[] = [];
  for (const item of brands) {
    if (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Brand).id === 'number' &&
      typeof (item as Brand).name === 'string'
    ) {
      result.push({ id: (item as Brand).id, name: (item as Brand).name });
    }
  }
  return result;
}

export async function fetchBrands(
  baseUrl: string | undefined = process.env['KUNTUR_API_URL'],
  fetcher: typeof fetch = fetch,
): Promise<Brand[]> {
  if (!baseUrl) return [];
  try {
    const response = await fetcher(new URL('/catalog/brands', baseUrl), {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    } as RequestInit);
    if (!response.ok) return [];
    return parseBrands(await response.json());
  } catch {
    return [];
  }
}

/**
 * Opciones del catálogo (carrocerías, colores) para la ficha. Cambian muy poco: se guardan 5
 * minutos en el servidor de la web y no llevan la cookie del visitante.
 */
export async function fetchCatalogOptions(
  baseUrl: string | undefined = process.env['KUNTUR_API_URL'],
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  if (!baseUrl) return null;
  try {
    const response = await fetcher(new URL('/catalog/options', baseUrl), {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    } as RequestInit);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}
