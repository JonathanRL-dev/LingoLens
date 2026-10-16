import { rateLimit } from 'express-rate-limit';
import { GLOBAL_LIMIT, STRICT_LIMIT } from '../config/limits';
import { AppError } from '../lib/errors';

export function createLimiter({ windowMs = GLOBAL_LIMIT.windowMs, max }: { windowMs?: number; max: number }) {
  return rateLimit({
    windowMs, max, standardHeaders: 'draft-7', legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    handler: (_req, _res, next) => next(new AppError('RATE_LIMITED', 'Terlalu banyak permintaan')),
  });
}
export const globalLimiter = createLimiter(GLOBAL_LIMIT);
// Fase 9: pasang pada scan-attempts, answers, pronunciation-attempts, dan complete.
export const strictLimiter = createLimiter(STRICT_LIMIT);
