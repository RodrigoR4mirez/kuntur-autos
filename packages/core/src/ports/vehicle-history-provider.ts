export type SourceResult<T> =
  { readonly status: 'ok'; readonly data: T } | { readonly status: 'unavailable' };

export interface VehicleHistoryReport {
  readonly plate: string;
  readonly fetchedAt: Date;
  /** Nombre del proveedor, para auditoría. */
  readonly provider: string;
  readonly liens: SourceResult<readonly string[]>;
  readonly trafficFines: SourceResult<{ readonly count: number; readonly totalMinor: number }>;
  readonly soat: SourceResult<{ readonly active: boolean; readonly expiresOn: string | null }>;
  readonly technicalReview: SourceResult<{
    readonly valid: boolean;
    readonly expiresOn: string | null;
  }>;
}

export interface VehicleHistoryProvider {
  lookupByPlate(plate: string): Promise<VehicleHistoryReport>;
}
