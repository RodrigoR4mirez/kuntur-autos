import type { UserId } from '../../../shared/index.ts';

export type Role = 'buyer' | 'seller' | 'dealer' | 'advisor' | 'admin';

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly role: Role;
  readonly createdAt: Date;
}
