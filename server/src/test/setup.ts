import { validateTestDatabaseUrl } from './database';

// NILAI PALSU HANYA UNTUK UJI
const values = {
  DATABASE_URL: 'mysql://test:test@localhost:3307/lingolens_test',
  JWT_SECRET: 'TEST_ONLY_secret_012345678901234567890123456',
  CORS_ORIGIN: 'http://localhost:5173',
  PORT: '3000',
  DEMO_RESET_KEY: 'TEST_ONLY_reset_0123456789',
};
if (process.env.RUN_DB_TESTS === '1') {
  const developmentUrl = process.env.LINGOLENS_DEVELOPMENT_DATABASE_URL ?? process.env.DATABASE_URL;
  const testUrl = validateTestDatabaseUrl(process.env.DATABASE_URL_TEST, developmentUrl);
  process.env.LINGOLENS_DEVELOPMENT_DATABASE_URL = developmentUrl;
  process.env.DATABASE_URL = testUrl;
}
process.env.NODE_ENV = 'test';
for (const [key, value] of Object.entries(values)) process.env[key] ??= value;
