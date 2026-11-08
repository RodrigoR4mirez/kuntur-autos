import type { UserId } from '../domain/ids.ts';
import type { User } from '../domain/user.ts';

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
