import { Prisma } from '@prisma/client';
import { gradeAnswer, type Exercise, type ExerciseKey } from '@shared';
import { AppError } from '../lib/errors';
import { getPrisma } from '../lib/prisma';
import { loadSessionExercises } from './exercise-session.service';
import { requireScannedSession } from './scan.service';

function sharedExercise(
  exercise: Awaited<ReturnType<typeof loadSessionExercises>>['exercises'][number],
): Exercise {
  if (exercise.kind === 'choice') {
    return {
      id: exercise.id,
      kind: 'choice',
      text: exercise.contextSentence,
      options: exercise.options,
    };
  }
  if (exercise.kind === 'cloze') {
    return {
      id: exercise.id,
      kind: 'cloze',
      parts: exercise.parts,
      chips: exercise.chips,
      speakText: exercise.speakText,
    };
  }
  return {
    id: exercise.id,
    kind: 'order',
    tokens: exercise.tokens,
    hintTranslation: exercise.hintTranslation,
    endPunctuation: exercise.endPunctuation,
  };
}

function answerText(exercise: Exercise, answer: string | readonly string[]): string {
  if (exercise.kind === 'order') {
    if (!Array.isArray(answer)) throw new Error('Order answer must be an array of token IDs');
    return JSON.stringify(answer);
  }
  if (typeof answer !== 'string') throw new Error('Choice and cloze answers must be a string');
  const options = exercise.kind === 'choice' ? exercise.options : exercise.chips;
  return options.find((option) => option.id === answer)?.text ?? answer;
}

function storedAnswer(exercise: Exercise, answer: string): string | string[] {
  if (exercise.kind !== 'order') return answer;
  try {
    const parsed: unknown = JSON.parse(answer);
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) return parsed;
  } catch {
    // Invalid persisted order answers are rejected by gradeAnswer below.
  }
  return [];
}

function responseFromAttempt(
  exercise: Exercise,
  key: ExerciseKey,
  attempt: {
    attemptNo: number;
    answer: string;
    isCorrect: boolean;
    value: Prisma.Decimal | number;
  },
  pointsOverride?: number,
) {
  const result = gradeAnswer(
    exercise,
    key,
    storedAnswer(exercise, attempt.answer),
    attempt.attemptNo,
  );
  return {
    correct: attempt.isCorrect,
    attemptNo: attempt.attemptNo,
    attemptsLeft: Math.max(0, 2 - attempt.attemptNo),
    pointsAwarded: pointsOverride ?? Number(attempt.value),
    ...(result.hint === undefined ? {} : { hint: result.hint }),
    ...(result.correctAnswer === undefined ? {} : { correctAnswer: result.correctAnswer }),
  };
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function submitExerciseAnswer(
  userId: string,
  sessionId: string,
  exerciseId: string,
  answer: string | readonly string[],
) {
  const session = await requireScannedSession(userId, sessionId);
  const loaded = await loadSessionExercises(session);
  const publicExercise = loaded.exercises.find((entry) => entry.id === exerciseId);
  const key = loaded.keys.find((entry) => entry.exerciseId === exerciseId);
  if (!publicExercise || !key)
    throw new AppError('EXERCISE_NOT_FOUND', 'Soal tidak ditemukan pada sesi ini');
  const exercise = sharedExercise(publicExercise);
  const db = getPrisma();
  const previous = await db.exerciseAttempt.findMany({
    where: { sessionId, sentenceId: Number(exerciseId) },
    orderBy: { attemptNo: 'asc' },
  });
  const correct = previous.find((attempt) => attempt.isCorrect);
  if (correct) return responseFromAttempt(exercise, key, correct, 0);
  const attemptNo =
    previous.reduce((highest, attempt) => Math.max(highest, attempt.attemptNo), 0) + 1;
  if (attemptNo > 2)
    throw new AppError('ATTEMPTS_EXHAUSTED', 'Kesempatan menjawab soal telah habis');
  let result;
  try {
    result = gradeAnswer(exercise, key, answer, attemptNo);
  } catch (error) {
    if (
      error instanceof Error &&
      /^(Unknown order token ID|Order answer|Choice and cloze answers)/.test(error.message)
    ) {
      throw new AppError('VALIDATION_ERROR', 'Jawaban tidak sesuai dengan token soal');
    }
    throw error;
  }
  const storedAnswer = answerText(exercise, answer);
  try {
    const saved = await db.$transaction((tx) =>
      tx.exerciseAttempt.create({
        data: {
          sessionId,
          sentenceId: Number(exerciseId),
          kind: exercise.kind,
          attemptNo,
          answer: storedAnswer,
          isCorrect: result.correct,
          value: result.score,
        },
      }),
    );
    return responseFromAttempt(exercise, key, saved);
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const saved = await db.exerciseAttempt.findUnique({
      where: {
        sessionId_sentenceId_attemptNo: { sessionId, sentenceId: Number(exerciseId), attemptNo },
      },
    });
    if (!saved) throw error;
    return responseFromAttempt(exercise, key, saved, saved.isCorrect ? 0 : undefined);
  }
}
