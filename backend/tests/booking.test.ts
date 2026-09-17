import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, disposeTestApp } from './test-app';

const apps: ReturnType<typeof createTestApp>[] = [];
const validBooking = { movieId: 1, theatreId: 1, seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450 };

function makeApp(): ReturnType<typeof createTestApp> {
  const testApp = createTestApp();
  apps.push(testApp);
  return testApp;
}

async function tokenFor(app: ReturnType<typeof createTestApp>['app']): Promise<string> {
  return (await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' })).body.token;
}

function bookingCount(db: ReturnType<typeof createTestApp>['db']): number {
  return (db.prepare('SELECT COUNT(*) AS count FROM bookings').get() as { count: number }).count;
}

afterEach(() => {
  while (apps.length > 0) {
    const { db, filename } = apps.pop()!;
    disposeTestApp(db, filename);
  }
});

describe('booking API', () => {
  it('persists a fixed mapped booking and returns the saved projection', async () => {
    const { app, db } = makeApp();
    const response = await request(app).post('/api/bookings').set('Authorization', `Bearer ${await tokenFor(app)}`).send(validBooking);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ movie: { id: 1, title: 'Paradise' }, theatre: { id: 1, name: 'Sandhya 70mm' }, seats: ['A1', 'A2', 'A3'] });
    expect(response.body.confirmationId).toMatch(/^BMS-\d+$/);
    expect(bookingCount(db)).toBe(1);
  });

  it('reads the persisted confirmation after reauthentication and returns status 200', async () => {
    const { app, db } = makeApp();
    const created = await request(app).post('/api/bookings').set('Authorization', `Bearer ${await tokenFor(app)}`).send(validBooking);
    const reauthenticatedToken = await tokenFor(app);
    const retrieved = await request(app).get(`/api/bookings/${created.body.confirmationId}`).set('Authorization', `Bearer ${reauthenticatedToken}`);

    expect(created.status).toBe(201);
    expect(retrieved.status).toBe(200);
    expect(retrieved.body).toEqual(created.body);
    expect(bookingCount(db)).toBe(1);
  });

  it('requires authentication and returns not found for absent or unowned confirmations', async () => {
    const { app } = makeApp();
    const ownerToken = await tokenFor(app);
    const created = await request(app).post('/api/bookings').set('Authorization', `Bearer ${ownerToken}`).send(validBooking);
    const otherUserToken = (await request(app).post('/api/auth/verify').send({ mobileNumber: '9000000000', otp: '1234' })).body.token;

    const unauthenticated = await request(app).get(`/api/bookings/${created.body.confirmationId}`);
    const missing = await request(app).get('/api/bookings/BMS-9999').set('Authorization', `Bearer ${ownerToken}`);
    const unowned = await request(app).get(`/api/bookings/${created.body.confirmationId}`).set('Authorization', `Bearer ${otherUserToken}`);

    expect(unauthenticated.status).toBe(401);
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Booking not found' });
    expect(unowned.status).toBe(404);
  });

  it('rejects missing and type-invalid booking fields with bounded 4xx errors', async () => {
    const { app, db } = makeApp();
    const token = await tokenFor(app);
    const invalidPayloads = [
      {},
      { ...validBooking, movieId: '1' },
      { ...validBooking, theatreId: null },
      { ...validBooking, seats: 'A1,A2,A3' },
      { ...validBooking, paymentMethod: 123 },
      { ...validBooking, totalPrice: '450' },
    ];

    for (const payload of invalidPayloads) {
      const response = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(payload);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid request' });
    }
    expect(bookingCount(db)).toBe(0);
  });

  it('rejects malformed JSON, oversized JSON, missing auth, malformed tokens, and tampered tokens', async () => {
    const { app, db } = makeApp();
    const token = await tokenFor(app);
    const malformedJson = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).set('Content-Type', 'application/json').send('{');
    const oversized = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).set('Content-Type', 'application/json').send(JSON.stringify({ payload: 'x'.repeat(11 * 1024) }));
    const missingAuth = await request(app).post('/api/bookings').send(validBooking);
    const malformedToken = await request(app).post('/api/bookings').set('Authorization', 'Bearer not-a-jwt').send(validBooking);
    const tamperedToken = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token.slice(0, -1)}x`).send(validBooking);

    expect(malformedJson.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(missingAuth.status).toBe(401);
    expect(malformedToken.status).toBe(401);
    expect(tamperedToken.status).toBe(401);
    expect(bookingCount(db)).toBe(0);
  });

  it('rejects invalid mappings, totals, payment methods, fixed seats, and injection-like strings without writing rows', async () => {
    const { app, db } = makeApp();
    const token = await tokenFor(app);
    const invalidPayloads = [
      { ...validBooking, theatreId: 2 },
      { ...validBooking, totalPrice: 449 },
      { ...validBooking, paymentMethod: 'CASH' },
      { ...validBooking, seats: ['A1'] },
      { ...validBooking, movieId: '1; DROP TABLE bookings;--' },
      { ...validBooking, seats: ["A1'; DROP TABLE bookings;--"] },
    ];

    for (const payload of invalidPayloads) {
      const response = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(payload);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid request' });
      expect(bookingCount(db)).toBe(0);
    }
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'bookings'").get()).toBeDefined();
  });

  it('enforces SQLite unique, foreign-key, and restrict constraints', () => {
    const { db } = makeApp();

    db.prepare('INSERT INTO users (id, mobile_number) VALUES (?, ?)').run(99, '9000000099');
    expect(() => db.prepare('INSERT INTO users (id, mobile_number) VALUES (?, ?)').run(100, '9000000099')).toThrow(/UNIQUE constraint failed/);
    expect(() => db.prepare('INSERT INTO movie_theatres (movie_id, theatre_id) VALUES (?, ?)').run(999, 1)).toThrow(/FOREIGN KEY constraint failed/);
    expect(() => db.prepare('DELETE FROM movies WHERE id = ?').run(1)).toThrow(/FOREIGN KEY constraint failed/);
  });

  it('keeps SQLite checks active and leaves no row after a rejected unmapped booking', async () => {
    const { app, db } = makeApp();
    const token = await tokenFor(app);
    const unmapped = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ ...validBooking, theatreId: 2 });

    expect(unmapped.status).toBe(400);
    expect(bookingCount(db)).toBe(0);
    expect(() => db.prepare("INSERT INTO bookings (user_id, movie_id, theatre_id, seats, payment_method, total_price) VALUES (1, 1, 1, '[]', 'CASH', 450)").run()).toThrow();
    expect(bookingCount(db)).toBe(0);
  });
});