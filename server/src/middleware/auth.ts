import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';
import { AppError } from '../lib/errors';

export const requireAuth: RequestHandler = (req, _res, next) => {
  try {
    const token = /^Bearer (\S+)$/i.exec(req.get('Authorization') ?? '')?.[1];
    if (!token) throw new Error('Missing token');
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error('Invalid subject');
    }
    req.user = { id: payload.sub };
  } catch {
    return next(new AppError('UNAUTHORIZED', 'Autentikasi tidak sah'));
  }
  next();
};
