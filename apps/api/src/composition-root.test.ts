import { describe, expect, it } from 'vitest';
import { createWiring } from './composition-root.ts';

describe('createWiring', () => {
  it('refuses to start in production without a database', async () => {
    await expect(createWiring({ databaseUrl: undefined, isProduction: true })).rejects.toThrow(
      /DATABASE_URL/,
    );
  });

  it('accepts the development tokens outside production', async () => {
    const wiring = await createWiring({ databaseUrl: undefined, isProduction: false });
    expect(await wiring.useCases.resolveSession('dev-seller')).toMatchObject({ role: 'seller' });
    expect(await wiring.useCases.resolveSession('otro')).toBeNull();
    await wiring.close();
  });

  it('never accepts the development tokens in production', async () => {
    // El pool de pg no se conecta hasta la primera consulta, así que esta URL no se usa.
    const wiring = await createWiring({
      databaseUrl: 'postgres://u:p@127.0.0.1:1/none',
      isProduction: true,
    });
    expect(await wiring.useCases.resolveSession('dev-seller')).toBeNull();
    expect(await wiring.useCases.resolveSession('dev-buyer')).toBeNull();
    await wiring.close();
  });
});
