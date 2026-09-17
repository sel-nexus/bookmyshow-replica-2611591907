import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
/** Map validation and unexpected errors to bounded API responses. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => { if(error instanceof ZodError) return res.status(400).json({error:'Invalid request'}); res.status(500).json({error:'Internal server error'}); };