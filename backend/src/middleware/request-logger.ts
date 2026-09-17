import type { RequestHandler } from 'express';

/** Log a safe structured summary when an HTTP response has finished. */
export const requestLogger: RequestHandler = (req, res, next): void => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : 'unmatched';
    const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    console.info(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      correlationId: res.getHeader('X-Correlation-Id'),
      route,
      method: req.method,
      status: res.statusCode,
      latencyMs: Math.round(latencyMs * 100) / 100,
    }));
  });

  next();
};
