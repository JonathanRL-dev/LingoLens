import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  answerRequestSchema,
  completeSessionRequestSchema,
  createGuestRequestSchema,
  errorResponseSchema,
  ExerciseSchema,
  pronunciationRequestSchema,
  resetHeadersSchema,
  resetResponseSchema,
  scanRequestSchema,
  schemas,
  updateMeRequestSchema,
} from './index';

// Contoh ini memakai angka manual; tidak mengimpor scoring.ts atau generator.
const requestSchema = z
  .object({
    method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']),
    path: z.string(),
    headers: z.record(z.string(), z.string()),
    body: z.unknown().optional(),
  })
  .strict();
const scenarioSchema = z
  .object({
    request: requestSchema,
    responses: z.record(z.string().regex(/^\d{3}$/), z.unknown()),
  })
  .strict();
const fixtureSchema = scenarioSchema.extend({
  scenarios: z.record(z.string(), scenarioSchema).optional(),
  _note: z.string().optional(),
});
type Scenario = z.infer<typeof scenarioSchema>;
interface Operation {
  name: string;
  method: string;
  path: string;
  status: number;
  response: z.ZodType;
  body?: z.ZodType;
  errors?: string[];
}
const operations: Operation[] = [
  { name: 'health', method: 'GET', path: '/health', status: 200, response: schemas.HealthResponse },
  {
    name: 'guest',
    method: 'POST',
    path: '/auth/guest',
    status: 201,
    response: schemas.GuestResponse,
    body: createGuestRequestSchema,
    errors: ['VALIDATION_ERROR'],
  },
  {
    name: 'me',
    method: 'GET',
    path: '/me',
    status: 200,
    response: schemas.MeResponse,
    errors: ['UNAUTHORIZED'],
  },
  {
    name: 'updateMe',
    method: 'PATCH',
    path: '/me',
    status: 200,
    response: schemas.UpdateMeResponse,
    body: updateMeRequestSchema,
    errors: ['VALIDATION_ERROR'],
  },
  {
    name: 'collection',
    method: 'GET',
    path: '/me/collection',
    status: 200,
    response: schemas.CollectionResponse,
  },
  {
    name: 'missions',
    method: 'GET',
    path: '/missions',
    status: 200,
    response: schemas.MissionsResponse,
  },
  {
    name: 'missionDetail',
    method: 'GET',
    path: '/missions/{id}',
    status: 200,
    response: schemas.MissionDetailResponse,
    errors: ['NOT_FOUND'],
  },
  {
    name: 'startSession',
    method: 'POST',
    path: '/missions/{id}/sessions',
    status: 201,
    response: schemas.StartSessionResponse,
    errors: ['MISSION_LOCKED'],
  },
  {
    name: 'hint',
    method: 'POST',
    path: '/sessions/{sid}/hints',
    status: 200,
    response: schemas.HintResponse,
    errors: ['SESSION_COMPLETED'],
  },
  {
    name: 'scan',
    method: 'POST',
    path: '/sessions/{sid}/scan-attempts',
    status: 200,
    response: schemas.ScanResponse,
    body: scanRequestSchema,
    errors: ['SESSION_COMPLETED'],
  },
  {
    name: 'exercises',
    method: 'GET',
    path: '/sessions/{sid}/exercises',
    status: 200,
    response: schemas.ExercisesResponse,
    errors: ['SESSION_NOT_SCANNED'],
  },
  {
    name: 'answer',
    method: 'POST',
    path: '/sessions/{sid}/exercises/{eid}/answers',
    status: 200,
    response: schemas.AnswerResponse,
    body: answerRequestSchema,
    errors: ['EXERCISE_NOT_FOUND', 'ATTEMPTS_EXHAUSTED'],
  },
  {
    name: 'pronunciation',
    method: 'POST',
    path: '/sessions/{sid}/pronunciation-attempts',
    status: 200,
    response: schemas.PronunciationResponse,
    body: pronunciationRequestSchema,
    errors: ['SESSION_COMPLETED'],
  },
  {
    name: 'complete',
    method: 'POST',
    path: '/sessions/{sid}/complete',
    status: 200,
    response: schemas.CompleteResponse,
    body: completeSessionRequestSchema,
    errors: ['PRACTICE_INCOMPLETE', 'SESSION_NOT_SCANNED'],
  },
  {
    name: 'vocabulary',
    method: 'GET',
    path: '/vocabulary/{id}',
    status: 200,
    response: schemas.VocabularyResponse,
    errors: ['NOT_FOUND'],
  },
  {
    name: 'reset',
    method: 'DELETE',
    path: '/dev/reset',
    status: 204,
    response: resetResponseSchema,
    errors: ['UNAUTHORIZED'],
  },
];
const directory = new URL('../../../docs/examples/', import.meta.url);
function load(name: string) {
  return fixtureSchema.parse(JSON.parse(readFileSync(new URL(name + '.json', directory), 'utf8')));
}
function response(name: string, status = '200'): unknown {
  return load(name).responses[status];
}
function validateScenario(operation: Operation, scenario: Scenario) {
  expect(scenario.request.method).toBe(operation.method);
  expect(scenario.request.path).toMatch(
    new RegExp('^/api/v1' + operation.path.replace(/\{\w+\}/g, '[^/]+') + '$'),
  );
  if (operation.body)
    expect(operation.body.parse(scenario.request.body)).toEqual(scenario.request.body);
  else expect(scenario.request.body).toBeUndefined();
  if (operation.name === 'reset') {
    expect(resetHeadersSchema.parse(scenario.request.headers)).toEqual(scenario.request.headers);
  } else if (!['health', 'guest'].includes(operation.name)) {
    expect(scenario.request.headers.Authorization).toMatch(/^Bearer .+/);
  } else {
    expect(scenario.request.headers.Authorization).toBeUndefined();
  }
  expect(Object.keys(scenario.responses).length).toBeGreaterThan(0);
  const codes: string[] = [];
  for (const [status, payload] of Object.entries(scenario.responses)) {
    if (status === '204') {
      expect(operation.status).toBe(204);
      expect(payload).toBeNull();
      // null adalah sentinel fixture; body HTTP 204 tetap kosong.
      expect(operation.response.parse(undefined)).toBeUndefined();
    } else if (Number(status) < 300) {
      expect(Number(status)).toBe(operation.status);
      expect(operation.response.parse(payload)).toEqual(payload);
    } else {
      const error = errorResponseSchema.parse(payload);
      expect([401, 404, 409, 422, 429, 500]).toContain(Number(status));
      codes.push(error.error.code);
    }
  }
  return codes;
}

describe('contoh respons per operationId', () => {
  it('memiliki tepat 16 JSON, satu per operationId', () => {
    const files = readdirSync(directory)
      .filter((file) => file.endsWith('.json'))
      .sort();
    expect(files).toEqual(operations.map((operation) => operation.name + '.json').sort());
    expect(files).toHaveLength(16);
  });
  it.each(operations)(
    '$name: request, semua respons, dan skenario valid terhadap Zod',
    (operation) => {
      const fixture = load(operation.name);
      expect(fixture.responses).toHaveProperty(String(operation.status));
      const codes = validateScenario(operation, fixture);
      for (const scenario of Object.values(fixture.scenarios ?? {})) {
        codes.push(...validateScenario(operation, scenario));
      }
      expect([...new Set(codes)].sort()).toEqual([...(operation.errors ?? [])].sort());
    },
  );
});

describe('alur misi pertama akun baru', () => {
  it('memakai akun baru, lima misi, dan koleksi sebelum complete', () => {
    const guest = schemas.GuestResponse.parse(response('guest', '201')).data;
    expect(guest.user.totalXp).toBe(20);
    expect(guest.user.level).toBe(1);
    expect(guest.user.collectedCount).toBe(0);
    expect(schemas.MeResponse.parse(response('me')).data).toEqual(guest.user);
    const missions = schemas.MissionsResponse.parse(response('missions')).data;
    expect(missions.map((mission) => mission.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    expect(missions[0]?.status).toBe('available');
    expect(missions.slice(1).every((mission) => mission.status === 'locked')).toBe(true);
    expect(
      schemas.CollectionResponse.parse(response('collection')).data.every(
        (item) => !item.collected,
      ),
    ).toBe(true);
  });
  it('menyatukan label cup, sesi, kartu choice, dan kalimat ucapan', () => {
    const start = schemas.StartSessionResponse.parse(response('startSession', '201')).data;
    const mission = schemas.MissionDetailResponse.parse(response('missionDetail')).data;
    expect(start.acceptedLabels).toEqual(mission.acceptedLabels);
    const scan = schemas.ScanResponse.parse(response('scan')).data;
    const card = schemas.VocabularyResponse.parse(response('vocabulary')).data;
    const complete = schemas.CompleteResponse.parse(response('complete')).data;
    expect(scan.vocabulary).toEqual(card);
    expect(complete.collectedWord).toEqual(card);
    expect(card.word).toBe('cup');
    expect(card.phonetic).toBe('/kʌp/');
    const input = pronunciationRequestSchema.parse(load('pronunciation').request.body);
    expect(input.sentenceId).toBe('s-cup-choice');
    expect(input.heardText).toBe((card.exampleSentence as { text: string }).text);
    for (const name of ['hint', 'scan', 'exercises', 'answer', 'pronunciation', 'complete']) {
      expect(load(name).request.path).toContain('/sessions/' + start.sessionId + '/');
    }
  });
  it('scan 50 XP; perfect complete 110 XP; welcome 20 menjadi level 2 pada 130 XP', () => {
    const scan = schemas.ScanResponse.parse(response('scan')).data;
    expect(scan.xpAwarded).toBe(50);
    expect(scan.alreadyCollected).toBe(false);
    const result = schemas.CompleteResponse.parse(response('complete')).data;
    expect(result).toMatchObject({
      stars: 3,
      sessionScore: 100,
      practiceAccuracy: 100,
      speakScore: 100,
      xpBreakdown: { scanXp: 50, practiceXp: 30, speakXp: 30 },
      totalXpAwarded: 110,
      levelUp: true,
      newLevel: 2,
      xpInLevel: 30,
      xpForNextLevel: 200,
      alreadyCollected: false,
    });
    expect(20 + result.totalXpAwarded).toBe(130);
    expect(result.xpInLevel + 100).toBe(130);
    expect(result.nextMission?.id).toBe('m2');
    expect(result.nextMission?.status).toBe('available');
    expect(schemas.PronunciationResponse.parse(response('pronunciation')).data).toMatchObject({
      score: 100,
      passed: true,
    });
    const scenarios = load('answer').scenarios ?? {};
    const points = ['choice', 'cloze', 'order'].map((kind) => {
      const scenario = scenarios[kind + 'CorrectFirstAttempt'];
      expect(scenario).toBeDefined();
      const result = schemas.AnswerResponse.parse(scenario?.responses['200']).data;
      expect(result).toMatchObject({ correct: true, attemptNo: 1, pointsAwarded: 10 });
      return result.pointsAwarded;
    });
    expect(points.reduce((sum, value) => sum + value, 0)).toBe(30);
  });
});

describe('contoh exercise dan jawaban tanpa bocoran', () => {
  const exercises = schemas.ExercisesResponse.parse(response('exercises')).data.exercises;
  it('memuat tiga jenis dan tidak menyisipkan kunci di kartu atau latihan', () => {
    expect(exercises.map((exercise) => exercise.kind)).toEqual(['choice', 'cloze', 'order']);
    for (const name of ['exercises', 'vocabulary']) {
      const raw = readFileSync(new URL(name + '.json', directory), 'utf8');
      for (const key of ['correctAnswer', 'blankWord', 'correctOptionId', 'correctTokenIds'])
        expect(raw).not.toContain(key);
    }
    for (const exercise of exercises) expect(ExerciseSchema.parse(exercise)).toEqual(exercise);
  });
  it('cloze memiliki chips 3–4 item dan speakText blank; token order teracak', () => {
    const cloze = exercises.find((exercise) => exercise.kind === 'cloze');
    expect(cloze?.chips.length).toBeGreaterThanOrEqual(3);
    expect(cloze?.chips.length).toBeLessThanOrEqual(4);
    expect(cloze?.speakText).toBe('The blank has a handle.');
    expect(cloze?.speakText.toLowerCase()).not.toContain('cup');
    const order = exercises.find((exercise) => exercise.kind === 'order');
    expect(order?.tokens.map((token) => token.text)).not.toEqual([
      'I',
      'put',
      'the',
      'cup',
      'here',
    ]);
    expect(order?.tokens.map((token) => token.text).sort()).toEqual(
      ['I', 'put', 'the', 'cup', 'here'].sort(),
    );
    expect(new Set(order?.tokens.map((token) => token.id)).size).toBe(5);
  });
  it('petunjuk salah pertama dan kunci saat habis tersedia bagi ketiga jenis', () => {
    const answer = load('answer');
    const scenarios = answer.scenarios ?? {};
    const firstChoice = schemas.AnswerResponse.parse(answer.responses['200']).data;
    expect(firstChoice).toMatchObject({
      correct: false,
      attemptNo: 1,
      attemptsLeft: 1,
      pointsAwarded: 0,
      hint: 'Arti kata diawali huruf c.',
    });
    expect(firstChoice).not.toHaveProperty('correctAnswer');
    for (const [kind, hint] of [
      ['cloze', 'Kata diawali huruf c.'],
      ['order', 'Kata pertama adalah I.'],
    ]) {
      const first = schemas.AnswerResponse.parse(
        scenarios[kind + 'FirstWrong']?.responses['200'],
      ).data;
      expect(first).toMatchObject({ correct: false, attemptNo: 1, attemptsLeft: 1, hint });
      expect(first).not.toHaveProperty('correctAnswer');
    }
    for (const kind of ['choice', 'cloze', 'order']) {
      const last = schemas.AnswerResponse.parse(
        scenarios[kind + 'Exhausted']?.responses['200'],
      ).data;
      expect(last).toMatchObject({
        correct: false,
        attemptNo: 2,
        attemptsLeft: 0,
        pointsAwarded: 0,
      });
      expect(last).toHaveProperty('correctAnswer');
    }
  });
});
