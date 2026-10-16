import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createGuest,
  dbEnabled,
  getTestApp,
  prisma,
  resetDatabase,
  seedMinimal,
} from '../test/helpers';
import { loadSessionExercises } from '../services/exercise-session.service';

describe.skipIf(!dbEnabled)('scan and exercise endpoints - MySQL', () => {
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
    await prisma.sentenceTranslation.create({
      data: {
        sentenceId: 11,
        languageCode: 'id-ID',
        text: 'Ini sebuah cangkir.',
        source: 'test-fixture',
        license: 'own',
      },
    });
  });
  afterAll(() => prisma.$disconnect());

  async function session(userId: string, status: 'started' | 'scanned' | 'completed' = 'started') {
    return prisma.missionSession.create({
      data: {
        id: randomUUID(),
        userId,
        missionId: 1,
        status,
        ...(status === 'scanned' ? { vocabularyId: 1 } : {}),
      },
    });
  }
  const scan = (
    token: string,
    sid: string,
    input: object = { model: 'coco-ssd', label: 'cup', confidence: 0.6, latencyMs: 45 },
  ) =>
    request(getTestApp())
      .post(`/api/v1/sessions/${sid}/scan-attempts`)
      .auth(token, { type: 'bearer' })
      .send(input);

  it('logs every detection, accepts the threshold, previews scan XP, and never awards XP here', async () => {
    const guest = await createGuest();
    const active = await session(guest.userId);
    const result = await scan(guest.token, active.id);
    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({
      matched: true,
      alreadyCollected: false,
      xpAwarded: 50,
    });
    expect(result.body.data.vocabulary).toMatchObject({ id: '1', word: 'cup', meaning: 'cangkir' });
    expect(
      (await prisma.missionSession.findUniqueOrThrow({ where: { id: active.id } })).status,
    ).toBe('scanned');
    expect(
      await prisma.missionSession
        .findUniqueOrThrow({ where: { id: active.id } })
        .then((row) => row.vocabularyId),
    ).toBe(1);
    expect(await prisma.scanAttempt.count({ where: { sessionId: active.id } })).toBe(1);
    expect(await prisma.xpEvent.count({ where: { userId: guest.userId } })).toBe(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: guest.userId } })).totalXp).toBe(20);
  });

  it('records bad label, wrong model, and below-threshold confidence without exposing target data', async () => {
    const guest = await createGuest();
    const active = await session(guest.userId);
    for (const input of [
      { model: 'coco-ssd', label: 'not-cup', confidence: 0.99, latencyMs: 10 },
      { model: 'other-model', label: 'cup', confidence: 0.99, latencyMs: 11 },
      { model: 'coco-ssd', label: 'cup', confidence: 0.59, latencyMs: 12 },
    ]) {
      const result = await scan(guest.token, active.id, input);
      expect(result.status).toBe(200);
      expect(result.body.data).toEqual({ matched: false, alreadyCollected: false, xpAwarded: 0 });
    }
    expect(
      await prisma.scanAttempt.count({ where: { sessionId: active.id, matched: false } }),
    ).toBe(3);
    expect(
      (await prisma.missionSession.findUniqueOrThrow({ where: { id: active.id } })).status,
    ).toBe('started');
  });

  it('halves preview XP for collected words and returns the same scanned word on later attempts', async () => {
    const guest = await createGuest();
    await prisma.userVocabulary.create({ data: { userId: guest.userId, vocabularyId: 1 } });
    const active = await session(guest.userId);
    const first = await scan(guest.token, active.id);
    expect(first.body.data).toMatchObject({ alreadyCollected: true, xpAwarded: 25 });
    const second = await scan(guest.token, active.id, {
      model: 'coco-ssd',
      label: 'not-a-label',
      confidence: 0.99,
      latencyMs: 5,
    });
    expect(second.body.data.matched).toBe(false);
    expect(second.body.data.vocabulary.id).toBe(first.body.data.vocabulary.id);
    expect(await prisma.scanAttempt.count({ where: { sessionId: active.id } })).toBe(2);
  });

  it('hides foreign sessions, rejects completed sessions, and preserves state across concurrent scans', async () => {
    const owner = await createGuest();
    const other = await createGuest('Other');
    const foreign = await session(owner.userId);
    const hidden = await scan(other.token, foreign.id);
    expect(hidden.status).toBe(404);
    expect(hidden.body.error.code).toBe('SESSION_NOT_FOUND');
    const complete = await session(owner.userId, 'completed');
    const rejected = await scan(owner.token, complete.id);
    expect(rejected.status).toBe(409);
    expect(rejected.body.error.code).toBe('SESSION_COMPLETED');
    const racing = await session(owner.userId);
    const responses = await Promise.all([
      scan(owner.token, racing.id),
      scan(owner.token, racing.id),
    ]);
    expect(
      responses.map((response) => ({
        status: response.status,
        vocabularyId: response.body.data.vocabulary?.id,
      })),
    ).toEqual([
      { status: 200, vocabularyId: '1' },
      { status: 200, vocabularyId: '1' },
    ]);
    expect(await prisma.scanAttempt.count({ where: { sessionId: racing.id } })).toBe(2);
    expect(
      await prisma.missionSession
        .findUniqueOrThrow({ where: { id: racing.id } })
        .then((row) => row.vocabularyId),
    ).toBe(1);
  });

  it('gates exercises, returns deterministic public DTO with persisted state but no keys', async () => {
    const guest = await createGuest();
    const unscanned = await session(guest.userId);
    const notReady = await request(getTestApp())
      .get(`/api/v1/sessions/${unscanned.id}/exercises`)
      .auth(guest.token, { type: 'bearer' });
    expect(notReady.status).toBe(409);
    expect(notReady.body.error.code).toBe('SESSION_NOT_SCANNED');
    const complete = await session(guest.userId, 'completed');
    const completed = await request(getTestApp())
      .get(`/api/v1/sessions/${complete.id}/exercises`)
      .auth(guest.token, { type: 'bearer' });
    expect(completed.status).toBe(409);
    expect(completed.body.error.code).toBe('SESSION_COMPLETED');

    const active = await session(guest.userId, 'scanned');
    const privateData = await loadSessionExercises(active);
    const read = () =>
      request(getTestApp())
        .get(`/api/v1/sessions/${active.id}/exercises`)
        .auth(guest.token, { type: 'bearer' });
    const first = await read();
    const again = await read();
    expect(first.status).toBe(200);
    expect(first.body.data.exercises).toEqual(again.body.data.exercises);
    expect(first.body.data.exercises).toHaveLength(2);
    const publicJson = JSON.stringify(first.body);
    expect(publicJson).not.toContain(JSON.stringify(privateData.keys));
    expect(publicJson).not.toMatch(/correctAnswer|"keys"|answerKey/);

    await prisma.exerciseAttempt.createMany({
      data: [
        {
          sessionId: active.id,
          sentenceId: 10,
          kind: 'choice',
          attemptNo: 1,
          answer: 'wrong',
          isCorrect: false,
          value: 0,
        },
        {
          sessionId: active.id,
          sentenceId: 11,
          kind: 'cloze',
          attemptNo: 1,
          answer: 'wrong',
          isCorrect: false,
          value: 0,
        },
        {
          sessionId: active.id,
          sentenceId: 11,
          kind: 'cloze',
          attemptNo: 2,
          answer: 'right',
          isCorrect: true,
          value: 0.5,
        },
      ],
    });
    const withState = (await read()).body.data.exercises;
    expect(withState[0].state).toEqual({ attemptsUsed: 1, solved: false, exhausted: false });
    expect(withState[1].state).toEqual({ attemptsUsed: 2, solved: true, exhausted: false });
  });

  it('returns a generic internal error for order plans unsupported by shared', async () => {
    const guest = await createGuest();
    await prisma.mission.update({ where: { id: 1 }, data: { exercisePlan: ['order'] } });
    const active = await session(guest.userId, 'scanned');
    const result = await request(getTestApp())
      .get(`/api/v1/sessions/${active.id}/exercises`)
      .auth(guest.token, { type: 'bearer' });
    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(result.body)).not.toMatch(/Unsupported exercise kind|order/);
  });
});
