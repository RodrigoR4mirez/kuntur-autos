import type { UserId } from '../../../shared/index.ts';
import type { Role } from './user.ts';

/** Quién hace la petición, ya autenticado. Si no hay sesión, la persona es anónima (null). */
export interface Session {
  readonly userId: UserId;
  readonly role: Role;
}
