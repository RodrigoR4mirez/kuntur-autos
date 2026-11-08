import type { ListingId } from '../../../shared/index.ts';
import type { Session } from '../../accounts/index.ts';
import type { AppointmentRepository } from '../../appointments/index.ts';
import type { AccessLevel } from '../domain/access-level.ts';

export interface DetermineAccessLevelDeps {
  readonly appointments: AppointmentRepository;
}

export type DetermineAccessLevel = (input: {
  readonly session: Session | null;
  readonly listingId: ListingId;
}) => Promise<AccessLevel>;

/**
 * Nivel de acceso de una persona a un anuncio concreto:
 *  - sin sesión: anonymous
 *  - con sesión: registered
 *  - con una cita de ese anuncio con depósito pagado (agendada o realizada): deposit_paid
 * El nivel `closed` (compra cerrada) llegará con el modelo de compra, en la Fase 2.
 */
export function determineAccessLevel(deps: DetermineAccessLevelDeps): DetermineAccessLevel {
  return async ({ session, listingId }) => {
    if (!session) return 'anonymous';

    const appointments = await deps.appointments.listByBuyer(session.userId);
    const depositPaid = appointments.some(
      (a) => a.listingId === listingId && (a.status === 'scheduled' || a.status === 'attended'),
    );
    return depositPaid ? 'deposit_paid' : 'registered';
  };
}
