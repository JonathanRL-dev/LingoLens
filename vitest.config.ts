import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@shared': resolve(__dirname, 'shared/src/index.ts') } },
  test: {
    include: ['{client,server,shared}/src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
