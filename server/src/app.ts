import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { globalLimiter } from './middleware/rateLimit';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();
  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGIN, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Demo-Key'], optionsSuccessStatus: 204,
  }));
  app.use(express.json({ limit: '10kb' }));
  app.use(globalLimiter);
  app.use('/api/v1', apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
