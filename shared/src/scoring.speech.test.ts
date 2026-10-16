import { describe, expect, it } from 'vitest';
import { normalizeText, scorePronunciation, wordLevenshtein, wordSimilarity } from './scoring';

const LONG = 'I really like to eat fresh red apples every morning';

describe('normalizeText', () => {
  it('huruf kecil, hapus tanda baca, rapikan spasi', () => {
    expect(normalizeText('  Hello,   WORLD!!  ')).toBe('hello world');
  });

  it('apostrof lengkung disamakan dan kontraksi diperluas', () => {
    expect(normalizeText('I’m happy')).toBe('i am happy');
    expect(normalizeText("Can't stop, won't stop")).toBe('cannot stop will not stop');
  });

  it('string kosong menghasilkan string kosong', () => {
    expect(normalizeText('  ...  ')).toBe('');
  });
});

describe('wordLevenshtein', () => {
  it('kasus dasar', () => {
    expect(wordLevenshtein([], [])).toBe(0);
    expect(wordLevenshtein(['a', 'b'], [])).toBe(2);
    expect(wordLevenshtein(['a', 'b', 'c'], ['a', 'x', 'c'])).toBe(1);
    expect(wordLevenshtein(['a', 'b'], ['a', 'b', 'c'])).toBe(1);
  });
});

describe('wordSimilarity', () => {
  it('keduanya kosong menghasilkan 1', () => {
    expect(wordSimilarity('', '...')).toBe(1);
  });

  it("'I am happy' vs 'I'm happy' menghasilkan 1", () => {
    expect(wordSimilarity("I'm happy", 'I am happy')).toBe(1);
    expect(wordSimilarity('I’m happy', 'I am happy')).toBe(1);
  });
});

describe('scorePronunciation', () => {
  it('kata sama, keyakinan 1: skor 100, good, passed', () => {
    const r = scorePronunciation({
      targetSentence: LONG,
      targetWord: 'red',
      heardText: LONG,
      recognitionConfidence: 1,
    });
    expect(r).toEqual({ score: 100, level: 'good', passed: true, targetWordHeard: true });
  });

  it('kata sama, keyakinan 0,85: 100*(0,7+0,255)=95,5 dibulatkan 96', () => {
    const r = scorePronunciation({
      targetSentence: LONG,
      targetWord: 'red',
      heardText: LONG,
      recognitionConfidence: 0.85,
    });
    expect(r.score).toBe(96);
    expect(r.level).toBe('good');
  });

  it('kata mirip: satu dari enam kata berbeda -> 83', () => {
    const r = scorePronunciation({
      targetSentence: 'the cat sat on the mat',
      targetWord: 'cat',
      heardText: 'the cat sat on a mat',
      recognitionConfidence: 1,
    });
    expect(r.score).toBe(83);
    expect(r.level).toBe('good');
    expect(r.targetWordHeard).toBe(true);
  });

  it('kata salah total: skor 0, retry, tidak lulus', () => {
    const r = scorePronunciation({
      targetSentence: 'the cat sat on the mat',
      targetWord: 'cat',
      heardText: 'banana pie',
      recognitionConfidence: 1,
    });
    expect(r).toEqual({ score: 0, level: 'retry', passed: false, targetWordHeard: false });
  });

  it('level almost untuk skor 75', () => {
    const r = scorePronunciation({
      targetSentence: 'I like red apples',
      targetWord: 'apples',
      heardText: 'I like apples',
      recognitionConfidence: 1,
    });
    expect(r.score).toBe(75);
    expect(r.level).toBe('almost');
    expect(r.passed).toBe(true);
  });

  it('kata target hilang: skor dibatasi 60 walau kalimat lain nyaris sempurna', () => {
    const r = scorePronunciation({
      targetSentence: LONG,
      targetWord: 'red',
      heardText: 'I really like to eat fresh apples every morning', // sim 0,9 -> 90 tanpa batas
      recognitionConfidence: 1,
    });
    expect(r.targetWordHeard).toBe(false);
    expect(r.score).toBe(60);
    expect(r.level).toBe('almost');
  });

  it('alternates menyelamatkan dari batas', () => {
    const r = scorePronunciation({
      targetSentence: LONG,
      targetWord: 'red',
      alternates: ['crimson'],
      heardText: 'I really like to eat fresh crimson apples every morning',
      recognitionConfidence: 1,
    });
    expect(r.targetWordHeard).toBe(true);
    expect(r.score).toBe(90);
  });

  it("kontraksi: 'I am' vs 'I'm' dianggap sama", () => {
    const r = scorePronunciation({
      targetSentence: "I'm happy",
      targetWord: 'happy',
      heardText: 'I am happy',
      recognitionConfidence: 1,
    });
    expect(r.score).toBe(100);
  });

  it('kata target berupa kontraksi tetap terdeteksi', () => {
    const r = scorePronunciation({
      targetSentence: "I don't know",
      targetWord: "don't",
      heardText: 'I do not know',
      recognitionConfidence: 1,
    });
    expect(r.targetWordHeard).toBe(true);
    expect(r.score).toBe(100);
  });

  it('keyakinan undefined sama dengan 0,85', () => {
    const base = {
      targetSentence: 'the cat sat on the mat',
      targetWord: 'cat',
      heardText: 'the cat sat on a mat',
    };
    const a = scorePronunciation(base);
    const b = scorePronunciation({ ...base, recognitionConfidence: 0.85 });
    expect(a).toEqual(b);
  });

  it('kalimat panjang dengan satu kata salah: 90, good, passed', () => {
    const r = scorePronunciation({
      targetSentence: LONG,
      targetWord: 'morning',
      heardText: 'I really like to eat fresh red apricots every morning',
      recognitionConfidence: 1,
    });
    expect(r.score).toBe(90);
    expect(r.level).toBe('good');
    expect(r.passed).toBe(true);
  });

  it('batas passed: 49 gagal, 50 lulus', () => {
    const base = {
      targetSentence: 'hello world',
      targetWord: 'hello',
      heardText: 'hello there', // sim 0,5
    };
    const fifty = scorePronunciation({ ...base, recognitionConfidence: 1 });
    expect(fifty.score).toBe(50);
    expect(fifty.passed).toBe(true);

    // 100*0,5*(0,7+0,3*0,95)=49,25 -> 49
    const fortyNine = scorePronunciation({ ...base, recognitionConfidence: 0.95 });
    expect(fortyNine.score).toBe(49);
    expect(fortyNine.passed).toBe(false);
    expect(fortyNine.level).toBe('retry');
  });
});
describe('audit pita ucapan', () => {
  it.each([
    [49, 'retry', false],
    [50, 'almost', true],
    [79, 'almost', true],
    [80, 'good', true],
  ] as const)('skor %i masuk pita %s', (score, level, passed) => {
    // 100 token berbeda memberi kemiripan score/100, tanpa menghapus target.
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`);
    const heard = words.map((word, i) => (i < score ? word : `other${i}`));
    expect(
      scorePronunciation({
        targetSentence: words.join(' '),
        targetWord: 'word0',
        heardText: heard.join(' '),
        recognitionConfidence: 1,
      }),
    ).toEqual({ score, level, passed, targetWordHeard: true });
  });
});
