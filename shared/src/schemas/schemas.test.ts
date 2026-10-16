import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  AnswerRequest,
  AnswerResult,
  CompleteRequest,
  ErrorCode,
  Exercise,
  GuestRequest,
  nicknameWithPolicy,
  PronunciationRequest,
  ScanRequest,
  schemas,
  Vocabulary,
} from './index';
import { endpoints } from '../../../scripts/api-contract';

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
      const file = new URL('../../../docs/examples/' + endpoint.name + '.json', import.meta.url);
      const value: unknown = JSON.parse(readFileSync(file, 'utf8'));
      const schema = schemas[(endpoint.name + 'Response') as keyof typeof schemas];
      expect(schema).toBeDefined();
      expect(schema?.parse(value)).toEqual(value);
      expect(value).toEqual({ success: true, data: endpoint.data });
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
    const value = JSON.parse(
      readFileSync(new URL('../../../docs/examples/Exercises.json', import.meta.url), 'utf8'),
    );
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
    const value = JSON.parse(
      readFileSync(new URL('../../../docs/examples/Vocabulary.json', import.meta.url), 'utf8'),
    );
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

  it('nickname kosong ditolak dan kebijakan kata kasar dapat dipasok', () => {
    for (const nickname of ['', '  ', '\t']) {
      expect(GuestRequest.safeParse({ nickname }).success).toBe(false);
    }
    const nickname = nicknameWithPolicy((value) => value !== 'kata-terlarang');
    expect(nickname.safeParse('kata-terlarang').success).toBe(false);
    expect(nickname.safeParse('Bintang').success).toBe(true);
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

  it('reset memakai status 204 tanpa body; file null adalah penanda saja', () => {
    expect(endpoints.find((endpoint) => endpoint.name === 'Reset')?.status).toBe(204);
    expect(
      readFileSync(new URL('../../../docs/examples/Reset.json', import.meta.url), 'utf8'),
    ).toBe('null\n');
  });
});
