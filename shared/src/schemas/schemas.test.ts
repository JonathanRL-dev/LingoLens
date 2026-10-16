import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  AnswerRequest,
  AnswerResult,
  CompleteRequest,
  ErrorCode,
  Exercise,
  PronunciationRequest,
  ScanRequest,
  schemas,
  Vocabulary,
} from './index';
import { endpoints } from '../../../scripts/api-contract';
import { z } from 'zod';
import { ErrorCodeSchema, errorResponseSchema, successSchema } from './common';
import {
  createGuestRequestSchema,
  updateMeRequestSchema,
  resetHeadersSchema,
  resetResponseSchema,
} from './auth';
import { ExerciseSchema, answerRequestSchema, exerciseStateSchema } from './exercises';
import { acceptedLabelSchema, missionSchema, nextMissionSchema } from './missions';
import { completeSessionRequestSchema, completeSessionDataSchema } from './sessions';
import { dataSchemas } from './index';

function exampleResponse(operationId: string, status = '200'): unknown {
  const fixture: { responses: Record<string, unknown> } = JSON.parse(
    readFileSync(
      new URL('../../../docs/examples/' + operationId + '.json', import.meta.url),
      'utf8',
    ),
  );
  return fixture.responses[status];
}
describe('kontrak Fase 1', () => {
  it('mencakup tepat 16 operasi unik dan 10 kode error', () => {
    expect(endpoints).toHaveLength(16);
    expect(new Set(endpoints.map((endpoint) => endpoint.method + endpoint.path)).size).toBe(16);
    expect(ErrorCode.options).toHaveLength(10);
    expect(new Set(ErrorCode.options).size).toBe(10);
  });

  it.each(endpoints.filter((endpoint) => endpoint.status !== 204))(
    '$method $path: contoh respons disk valid terhadap skema bersama',
    (endpoint) => {
      const operationId = endpoint.name[0]!.toLowerCase() + endpoint.name.slice(1);
      const value = exampleResponse(operationId, String(endpoint.status));
      const schema = schemas[(endpoint.name + 'Response') as keyof typeof schemas];
      expect(schema).toBeDefined();
      expect(schema?.parse(value)).toEqual(value);
    },
  );

  it.each(endpoints.filter((endpoint) => endpoint.request))(
    '$method $path: contoh request valid',
    (endpoint) => {
      expect(endpoint.request?.schema.parse(endpoint.request.example)).toEqual(
        endpoint.request?.example,
      );
    },
  );

  it('mencakup tiga jenis exercise tanpa kunci jawaban', () => {
    const value = schemas.ExercisesResponse.parse(exampleResponse('exercises'));
    const exercises: unknown[] = value.data.exercises;
    expect(exercises.map((exercise) => Exercise.parse(exercise).kind)).toEqual([
      'choice',
      'cloze',
      'order',
    ]);
    for (const exercise of exercises) {
      expect(
        Exercise.safeParse({ ...Exercise.parse(exercise), correctAnswer: 'bocor' }).success,
      ).toBe(false);
    }
    const serialized = JSON.stringify(value);
    expect(serialized).not.toContain('correctAnswer');
    expect(serialized).not.toContain('blankWord');
  });

  it('menolak kunci jawaban pada kartu dan misi', () => {
    const value = schemas.VocabularyResponse.parse(exampleResponse('vocabulary'));
    expect(Vocabulary.safeParse({ ...value.data, correctAnswer: 'bocor' }).success).toBe(false);
    const mission = endpoints.find((endpoint) => endpoint.name === 'MissionDetail')?.data;
    expect(
      schemas.MissionDetail.safeParse({ ...(mission as object), correctAnswer: 'bocor' }).success,
    ).toBe(false);
  });

  it('tidak membuka kartu penuh untuk koleksi terkunci', () => {
    const endpoint = endpoints.find((item) => item.name === 'Collection');
    const response = schemas.CollectionResponse;
    expect(
      response?.safeParse({
        success: true,
        data: [
          {
            vocabulary: { id: 'v-book', word: 'book' },
            collected: false,
            bestScore: 0,
          },
        ],
      }).success,
    ).toBe(false);
    expect(endpoint?.data).toBeDefined();
  });

  it('kunci hanya sah setelah jawaban gagal dan kesempatan habis', () => {
    const result = {
      correct: false,
      attemptNo: 2,
      attemptsLeft: 0,
      pointsAwarded: 0,
      correctAnswer: 'cup',
    };
    expect(AnswerResult.safeParse(result).success).toBe(true);
    expect(AnswerResult.safeParse({ ...result, attemptsLeft: 1 }).success).toBe(false);
    expect(AnswerResult.safeParse({ ...result, correct: true }).success).toBe(false);
    expect(AnswerRequest.safeParse({ answer: 'option-id' }).success).toBe(true);
    expect(AnswerRequest.safeParse({ answer: ['t2', 't1'] }).success).toBe(true);
    expect(AnswerRequest.safeParse({ answer: [] }).success).toBe(false);
  });

  it('validasi confidence, field opsional, dan larangan foto', () => {
    const input = { label: 'cup', confidence: 0.9, model: 'coco-ssd', latencyMs: 40 };
    expect(ScanRequest.safeParse(input).success).toBe(true);
    expect(ScanRequest.safeParse({ ...input, confidence: 1.1 }).success).toBe(false);
    expect(ScanRequest.safeParse({ ...input, latencyMs: -1 }).success).toBe(false);
    expect(ScanRequest.safeParse({ ...input, image: 'base64' }).success).toBe(false);
    expect(PronunciationRequest.parse({ heardText: 'cup' })).toEqual({ heardText: 'cup' });
    expect(CompleteRequest.parse({})).toEqual({});
    expect(CompleteRequest.safeParse({ skippedPractice: 'true' }).success).toBe(false);
  });

  it('reset memakai status 204 tanpa body; null di fixture adalah penanda saja', () => {
    expect(endpoints.find((endpoint) => endpoint.name === 'Reset')?.status).toBe(204);
    expect(exampleResponse('reset', '204')).toBeNull();
  });
});

describe('amplop dan kode error', () => {
  const codes = [
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'NOT_FOUND',
    'MISSION_LOCKED',
    'SESSION_COMPLETED',
    'RATE_LIMITED',
    'SESSION_NOT_SCANNED',
    'ATTEMPTS_EXHAUSTED',
    'EXERCISE_NOT_FOUND',
    'PRACTICE_INCOMPLETE',
  ];
  it('enum berisi tepat sepuluh kode yang ditetapkan', () => {
    expect(ErrorCodeSchema.options).toEqual(codes);
  });
  it.each(codes)('menerima amplop error %s', (code) => {
    const value = {
      success: false,
      error: { code, message: 'Belum dapat diproses', details: null },
    };
    expect(errorResponseSchema.parse(value)).toEqual(value);
    expect(
      errorResponseSchema.parse({
        ...value,
        error: { ...value.error, details: { field: 'nickname' } },
      }).error.details,
    ).toEqual({ field: 'nickname' });
  });
  it('menolak kode tak dikenal, details hilang, dan flag sukses yang salah', () => {
    const error = { code: 'VALIDATION_ERROR', message: 'Tidak sah', details: null };
    expect(
      errorResponseSchema.safeParse({ success: false, error: { ...error, code: 'UNKNOWN' } })
        .success,
    ).toBe(false);
    expect(errorResponseSchema.safeParse({ success: true, error }).success).toBe(false);
    expect(
      errorResponseSchema.safeParse({
        success: false,
        error: { code: error.code, message: error.message },
      }).success,
    ).toBe(false);
  });
  it('successSchema memvalidasi data dan literal success', () => {
    const schema = successSchema(z.object({ id: z.string() }).strict());
    expect(schema.parse({ success: true, data: { id: 'a' } })).toEqual({
      success: true,
      data: { id: 'a' },
    });
    expect(schema.safeParse({ success: false, data: { id: 'a' } }).success).toBe(false);
    expect(schema.safeParse({ success: true, data: { id: 1 } }).success).toBe(false);
    expect(schema.safeParse({ success: true }).success).toBe(false);
  });
});

describe('nickname dan autentikasi', () => {
  it.each(['a', 'a'.repeat(20)])('menerima panjang batas nickname setelah trim: %s', (nickname) => {
    expect(createGuestRequestSchema.parse({ nickname: '  ' + nickname + '  ' })).toEqual({
      nickname,
    });
    expect(updateMeRequestSchema.parse({ nickname: '  ' + nickname + '  ' })).toEqual({ nickname });
  });
  it.each(['', ' ', '\t\n', 'a'.repeat(21), 42, null])(
    'menolak nickname invalid %j',
    (nickname) => {
      expect(createGuestRequestSchema.safeParse({ nickname }).success).toBe(false);
      expect(updateMeRequestSchema.safeParse({ nickname }).success).toBe(false);
    },
  );
  it('tidak menerapkan kebijakan kata kasar di shared', () => {
    expect(createGuestRequestSchema.parse({ nickname: 'kata-terlarang' }).nickname).toBe(
      'kata-terlarang',
    );
  });
  it('PATCH mengizinkan field opsional tanpa meloloskan field rekaan', () => {
    expect(updateMeRequestSchema.parse({})).toEqual({});
    expect(updateMeRequestSchema.parse({ avatarKey: 'star' })).toEqual({ avatarKey: 'star' });
    expect(updateMeRequestSchema.safeParse({ totalXp: 999 }).success).toBe(false);
  });
  it('reset memerlukan header demo dan tidak menerima body JSON', () => {
    expect(resetHeadersSchema.parse({ 'X-Demo-Key': 'example-only' })).toEqual({
      'X-Demo-Key': 'example-only',
    });
    expect(resetHeadersSchema.safeParse({}).success).toBe(false);
    expect(resetHeadersSchema.safeParse({ 'X-Demo-Key': '' }).success).toBe(false);
    expect(resetResponseSchema.parse(undefined)).toBeUndefined();
    expect(resetResponseSchema.safeParse(null).success).toBe(false);
  });
});

describe('validasi data setiap endpoint', () => {
  it.each(endpoints.filter((endpoint) => endpoint.status !== 204))(
    '$name: data valid diterima dan bidang wajib yang hilang ditolak',
    (endpoint) => {
      const schema = dataSchemas[endpoint.name as keyof typeof dataSchemas];
      expect(schema.parse(endpoint.data)).toEqual(endpoint.data);
      const invalid = structuredClone(endpoint.data);
      const item = (Array.isArray(invalid) ? invalid[0] : invalid) as Record<string, unknown>;
      // Semua contoh berisi objek; field pertama pada setiap contoh bersifat wajib.
      const key = Object.keys(item)[0];
      expect(key).toBeDefined();
      if (key === undefined) throw new Error('Contoh tidak berisi field');
      delete item[key];
      expect(schema.safeParse(invalid).success).toBe(false);
    },
  );
});

describe('exercise strict dan jawaban', () => {
  const input = schemas.ExercisesResponse.parse(exampleResponse('exercises'));
  const examples = ExerciseSchema.array().parse(input.data.exercises);
  it.each(examples)('$kind valid; menolak kunci pada exercise dan state', (exercise) => {
    expect(ExerciseSchema.parse(exercise)).toEqual(exercise);
    expect(ExerciseSchema.safeParse({ ...exercise, correctAnswer: 'bocor' }).success).toBe(false);
    expect(
      ExerciseSchema.safeParse({
        ...exercise,
        state: { ...exercise.state, correctAnswer: 'bocor' },
      }).success,
    ).toBe(false);
    expect(ExerciseSchema.safeParse({ ...exercise, kind: 'unknown' }).success).toBe(false);
    expect(ExerciseSchema.safeParse({ ...exercise, index: -1 }).success).toBe(false);
  });
  it('memvalidasi jumlah opsi, parts, chips, dan tokens', () => {
    for (const exercise of examples) {
      if (exercise.kind === 'choice') {
        expect(
          ExerciseSchema.safeParse({ ...exercise, options: exercise.options.slice(1) }).success,
        ).toBe(false);
      } else if (exercise.kind === 'cloze') {
        expect(ExerciseSchema.safeParse({ ...exercise, parts: ['satu'] }).success).toBe(false);
        expect(
          ExerciseSchema.safeParse({ ...exercise, chips: exercise.chips.slice(0, 2) }).success,
        ).toBe(false);
        expect(
          ExerciseSchema.safeParse({ ...exercise, chips: Array(5).fill(exercise.chips[0]) })
            .success,
        ).toBe(false);
      } else {
        expect(ExerciseSchema.safeParse({ ...exercise, tokens: [] }).success).toBe(false);
      }
    }
  });
  it.each([-1, 0.5, 3])('menolak attemptsUsed %s', (attemptsUsed) => {
    expect(
      exerciseStateSchema.safeParse({ attemptsUsed, solved: false, exhausted: false }).success,
    ).toBe(false);
  });
  it.each(['option-id', ['t2', 't1']])('menerima bentuk answer %j', (answer) => {
    expect(answerRequestSchema.parse({ answer })).toEqual({ answer });
  });
  it.each(['', [], [''], [1], 1, null])('menolak bentuk answer %j', (answer) => {
    expect(answerRequestSchema.safeParse({ answer }).success).toBe(false);
  });
});

describe('misi dan hasil sesi', () => {
  it('minConfidence dan rencana latihan mengikuti OpenAPI', () => {
    const label = { model: 'coco-ssd', label: 'cup', minConfidence: 0, vocabularyId: 'cup' };
    expect(acceptedLabelSchema.parse(label)).toEqual(label);
    expect(acceptedLabelSchema.safeParse({ ...label, minConfidence: 1 }).success).toBe(true);
    expect(acceptedLabelSchema.safeParse({ ...label, minConfidence: 1.1 }).success).toBe(false);
    const missions = schemas.MissionsResponse.parse({
      success: true,
      data: endpoints.find((e) => e.name === 'Missions')?.data,
    }).data;
    expect(nextMissionSchema.parse(null)).toBeNull();
    expect(nextMissionSchema.parse(missions[0])).toEqual(missions[0]);
    expect(missionSchema.safeParse({ ...missions[0], exercisePlan: ['unknown'] }).success).toBe(
      false,
    );
  });
  it('complete memvalidasi flags, xpBreakdown, level, dan nextMission nullable', () => {
    expect(completeSessionRequestSchema.parse({})).toEqual({});
    expect(
      completeSessionRequestSchema.parse({ skippedPractice: true, skippedSpeak: false }),
    ).toEqual({ skippedPractice: true, skippedSpeak: false });
    expect(completeSessionRequestSchema.safeParse({ skippedSpeak: 1 }).success).toBe(false);
    const data = completeSessionDataSchema.parse(
      endpoints.find((e) => e.name === 'Complete')?.data,
    );
    expect(data.nextMission).toBeNull();
    expect(
      completeSessionDataSchema.safeParse({ ...data, xpBreakdown: { scanXp: 50, practiceXp: 30 } })
        .success,
    ).toBe(false);
    expect(completeSessionDataSchema.safeParse({ ...data, newLevel: 0 }).success).toBe(false);
    expect(completeSessionDataSchema.safeParse({ ...data, nextMission: {} }).success).toBe(false);
  });
});
