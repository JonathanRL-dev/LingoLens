import { scorePronunciation } from '@shared';
import { AppError } from '../lib/errors';
import { getPrisma } from '../lib/prisma';
import { requireScannedSession } from './scan.service';

export interface PronunciationInput {
  heardText: string;
  recognitionConfidence?: number;
  sentenceId?: string;
}

export async function submitPronunciation(
  userId: string,
  sessionId: string,
  input: PronunciationInput,
) {
  const session = await requireScannedSession(userId, sessionId);
  if (session.vocabularyId === null)
    throw new AppError('SESSION_NOT_SCANNED', 'Sesi belum berhasil dipindai');
  const db = getPrisma();
  const vocabulary = await db.vocabularyItem.findUnique({ where: { id: session.vocabularyId } });
  if (!vocabulary) throw new AppError('INTERNAL_ERROR', 'Kosakata sesi tidak tersedia');
  const sentenceId = input.sentenceId === undefined ? undefined : Number(input.sentenceId);
  if (sentenceId !== undefined && (!Number.isSafeInteger(sentenceId) || sentenceId < 1)) {
    throw new AppError('NOT_FOUND', 'Kalimat tidak ditemukan');
  }
  const sentence = await db.vocabularySentence.findFirst({
    where: {
      vocabularyId: vocabulary.id,
      kind: 'choice',
      ...(sentenceId === undefined ? {} : { id: sentenceId }),
    },
    orderBy: { id: 'asc' },
  });
  if (!sentence) throw new AppError('NOT_FOUND', 'Kalimat tidak ditemukan');
  const alternates = Array.isArray(vocabulary.alternates)
    ? vocabulary.alternates.filter((value): value is string => typeof value === 'string')
    : [];
  const result = scorePronunciation({
    targetSentence: sentence.sentenceEn,
    targetWord: vocabulary.word,
    alternates,
    heardText: input.heardText,
    recognitionConfidence: input.recognitionConfidence,
  });
  const feedback = result.targetWordHeard ? result.level : 'target_missing';
  await db.pronunciationAttempt.create({
    data: {
      sessionId,
      sentenceId: sentence.id,
      transcript: input.heardText,
      confidence: input.recognitionConfidence ?? null,
      score: result.score,
    },
  });
  return { ...result, feedback };
}
