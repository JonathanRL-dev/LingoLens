import { expect, test } from 'vitest';
import { validateTestDatabaseUrl } from './database';
const dev = 'mysql://fake:fake@localhost:3307/lingolens';
test('guard accepts only a separate *_test MySQL database', () => {
  const target = dev + '_test';
  expect(validateTestDatabaseUrl(target, dev)).toBe(target);
  for (const value of [
    undefined,
    dev,
    'mysql://fake:fake@localhost/production',
    'postgresql://fake:fake@localhost/lingolens_test',
  ]) {
    expect(() => validateTestDatabaseUrl(value, dev)).toThrow();
  }
  expect(() => validateTestDatabaseUrl(target, target)).toThrow();
});
