import { Prisma } from '@prisma/client';
import {
  isExerciseSettled,
  levelDariXp,
  practiceAccuracy as calculatePracticeAccuracy,
  questionGrade,
  sessionScore as calculateSessionScore,
  SPEAK_PASS,
  starsFromScore,
  xpForNextLevel,
  xpInLevel,
} from '@shared';
import { AppError } from '../lib/errors';
import { getPrisma } from '../lib/prisma';
import { isNextDay } from '@shared';
import { jakartaDateString } from '../lib/time';
import { getMissionStatusesForUser, missionDto } from './mission.service';
import { getOwnedSession } from './session.service';
import { loadSessionExercises } from './exercise-session.service';
import { computeXpComponents } from './reward.service';

type CompleteOptions = { skippedPractice?: boolean; skippedSpeak?: boolean };
type Transaction = Prisma.TransactionClient;

class CompletionRace extends Error {}

function priorActivityKey(date: Date | null): string | null {
  // MySQL DATE comes back as UTC midnight; preserve its stored calendar date.
  return date ? date.toISOString().slice(0, 10) : null;
}

function streakAfter(previousCount: number, previousDate: Date | null, today: string): number {
  const previousDay = priorActivityKey(previousDate);
  if (!previousDay) return 1;
  if (previousDay === today) return previousCount;
  return isNextDay(previousDay, today) ? previousCount + 1 : 1;
}

async function readCompletedResult(userId: string, sessionId: string) {
  const completed = await getOwnedSession(userId, sessionId);
  if (completed.status !== 'completed' || completed.resultJson === null) return null;
  return completed.resultJson;
}

async function nextMission(database: Transaction, userId: string, completedOrderIndex: number) {
  const rows = await getMissionStatusesForUser(userId, database);
  const upcoming = rows.find(
    ({ mission, status }) => status === 'open' && mission.orderIndex > completedOrderIndex,
  );
  if (!upcoming) return null;
  const category = await database.category.findUnique({
    where: { id: upcoming.mission.categoryId },
    select: { name: true },
  });
  return missionDto(upcoming, category?.name ?? '');
}

async function publicCollectedWord(database: Transaction, userId: string, vocabularyId: number) {
  const [item, collected] = await Promise.all([
    database.vocabularyItem.findUnique({
      where: { id: vocabularyId },
      include: {
        category: true,
        translations: { orderBy: { languageCode: 'asc' } },
        sentences: {
          where: { kind: 'choice' },
          orderBy: { id: 'asc' },
          take: 1,
          include: { translations: { orderBy: { languageCode: 'asc' } } },
        },
        relationsFrom: {
          orderBy: { relatedVocabularyId: 'asc' },
          include: { relatedVocabulary: true },
        },
      },
    }),
    database.userVocabulary.findMany({ where: { userId }, select: { vocabularyId: true } }),
  ]);
  if (!item) throw new AppError('INTERNAL_ERROR', 'Kosakata sesi tidak tersedia');
  const ownedIds = new Set(collected.map(({ vocabularyId: id }) => id));
  const sentence = item.sentences[0];
  return {
    id: String(item.id),
    word: item.word,
    phonetic: item.phonetic ?? '',
    meaning: item.meaningId,
    imageUrl: item.imageUrl ?? '',
    category: item.category.name,
    translations: item.translations.map(({ languageCode, translation, romanization }) => ({
      languageCode,
      translation,
      romanization,
    })),
    exampleSentence: sentence
      ? {
          id: String(sentence.id),
          text: sentence.sentenceEn,
          translations: sentence.translations.map(({ languageCode, text, pinyin }) => ({
            languageCode,
            text,
            pinyin,
          })),
        }
      : {},
    related: item.relationsFrom.map(({ relatedVocabulary: related, kind }) =>
      ownedIds.has(related.id)
        ? { id: String(related.id), word: related.word, imageUrl: related.imageUrl ?? '', kind }
        : { id: String(related.id), imageUrl: related.imageUrl ?? '' },
    ),
  };
}

/** Finalize a scanned session and credit all XP atomically; repeated calls replay result_json. */
export async function completeSession(
  userId: string,
  sessionId: string,
  options: CompleteOptions = {},
) {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status === 'completed') {
    if (session.resultJson === null)
      throw new AppError('INTERNAL_ERROR', 'Hasil sesi tidak tersedia');
    return session.resultJson;
  }
  if (session.status !== 'scanned') {
    throw new AppError('SESSION_NOT_SCANNED', 'Sesi belum berhasil dipindai');
  }
  if (session.vocabularyId === null)
    throw new AppError('INTERNAL_ERROR', 'Kosakata sesi tidak tersedia');

  const db = getPrisma();
  const skippedPractice = options.skippedPractice ?? false;
  const skippedSpeak = options.skippedSpeak ?? false;
  let accuracy = 0;
  if (!skippedPractice) {
    const loaded = await loadSessionExercises(session);
    const attempts = await db.exerciseAttempt.findMany({
      where: { sessionId },
      orderBy: [{ sentenceId: 'asc' }, { attemptNo: 'asc' }],
      select: { sentenceId: true, isCorrect: true, attemptNo: true },
    });
    const rowsBySentence = new Map<number, typeof attempts>();
    for (const attempt of attempts) {
      const bucket = rowsBySentence.get(attempt.sentenceId) ?? [];
      bucket.push(attempt);
      rowsBySentence.set(attempt.sentenceId, bucket);
    }
    const grades = loaded.exercises.map((exercise) => {
      const rows = rowsBySentence.get(Number(exercise.id)) ?? [];
      const solved = rows.some(({ isCorrect }) => isCorrect);
      const state = { solved, attemptsUsed: rows.length, exhausted: !solved && rows.length >= 2 };
      if (!isExerciseSettled(state)) {
        throw new AppError('PRACTICE_INCOMPLETE', 'Selesaikan semua latihan sebelum menutup sesi');
      }
      return questionGrade({ solved, attemptsUsed: rows.length });
    });
    // A settled session with no answers is possible only when the plan has no questions.
    accuracy = attempts.length === 0 ? 0 : calculatePracticeAccuracy(grades);
  }
  const pronunciation = skippedSpeak
    ? []
    : await db.pronunciationAttempt.findMany({
        where: { sessionId },
        select: { score: true },
      });
  const speakScore = skippedSpeak ? 0 : Math.max(0, ...pronunciation.map(({ score }) => score));
  const score = calculateSessionScore(accuracy, speakScore);
  const stars = starsFromScore(score);
  const mission = await db.mission.findUnique({ where: { id: session.missionId } });
  if (!mission) throw new AppError('INTERNAL_ERROR', 'Misi sesi tidak tersedia');

  const now = new Date();
  const today = jakartaDateString(now);
  const activityDate = new Date(`${today}T00:00:00.000Z`);
  try {
    return await db.$transaction(async (tx) => {
      // Serialize XP/level/streak updates for this account across different sessions too.
      await tx.$queryRaw<
        Array<{ id: string }>
      >`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      const claimed = await tx.missionSession.updateMany({
        where: { id: sessionId, userId, status: 'scanned' },
        data: { status: 'completed', completedAt: now },
      });
      if (claimed.count !== 1) throw new CompletionRace();

      const existing = await tx.userVocabulary.findUnique({
        where: { userId_vocabularyId: { userId, vocabularyId: session.vocabularyId! } },
      });
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('UNAUTHORIZED', 'Autentikasi tidak sah');
      const xpBreakdown = computeXpComponents({
        scanXp: mission.scanXp,
        practiceXp: Math.round((mission.practiceXp * accuracy) / 100),
        speakXp: speakScore >= SPEAK_PASS ? mission.speakXp : 0,
        alreadyCollected: existing !== null,
      });
      const totalXpAwarded = xpBreakdown.scanXp + xpBreakdown.practiceXp + xpBreakdown.speakXp;
      const newTotal = user.totalXp + totalXpAwarded;
      const newLevel = levelDariXp(newTotal);
      const [next, collectedWord] = await Promise.all([
        nextMission(tx, userId, mission.orderIndex),
        publicCollectedWord(tx, userId, session.vocabularyId!),
      ]);
      const data = {
        stars,
        sessionScore: score,
        practiceAccuracy: accuracy,
        speakScore,
        xpBreakdown,
        totalXpAwarded,
        levelUp: user.level < newLevel,
        newLevel,
        xpInLevel: xpInLevel(newTotal),
        xpForNextLevel: xpForNextLevel(newLevel),
        collectedWord,
        alreadyCollected: existing !== null,
        nextMission: next,
      };
      const response = { success: true as const, data };

      await tx.xpEvent.createMany({
        data: (['scan', 'practice', 'speak'] as const).map((source) => ({
          userId,
          sessionId,
          source,
          amount: xpBreakdown[`${source}Xp`],
        })),
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          totalXp: newTotal,
          level: newLevel,
          streakCount: streakAfter(user.streakCount, user.lastActiveDate, today),
          lastActiveDate: activityDate,
        },
      });
      await tx.userVocabulary.upsert({
        where: { userId_vocabularyId: { userId, vocabularyId: session.vocabularyId! } },
        create: { userId, vocabularyId: session.vocabularyId!, bestScore: score },
        update: {
          bestScore: Math.max(existing?.bestScore ?? 0, score),
          timesPracticed: { increment: 1 },
        },
      });
      await tx.missionSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: now,
          practiceAccuracy: accuracy,
          speakScore,
          sessionScore: score,
          bestScore: score,
          stars,
          xpAwarded: totalXpAwarded,
          resultJson: response as Prisma.InputJsonObject,
        },
      });
      return response;
    });
  } catch (error) {
    if (
      error instanceof CompletionRace ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
    ) {
      const result = await readCompletedResult(userId, sessionId);
      if (result !== null) return result;
    }
    throw error;
  }
}
