import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts', 'scripts/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      // El negocio es lo que más importa probar: el núcleo, sin las implementaciones en memoria.
      include: ['packages/core/src/modules/**/*.ts', 'packages/core/src/shared/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts', '**/ports/**', '**/domain/catalog.ts'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
});
