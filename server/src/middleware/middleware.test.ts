import '../test/setup';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { env } from '../lib/env';
import { AppError, statusByCode, type AppErrorCode } from '../lib/errors';
import { STRICT_LIMIT } from '../config/limits';
import { errorHandler } from './errorHandler';
import { requireAuth } from './auth';
import { validate } from './validate';
import { createLimiter, strictLimiter } from './rateLimit';

describe('rate limiter', () => {
  it('OPTIONS dilewati; permintaan ketiga ditolak dengan header draft-7', async () => {
    const app = express().use(createLimiter({ max: 2 }));
    app.all('/', (_req, res) => res.sendStatus(204));
    app.use(errorHandler);
    await request(app).options('/').expect(204);
    await request(app).options('/').expect(204);
    await request(app).get('/').expect(204);
    await request(app).get('/').expect(204);
    const res = await request(app).get('/');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(res.headers.ratelimit).toContain('limit=2');
    expect(res.headers['x-ratelimit-limit']).toBeUndefined();
  });
  it('strictLimiter menolak setelah batas ketat', async () => {
    const app = express().use(strictLimiter);
    app.get('/', (_req, res) => res.sendStatus(204));
    app.use(errorHandler);
    for (let i = 0; i < STRICT_LIMIT.max; i++) await request(app).get('/').expect(204);
    const res = await request(app).get('/');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('validasi Zod', () => {
  const app = express().use(express.json());
  app.post('/items/:id', validate({
    body: z.object({ name: z.string().trim().min(1) }),
    params: z.object({ id: z.coerce.number().int() }),
    query: z.object({ page: z.coerce.number().int() }),
  }), (req, res) => res.json({ body: req.body, params: req.params, query: res.locals.query, rawQuery: req.query }));
  app.use(errorHandler);
  it('menulis hasil parse body/params dan menyimpan query di locals', async () => {
    const res = await request(app).post('/items/42?page=2').send({ name: ' cup ' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ body: { name: 'cup' }, params: { id: 42 }, query: { page: 2 }, rawQuery: { page: '2' } });
  });
  it.each([
    ['/items/42?page=2', {}, 'body.name'],
    ['/items/abc?page=2', { name: 'cup' }, 'params.id'],
    ['/items/42?page=abc', { name: 'cup' }, 'query.page'],
  ])('input invalid pada %s menjadi 422', async (path, body, field) => {
    const res = await request(app).post(path).send(body);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toMatchObject({ path: field, message: expect.any(String) });
  });
});

describe('JWT HS256', () => {
  const app = express();
  app.get('/', requireAuth, (req, res) => res.json(req.user));
  app.use(errorHandler);
  const validToken = jwt.sign({ sub: 'user-1' }, env.JWT_SECRET, { algorithm: 'HS256' });
  it.each([
    undefined, 'Bearer invalid', 'Basic ' + validToken,
    'Bearer ' + jwt.sign({ sub: 'user-1' }, env.JWT_SECRET, { algorithm: 'HS384' }),
    'Bearer ' + jwt.sign({}, env.JWT_SECRET),
    'Bearer ' + jwt.sign({ sub: 'user-1' }, 'wrong-secret'),
    'Bearer ' + jwt.sign({ sub: 'user-1' }, env.JWT_SECRET, { expiresIn: -1 }),
  ])('menolak header invalid %j', async (header) => {
    const req = request(app).get('/');
    if (header) req.set('Authorization', header);
    const res = await req;
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: 'UNAUTHORIZED', message: 'Autentikasi tidak sah', details: null });
  });
  it('mengisi req.user dari sub yang valid tanpa DB', async () => {
    const res = await request(app).get('/').set('Authorization', 'Bearer ' + validToken);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'user-1' });
  });
});

describe('error handler', () => {
  it.each(Object.entries(statusByCode))('memetakan %s ke %i', async (code, status) => {
    const app = express();
    app.get('/', () => { throw new AppError(code as AppErrorCode, 'Pesan uji'); });
    app.use(errorHandler);
    const res = await request(app).get('/');
    expect(res.status).toBe(status);
    expect(res.body).toEqual({ success: false, error: { code, message: 'Pesan uji', details: null } });
  });
  it('galat async tak dikenal menjadi 500 tanpa pesan asli atau stack', async () => {
    const app = express();
    app.get('/', async () => { throw new Error('private-stack-value'); });
    app.use(errorHandler);
    const res = await request(app).get('/');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal', details: null } });
    expect(res.text).not.toContain('private-stack-value');
    expect(res.text).not.toContain('stack');
  });
});
