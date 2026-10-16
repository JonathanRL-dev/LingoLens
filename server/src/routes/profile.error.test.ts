import '../test/setup';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { expect, it, vi } from 'vitest';
import { env } from '../lib/env';
vi.mock('../services/profile.service', () => ({
  getProfile: vi.fn().mockRejectedValue(new Error('Prisma private_table secret_query')),
  createGuest: vi.fn(),
  updateProfile: vi.fn(),
  resetProfile: vi.fn(),
}));
import { createApp } from '../app';
it('profile DB failures return a generic 500 without internal details', async () => {
  const token = jwt.sign({}, env.JWT_SECRET, { subject: 'user-1', algorithm: 'HS256' });
  const result = await request(createApp()).get('/api/v1/me').auth(token, { type: 'bearer' });
  expect(result.status).toBe(500);
  expect(result.body.error.code).toBe('INTERNAL_ERROR');
  expect(result.text).not.toMatch(/Prisma|private_table|secret_query|stack/);
});
