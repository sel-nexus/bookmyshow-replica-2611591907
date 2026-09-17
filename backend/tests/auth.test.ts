import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestApp, disposeTestApp } from './test-app';

const apps: ReturnType<typeof createTestApp>[] = [];

function makeApp(): ReturnType<typeof createTestApp> {
  const testApp = createTestApp();
  apps.push(testApp);
  return testApp;
}

afterEach(() => {
  while (apps.length > 0) {
    const { db, filename } = apps.pop()!;
    disposeTestApp(db, filename);
  }
});

describe('authentication API', () => {
  it('persists one SQLite user across repeated successful verification', async () => {
    const { app, db } = makeApp();
    const login = await request(app).post('/api/auth/login').send({ mobileNumber: '9876543210' });
    const first = await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    const second = await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });

    expect(login.status).toBe(200);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.user.id).toBe(first.body.user.id);
    expect(db.prepare('SELECT COUNT(*) AS count FROM users WHERE mobile_number = ?').get('9876543210')).toEqual({ count: 1 });
  });

  it('rejects invalid OTP and malformed authentication input without issuing a token', async () => {
    const { app, db } = makeApp();
    expect((await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '0000' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ mobileNumber: 'bad' })).status).toBe(400);
    expect((await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210' })).status).toBe(400);
    expect(db.prepare('SELECT COUNT(*) AS count FROM users').get()).toEqual({ count: 0 });
  });

  it('returns health status after a lightweight database probe', async () => {
    const { app } = makeApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('bounds health database failures to an unavailable response', async () => {
    const { app, db } = makeApp();
    db.close();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'unavailable' });
  });

  it('echoes a valid correlation ID and generates one when omitted', async () => {
    const { app } = makeApp();
    const echoed = await request(app).get('/api/health').set('X-Correlation-Id', 'request-42');
    const generated = await request(app).get('/api/health');

    expect(echoed.headers['x-correlation-id']).toBe('request-42');
    expect(generated.headers['x-correlation-id']).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('writes a safe structured finish log without request secrets', async () => {
    const { app } = makeApp();
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await request(app).get('/api/health').set('X-Correlation-Id', 'request-42').set('Authorization', 'Bearer secret-token');

    expect(logSpy).toHaveBeenCalledOnce();
    const logEntry = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(logEntry).toMatchObject({
      timestamp: expect.any(String), level: 'info', correlationId: 'request-42', route: '/api/health', method: 'GET', status: 200,
    });
    expect(new Date(logEntry.timestamp).toISOString()).toBe(logEntry.timestamp);
    expect(logEntry.latencyMs).toEqual(expect.any(Number));
    expect(logSpy.mock.calls[0][0]).not.toContain('secret-token');
    logSpy.mockRestore();
  });
});