import { expect, test } from 'vitest';
import { APP_NAME } from './constants';

test('APP_NAME is LingoLens', () => {
  expect(APP_NAME).toBe('LingoLens');
});
