import type { ListingId } from './ids.ts';

export type Transmission = 'manual' | 'automatic';
export type Fuel = 'gasoline' | 'diesel' | 'lpg' | 'gnv' | 'hybrid' | 'electric';

/** Extensión de Listing para la vertical 'vehicle'. Catálogo cerrado: ids numéricos. */
export interface VehicleDetails {
  readonly listingId: ListingId;
  readonly brandId: number;
  readonly modelId: number;
  readonly versionId: number | null;
  readonly bodyTypeId: number;
  readonly colorId: number;
  readonly year: number;
  readonly mileageKm: number;
  readonly transmission: Transmission;
  readonly fuel: Fuel;
  /** Placa normalizada: mayúsculas, sin guion. */
  readonly plate: string;
}
