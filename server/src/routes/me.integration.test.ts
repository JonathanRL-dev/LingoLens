import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createGuest,
  dbEnabled,
  getTestApp,
  prisma,
  resetDatabase,
  seedMinimal,
} from '../test/helpers';

describe.skipIf(!dbEnabled)('GET /me - MySQL', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedMinimal(prisma);
  });
  afterAll(() => prisma.$disconnect());
  it('rejects missing or broken tokens', async () => {
    expect((await request(getTestApp()).get('/api/v1/me')).status).toBe(401);
    expect(
      (await request(getTestApp()).get('/api/v1/me').auth('broken', { type: 'bearer' })).status,
    ).toBe(401);
  });
  it('computes levels from current XP and returns avatar and collected count', async () => {
    const guest = await createGuest();
    await prisma.userVocabulary.create({ data: { userId: guest.userId, vocabularyId: 1 } });
    for (const [totalXp, level, xpInLevel, xpForNextLevel] of [
      [99, 1, 99, 100],
      [100, 2, 0, 200],
      [130, 2, 30, 200],
      [299, 2, 199, 200],
      [300, 3, 0, 300],
    ]) {
      await prisma.user.update({
        where: { id: guest.userId },
        data: { totalXp, avatarKey: 'owl' },
      });
      const result = await request(getTestApp())
        .get('/api/v1/me')
        .auth(guest.token, { type: 'bearer' });
      expect(result.status).toBe(200);
      expect(result.body.data).toMatchObject({
        totalXp,
        level,
        xpInLevel,
        xpForNextLevel,
        avatarKey: 'owl',
        collectedCount: 1,
      });
      expect(result.body.data).not.toHaveProperty('passwordHash');
    }
  });
  it('rejects an otherwise valid token for a deleted user', async () => {
    const guest = await createGuest();
    await prisma.xpEvent.deleteMany({ where: { userId: guest.userId } });
    await prisma.user.delete({ where: { id: guest.userId } });
    expect(
      (await request(getTestApp()).get('/api/v1/me').auth(guest.token, { type: 'bearer' })).status,
    ).toBe(401);
  });
});
