import type { IdGenerator } from '../shared/index.ts';

/** Genera 'prefix-1', 'prefix-2', ... Predecible para las pruebas. */
export class SequentialIds implements IdGenerator {
  private count = 0;
  private readonly prefix: string;

  constructor(prefix = 'id') {
    this.prefix = prefix;
  }

  next(): string {
    this.count += 1;
    return `${this.prefix}-${this.count}`;
  }
}
