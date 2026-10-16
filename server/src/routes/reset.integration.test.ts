import '../test/setup';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { env } from '../lib/env';
import {
  createGuest,
  dbEnabled,
  getTestApp,
  prisma,
  resetDatabase,
  seedMinimal,
} from '../test/helpers';

async function populate(userId: string) {
  const sessionId = randomUUID();
  await prisma.missionSession.create({
    data: { id: sessionId, userId, missionId: 1, vocabularyId: 1 },
  });
  await prisma.scanAttempt.create({
    data: { sessionId, model: 'coco-ssd', label: 'cup', confidence: 1, matched: true },
  });
  await prisma.exerciseAttempt.create({
    data: {
      sessionId,
      sentenceId: 10,
      kind: 'choice',
      attemptNo: 1,
      answer: 'cangkir',
      isCorrect: true,
      value: 1,
    },
  });
  await prisma.pronunciationAttempt.create({
    data: { sessionId, sentenceId: 10, transcript: 'cup', score: 100 },
  });
  await prisma.userVocabulary.create({ data: { userId, vocabularyId: 1 } });
  await prisma.xpEvent.create({ data: { userId, sessionId, source: 'scan', amount: 50 } });
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalXp: 70,
      streakCount: 3,
      lastActiveDate: new Date('2026-10-16T00:00:00Z'),
      avatarKey: 'owl',
    },
  });
  return sessionId;
}
async function snapshot(userId: string, sessionId: string) {
  return {
    user: await prisma.user.findUnique({ where: { id: userId } }),
    sessions: await prisma.missionSession.findMany({ where: { userId } }),
    xp: await prisma.xpEvent.findMany({ where: { userId }, orderBy: { id: 'asc' } }),
    collection: await prisma.userVocabulary.findMany({ where: { userId } }),
    scans: await prisma.scanAttempt.findMany({ where: { sessionId } }),
    exercises: await prisma.exerciseAttempt.findMany({ where: { sessionId } }),
    speech: await prisma.pronunciationAttempt.findMany({ where: { sessionId } }),
  };
}

describe.skipIf(!dbEnabled)('DELETE /dev/reset - MySQL', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedMinimal(prisma);
  });
  afterAll(() => prisma.$disconnect());
  it('always requires JWT, including development', async () => {
    expect((await request(getTestApp()).delete('/api/v1/dev/reset')).status).toBe(401);
  });
  it('production rejects missing/wrong demo key and permits a correct key only with JWT', async () => {
    const guest = await createGuest();
    const previous = env.NODE_ENV;
    env.NODE_ENV = 'production';
    try {
      for (const key of [undefined, 'wrong', 'x'.repeat(env.DEMO_RESET_KEY.length)]) {
        const call = request(getTestApp())
          .delete('/api/v1/dev/reset')
          .auth(guest.token, { type: 'bearer' });
        if (key) call.set('X-Demo-Key', key);
        expect((await call).status).toBe(404);
      }
      expect(
        (
          await request(getTestApp())
            .delete('/api/v1/dev/reset')
            .set('X-Demo-Key', env.DEMO_RESET_KEY)
        ).status,
      ).toBe(401);
      expect(
        (
          await request(getTestApp())
            .delete('/api/v1/dev/reset')
            .auth(guest.token, { type: 'bearer' })
            .set('X-Demo-Key', env.DEMO_RESET_KEY)
        ).status,
      ).toBe(204);
    } finally {
      env.NODE_ENV = previous;
    }
  });
  it('resets only the caller, preserves the other user and keeps exactly one 20 XP welcome after repeats', async () => {
    const caller = await createGuest('Caller');
    const other = await createGuest('Other');
    await populate(caller.userId);
    const otherSession = await populate(other.userId);
    const before = await snapshot(other.userId, otherSession);
    for (let repeat = 0; repeat < 2; repeat++) {
      const response = await request(getTestApp())
        .delete('/api/v1/dev/reset')
        .auth(caller.token, { type: 'bearer' })
        .send({ userId: other.userId });
      expect(response.status).toBe(204);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: caller.userId } });
      expect(user).toMatchObject({
        totalXp: 20,
        level: 1,
        streakCount: 0,
        lastActiveDate: null,
        avatarKey: 'owl',
      });
      expect(await prisma.xpEvent.findMany({ where: { userId: caller.userId } })).toMatchObject([
        { amount: 20, source: 'welcome', sessionId: null },
      ]);
      expect(await prisma.xpEvent.count({ where: { userId: caller.userId } })).toBe(1);
      expect(await prisma.missionSession.count({ where: { userId: caller.userId } })).toBe(0);
      expect(await prisma.userVocabulary.count({ where: { userId: caller.userId } })).toBe(0);
      expect(await snapshot(other.userId, otherSession)).toEqual(before);
      expect(await prisma.scanAttempt.count()).toBe(1);
      expect(await prisma.exerciseAttempt.count()).toBe(1);
      expect(await prisma.pronunciationAttempt.count()).toBe(1);
    }
  });
});
