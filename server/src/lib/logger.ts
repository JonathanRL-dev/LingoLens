import pino, { type DestinationStream } from 'pino';
import { env } from './env';

export function createLogger(destination?: DestinationStream) {
  return pino({
    level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'development' ? 'debug' : 'info',
    redact: ['req.headers.authorization', 'req.headers["x-demo-key"]'],
  }, destination);
}
export const logger = createLogger();
