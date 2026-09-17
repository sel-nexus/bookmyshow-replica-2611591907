import express from 'express';
import cors from 'cors';
import type Database from 'better-sqlite3';
import { loadConfig, type Config } from './config';
import { AuthService } from './modules/auth/auth.service';
import { createAuthRouter } from './modules/auth/auth.routes';
import { CatalogRepository } from './modules/catalog/catalog.repository';
import { createCatalogRouter } from './modules/catalog/catalog.routes';
import { CatalogService } from './modules/catalog/catalog.service';
import { errorHandler } from './middleware/error-handler';
import { correlationId } from './middleware/correlation-id';
import { requestLogger } from './middleware/request-logger';
import { requireAuth } from './middleware/auth';
import { BookingRepository } from './modules/booking/booking.repository';
import { BookingService } from './modules/booking/booking.service';
import { createBookingRouter } from './modules/booking/booking.routes';
/** Compose the Express API and its dependency graph. */
export function createApp(db: Database.Database, config: Config = loadConfig()) {
  const app = express();
  app.use(correlationId);
  app.use(requestLogger);
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10kb' }));
  app.get('/api/health', (_req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.status(200).json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });
  app.use('/api/auth', createAuthRouter(new AuthService(db, config.jwtSecret, config.jwtExpiresIn)));
  app.use('/api', createCatalogRouter(new CatalogService(new CatalogRepository(db)), config.catalogTestMode));
  app.use('/api', requireAuth(config.jwtSecret), createBookingRouter(new BookingService(db, new BookingRepository(db))));
  app.use(errorHandler);
  return app;
}