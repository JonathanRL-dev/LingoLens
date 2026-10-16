import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { validateTestDatabaseUrl } from './database';

const url = validateTestDatabaseUrl(process.env.DATABASE_URL_TEST, process.env.DATABASE_URL);
const options = { cwd: resolve(__dirname, '../..'), stdio: 'inherit' as const };
const migrate = spawnSync(
  process.execPath,
  [resolve(__dirname, '../../../node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
  { ...options, env: { ...process.env, DATABASE_URL: url } },
);
if (migrate.status !== 0) {
  process.exitCode = migrate.status ?? 1;
} else {
  const tests = spawnSync(
    process.execPath,
    [resolve(__dirname, '../../../node_modules/vitest/vitest.mjs'), 'run'],
    { ...options, env: { ...process.env, RUN_DB_TESTS: '1' } },
  );
  process.exitCode = tests.status ?? 1;
}
