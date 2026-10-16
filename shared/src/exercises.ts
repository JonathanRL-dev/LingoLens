const CHOICE_DISTRACTORS = 3;
const CLOZE_DISTRACTORS = 2;
const MAX_ATTEMPTS = 2;
const FULL_SCORE = 1;
const RETRY_SCORE = 0.5;
const ZERO_SCORE = 0;

// TODO: selaraskan dengan kontrak Fase 1
// Kontrak/seed belum tersedia: ID string, plan menunjuk kalimat secara eksplisit.
export interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  categoryId: string;
}
export interface Sentence {
  id: string;
  vocabularyId: string;
  text: string;
  wordsJson?: readonly string[] | null;
  hintTranslation?: string;
}
export interface ExercisePlanItem {
  sentenceId: string;
  kind: string;
}
export interface ExerciseOption {
  id: string;
  text: string;
}
export type Exercise =
  | { id: string; kind: 'choice'; text: string; options: ExerciseOption[] }
  | {
      id: string;
      kind: 'cloze';
      parts: [string, string];
      chips: ExerciseOption[];
      speakText: string;
    }
  | {
      id: string;
      kind: 'order';
      tokens: ExerciseOption[];
      hintTranslation: string;
      endPunctuation: string;
    };
export interface ExerciseKey {
  exerciseId: string;
  answer: string;
  hint?: string;
}
export interface GenerateExercisesInput {
  sessionId: string;
  vocabulary: Vocabulary;
  sentences: readonly Sentence[];
  allVocabulary: readonly Vocabulary[];
  plan: readonly ExercisePlanItem[];
}
export interface GradeResult {
  correct: boolean;
  score: 1 | 0.5 | 0;
  hint?: string;
  correctAnswer?: string;
}
export interface ExerciseState {
  solved: boolean;
  attemptsUsed: number;
  exhausted?: boolean;
}

const normalize = (text: string): string => text.trim().toLowerCase().replace(/\s+/g, ' ');
const byId = (a: { id: string }, b: { id: string }): number =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

// FNV-1a + mulberry32; JSON tuple menghindari pasangan ID dengan separator ambigu.
function randomFor(sessionId: string, sentenceId: string): () => number {
  let seed = 2166136261;
  for (const character of JSON.stringify([sessionId, sentenceId])) {
    seed = Math.imul(seed ^ character.codePointAt(0)!, 16777619);
  }
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

function orderWords(sentence: Sentence): { words: string[]; endPunctuation: string } {
  const sourceWords = sentence.wordsJson;
  if (
    !sourceWords?.length ||
    sourceWords.some((word) => typeof word !== 'string' || !word.trim())
  ) {
    throw new Error('Order sentence needs nonempty words_json tokens: ' + sentence.id);
  }
  const endPunctuation = sentence.text.match(/[.!?…]+$/u)?.[0] ?? '';
  const words = sourceWords.map((word) => (word === 'I' ? 'I' : word.toLowerCase()));
  const lastIndex = words.length - 1;
  if (endPunctuation && lastIndex >= 0) {
    words[lastIndex] = words[lastIndex]!.replace(/[.!?…]+$/u, '');
  }
  return { words, endPunctuation };
}

function shuffledOrder(words: readonly string[], sessionId: string, sentenceId: string): string[] {
  const sameVisibleOrder = (candidate: readonly string[]) =>
    candidate.every((word, index) => normalize(word) === normalize(words[index] ?? ''));
  let candidate = shuffle(words, randomFor(sessionId, sentenceId));
  if (!sameVisibleOrder(candidate)) return candidate;

  // Shift the seed if the first seeded permutation accidentally matches the answer.
  for (let shift = 1; shift <= 16; shift++) {
    candidate = shuffle(words, randomFor(sessionId, `${sentenceId}:shift:${shift}`));
    if (!sameVisibleOrder(candidate)) return candidate;
  }

  // Deterministic fallback for unusually unlucky seeds with at least two distinct words.
  if (new Set(words.map(normalize)).size > 1) return [...words.slice(1), words[0]!];
  return candidate;
}

/** Heuristik Inggris: hour/honest/heir vokal; university/unit/user/european/one konsonan. */
export function startsWithVowelSound(word: string): boolean {
  const text = normalize(word);
  if (/^(hour|honest|heir)/.test(text)) return true;
  if (/^(university|unit|user|european|one)/.test(text)) return false;
  return /^[aeiou]/.test(text);
}

function selectUnique(
  candidates: readonly Vocabulary[],
  textOf: (item: Vocabulary) => string,
  correctText: string,
  count: number,
  sentenceId: string,
): string[] {
  const seen = new Set([normalize(correctText)]);
  const texts: string[] = [];
  for (const item of candidates) {
    const text = textOf(item);
    if (seen.has(normalize(text))) continue;
    seen.add(normalize(text));
    texts.push(text);
    if (texts.length === count) return texts;
  }
  throw new Error('Not enough unique distractors for sentence ' + sentenceId);
}

/** Tidak menyimpan state; setiap kalimat mendapat PRNG sendiri dan keluaran tanpa kunci. */
export function generateExercises(input: GenerateExercisesInput): {
  exercises: Exercise[];
  keys: ExerciseKey[];
} {
  const { sessionId, vocabulary: target, sentences, allVocabulary, plan } = input;
  const targetWord = normalize(target.word);
  if (!targetWord || !normalize(target.meaning))
    throw new Error('Target word and meaning must not be empty');
  const exercises: Exercise[] = [];
  const keys: ExerciseKey[] = [];
  const used = new Set<string>();
  // Sort salinan: urutan input tidak menentukan pilihan pengecoh atau keluaran.
  const orderedPlan = [...plan].sort((a, b) => byId({ id: a.sentenceId }, { id: b.sentenceId }));
  const pool = [...allVocabulary]
    .sort(byId)
    .filter(
      (item) =>
        item.id !== target.id &&
        normalize(item.word) !== '' &&
        !normalize(item.word).includes(targetWord),
    );
  for (const entry of orderedPlan) {
    if (entry.kind !== 'choice' && entry.kind !== 'cloze' && entry.kind !== 'order') {
      throw new Error('Unsupported exercise kind: ' + entry.kind);
    }
    if (used.has(entry.sentenceId))
      throw new Error('Duplicate sentence in plan: ' + entry.sentenceId);
    used.add(entry.sentenceId);
    const matches = sentences.filter((item) => item.id === entry.sentenceId);
    const sentence = matches[0];
    if (matches.length !== 1 || !sentence || sentence.vocabularyId !== target.id) {
      throw new Error('Expected one target sentence: ' + entry.sentenceId);
    }
    const random = randomFor(sessionId, sentence.id);
    // ID ditetapkan SESUDAH shuffle, sehingga tidak menandai opsi benar.
    const options = (texts: string[]): ExerciseOption[] =>
      shuffle(texts, random).map((text, index) => ({
        id: JSON.stringify([sentence.id, index]),
        text,
      }));
    if (entry.kind === 'choice') {
      const eligible = pool.filter(
        (item) => normalize(item.meaning) !== '' && !normalize(item.meaning).includes(targetWord),
      );
      const sameCategory = eligible.filter((item) => item.categoryId === target.categoryId);
      const otherCategory = eligible.filter((item) => item.categoryId !== target.categoryId);
      const distractors = selectUnique(
        [...shuffle(sameCategory, random), ...shuffle(otherCategory, random)],
        (item) => item.meaning,
        target.meaning,
        CHOICE_DISTRACTORS,
        sentence.id,
      );
      exercises.push({
        id: sentence.id,
        kind: 'choice',
        text: sentence.text,
        options: options([target.meaning, ...distractors]),
      });
      keys.push({ exerciseId: sentence.id, answer: target.meaning });
    } else if (entry.kind === 'cloze') {
      const parts = sentence.text.split('___');
      if (parts.length !== 2)
        throw new Error('Expected exactly one ___ in sentence ' + sentence.id);
      const before = parts[0]!;
      const after = parts[1]!;
      const speakText = before + 'blank' + after;
      if (normalize(speakText).includes(targetWord)) {
        throw new Error('speakText exposes target word in sentence ' + sentence.id);
      }
      const article = normalize(before).split(' ').at(-1);
      // Pilih tepat dua pengecoh. Untuk "an", samakan bunyi SEMUA pengecoh dengan target.
      const eligible = pool.filter(
        (item) =>
          item.categoryId !== target.categoryId &&
          (article !== 'a' || !startsWithVowelSound(item.word)) &&
          (article !== 'an' ||
            startsWithVowelSound(item.word) === startsWithVowelSound(target.word)),
      );
      const distractors = selectUnique(
        shuffle(eligible, random),
        (item) => item.word,
        target.word,
        CLOZE_DISTRACTORS,
        sentence.id,
      );
      exercises.push({
        id: sentence.id,
        kind: 'cloze',
        parts: [before, after],
        chips: options([target.word, ...distractors]),
        speakText,
      });
      keys.push({ exerciseId: sentence.id, answer: target.word });
    } else {
      const { words, endPunctuation } = orderWords(sentence);
      const shuffledWords = shuffledOrder(words, sessionId, sentence.id);
      const tokens = shuffledWords.map((text, index) => ({ id: `t${index}`, text }));
      const answer = normalize(sentence.text.replace(/[.!?…]+$/u, ''));
      exercises.push({
        id: sentence.id,
        kind: 'order',
        tokens,
        hintTranslation: sentence.hintTranslation ?? '',
        endPunctuation,
      });
      const hint = sentence.text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/u)?.[0] ?? '';
      keys.push({ exerciseId: sentence.id, answer, hint });
    }
  }
  return { exercises, keys };
}

/** Pemanggil WAJIB memeriksa state sebelum memberi poin lagi pada soal yang telah selesai. */
export function isExerciseSettled(state: ExerciseState): boolean {
  return state.solved || state.exhausted === true || state.attemptsUsed >= MAX_ATTEMPTS;
}

/** Percobaan di luar 1..2 ditolak; ID opsi hanya dipakai untuk mendapatkan teksnya. */
export function gradeAnswer(
  exercise: Exercise,
  key: ExerciseKey,
  answer: string | readonly string[],
  attemptNo: number,
): GradeResult {
  if (!Number.isInteger(attemptNo) || attemptNo < 1 || attemptNo > MAX_ATTEMPTS) {
    throw new Error('attemptNo must be an integer from 1 to ' + MAX_ATTEMPTS);
  }
  if (key.exerciseId !== exercise.id) throw new Error('Exercise key does not match exercise');
  let text: string;
  if (exercise.kind === 'order') {
    if (!Array.isArray(answer)) throw new Error('Order answer must be an array of token IDs');
    const tokensById = new Map(exercise.tokens.map((token) => [token.id, token.text]));
    if (answer.some((id) => !tokensById.has(id))) throw new Error('Unknown order token ID');
    if (
      answer.length !== exercise.tokens.length ||
      new Set(answer).size !== exercise.tokens.length
    ) {
      throw new Error('Order answer must use every token ID exactly once');
    }
    text = answer.map((id) => tokensById.get(id)!).join(' ');
  } else {
    if (typeof answer !== 'string') throw new Error('Choice and cloze answers must be a string');
    const choices = exercise.kind === 'choice' ? exercise.options : exercise.chips;
    text = choices.find((option) => option.id === answer)?.text ?? answer;
  }
  if (normalize(text) === normalize(key.answer)) {
    return { correct: true, score: attemptNo === 1 ? FULL_SCORE : RETRY_SCORE };
  }
  return attemptNo === MAX_ATTEMPTS
    ? { correct: false, score: ZERO_SCORE, correctAnswer: key.answer }
    : {
        correct: false,
        score: ZERO_SCORE,
        hint:
          exercise.kind === 'order'
            ? (key.hint ?? key.answer.split(' ')[0] ?? '')
            : (Array.from(normalize(key.answer))[0] ?? ''),
      };
}
