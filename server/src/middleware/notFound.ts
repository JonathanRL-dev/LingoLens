import type { RequestHandler } from 'express';
import { AppError } from '../lib/errors';
export const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError('NOT_FOUND', 'Rute tidak ditemukan'));
};
