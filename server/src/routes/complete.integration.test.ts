import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createGuest,
  dbEnabled,
  getTestApp,
  prisma,
  resetDatabase,
  seedMinimal,
} from '../test/helpers';
import { loadSessionExercises } from '../services/exercise-session.service';

describe.skipIf(!dbEnabled)('complete session endpoint - MySQL', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedMinimal(prisma);
    await prisma.category.create({ data: { id: 2, slug: 'food', name: 'Makanan' } });
    for (const [id, word, meaningId] of [
      [3, 'chair', 'kursi'],
      [4, 'banana', 'pisang'],
      [5, 'apple', 'apel'],
    ] as const) {
      await prisma.vocabularyItem.create({
        data: { id, slug: word, word, meaningId, categoryId: 2 },
      });
    }
  });
  afterEach(() => vi.useRealTimers());
  afterAll(() => prisma.$disconnect());

  async function scanned(userId: string, missionId = 1, vocabularyId = 1) {
    return prisma.missionSession.create({
      data: { id: randomUUID(), userId, missionId, vocabularyId, status: 'scanned' },
    });
  }
  const finish = (token: string, sid: string, body: object = {}) =>
    request(getTestApp())
      .post(`/api/v1/sessions/${sid}/complete`)
      .auth(token, { type: 'bearer' })
      .send(body);

  async function settlePractice(userId: string, sid: string) {
    const session = await prisma.missionSession.findUniqueOrThrow({ where: { id: sid } });
    const { keys } = await loadSessionExercises(session);
    await prisma.exerciseAttempt.createMany({
      data: keys.map((key) => ({
        sessionId: sid,
        sentenceId: Number(key.exerciseId),
        kind: key.exerciseId === '10' ? ('choice' as const) : ('cloze' as const),
        attemptNo: 1,
        answer: key.answer,
        isCorrect: true,
        value: 1,
      })),
    });
    return keys;
  }

  it('completes the first mission end to end, awards 110 XP once, and replays identical JSON', async () => {
    const guest = await createGuest();
    const start = await request(getTestApp())
      .post('/api/v1/missions/1/sessions')
      .auth(guest.token, { type: 'bearer' });
    const sid = start.body.data.sessionId as string;
    const scan = await request(getTestApp())
      .post(`/api/v1/sessions/${sid}/scan-attempts`)
      .auth(guest.token, { type: 'bearer' })
      .send({ model: 'coco-ssd', label: 'cup', confidence: 0.95, latencyMs: 30 });
    expect(scan.status).toBe(200);
    const session = await prisma.missionSession.findUniqueOrThrow({ where: { id: sid } });
    const { keys } = await loadSessionExercises(session);
    for (const key of keys) {
      const answer = await request(getTestApp())
        .post(`/api/v1/sessions/${sid}/exercises/${key.exerciseId}/answers`)
        .auth(guest.token, { type: 'bearer' })
        .send({ answer: key.answer });
      expect(answer.status).toBe(200);
      expect(answer.body.data.correct).toBe(true);
    }
    const pronunciation = await request(getTestApp())
      .post(`/api/v1/sessions/${sid}/pronunciation-attempts`)
      .auth(guest.token, { type: 'bearer' })
      .send({ heardText: 'This is a cup.', recognitionConfidence: 1 });
    expect(pronunciation.body.data.score).toBe(100);

    const first = await finish(guest.token, sid);
    expect(first.status).toBe(200);
    expect(first.body.data).toMatchObject({
      practiceAccuracy: 100,
      speakScore: 100,
      sessionScore: 100,
      stars: 3,
      xpBreakdown: { scanXp: 50, practiceXp: 30, speakXp: 30 },
      totalXpAwarded: 110,
      levelUp: true,
      newLevel: 2,
      xpInLevel: 30,
      xpForNextLevel: 200,
      collectedWord: { id: '1', word: 'cup' },
      alreadyCollected: false,
      nextMission: { id: '2', status: 'open' },
    });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: guest.userId } })).totalXp).toBe(
      130,
    );
    const stored = await prisma.missionSession.findUniqueOrThrow({ where: { id: sid } });
    expect(stored.resultJson).toEqual(first.body);
    const replay = await finish(guest.token, sid);
    expect(replay.body).toEqual(first.body);
    expect(await prisma.xpEvent.count({ where: { sessionId: sid } })).toBe(3);
    expect(
      await prisma.userVocabulary.count({ where: { userId: guest.userId, vocabularyId: 1 } }),
    ).toBe(1);
  });

  it('handles simultaneous complete calls with one set of three session XP events', async () => {
    const guest = await createGuest();
    const session = await scanned(guest.userId);
    const results = await Promise.all([
      finish(guest.token, session.id, { skippedPractice: true, skippedSpeak: true }),
      finish(guest.token, session.id, { skippedPractice: true, skippedSpeak: true }),
    ]);
    expect(results.map(({ status }) => status)).toEqual([200, 200]);
    expect(results[0]?.body).toEqual(results[1]?.body);
    expect(await prisma.xpEvent.count({ where: { sessionId: session.id } })).toBe(3);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: guest.userId } });
    const sum = await prisma.xpEvent.aggregate({
      where: { userId: guest.userId },
      _sum: { amount: true },
    });
    expect(sum._sum.amount).toBe(user.totalXp);
  });

  it('halves each XP component for a collected word and does not report a false level-up', async () => {
    const guest = await createGuest();
    await prisma.user.update({ where: { id: guest.userId }, data: { totalXp: 20, level: 1 } });
    await prisma.userVocabulary.create({ data: { userId: guest.userId, vocabularyId: 1 } });
    const session = await scanned(guest.userId);
    await settlePractice(guest.userId, session.id);
    await prisma.pronunciationAttempt.create({
      data: { sessionId: session.id, sentenceId: 10, transcript: 'This is a cup.', score: 100 },
    });
    const result = await finish(guest.token, session.id);
    expect(result.body.data).toMatchObject({
      alreadyCollected: true,
      xpBreakdown: { scanXp: 25, practiceXp: 15, speakXp: 15 },
      totalXpAwarded: 55,
      levelUp: false,
      newLevel: 1,
      practiceAccuracy: 100,
      speakScore: 100,
    });
    const collected = await prisma.userVocabulary.findUniqueOrThrow({
      where: { userId_vocabularyId: { userId: guest.userId, vocabularyId: 1 } },
    });
    expect(collected.timesPracticed).toBe(2);
    expect(collected.bestScore).toBe(100);
  });

  it('supports each skip option and rejects unsettled practice without a skip', async () => {
    const incompleteOwner = await createGuest();
    const incomplete = await scanned(incompleteOwner.userId);
    const rejected = await finish(incompleteOwner.token, incomplete.id);
    expect(rejected.status).toBe(409);
    expect(rejected.body.error.code).toBe('PRACTICE_INCOMPLETE');

    const practiceOwner = await createGuest();
    const practiceSkipped = await scanned(practiceOwner.userId);
    const onlyPractice = await finish(practiceOwner.token, practiceSkipped.id, {
      skippedPractice: true,
    });
    expect(onlyPractice.body.data).toMatchObject({
      practiceAccuracy: 0,
      speakScore: 0,
      xpBreakdown: { scanXp: 50, practiceXp: 0, speakXp: 0 },
    });

    const speakOwner = await createGuest();
    const speakSkipped = await scanned(speakOwner.userId);
    await settlePractice(speakOwner.userId, speakSkipped.id);
    const onlySpeak = await finish(speakOwner.token, speakSkipped.id, { skippedSpeak: true });
    expect(onlySpeak.body.data).toMatchObject({
      practiceAccuracy: 100,
      speakScore: 0,
      xpBreakdown: { scanXp: 50, practiceXp: 30, speakXp: 0 },
    });

    const bothOwner = await createGuest();
    const both = await scanned(bothOwner.userId);
    const allSkipped = await finish(bothOwner.token, both.id, {
      skippedPractice: true,
      skippedSpeak: true,
    });
    expect(allSkipped.body.data).toMatchObject({
      practiceAccuracy: 0,
      speakScore: 0,
      sessionScore: 0,
      stars: 1,
    });
  });

  it('enforces ownership, scanned status, locked missions, and session-local exercises', async () => {
    const owner = await createGuest();
    const other = await createGuest('Other');
    const locked = await request(getTestApp())
      .post('/api/v1/missions/2/sessions')
      .auth(owner.token, { type: 'bearer' });
    expect(locked.status).toBe(409);
    expect(locked.body.error.code).toBe('MISSION_LOCKED');
    const started = await prisma.missionSession.create({
      data: { id: randomUUID(), userId: owner.userId, missionId: 1, status: 'started' },
    });
    const notScanned = await finish(owner.token, started.id);
    expect(notScanned.status).toBe(409);
    expect(notScanned.body.error.code).toBe('SESSION_NOT_SCANNED');
    const foreign = await finish(other.token, (await scanned(owner.userId)).id, {
      skippedPractice: true,
    });
    expect(foreign.status).toBe(404);
    expect(foreign.body.error.code).toBe('SESSION_NOT_FOUND');

    const active = await scanned(owner.userId);
    const otherSession = await scanned(owner.userId, 1, 2);
    const foreignExercise = (await loadSessionExercises(otherSession)).keys[0]!;
    const exerciseResponse = await request(getTestApp())
      .get(`/api/v1/sessions/${active.id}/exercises`)
      .auth(owner.token, { type: 'bearer' });
    const privateKeys = (await loadSessionExercises(active)).keys;
    expect(JSON.stringify(exerciseResponse.body)).not.toContain(JSON.stringify(privateKeys));
    expect(JSON.stringify(exerciseResponse.body)).not.toMatch(/correctAnswer|answerKey/);
    const collection = await request(getTestApp())
      .get('/api/v1/me/collection')
      .auth(owner.token, { type: 'bearer' });
    const lockedCup = collection.body.data.find(
      (entry: { vocabulary: { id: string } }) => entry.vocabulary.id === '1',
    );
    expect(lockedCup).toMatchObject({
      collected: false,
      vocabulary: { id: '1', imageUrl: '/images/1.svg' },
    });
    expect(JSON.stringify(lockedCup)).not.toMatch(/cup|cangkir|correctAnswer|blankWord|wordsJson/);
    const invalid = await request(getTestApp())
      .post(`/api/v1/sessions/${active.id}/exercises/${foreignExercise.exerciseId}/answers`)
      .auth(owner.token, { type: 'bearer' })
      .send({ answer: 'wrong' });
    expect(invalid.status).toBe(404);
    expect(invalid.body.error.code).toBe('EXERCISE_NOT_FOUND');
  });

  it('updates Jakarta streaks at the WIB boundary, on the same day, and after a gap', async () => {
    const guest = await createGuest();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-15T16:59:00.000Z')); // 23:59 WIB
    await prisma.user.update({
      where: { id: guest.userId },
      data: { streakCount: 4, lastActiveDate: new Date('2026-10-15T00:00:00.000Z') },
    });
    const beforeMidnight = await scanned(guest.userId);
    await finish(guest.token, beforeMidnight.id, { skippedPractice: true, skippedSpeak: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: guest.userId } })).streakCount).toBe(
      4,
    );
    const sameDay = await scanned(guest.userId);
    await finish(guest.token, sameDay.id, { skippedPractice: true, skippedSpeak: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: guest.userId } })).streakCount).toBe(
      4,
    );

    vi.setSystemTime(new Date('2026-10-15T17:00:00.000Z')); // 00:00 WIB, next Jakarta day
    const afterMidnight = await scanned(guest.userId);
    await finish(guest.token, afterMidnight.id, { skippedPractice: true, skippedSpeak: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: guest.userId } })).streakCount).toBe(
      5,
    );

    await prisma.user.update({
      where: { id: guest.userId },
      data: { streakCount: 8, lastActiveDate: new Date('2026-10-13T00:00:00.000Z') },
    });
    vi.setSystemTime(new Date('2026-10-15T17:01:00.000Z')); // 00:01 WIB on Oct 16, two-day gap
    const afterGap = await scanned(guest.userId);
    await finish(guest.token, afterGap.id, { skippedPractice: true, skippedSpeak: true });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: guest.userId } })).streakCount).toBe(
      1,
    );
  });
});
