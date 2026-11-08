import type { ListingId, UserId } from './ids.ts';
import type { Money } from './money.ts';

/** Verticales soportadas. Hoy solo 'vehicle'; 'property' queda previsto. */
export type Vertical = 'vehicle' | 'property';

export type ListingStatus =
  'draft' | 'pending_review' | 'published' | 'reserved' | 'sold' | 'rejected' | 'archived';

/** Anuncio genérico. Los campos de cada vertical viven en su propia extensión. */
export interface Listing {
  readonly id: ListingId;
  readonly vertical: Vertical;
  readonly ownerId: UserId;
  readonly status: ListingStatus;
  readonly title: string;
  readonly price: Money;
  readonly department: string;
  readonly city: string;
  readonly createdAt: Date;
}
