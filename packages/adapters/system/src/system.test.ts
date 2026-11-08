import { describe, expect, it } from 'vitest';
import { SystemClock, UuidIdGenerator } from './index.ts';

describe('system adapters', () => {
  it('SystemClock returns the current time', () => {
    const before = Date.now();
    const now = new SystemClock().now().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });

  it('UuidIdGenerator returns distinct UUIDs', () => {
    const ids = new UuidIdGenerator();
    const a = ids.next();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(ids.next()).not.toBe(a);
  });
});
