import type { AppointmentId, UserId } from '../domain/ids.ts';
import type { Appointment } from '../domain/appointment.ts';

export interface AppointmentRepository {
  findById(id: AppointmentId): Promise<Appointment | null>;
  listByBuyer(buyerId: UserId): Promise<readonly Appointment[]>;
  save(appointment: Appointment): Promise<void>;
}
