import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { BookingValidationError } from '../modules/booking/booking.service';

interface HttpParseError extends Error {
  status?: number;
  type?: string;
}

/** Map known input failures and unexpected errors to bounded API responses. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next): void => {
  const parseError = error as HttpParseError;

  if (parseError.type === 'entity.too.large' || parseError.status === 413) {
    res.status(413).json({ error: 'Request too large' });
    return;
  }

  if (error instanceof ZodError || parseError.type === 'entity.parse.failed' || error instanceof BookingValidationError) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};