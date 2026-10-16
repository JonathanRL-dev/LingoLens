import '../test/setup';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { env } from '../lib/env';
import { dbEnabled, getTestApp, prisma, resetDatabase, seedMinimal } from '../test/helpers';

describe.skipIf(!dbEnabled)('POST /auth/guest - MySQL', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedMinimal(prisma);
  });
  afterAll(() => prisma.$disconnect());
  it('creates 20 XP, level 1, one welcome event and a valid expiring JWT', async () => {
    const result = await request(getTestApp())
      .post('/api/v1/auth/guest')
      .send({ nickname: '  Budi  ' });
    expect(result.status).toBe(201);
    const { token, user } = result.body.data;
    expect(user).toMatchObject({
      nickname: 'Budi',
      totalXp: 20,
      level: 1,
      xpInLevel: 20,
      xpForNextLevel: 100,
      streak: 0,
      collectedCount: 0,
      avatarKey: null,
    });
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    expect(payload).toMatchObject({ sub: user.id });
    if (typeof payload === 'string') throw new Error('Expected JWT object');
    expect(payload.exp! - payload.iat!).toBeGreaterThan(0);
    expect(await prisma.xpEvent.findMany({ where: { userId: user.id } })).toMatchObject([
      { source: 'welcome', amount: 20, sessionId: null },
    ]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).totalXp).toBe(20);
  });
  it('uses the configured JWT lifetime', async () => {
    const previous = env.JWT_EXPIRES_IN;
    env.JWT_EXPIRES_IN = '1h';
    try {
      const response = await request(getTestApp())
        .post('/api/v1/auth/guest')
        .send({ nickname: 'Lifetime' });
      expect(response.status).toBe(201);
      const payload = jwt.verify(response.body.data.token, env.JWT_SECRET);
      if (typeof payload === 'string') throw new Error('Expected JWT object');
      expect(payload.exp! - payload.iat!).toBe(3600);
    } finally {
      env.JWT_EXPIRES_IN = previous;
    }
  });
  it.each(['', '  ', 'x'.repeat(21), '4 n j 1 n g', 'FUCK', '$h1t'])(
    'rejects %j without writes',
    async (nickname) => {
      expect(
        (await request(getTestApp()).post('/api/v1/auth/guest').send({ nickname })).status,
      ).toBe(422);
      expect(await prisma.user.count()).toBe(0);
      expect(await prisma.xpEvent.count()).toBe(0);
    },
  );
  it('keeps nickname minimum one character from the frozen contract', async () => {
    expect(
      (await request(getTestApp()).post('/api/v1/auth/guest').send({ nickname: 'A' })).status,
    ).toBe(201);
  });
});
