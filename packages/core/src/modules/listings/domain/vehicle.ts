import { err, ok, type ListingId, type Result } from '../../../shared/index.ts';

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
  /** Placa normalizada: 6 caracteres en mayúsculas, sin guion. */
  readonly plate: string;
  // Declarado por el vendedor y verificado por el asesor al revisar. `null` = no informado.
  readonly previousOwners: number | null;
  readonly hasServiceHistory: boolean | null;
  readonly soatValid: boolean | null;
  readonly technicalReviewValid: boolean | null;
  readonly hasSpareKey: boolean | null;
  readonly hasLiens: boolean | null;
  readonly hasAccidents: boolean | null;
  readonly description: string | null;
}

export type VehicleError =
  | { readonly code: 'invalid_year' }
  | { readonly code: 'invalid_mileage' }
  | { readonly code: 'invalid_plate' }
  | { readonly code: 'invalid_owners' }
  | { readonly code: 'invalid_description' };

export const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_OWNERS = 20;

const FIRST_YEAR = 1950;

/** Invariantes del dominio. El formato de entrada lo valida `contracts`; esto protege el modelo. */
export function validateVehicle(
  details: VehicleDetails,
  currentYear: number,
): Result<VehicleDetails, VehicleError> {
  if (
    !Number.isInteger(details.year) ||
    details.year < FIRST_YEAR ||
    details.year > currentYear + 1
  ) {
    return err({ code: 'invalid_year' });
  }
  if (!Number.isInteger(details.mileageKm) || details.mileageKm < 0) {
    return err({ code: 'invalid_mileage' });
  }
  if (!/^[A-Z0-9]{6}$/.test(details.plate)) return err({ code: 'invalid_plate' });
  const owners = details.previousOwners;
  if (owners !== null && (!Number.isInteger(owners) || owners < 0 || owners > MAX_OWNERS)) {
    return err({ code: 'invalid_owners' });
  }
  if (details.description !== null && details.description.length > MAX_DESCRIPTION_LENGTH) {
    return err({ code: 'invalid_description' });
  }
  return ok(details);
}
