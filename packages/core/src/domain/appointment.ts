import type { AppointmentId, ListingId, UserId } from './ids.ts';

export type AppointmentStatus =
  | 'pending_deposit'
  | 'scheduled'
  | 'attended'
  | 'no_show'
  | 'cancelled_by_seller'
  | 'cancelled_by_advisor';

export interface Appointment {
  readonly id: AppointmentId;
  readonly listingId: ListingId;
  readonly buyerId: UserId;
  readonly advisorId: UserId | null;
  readonly scheduledAt: Date | null;
  readonly status: AppointmentStatus;
}
