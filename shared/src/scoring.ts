import {
  DEFAULT_ASR_CONFIDENCE,
  SPEAK_CAP_WITHOUT_TARGET,
  SPEAK_PASS,
  PRACTICE_XP,
  PRACTICE_WEIGHT,
  SPEAK_WEIGHT,
  STAR_BANDS,
  SCAN_XP,
  SPEAK_XP,
  COLLECTED_XP_FACTOR,
} from './constants';

export type PronunciationLevel = 'good' | 'almost' | 'retry';

export interface PronunciationInput {
  targetSentence: string;
  targetWord: string;
  alternates?: string[];
  heardText: string;
  recognitionConfidence?: number;
}

export interface PronunciationResult {
  score: number;
  level: PronunciationLevel;
  passed: boolean;
  targetWordHeard: boolean;
}

// Batas level (spesifikasi S2): good 80-100, almost 50-79, retry < 50.
const LEVEL_GOOD_MIN = 80;
const LEVEL_ALMOST_MIN = 50;

// Tabel statis kontraksi -> bentuk kanonik. Perluasan hanya lewat PM.
// Kunci memakai apostrof lurus (') karena teks sudah diseragamkan lebih dulu.
const CONTRACTIONS: ReadonlyMap<string, string> = new Map([
  ["i'm", 'i am'],
  ["it's", 'it is'],
  ["that's", 'that is'],
  ["don't", 'do not'],
  ["can't", 'cannot'],
  ["what's", 'what is'],
  ["there's", 'there is'],
  ["let's", 'let us'],
  ["he's", 'he is'],
  ["she's", 'she is'],
  ["we're", 'we are'],
  ["they're", 'they are'],
  ["you're", 'you are'],
  ["isn't", 'is not'],
  ["aren't", 'are not'],
  ["doesn't", 'does not'],
  ["didn't", 'did not'],
  ["won't", 'will not'],
  ["i'll", 'i will'],
  ["i've", 'i have'],
]);

export function normalizeText(s: string): string {
  const cleaned = s
    .toLowerCase()
    // apostrof lengkung -> apostrof lurus
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    // tanda hubung/dash dianggap pemisah kata
    .replace(/[\u2010-\u2015-]/g, ' ')
    // hapus tanda baca kecuali apostrof
    .replace(/[^\p{L}\p{N}'\s]/gu, '');

  return cleaned
    .split(/\s+/)
    .map((t) => t.replace(/^'+|'+$/g, '')) // apostrof sebagai tanda kutip
    .filter((t) => t.length > 0)
    .map((t) => CONTRACTIONS.get(t) ?? t)
    .join(' ');
}

function tokenize(s: string): string[] {
  const n = normalizeText(s);
  return n === '' ? [] : n.split(' ');
}

export function wordLevenshtein(a: string[], b: string[]): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  let curr = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length]!;
}

export function wordSimilarity(target: string, heard: string): number {
  const t = tokenize(target);
  const h = tokenize(heard);
  const longest = Math.max(t.length, h.length);
  if (longest === 0) return 1;
  return 1 - wordLevenshtein(t, h) / longest;
}

function containsPhrase(tokens: string[], phrase: string[]): boolean {
  if (phrase.length === 0 || phrase.length > tokens.length) return false;
  for (let i = 0; i + phrase.length <= tokens.length; i++) {
    let ok = true;
    for (let k = 0; k < phrase.length; k++) {
      if (tokens[i + k] !== phrase[k]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function levelFor(score: number): PronunciationLevel {
  if (score >= LEVEL_GOOD_MIN) return 'good';
  if (score >= LEVEL_ALMOST_MIN) return 'almost';
  return 'retry';
}

export function scorePronunciation(input: PronunciationInput): PronunciationResult {
  const raw = input.recognitionConfidence ?? DEFAULT_ASR_CONFIDENCE;
  const confidence = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : DEFAULT_ASR_CONFIDENCE;

  const sim = wordSimilarity(input.targetSentence, input.heardText);
  const exact = 100 * sim * (0.7 + 0.3 * confidence);
  // toFixed(6) menghindari galat floating point pada nilai .5 (mis. 95.49999...)
  let score = Math.round(Number(exact.toFixed(6)));

  const heardTokens = tokenize(input.heardText);
  const candidates = [input.targetWord, ...(input.alternates ?? [])];
  const targetWordHeard = candidates.some((c) => containsPhrase(heardTokens, tokenize(c)));

  if (!targetWordHeard) score = Math.min(score, SPEAK_CAP_WITHOUT_TARGET);

  return {
    score,
    level: levelFor(score),
    passed: score >= SPEAK_PASS,
    targetWordHeard,
  };
}

// Penilaian latihan dan sesi.

/** Nilai satu soal: percobaan 1 = 1, percobaan 2 = 0,5, selainnya 0. */
export function questionGrade(outcome: { solved: boolean; attemptsUsed: number }): 0 | 0.5 | 1 {
  if (!outcome.solved) return 0;
  if (outcome.attemptsUsed === 1) return 1;
  if (outcome.attemptsUsed === 2) return 0.5;
  return 0;
}

/** Akurasi latihan (0-100) = rata-rata nilai × 100. Array kosong → 0. Dibulatkan setengah ke atas. */
export function practiceAccuracy(grades: number[]): number {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((a, b) => a + b, 0);
  return Math.round((sum / grades.length) * 100);
}

/** Poin XP per jawaban. */
export function pointsPerAnswer(totalQuestions: number, grade: number): number {
  return Math.round((PRACTICE_XP / totalQuestions) * grade);
}

/** Skor sesi (0-100), dibulatkan. Latihan dilewati → kirim practiceAcc = 0; ucapan dilewati → speakScore = 0. */
export function sessionScore(practiceAcc: number, speakScore: number): number {
  return Math.round(PRACTICE_WEIGHT * practiceAcc + SPEAK_WEIGHT * speakScore);
}

/** Bintang dari skor sesi sesuai STAR_BANDS. */
export function starsFromScore(score: number): 1 | 2 | 3 {
  if (score >= STAR_BANDS.three) return 3;
  if (score >= STAR_BANDS.two) return 2;
  return 1;
}

/**
 * Hitung XP.
 * practiceXp dihitung dari akurasi yang diberikan pemanggil;
 * Math.round hanya dipakai di akhir. Jika alreadyCollected, tiap komponen
 * dikali COLLECTED_XP_FACTOR lalu dibulatkan; total = jumlah komponen terbulat.
 */
export function computeXp(input: {
  practiceAccuracy: number;
  speakPassed: boolean;
  alreadyCollected: boolean;
}): { scanXp: number; practiceXp: number; speakXp: number; total: number } {
  let scanXp: number = SCAN_XP;
  let practiceXp: number = Math.round((PRACTICE_XP * input.practiceAccuracy) / 100);
  let speakXp: number = input.speakPassed ? SPEAK_XP : 0;
  if (input.alreadyCollected) {
    scanXp = Math.round(scanXp * COLLECTED_XP_FACTOR);
    practiceXp = Math.round(practiceXp * COLLECTED_XP_FACTOR);
    speakXp = Math.round(speakXp * COLLECTED_XP_FACTOR);
  }
  return { scanXp, practiceXp, speakXp, total: scanXp + practiceXp + speakXp };
}

/** Bandingkan teks token per posisi (bukan ID), sehingga token ganda yang bertukar tetap benar. */
export function isOrderCorrect(answerTexts: string[], targetTexts: string[]): boolean {
  if (answerTexts.length !== targetTexts.length) return false;
  return answerTexts.every((t, i) => t === targetTexts[i]);
}
