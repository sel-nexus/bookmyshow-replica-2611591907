import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';

describe('runtime configuration', () => {
  it('retains safe development defaults when production is not selected', () => {
    expect(loadConfig({ NODE_ENV: 'development', SQLITE_PATH: undefined, JWT_SECRET: undefined, CORS_ORIGIN: undefined })).toMatchObject({
      sqlitePath: './data/bookmyshow.db',
      jwtSecret: 'test-secret',
      corsOrigin: 'http://localhost:5173',
    });
  });

  it('fails closed in production when required deployment settings are missing', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', SQLITE_PATH: undefined, JWT_SECRET: '', CORS_ORIGIN: undefined })).toThrow('Missing required production configuration: SQLITE_PATH, JWT_SECRET, CORS_ORIGIN');
  });

  it('accepts explicit production deployment settings', () => {
    expect(loadConfig({ NODE_ENV: 'production', SQLITE_PATH: '/var/lib/bookings.db', JWT_SECRET: 'production-secret', CORS_ORIGIN: 'https://bookings.example' })).toMatchObject({
      sqlitePath: '/var/lib/bookings.db',
      jwtSecret: 'production-secret',
      corsOrigin: 'https://bookings.example',
    });
  });
});
