import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import { importSpecifiers, violation } from './check-boundaries.mjs';

describe('check-boundaries', () => {
  it('finds static, side-effect, export-from and dynamic imports', () => {
    const src = `
      import a from 'zod';
      import type { B } from "@kuntur/core";
      export * from './x.ts';
      import 'side-effect';
      const m = await import('lazy');
    `;
    expect(importSpecifiers(src)).toEqual(['zod', '@kuntur/core', './x.ts', 'side-effect', 'lazy']);
  });

  it('forbids any package import inside core', () => {
    expect(violation('core', 'zod')).toMatch(/core solo puede/);
    expect(violation('core', 'node:fs')).toMatch(/core solo puede/);
    expect(violation('core', './money.ts')).toBeNull();
  });

  it('keeps contracts depending only on core', () => {
    expect(violation('contracts', '@kuntur/core')).toBeNull();
    expect(violation('contracts', '@kuntur/api')).toMatch(/contracts solo/);
    expect(violation('contracts', 'zod')).toBeNull();
  });

  it('lets only apps depend on adapters', () => {
    expect(violation('adapters', '@kuntur/adapter-db-postgres')).toMatch(/solo las apps/);
    expect(violation('apps', '@kuntur/adapter-db-postgres')).toBeNull();
  });
});
