import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import { coreViolation, importSpecifiers, violation } from './check-boundaries.mjs';

describe('importSpecifiers', () => {
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
});

describe('core rules', () => {
  const inDomain = 'modules/listings/domain/listing.ts';

  it('forbids any package import', () => {
    expect(coreViolation(inDomain, 'zod')).toMatch(/core solo puede/);
    expect(coreViolation(inDomain, 'node:fs')).toMatch(/core solo puede/);
  });

  it('allows imports inside the same module and from shared', () => {
    expect(coreViolation(inDomain, './vehicle.ts')).toBeNull();
    expect(coreViolation(inDomain, '../../../shared/index.ts')).toBeNull();
  });

  it('lets a module use another one only through its index.ts', () => {
    const from = 'modules/storefront/domain/listing-view.ts';
    expect(coreViolation(from, '../../listings/index.ts')).toBeNull();
    expect(coreViolation(from, '../../listings/domain/listing.ts')).toMatch(/solo por su index/);
  });

  it('keeps domain independent from application', () => {
    expect(coreViolation(inDomain, '../application/create-draft-listing.ts')).toMatch(
      /domain no puede/,
    );
    expect(
      coreViolation('modules/listings/application/create-draft-listing.ts', '../domain/listing.ts'),
    ).toBeNull();
  });

  it('keeps shared independent from modules', () => {
    expect(coreViolation('shared/money.ts', '../modules/listings/index.ts')).toMatch(
      /shared no puede/,
    );
  });
});

describe('other layers', () => {
  it('keeps contracts depending only on core', () => {
    expect(violation('contracts', '@kuntur/core')).toBeNull();
    expect(violation('contracts', '@kuntur/api')).toMatch(/contracts solo/);
    expect(violation('contracts', 'zod')).toBeNull();
  });

  it('lets only apps depend on adapters', () => {
    expect(violation('adapters', '@kuntur/adapter-system')).toMatch(/solo las apps/);
    expect(violation('adapters', '@kuntur/core/in-memory')).toMatch(/solo las apps/);
  });

  it('lets only the composition root wire adapters inside an app', () => {
    expect(
      violation('apps', '@kuntur/adapter-system', '/x/apps/api/src/composition-root.ts'),
    ).toBeNull();
    expect(violation('apps', '@kuntur/adapter-system', '/x/apps/api/src/app.ts')).toMatch(
      /composition-root/,
    );
    expect(violation('apps', '@kuntur/core/in-memory', '/x/apps/api/src/app.ts')).toMatch(
      /composition-root/,
    );
  });
});
