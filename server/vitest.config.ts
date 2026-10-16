import { resolve } from 'node:path';
import type { UserConfig } from 'vitest/config';

export default {
  resolve: { alias: { '@shared': resolve(__dirname, '../shared/src/index.ts') } },
  test: {
    environment: 'node',
    fileParallelism: process.env.RUN_DB_TESTS !== '1',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
} satisfies UserConfig;
