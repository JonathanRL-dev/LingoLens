import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) return next(error);
  const type = (error as { type?: string } | null)?.type;
  if (type === 'entity.too.large' || type === 'entity.parse.failed') {
    res.status(422).json({ success: false, error: {
      code: 'VALIDATION_ERROR', message: 'Body JSON tidak valid',
      details: { reason: type === 'entity.too.large' ? 'BODY_TOO_LARGE' : 'INVALID_JSON' },
    } });
    return;
  }
  if (!(error instanceof AppError)) (req.log ?? logger).error({ err: error }, 'Unhandled server error');
  const appError = error instanceof AppError ? error : new AppError('INTERNAL_ERROR', 'Terjadi kesalahan internal');
  res.status(appError.status).json({
    success: false, error: { code: appError.code, message: appError.message, details: appError.details },
  });
};
