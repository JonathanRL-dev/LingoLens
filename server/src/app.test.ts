import './test/setup';
import { Writable } from 'node:stream';
import express from 'express';
import pinoHttp from 'pino-http';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { env } from './lib/env';
import { createLogger } from './lib/logger';
import { GLOBAL_LIMIT } from './config/limits';

describe('middleware app', () => {
  const app = createApp();
  it('preflight origin yang diizinkan 204 dengan header lengkap', async () => {
    const origin = env.CORS_ORIGIN[0]!;
    const res = await request(app).options('/api/v1/missions').set('Origin', origin)
      .set('Access-Control-Request-Method', 'GET').set('Access-Control-Request-Headers', 'authorization');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
    expect(res.headers['access-control-allow-headers']).toContain('X-Demo-Key');
    expect(res.headers['access-control-allow-methods']).toBe('GET,POST,PATCH,DELETE,OPTIONS');
  });
  it('origin lain tidak mendapat access-control-allow-origin', async () => {
    const res = await request(app).options('/api/v1/missions').set('Origin', 'https://not-allowed.invalid')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('404 memakai amplop dan header helmet', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers.ratelimit).toContain('limit=' + GLOBAL_LIMIT.max);
    expect(res.body).toEqual({ success: false, error: { code: 'NOT_FOUND', message: 'Rute tidak ditemukan', details: null } });
  });
  it.each([
    ['besar', JSON.stringify({ a: 'a'.repeat(11000) }), 'BODY_TOO_LARGE'],
    ['rusak', '{"a":', 'INVALID_JSON'],
  ])('JSON %s menjadi 400, tanpa stack', async (_name, body, reason) => {
    const res = await request(app).post('/api/v1/x').set('Content-Type', 'application/json').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ code: 'VALIDATION_ERROR', message: 'Body JSON tidak valid', details: { reason } });
  });
  it('logger senyap di test dan menyamarkan token saat logging diaktifkan', async () => {
    let output = '';
    const stream = new Writable({ write(chunk, _encoding, callback) { output += chunk.toString(); callback(); } });
    const logger = createLogger(stream);
    expect(logger.level).toBe('silent');
    logger.level = 'info';
    const loggingApp = express().use(pinoHttp({ logger }));
    loggingApp.get('/', (_req, res) => res.sendStatus(204));
    await request(loggingApp).get('/').set('Authorization', 'Bearer rahasia123').set('X-Demo-Key', 'demo-secret');
    expect(output).toContain('[Redacted]');
    expect(output).not.toContain('rahasia123');
    expect(output).not.toContain('demo-secret');
  });
});
