import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../lib/errors';

export function validate(schemas: Partial<Record<'body' | 'params' | 'query', z.ZodType>>): RequestHandler {
  return (req, res, next) => {
    for (const key of ['body', 'params', 'query'] as const) {
      const result = schemas[key]?.safeParse(req[key]);
      if (!result) continue;
      if (!result.success) return next(new AppError('VALIDATION_ERROR', 'Validasi gagal',
        result.error.issues.map((issue) => ({ path: [key, ...issue.path].join('.'), message: issue.message }))));
      if (key === 'query') res.locals.query = result.data;
      else if (key === 'params') req.params = result.data as typeof req.params;
      else req.body = result.data;
    }
    next();
  };
}
