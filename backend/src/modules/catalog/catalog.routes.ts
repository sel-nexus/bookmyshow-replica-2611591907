import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import type { CatalogService } from './catalog.service';

const movieIdSchema = z.coerce.number().int().positive();

/** Adapt catalogue HTTP requests to service operations. */
export function createCatalogRouter(service: CatalogService, catalogTestMode = false): Router {
  const router = Router();

  router.get('/movies', (req: Request, res: Response, next: NextFunction): void => {
    try {
      const scenario = catalogTestMode ? req.query.scenario : undefined;
      if (scenario === 'empty') {
        res.status(200).json({ movies: [] });
        return;
      }
      if (scenario === 'delayed-empty') {
        setTimeout(() => { res.status(200).json({ movies: [] }); }, 1000);
        return;
      }
      res.status(200).json({ movies: service.listMovies() });
    } catch (error) {
      next(error);
    }
  });

  router.get('/theatres', (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.status(200).json({ theatres: service.listTheatres() });
    } catch (error) {
      next(error);
    }
  });

  router.get('/movies/:movieId/theatres', (req: Request, res: Response, next: NextFunction): void => {
    try {
      const theatres = service.listTheatresForMovie(movieIdSchema.parse(req.params.movieId));
      if (theatres === null) {
        res.status(404).json({ error: 'Movie not found' });
        return;
      }
      const movie = service.listMovies().find((candidate) => candidate.id === Number(req.params.movieId));
      res.status(200).json({ movie, theatres });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
