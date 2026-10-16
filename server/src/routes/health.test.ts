import '../test/setup';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query, getPrisma } = vi.hoisted(() => ({ query: vi.fn(), getPrisma: vi.fn() }));
vi.mock('../lib/prisma', () => ({ getPrisma }));
import { createApp } from '../app';

describe('GET /api/v1/health', () => {
  const app = createApp();
  beforeEach(() => {
    query.mockReset();
    getPrisma.mockReset().mockReturnValue({ $queryRaw: query });
  });
  it('DB ok: 200 tanpa autentikasi dan menjalankan SELECT 1', async () => {
    query.mockResolvedValue([{ result: 1 }]);
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok', db: 'ok' } });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[0]).toEqual(['SELECT 1']);
  });
  it('DB gagal: 500 INTERNAL_ERROR, degraded, tanpa stack atau pesan DB', async () => {
    query.mockRejectedValue(new Error('private-database-password'));
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Database tidak tersedia',
        details: { status: 'degraded', db: 'error' },
      },
    });
    expect(res.text).not.toContain('private-database-password');
    expect(res.text).not.toContain('stack');
  });
  it('gagal membangun PrismaClient juga menghasilkan degraded tanpa detail internal', async () => {
    getPrisma.mockImplementation(() => {
      throw new Error('private-client-init');
    });
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(500);
    expect(res.body.error.details).toEqual({ status: 'degraded', db: 'error' });
    expect(query).not.toHaveBeenCalled();
    expect(res.text).not.toContain('private-client-init');
  });
});
