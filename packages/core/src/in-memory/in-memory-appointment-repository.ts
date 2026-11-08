import type { AppointmentId, UserId } from '../shared/index.ts';
import type { Appointment, AppointmentRepository } from '../modules/appointments/index.ts';

export class InMemoryAppointmentRepository implements AppointmentRepository {
  private readonly appointments = new Map<AppointmentId, Appointment>();

  findById(id: AppointmentId): Promise<Appointment | null> {
    return Promise.resolve(this.appointments.get(id) ?? null);
  }

  listByBuyer(buyerId: UserId): Promise<readonly Appointment[]> {
    return Promise.resolve([...this.appointments.values()].filter((a) => a.buyerId === buyerId));
  }

  save(appointment: Appointment): Promise<void> {
    this.appointments.set(appointment.id, appointment);
    return Promise.resolve();
  }
}
