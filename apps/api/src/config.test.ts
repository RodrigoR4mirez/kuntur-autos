import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.ts';

const SECRET = 'a'.repeat(32);

describe('loadConfig', () => {
  it('uses safe defaults when nothing is set', () => {
    expect(loadConfig({})).toEqual({
      port: 3000,
      isProduction: false,
      databaseUrl: undefined,
      auth: { secret: undefined, baseUrl: undefined, trustedOrigins: [], google: null, smtp: null },
    });
  });

  it('reads production, database and auth settings', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      DATABASE_URL: 'postgres://x',
      AUTH_SECRET: SECRET,
      AUTH_BASE_URL: 'https://api.example.com',
      AUTH_TRUSTED_ORIGINS: 'https://a.com, https://b.com,',
      GOOGLE_CLIENT_ID: 'id',
      GOOGLE_CLIENT_SECRET: 'secret',
      SMTP_URL: 'smtps://u:p@smtp.example.com:465',
      MAIL_FROM: 'Kuntur <no-responder@example.com>',
    });
    expect(config).toMatchObject({ port: 8080, isProduction: true, databaseUrl: 'postgres://x' });
    expect(config.auth.trustedOrigins).toEqual(['https://a.com', 'https://b.com']);
    expect(config.auth.google).toEqual({ clientId: 'id', clientSecret: 'secret' });
    expect(config.auth.smtp?.from).toContain('no-responder');
  });

  it('treats empty strings as not set', () => {
    expect(loadConfig({ AUTH_SECRET: '  ', GOOGLE_CLIENT_ID: '' }).auth).toMatchObject({
      secret: undefined,
      google: null,
    });
  });

  it('rejects a short secret', () => {
    expect(() => loadConfig({ AUTH_SECRET: 'corto' })).toThrow(/AUTH_SECRET/);
  });

  it('rejects half-configured Google or SMTP', () => {
    expect(() => loadConfig({ GOOGLE_CLIENT_ID: 'id' })).toThrow(/GOOGLE_CLIENT/);
    expect(() => loadConfig({ GOOGLE_CLIENT_SECRET: 's' })).toThrow(/GOOGLE_CLIENT/);
    expect(() => loadConfig({ SMTP_URL: 'smtp://x' })).toThrow(/SMTP_URL/);
    expect(() => loadConfig({ MAIL_FROM: 'a@b.c' })).toThrow(/SMTP_URL/);
  });

  it('rejects an invalid port', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => loadConfig({ PORT: '70000' })).toThrow(/PORT/);
  });
});
