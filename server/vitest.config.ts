import { resolve } from 'node:path';
import type { UserConfig } from 'vitest/config';

export default {
  resolve: { alias: { '@shared': resolve(__dirname, '../shared/src/index.ts') } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
} satisfies UserConfig;
