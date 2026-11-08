import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '@kuntur/core';

export class UuidIdGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}
