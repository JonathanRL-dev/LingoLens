import { describe, expect, it } from 'vitest';
import { containsProfanity } from '../lib/profanity';
import { createGuestRequestSchema, updateMeRequestSchema } from './profile';

describe.each([
  ['guest', createGuestRequestSchema],
  ['patch me', updateMeRequestSchema],
] as const)('%s nickname', (_name, schema) => {
  it('memangkas nickname valid tanpa mengubah input', () => {
    const input = Object.freeze({ nickname: '  Jonathan  ' });
    expect(schema.parse(input)).toEqual({ nickname: 'Jonathan' });
    expect(input.nickname).toBe('  Jonathan  ');
  });
  it.each(['', ' ', 'x'.repeat(21), 'ANJING', '4 n j 1 n g', 'b1tch', '$h1t'])(
    'menolak nickname %j',
    (nickname) => {
      expect(schema.safeParse({ nickname }).success).toBe(false);
    },
  );
  it('menolak field tak dikenal dan body tanpa nickname', () => {
    expect(schema.safeParse({ nickname: 'Guest', totalXp: 100 }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(_name === 'patch me');
  });
  it('menerima batas panjang 2 dan 20 setelah trim', () => {
    expect(schema.safeParse({ nickname: ' ab ' }).success).toBe(true);
    expect(schema.safeParse({ nickname: 'x'.repeat(20) }).success).toBe(true);
  });
});

describe('containsProfanity', () => {
  it.each(['b.a.b.i', 'F U C K', 'B4J1NG4N', 'a$$hole'])('menolak bentuk samar %j', (word) => {
    expect(containsProfanity(word)).toBe(true);
  });
  it.each(['Jonathan', 'Classic', 'Budi', 'Dewi'])('menerima %s', (word) => {
    expect(containsProfanity(word)).toBe(false);
  });
});
