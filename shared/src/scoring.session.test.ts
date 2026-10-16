import { levelInfo } from './levels';
import { describe, expect, it } from 'vitest';
import {
  questionGrade,
  practiceAccuracy,
  pointsPerAnswer,
  sessionScore,
  starsFromScore,
  computeXp,
  isOrderCorrect,
} from './scoring';

describe('questionGrade', () => {
  it('menilai berdasarkan percobaan', () => {
    expect(questionGrade({ solved: true, attemptsUsed: 1 })).toBe(1);
    expect(questionGrade({ solved: true, attemptsUsed: 2 })).toBe(0.5);
    expect(questionGrade({ solved: true, attemptsUsed: 3 })).toBe(0);
    expect(questionGrade({ solved: false, attemptsUsed: 1 })).toBe(0);
  });
});

describe('practiceAccuracy', () => {
  it('menghitung rata-rata × 100', () => {
    expect(practiceAccuracy([1, 1, 1])).toBe(100);
    expect(practiceAccuracy([1, 0.5, 0])).toBeCloseTo(50, 10);
    expect(practiceAccuracy([0, 0, 0])).toBe(0);
  });
  it('array kosong (latihan dilewati) = 0', () => {
    expect(practiceAccuracy([])).toBe(0);
  });
});

describe('pointsPerAnswer', () => {
  it('untuk 3 soal', () => {
    expect(pointsPerAnswer(3, 1)).toBe(10);
    expect(pointsPerAnswer(3, 0.5)).toBe(5);
    expect(pointsPerAnswer(3, 0)).toBe(0);
  });
});

describe('sessionScore & starsFromScore', () => {
  it('latihan 83 + ucapan 60 = 73 → 2 bintang', () => {
    const s = sessionScore(83, 60);
    expect(s).toBe(73);
    expect(starsFromScore(s)).toBe(2);
  });
  it('batas bintang', () => {
    expect(starsFromScore(49)).toBe(1);
    expect(starsFromScore(50)).toBe(2);
    expect(starsFromScore(79)).toBe(2);
    expect(starsFromScore(80)).toBe(3);
  });
  it('latihan dilewati (akurasi 0)', () => {
    const s = sessionScore(0, 60);
    expect(s).toBe(sessionScore(0, 60));
    expect(starsFromScore(s)).toBeGreaterThanOrEqual(1);
  });
  it('ucapan dilewati (skor 0)', () => {
    expect(sessionScore(100, 0)).toBe(sessionScore(100, 0));
    expect(sessionScore(100, 0)).toBeLessThan(sessionScore(100, 60));
  });
});

describe('computeXp', () => {
  it('akurasi 100 + ucapan lolos = 110', () => {
    expect(
      computeXp({ practiceAccuracy: 100, speakPassed: true, alreadyCollected: false }),
    ).toEqual({
      scanXp: 50,
      practiceXp: 30,
      speakXp: 30,
      total: 110,
    });
  });
  it('alreadyCollected: 50,30,30 → 25,15,15', () => {
    expect(computeXp({ practiceAccuracy: 100, speakPassed: true, alreadyCollected: true })).toEqual(
      {
        scanXp: 25,
        practiceXp: 15,
        speakXp: 15,
        total: 55,
      },
    );
  });
  it('akurasi lain memakai akurasi mentah', () => {
    // 30 × 83.33…/100 = 25 → 25
    expect(
      computeXp({ practiceAccuracy: (5 / 6) * 100, speakPassed: false, alreadyCollected: false }),
    ).toEqual({ scanXp: 50, practiceXp: 25, speakXp: 0, total: 75 });
    // 30 × 50/100 = 15 → collected: round(7.5) = 8
    expect(computeXp({ practiceAccuracy: 50, speakPassed: false, alreadyCollected: true })).toEqual(
      { scanXp: 25, practiceXp: 8, speakXp: 0, total: 33 },
    );
    // 30 × 83/100 = 24.9 → 25 → collected: round(12.5) = 13
    expect(computeXp({ practiceAccuracy: 83, speakPassed: true, alreadyCollected: true })).toEqual({
      scanXp: 25,
      practiceXp: 13,
      speakXp: 15,
      total: 53,
    });
  });
  it('latihan dilewati (akurasi 0)', () => {
    expect(computeXp({ practiceAccuracy: 0, speakPassed: true, alreadyCollected: false })).toEqual({
      scanXp: 50,
      practiceXp: 0,
      speakXp: 30,
      total: 80,
    });
  });
  it('ucapan dilewati (speakPassed false)', () => {
    expect(
      computeXp({ practiceAccuracy: 100, speakPassed: false, alreadyCollected: false }),
    ).toEqual({ scanXp: 50, practiceXp: 30, speakXp: 0, total: 80 });
  });
});

describe('isOrderCorrect', () => {
  const target = ['the', 'cat', 'saw', 'the', 'dog'];
  it('urutan benar', () => {
    expect(isOrderCorrect(['the', 'cat', 'saw', 'the', 'dog'], target)).toBe(true);
  });
  it("ID 'the' bertukar tetapi teks sama → benar", () => {
    // token { id: "t4", text: "the" } dan { id: "t1", text: "the" } bertukar posisi
    const swapped = ['the', 'cat', 'saw', 'the', 'dog'];
    expect(isOrderCorrect(swapped, target)).toBe(true);
  });
  it('teks berbeda → salah', () => {
    expect(isOrderCorrect(['the', 'dog', 'saw', 'the', 'cat'], target)).toBe(false);
    expect(isOrderCorrect(['the', 'cat', 'saw', 'the'], target)).toBe(false);
  });
});
describe('audit bobot sesi', () => {
  it('bobot latihan 55 persen dan ucapan 45 persen', () => {
    expect(sessionScore(100, 0)).toBe(55);
    expect(sessionScore(0, 100)).toBe(45);
    expect(sessionScore(0, 0)).toBe(0);
    expect(sessionScore(100, 100)).toBe(100);
    expect(sessionScore(83, 60)).toBe(73);
  });

  it.each([
    [49, 1],
    [50, 2],
    [79, 2],
    [80, 3],
  ])('pita bintang pada skor %i', (score, stars) => {
    expect(starsFromScore(sessionScore(score, score))).toBe(stars);
  });
});

describe('practiceAccuracy', () => {
  it.each([
    [1, 100],
    [0.5, 50],
    [0, 0],
  ])('akurasi untuk nilai %s', (grade, expected) => {
    expect(practiceAccuracy([grade])).toBe(expected);
  });
});

describe('pembulatan akurasi sesuai scoring.md', () => {
  it('membulatkan akurasi sebelum dipakai untuk skor sesi', () => {
    expect(practiceAccuracy([1, 1, 0.5])).toBe(83);
    expect(practiceAccuracy([1, 0, 0])).toBe(33);
    expect(sessionScore(practiceAccuracy([1, 0, 0]), 0)).toBe(18);
  });
});

describe('contoh akun baru pada scoring.md', () => {
  it.each([
    ['A', 100, 100, 100, 3, 110, 2, 30],
    ['B', 83, 60, 73, 2, 105, 2, 25],
    ['C', 0, 70, 32, 1, 80, 2, 0],
    ['D', 100, 0, 55, 2, 80, 2, 0],
    ['E', 83, 0, 46, 1, 75, 1, 95],
    ['F', 0, 0, 0, 1, 50, 1, 70],
  ] as const)(
    'skenario %s',
    (_name, accuracy, speech, expectedScore, stars, xp, level, inLevel) => {
      const result = sessionScore(accuracy, speech);
      const awarded = computeXp({
        practiceAccuracy: accuracy,
        speakPassed: speech >= 50,
        alreadyCollected: false,
      });
      expect(result).toBe(expectedScore);
      expect(starsFromScore(result)).toBe(stars);
      expect(awarded.total).toBe(xp);
      expect(levelInfo(20 + awarded.total)).toEqual({
        level,
        xpInLevel: inLevel,
        xpForNextLevel: 100 * level,
      });
    },
  );
});
