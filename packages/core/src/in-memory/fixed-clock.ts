import type { Clock } from '../shared/index.ts';

export class FixedClock implements Clock {
  private current: Date;

  constructor(initial: Date) {
    this.current = initial;
  }

  now(): Date {
    return this.current;
  }

  set(next: Date): void {
    this.current = next;
  }
}
