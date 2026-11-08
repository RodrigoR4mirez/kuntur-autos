import { beforeEach, describe, expect, it } from 'vitest';
import type { AppointmentId, ListingId, UserId } from '../../../shared/index.ts';
import type { Appointment, AppointmentStatus } from '../../appointments/index.ts';
import { InMemoryAppointmentRepository, OWNER, STRANGER } from '../../../in-memory/index.ts';
import { determineAccessLevel } from './determine-access-level.ts';

const listingId = 'listing-1' as ListingId;
const buyer = { userId: 'user-buyer' as UserId, role: 'buyer' as const };
let appointments: InMemoryAppointmentRepository;
let run: ReturnType<typeof determineAccessLevel>;

function appointment(over: Partial<Appointment> = {}): Appointment {
  return {
    id: 'appt-1' as AppointmentId,
    listingId,
    buyerId: buyer.userId,
    advisorId: null,
    scheduledAt: null,
    status: 'scheduled',
    ...over,
  };
}

beforeEach(() => {
  appointments = new InMemoryAppointmentRepository();
  run = determineAccessLevel({ appointments });
});

describe('determineAccessLevel', () => {
  it('treats a request without session as anonymous', async () => {
    expect(await run({ session: null, listingId })).toBe('anonymous');
  });

  it('gives a signed-in user with no appointment the registered level', async () => {
    expect(await run({ session: buyer, listingId })).toBe('registered');
  });

  it.each<AppointmentStatus>(['scheduled', 'attended'])(
    'gives deposit_paid when the appointment is %s',
    async (status) => {
      await appointments.save(appointment({ status }));
      expect(await run({ session: buyer, listingId })).toBe('deposit_paid');
    },
  );

  it.each<AppointmentStatus>([
    'pending_deposit',
    'no_show',
    'cancelled_by_seller',
    'cancelled_by_advisor',
  ])('does not give deposit_paid when the appointment is %s', async (status) => {
    await appointments.save(appointment({ status }));
    expect(await run({ session: buyer, listingId })).toBe('registered');
  });

  it('does not carry the deposit over to another listing', async () => {
    await appointments.save(appointment({ listingId: 'listing-2' as ListingId }));
    expect(await run({ session: buyer, listingId })).toBe('registered');
  });

  it('does not share the deposit with another user', async () => {
    await appointments.save(appointment());
    expect(await run({ session: { userId: STRANGER, role: 'buyer' }, listingId })).toBe(
      'registered',
    );
    expect(await run({ session: { userId: OWNER, role: 'seller' }, listingId })).toBe('registered');
  });
});
