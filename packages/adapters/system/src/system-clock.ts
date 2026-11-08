import type { Clock } from '@kuntur/core';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
