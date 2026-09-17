import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import type { BookingService } from './booking.service';

const bookingSchema = z.object({
  movieId: z.number().int().positive(),
  theatreId: z.number().int().positive(),
  seats: z.array(z.string().min(1).max(8)).min(1).max(3),
  paymentMethod: z.enum(['CARD', 'UPI']),
  totalPrice: z.number().int().nonnegative(),
}).strict();

/** Adapt authenticated booking requests to the booking service. */
export function createBookingRouter(service: BookingService): Router {
  const router = Router();

  router.post('/bookings', (req: Request & { auth?: { userId: number } }, res: Response, next: NextFunction): void => {
    try {
      res.status(201).json(service.create(req.auth!.userId, bookingSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  });

  router.get('/bookings/:confirmationId', (req: Request & { auth?: { userId: number } }, res: Response, next: NextFunction): void => {
    try {
      const confirmation = service.getConfirmation(req.auth!.userId, req.params.confirmationId);
      if (!confirmation) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      res.status(200).json(confirmation);
    } catch (error) {
      next(error);
    }
  });

  return router;
}