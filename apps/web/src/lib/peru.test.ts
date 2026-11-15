import { describe, expect, it } from 'vitest';
import { DEPARTMENTS } from './peru.ts';

describe('departamentos', () => {
  it('son 25 sin repetir e incluyen Lima y Callao', () => {
    expect(DEPARTMENTS).toHaveLength(25);
    expect(new Set(DEPARTMENTS).size).toBe(25);
    expect(DEPARTMENTS).toContain('Lima');
    expect(DEPARTMENTS).toContain('Callao');
  });
});
