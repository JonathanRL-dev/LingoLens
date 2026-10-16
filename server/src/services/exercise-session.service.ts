import type { MissionSession, Prisma } from '@prisma/client';
import { generateExercises } from '@shared';
import { logger } from '../lib/logger';
import { AppError } from '../lib/errors';
import { getPrisma } from '../lib/prisma';

function mapPlan(raw: Prisma.JsonValue, sentences: Array<{ id: number; kind: string }>) {
  if (!Array.isArray(raw)) throw new Error('Mission exercise_plan must be an array');
  const used = new Set<number>();
  return raw.map((item) => {
    if (typeof item === 'string') {
      const sentence = sentences.find((entry) => entry.kind === item && !used.has(entry.id));
      if (sentence) used.add(sentence.id);
      // Unknown kinds deliberately reach generateExercises for its explicit unsupported-kind error.
      return { sentenceId: String(sentence?.id ?? ''), kind: item };
    }
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const entry = item as Record<string, Prisma.JsonValue>;
      const sentenceId = String(entry.sentenceId ?? '');
      if (typeof entry.kind !== 'string') {
        throw new Error('Mission exercise_plan item needs a string kind');
      }
      return { sentenceId, kind: entry.kind };
    }
    throw new Error('Mission exercise_plan item is invalid');
  });
}

/** Load target data, generate deterministic exercises, and retain private answer keys. */
export async function loadSessionExercises(session: MissionSession) {
  const db = getPrisma();
  if (session.vocabularyId === null) throw new Error('Scanned session has no vocabulary_id');
  const [mission, target, allItems] = await Promise.all([
    db.mission.findUnique({ where: { id: session.missionId } }),
    db.vocabularyItem.findUnique({
      where: { id: session.vocabularyId },
      include: {
        category: true,
        sentences: {
          orderBy: { id: 'asc' },
          include: { translations: { orderBy: { languageCode: 'asc' } } },
        },
      },
    }),
    db.vocabularyItem.findMany({ include: { category: true }, orderBy: { id: 'asc' } }),
  ]);
  if (!mission || !target) throw new Error('Session exercise source data is missing');
  const sentences = target.sentences.map((sentence) => ({
    id: String(sentence.id),
    vocabularyId: String(sentence.vocabularyId),
    text: sentence.sentenceEn,
    wordsJson:
      Array.isArray(sentence.wordsJson) &&
      sentence.wordsJson.every((word) => typeof word === 'string')
        ? (sentence.wordsJson as string[])
        : null,
    hintTranslation:
      sentence.translations.find((entry) => entry.languageCode === 'id-ID')?.text ?? '',
  }));
  let generated: ReturnType<typeof generateExercises>;
  try {
    generated = generateExercises({
      sessionId: session.id,
      vocabulary: {
        id: String(target.id),
        word: target.word,
        meaning: target.meaningId,
        categoryId: String(target.categoryId),
      },
      sentences,
      allVocabulary: allItems.map((item) => ({
        id: String(item.id),
        word: item.word,
        meaning: item.meaningId,
        categoryId: String(item.categoryId),
      })),
      plan: mapPlan(mission.exercisePlan, target.sentences),
    });
  } catch (error) {
    logger.error(
      { err: error, sessionId: session.id, missionId: mission.id },
      'Cannot generate session exercises',
    );
    throw new AppError('INTERNAL_ERROR', 'Latihan sesi tidak dapat disiapkan');
  }
  const sentenceById = new Map(target.sentences.map((sentence) => [String(sentence.id), sentence]));
  const exercises = generated.exercises.map((exercise, index) => {
    const sentence = sentenceById.get(exercise.id);
    if (!sentence) throw new AppError('INTERNAL_ERROR', 'Kalimat latihan tidak tersedia');
    const state = { attemptsUsed: 0, solved: false, exhausted: false };
    if (exercise.kind === 'choice') {
      return {
        id: exercise.id,
        kind: exercise.kind,
        index,
        state,
        word: target.word,
        imageUrl: target.imageUrl ?? '',
        contextSentence: exercise.text,
        options: exercise.options,
      };
    }
    if (exercise.kind === 'cloze') {
      const hintTranslation =
        sentence.translations.find((entry) => entry.languageCode === 'id-ID') ??
        sentence.translations.find((entry) => entry.languageCode === 'zh-CN');
      return {
        id: exercise.id,
        kind: exercise.kind,
        index,
        state,
        parts: exercise.parts,
        chips: exercise.chips,
        hintTranslation: hintTranslation?.text ?? '',
        speakText: exercise.speakText,
      };
    }
    return { ...exercise, index, state };
  });
  return { exercises, keys: generated.keys };
}

/** Add persisted attempt state to the public exercise DTO; never return generated keys. */
export async function getSessionExercises(session: MissionSession) {
  const { exercises, keys } = await loadSessionExercises(session);
  const attempts = await getPrisma().exerciseAttempt.findMany({
    where: { sessionId: session.id },
    select: { sentenceId: true, attemptNo: true, isCorrect: true },
  });
  const bySentence = new Map<number, typeof attempts>();
  for (const attempt of attempts) {
    const bucket = bySentence.get(attempt.sentenceId) ?? [];
    bucket.push(attempt);
    bySentence.set(attempt.sentenceId, bucket);
  }
  const stateful = exercises.map((exercise) => {
    const rows = bySentence.get(Number(exercise.id)) ?? [];
    const attemptsUsed = Math.min(2, rows.length);
    const solved = rows.some((row) => row.isCorrect);
    return {
      ...exercise,
      state: { attemptsUsed, solved, exhausted: !solved && attemptsUsed >= 2 },
    };
  });
  return { exercises: stateful, keys };
}
