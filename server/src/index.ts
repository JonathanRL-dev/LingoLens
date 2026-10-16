import { env } from './lib/env';
import { createApp } from './app';

createApp().listen(env.PORT, () => {
  console.info('LingoLens server listening on port ' + env.PORT);
});
