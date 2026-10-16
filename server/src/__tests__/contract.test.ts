import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { schemas } from '@shared';
import { dbEnabled, getTestApp, prisma, resetDatabase, seedMinimal } from '../test/helpers';
import { loadSessionExercises } from '../services/exercise-session.service';

describe.skipIf(!dbEnabled)('OpenAPI contract - Supertest', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedMinimal(prisma);
    await prisma.category.create({ data: { id: 2, slug: 'food', name: 'Makanan' } });
    for (const [id, word, meaningId] of [
      [3, 'chair', 'kursi'],
      [4, 'banana', 'pisang'],
      [5, 'apple', 'apel'],
    ] as const) {
      await prisma.vocabularyItem.create({ data: { id, slug: word, word, meaningId, categoryId: 2 } });
    }
  });
  afterAll(() => prisma.$disconnect());

  it('checks all 16 operations, invalid JWT, and SESSION_NOT_SCANNED against Zod', async () => {
    const app = getTestApp();
    const check = (response: request.Response, status: number, schema?: { parse(value: unknown): unknown }) => {
      expect(response.status).toBe(status);
      if (schema) schema.parse(response.body);
      return response;
    };
    check(await request(app).get('/api/v1/health'), 200, schemas.HealthResponse);
    check(await request(app).get('/api/v1/me').auth('invalid', { type: 'bearer' }), 401, schemas.ErrorResponse);
    const guest = check(await request(app).post('/api/v1/auth/guest').send({ nickname: 'Contract' }), 201, schemas.GuestResponse).body.data;
    const auth = (req: request.Test) => req.auth(guest.token, { type: 'bearer' });
    check(await auth(request(app).get('/api/v1/me')), 200, schemas.MeResponse);
    check(await auth(request(app).patch('/api/v1/me').send({ nickname: 'Contract', avatarKey: null })), 200, schemas.UpdateMeResponse);
    check(await auth(request(app).get('/api/v1/me/collection')), 200, schemas.CollectionResponse);
    check(await auth(request(app).get('/api/v1/missions')), 200, schemas.MissionsResponse);
    check(await auth(request(app).get('/api/v1/missions/1')), 200, schemas.MissionDetailResponse);
    const started = check(await auth(request(app).post('/api/v1/missions/1/sessions')), 201, schemas.StartSessionResponse);
    const sid = started.body.data.sessionId;
    const notScanned = check(await auth(request(app).get(`/api/v1/sessions/${sid}/exercises`)), 409, schemas.ErrorResponse);
    expect(notScanned.body.error.code).toBe('SESSION_NOT_SCANNED');
    check(await auth(request(app).post(`/api/v1/sessions/${sid}/hints`)), 200, schemas.HintResponse);
    check(await auth(request(app).post(`/api/v1/sessions/${sid}/scan-attempts`).send({ model: 'coco-ssd', label: 'cup', confidence: 0.95, latencyMs: 25 })), 200, schemas.ScanResponse);
    const exercises = check(await auth(request(app).get(`/api/v1/sessions/${sid}/exercises`)), 200, schemas.ExercisesResponse);
    const session = await prisma.missionSession.findUniqueOrThrow({ where: { id: sid } });
    const privateExercises = await loadSessionExercises(session);
    for (const exercise of exercises.body.data.exercises) {
      const key = privateExercises.keys.find((item) => item.exerciseId === exercise.id)!;
      const answer = exercise.kind === 'choice'
        ? exercise.options.find((item: { text: string }) => item.text === key.answer)?.id
        : exercise.kind === 'cloze'
          ? exercise.chips.find((item: { text: string }) => item.text === key.answer)?.id
          : undefined;
      if (!answer) throw new Error('Mini seed contract flow requires choice/cloze exercises');
      check(await auth(request(app).post(`/api/v1/sessions/${sid}/exercises/${exercise.id}/answers`).send({ answer })), 200, schemas.AnswerResponse);
    }
    check(await auth(request(app).post(`/api/v1/sessions/${sid}/pronunciation-attempts`).send({ heardText: 'This is a cup.', recognitionConfidence: 1 })), 200, schemas.PronunciationResponse);
    check(await auth(request(app).post(`/api/v1/sessions/${sid}/complete`).send({})), 200, schemas.CompleteResponse);
    check(await auth(request(app).get('/api/v1/vocabulary/1')), 200, schemas.VocabularyResponse);
    const reset = await auth(request(app).delete('/api/v1/dev/reset'));
    expect(reset.status).toBe(204);
    expect(reset.text).toBe('');
  });
});
