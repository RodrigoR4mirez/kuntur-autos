import {
  err,
  ok,
  type ListingId,
  type Money,
  type Result,
  type UserId,
} from '../../../shared/index.ts';

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

export type ListingError =
  | { readonly code: 'invalid_title' }
  | { readonly code: 'invalid_price' }
  | {
      readonly code: 'invalid_transition';
      readonly from: ListingStatus;
      readonly to: ListingStatus;
    };

export interface NewListingProps {
  readonly id: ListingId;
  readonly vertical: Vertical;
  readonly ownerId: UserId;
  readonly title: string;
  readonly price: Money;
  readonly department: string;
  readonly city: string;
  readonly now: Date;
}

const TITLE_MIN = 5;
const TITLE_MAX = 100;

export function createDraft(props: NewListingProps): Result<Listing, ListingError> {
  const title = props.title.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) return err({ code: 'invalid_title' });
  if (props.price.amountMinor <= 0) return err({ code: 'invalid_price' });
  return ok({
    id: props.id,
    vertical: props.vertical,
    ownerId: props.ownerId,
    status: 'draft',
    title,
    price: props.price,
    department: props.department,
    city: props.city,
    createdAt: props.now,
  });
}

/** Transiciones permitidas del ciclo de vida. Todo lo demás es inválido. */
const TRANSITIONS: Readonly<Record<ListingStatus, readonly ListingStatus[]>> = {
  draft: ['pending_review', 'archived'],
  pending_review: ['published', 'rejected'],
  published: ['reserved', 'archived'],
  reserved: ['published', 'sold'],
  sold: [],
  rejected: ['draft', 'archived'],
  archived: [],
};

export function transition(listing: Listing, to: ListingStatus): Result<Listing, ListingError> {
  if (!TRANSITIONS[listing.status].includes(to)) {
    return err({ code: 'invalid_transition', from: listing.status, to });
  }
  return ok({ ...listing, status: to });
}

export const submitForReview = (listing: Listing) => transition(listing, 'pending_review');
