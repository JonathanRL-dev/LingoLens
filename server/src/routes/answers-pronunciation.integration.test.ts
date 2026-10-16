import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { scorePronunciation } from '@shared';
import {
  createGuest,
  dbEnabled,
  getTestApp,
  prisma,
  resetDatabase,
  seedMinimal,
} from '../test/helpers';
import { loadSessionExercises } from '../services/exercise-session.service';

describe.skipIf(!dbEnabled)('answer and pronunciation endpoints - MySQL', () => {
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
  afterAll(() => prisma.$disconnect());

  async function makeSession(
    userId: string,
    status: 'started' | 'scanned' | 'completed' = 'scanned',
    vocabularyId = 1,
  ) {
    return prisma.missionSession.create({
      data: {
        id: randomUUID(),
        userId,
        missionId: 1,
        status,
        ...(status === 'scanned' ? { vocabularyId } : {}),
      },
    });
  }
  const answer = (token: string, sid: string, eid: string, value: string) =>
    request(getTestApp())
      .post(`/api/v1/sessions/${sid}/exercises/${eid}/answers`)
      .auth(token, { type: 'bearer' })
      .send({ answer: value });
  const pronunciation = (token: string, sid: string, body: object) =>
    request(getTestApp())
      .post(`/api/v1/sessions/${sid}/pronunciation-attempts`)
      .auth(token, { type: 'bearer' })
      .send(body);

  it('grades correct answers on first and second attempts, gates answer leakage, and exhausts after two misses', async () => {
    const guest = await createGuest();
    const active = await makeSession(guest.userId);
    const loaded = await loadSessionExercises(active);
    const key = loaded.keys[0]!;
    const eid = key.exerciseId;
    const first = await answer(guest.token, active.id, eid, `  ${key.answer.toUpperCase()}  `);
    expect(first.status).toBe(200);
    expect(first.body.data).toMatchObject({
      correct: true,
      attemptNo: 1,
      attemptsLeft: 1,
      pointsAwarded: 1,
    });
    expect(first.body.data).not.toHaveProperty('correctAnswer');

    const secondSession = await makeSession(guest.userId);
    const secondKey = (await loadSessionExercises(secondSession)).keys[0]!;
    const wrong = await answer(
      guest.token,
      secondSession.id,
      secondKey.exerciseId,
      'definitely wrong',
    );
    expect(wrong.body.data).toMatchObject({
      correct: false,
      attemptNo: 1,
      attemptsLeft: 1,
      pointsAwarded: 0,
    });
    expect(wrong.body.data.hint).toBe(secondKey.answer.trim().toLowerCase()[0]);
    expect(wrong.body.data).not.toHaveProperty('correctAnswer');
    const retry = await answer(
      guest.token,
      secondSession.id,
      secondKey.exerciseId,
      secondKey.answer,
    );
    expect(retry.body.data).toMatchObject({
      correct: true,
      attemptNo: 2,
      attemptsLeft: 0,
      pointsAwarded: 0.5,
    });

    const thirdSession = await makeSession(guest.userId);
    const thirdKey = (await loadSessionExercises(thirdSession)).keys[0]!;
    await answer(guest.token, thirdSession.id, thirdKey.exerciseId, 'wrong one');
    const last = await answer(guest.token, thirdSession.id, thirdKey.exerciseId, 'wrong two');
    expect(last.body.data).toMatchObject({
      correct: false,
      attemptNo: 2,
      attemptsLeft: 0,
      pointsAwarded: 0,
    });
    expect(last.body.data.correctAnswer).toBe(thirdKey.answer);
    expect(JSON.stringify(wrong.body)).not.toContain(thirdKey.answer);
    const exhausted = await answer(
      guest.token,
      thirdSession.id,
      thirdKey.exerciseId,
      thirdKey.answer,
    );
    expect(exhausted.status).toBe(409);
    expect(exhausted.body.error.code).toBe('ATTEMPTS_EXHAUSTED');
    expect((await prisma.user.findUniqueOrThrow({ where: { id: guest.userId } })).totalXp).toBe(20);
  });

  it('returns zero points for solved replays, hides foreign or foreign-session exercises, and handles click races once', async () => {
    const guest = await createGuest();
    const other = await createGuest('Other');
    const active = await makeSession(guest.userId);
    const key = (await loadSessionExercises(active)).keys[0]!;
    const solved = await answer(guest.token, active.id, key.exerciseId, key.answer);
    const rowsBefore = await prisma.exerciseAttempt.count({ where: { sessionId: active.id } });
    const replay = await answer(guest.token, active.id, key.exerciseId, key.answer);
    expect(replay.body.data).toMatchObject({ correct: true, pointsAwarded: 0 });
    expect(await prisma.exerciseAttempt.count({ where: { sessionId: active.id } })).toBe(
      rowsBefore,
    );
    expect(solved.body.data.correct).toBe(true);

    const foreign = await answer(other.token, active.id, key.exerciseId, key.answer);
    expect(foreign.status).toBe(404);
    expect(foreign.body.error.code).toBe('SESSION_NOT_FOUND');
    const anotherWord = await makeSession(guest.userId, 'scanned', 2);
    const otherExerciseId = (await loadSessionExercises(anotherWord)).keys[0]!.exerciseId;
    const invalidExercise = await answer(guest.token, active.id, otherExerciseId, key.answer);
    expect(invalidExercise.status).toBe(404);
    expect(invalidExercise.body.error.code).toBe('EXERCISE_NOT_FOUND');

    const racing = await makeSession(guest.userId);
    const racingKey = (await loadSessionExercises(racing)).keys[0]!;
    const results = await Promise.all([
      answer(guest.token, racing.id, racingKey.exerciseId, racingKey.answer),
      answer(guest.token, racing.id, racingKey.exerciseId, racingKey.answer),
    ]);
    expect(results.every((result) => result.status === 200 && result.body.data.correct)).toBe(true);
    expect(
      await prisma.exerciseAttempt.count({
        where: { sessionId: racing.id, sentenceId: Number(racingKey.exerciseId) },
      }),
    ).toBe(1);
  });

  it('requires a scanned session before answers', async () => {
    const guest = await createGuest();
    const active = await makeSession(guest.userId, 'started');
    const rejected = await answer(guest.token, active.id, '10', 'answer');
    expect(rejected.status).toBe(409);
    expect(rejected.body.error.code).toBe('SESSION_NOT_SCANNED');
    const completed = await makeSession(guest.userId, 'completed');
    const completedResponse = await answer(guest.token, completed.id, '10', 'answer');
    expect(completedResponse.status).toBe(409);
    expect(completedResponse.body.error.code).toBe('SESSION_COMPLETED');
  });

  it('uses shared pronunciation scores and returns all feedback codes while persisting each attempt', async () => {
    const guest = await createGuest();
    const active = await makeSession(guest.userId);
    const cases = [
      { heardText: 'This is a cup.', confidence: 1, feedback: 'good' },
      { heardText: 'This is cup', confidence: 1, feedback: 'almost' },
      { heardText: 'cup', confidence: 1, feedback: 'retry' },
      { heardText: 'This is a mug.', confidence: 1, feedback: 'target_missing' },
    ];
    for (const example of cases) {
      const expected = scorePronunciation({
        targetSentence: 'This is a cup.',
        targetWord: 'cup',
        heardText: example.heardText,
        recognitionConfidence: example.confidence,
      });
      const response = await pronunciation(guest.token, active.id, {
        heardText: example.heardText,
        recognitionConfidence: example.confidence,
      });
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        ...expected,
        feedback: example.feedback,
      });
    }
    expect(await prisma.pronunciationAttempt.count({ where: { sessionId: active.id } })).toBe(4);
    expect(
      await prisma.pronunciationAttempt.count({ where: { sessionId: active.id, sentenceId: 10 } }),
    ).toBe(4);
    expect(
      await prisma.user
        .findUniqueOrThrow({ where: { id: guest.userId } })
        .then((user) => user.totalXp),
    ).toBe(20);
  });

  it('uses alternates, validates choice sentence ownership, and requires a scanned session', async () => {
    const guest = await createGuest();
    await prisma.vocabularyItem.update({ where: { id: 1 }, data: { alternates: ['mug'] } });
    const active = await makeSession(guest.userId);
    const alternate = await pronunciation(guest.token, active.id, {
      heardText: 'This is a mug.',
      recognitionConfidence: 1,
    });
    expect(alternate.body.data.targetWordHeard).toBe(true);
    const cloze = await pronunciation(guest.token, active.id, {
      heardText: 'This is a cup.',
      sentenceId: '11',
    });
    expect(cloze.status).toBe(404);
    expect(cloze.body.error.code).toBe('NOT_FOUND');
    const unscanned = await makeSession(guest.userId, 'started');
    const gated = await pronunciation(guest.token, unscanned.id, { heardText: 'This is a cup.' });
    expect(gated.status).toBe(409);
    expect(gated.body.error.code).toBe('SESSION_NOT_SCANNED');
    const completed = await makeSession(guest.userId, 'completed');
    const finished = await pronunciation(guest.token, completed.id, {
      heardText: 'This is a cup.',
    });
    expect(finished.status).toBe(409);
    expect(finished.body.error.code).toBe('SESSION_COMPLETED');
  });
});
