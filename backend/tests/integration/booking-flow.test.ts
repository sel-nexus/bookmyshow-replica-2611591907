import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, disposeTestApp } from '../test-app';

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

describe('auth catalog booking flow', () => {
  it('chains user persistence, mapping read, and a committed SQLite booking', async () => {
    const { app, db } = makeApp();
    const session = (await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' })).body;
    const mapping = await request(app).get('/api/movies/1/theatres');
    const booking = await request(app).post('/api/bookings').set('Authorization', `Bearer ${session.token}`).send({
      movieId: mapping.body.movie.id,
      theatreId: mapping.body.theatres[0].id,
      seats: ['A1', 'A2', 'A3'],
      paymentMethod: 'UPI',
      totalPrice: 450,
    });

    expect(mapping.body.movie).toEqual({ id: 1, title: 'Paradise' });
    expect(booking.status).toBe(201);
    expect(db.prepare('SELECT payment_method, total_price FROM bookings').get()).toEqual({ payment_method: 'UPI', total_price: 450 });
    expect(db.prepare('SELECT mobile_number FROM users WHERE id = ?').get(session.user.id)).toEqual({ mobile_number: '9876543210' });
  });

  it('rejects an unmapped cross-feature choice and preserves all booking state', async () => {
    const { app, db } = makeApp();
    const session = (await request(app).post('/api/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' })).body;
    const rejected = await request(app).post('/api/bookings').set('Authorization', `Bearer ${session.token}`).send({
      movieId: 1, theatreId: 2, seats: ['A1', 'A2', 'A3'], paymentMethod: 'CARD', totalPrice: 450,
    });

    expect(rejected.status).toBe(400);
    expect(db.prepare('SELECT COUNT(*) AS count FROM bookings').get()).toEqual({ count: 0 });
  });
});