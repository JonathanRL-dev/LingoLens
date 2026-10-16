import { env } from './lib/env';
import { createApp } from './app';
import { logger } from './lib/logger';

createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'LingoLens server listening');
});
