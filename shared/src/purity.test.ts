import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as scoring from './scoring';
import * as levels from './levels';

/*
Daftar uji wajib Fase 1 (nama describe / nama uji):
| Butir | Uji yang menutup |
| --- | --- |
| Kata sama | scorePronunciation / kata sama, keyakinan 1: skor 100, good, passed |
| Kata mirip | scorePronunciation / kata mirip: satu dari enam kata berbeda -> 83 |
| Kata salah | scorePronunciation / kata salah total: skor 0, retry, tidak lulus |
| Kata target hilang | scorePronunciation / kata target hilang: skor dibatasi 60 walau kalimat lain nyaris sempurna |
| Alternates | scorePronunciation / alternates menyelamatkan dari batas |
| Kontraksi | scorePronunciation / kontraksi: 'I am' vs 'I'm' dianggap sama |
| Keyakinan kosong | scorePronunciation / keyakinan undefined sama dengan 0,85 |
| Kalimat panjang satu kata salah | scorePronunciation / kalimat panjang dengan satu kata salah: 90, good, passed |
| Susun kata token ganda | isOrderCorrect / ID 'the' bertukar tetapi teks sama → benar |
| Akurasi 1/0,5/0 | questionGrade / menilai berdasarkan percobaan; practiceAccuracy / akurasi untuk nilai %s (1 → 100; 0.5 → 50; 0 → 0) |
| Bobot | audit bobot sesi / bobot latihan 55 persen dan ucapan 45 persen |
| Pita 49/50/79/80 | audit bobot sesi / pita bintang pada skor %i; audit pita ucapan / skor %i masuk pita %s |
| Level 99/100/130/299/300 | level / XP %i → level %i, xpInLevel %i, next %i |
| Streak lewat tengah malam WIB | streak tengah malam WIB / dua detik berurutan melintasi tengah malam meneruskan streak |
*/

const forbidden = [
  ['Math.random', /\bMath\s*(?:\.\s*random|\[\s*['"]random['"]\s*\])/],
  ['Date.now', /\bDate\s*(?:\.\s*now|\[\s*['"]now['"]\s*\])/],
  ['new Date() tanpa argumen', /\bnew\s+Date\s*\(\s*\)/],
  ['fetch', /\bfetch\b/],
  ['process.env', /\bprocess\s*(?:\.\s*env|\[\s*['"]env['"]\s*\])/],
] as const;

describe('audit sumber murni', () => {
  it.each(['constants.ts', 'scoring.ts', 'levels.ts'])(
    '%s tidak membaca jam sistem, acak, jaringan, atau environment',
    (file) => {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      for (const [name, pattern] of forbidden) {
        expect(source, name).not.toMatch(pattern);
      }
      // Date sebagai tipe (misalnya jakartaDateKey(date: Date)) tetap sah.
      expect(source).not.toMatch(
        /(?:\bfrom\s*|\bimport\s*\(|\brequire\s*\()\s*['"](?:node:)?(?:fs|https?|net|dns)(?:\/[^'"]*)?['"]/,
      );
    },
  );
});

describe('determinisme dan masukan tetap utuh', () => {
  it('semua fungsi scoring menghasilkan keluaran sama pada dua panggilan', () => {
    const alternates = ['crimson', 'red'];
    const input = {
      targetSentence: 'I like red apples',
      targetWord: 'red',
      heardText: 'I like crimson apples',
      alternates,
      recognitionConfidence: 0.85,
    };
    const answer = ['the', 'cat', 'saw', 'the', 'dog'];
    const target = [...answer];
    const grades = [1, 0.5, 0];
    const outcome = { solved: true, attemptsUsed: 2 };
    const xpInput = { practiceAccuracy: 50, speakPassed: true, alreadyCollected: true };
    const before = {
      input: { ...input, alternates: [...alternates] },
      answer: [...answer],
      target: [...target],
      grades: [...grades],
      outcome: { ...outcome },
      xpInput: { ...xpInput },
    };
    // Freeze mendeteksi mutasi sementara yang dibatalkan sebelum fungsi kembali.
    [alternates, input, answer, target, grades, outcome, xpInput].forEach(Object.freeze);
    const run = () => ({
      normalized: scoring.normalizeText("I'm happy!"),
      distance: scoring.wordLevenshtein(answer, target),
      similarity: scoring.wordSimilarity(input.targetSentence, input.heardText),
      pronunciation: scoring.scorePronunciation(input),
      grade: scoring.questionGrade(outcome),
      accuracy: scoring.practiceAccuracy(grades),
      points: scoring.pointsPerAnswer(3, 0.5),
      session: scoring.sessionScore(50, 80),
      stars: scoring.starsFromScore(79),
      xp: scoring.computeXp(xpInput),
      ordered: scoring.isOrderCorrect(answer, target),
    });
    expect(run()).toEqual(run());
    expect({ input, answer, target, grades, outcome, xpInput }).toEqual(before);
    // Jalur edit dan urutan salah juga harus menjaga kedua array.
    expect(scoring.wordLevenshtein(answer, ['the', 'dog'])).toBe(3);
    expect(scoring.isOrderCorrect(answer, ['the', 'dog'])).toBe(false);
    expect(answer).toEqual(before.answer);
    expect(target).toEqual(before.target);
  });

  it('semua fungsi level dan kalender deterministik tanpa mengubah Date masukan', () => {
    const date = new Date('2026-10-15T17:00:00Z');
    const before = date.getTime();
    const run = () => ({
      threshold: levels.cumulativeThreshold(3),
      level: levels.levelFromXp(130),
      inLevel: levels.xpInLevel(130),
      next: levels.xpForNextLevel(2),
      info: levels.levelInfo(130),
      key: levels.jakartaDateKey(date),
      consecutive: levels.isNextDay('2026-10-15', '2026-10-16'),
    });
    expect(run()).toEqual(run());
    expect(date.getTime()).toBe(before);
  });
});
