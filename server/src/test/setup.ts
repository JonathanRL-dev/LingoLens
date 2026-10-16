// NILAI PALSU HANYA UNTUK UJI
const values = {
  DATABASE_URL: 'mysql://test:test@localhost:3306/lingolens_test',
  JWT_SECRET: 'TEST_ONLY_secret_012345678901234567890123456',
  CORS_ORIGIN: 'http://localhost:5173',
  PORT: '3000',
  NODE_ENV: 'test',
  DEMO_RESET_KEY: 'TEST_ONLY_reset_0123456789',
};
for (const [key, value] of Object.entries(values)) {
  process.env[key] ??= value;
}
