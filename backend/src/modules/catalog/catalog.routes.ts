import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import type { CatalogService } from './catalog.service';

const movieIdSchema = z.coerce.number().int().positive();

/** Adapt catalogue HTTP requests to service operations. */
export function createCatalogRouter(service: CatalogService): Router {
  const router = Router();

  router.get('/movies', (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.status(200).json(service.listMovies());
    } catch (error) {
      next(error);
    }
  });

  router.get('/theatres', (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.status(200).json(service.listTheatres());
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
      res.status(200).json(theatres);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
