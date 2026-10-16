import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../lib/env';
import { AppError } from '../lib/errors';

export const allowDemoReset: RequestHandler = (req, _res, next) => {
  if (env.NODE_ENV !== 'production') return next();
  const provided = Buffer.from(req.get('X-Demo-Key') ?? '');
  const expected = Buffer.from(env.DEMO_RESET_KEY);
  if (provided.length === expected.length && timingSafeEqual(provided, expected)) return next();
  next(new AppError('NOT_FOUND', 'Rute tidak ditemukan'));
};
