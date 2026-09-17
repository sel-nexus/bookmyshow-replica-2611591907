import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const validCorrelationId = /^[A-Za-z0-9._-]{1,128}$/;

/** Echo a safe caller correlation ID or generate one for each response. */
export const correlationId: RequestHandler = (req, res, next): void => {
  const supplied = req.header('x-correlation-id');
  res.setHeader('X-Correlation-Id', supplied && validCorrelationId.test(supplied) ? supplied : randomUUID());
  next();
};
