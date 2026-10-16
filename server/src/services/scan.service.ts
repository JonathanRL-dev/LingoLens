import type { MissionSession } from '@prisma/client';
import { getPrisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { getOwnedSession } from './session.service';
import { computeXpComponents } from './reward.service';

export interface ScanInput {
  model: string;
  label: string;
  confidence: number;
  latencyMs: number;
}

async function scanVocabulary(vocabularyId: number, userId: string) {
  const db = getPrisma();
  const item = await db.vocabularyItem.findUnique({
    where: { id: vocabularyId },
    include: {
      category: true,
      translations: { orderBy: { languageCode: 'asc' } },
      sentences: {
        where: { kind: 'choice' },
        orderBy: { id: 'asc' },
        include: { translations: { orderBy: { languageCode: 'asc' } } },
      },
      relationsFrom: {
        include: { relatedVocabulary: true },
        orderBy: { relatedVocabularyId: 'asc' },
      },
    },
  });
  if (!item) throw new AppError('INTERNAL_ERROR', 'Kosakata hasil pindai tidak tersedia');
  const [owned, collected] = await Promise.all([
    db.userVocabulary.findMany({ where: { userId }, select: { vocabularyId: true } }),
    db.userVocabulary.findUnique({ where: { userId_vocabularyId: { userId, vocabularyId } } }),
  ]);
  const ids = new Set(owned.map((entry) => entry.vocabularyId));
  const sentence = item.sentences[0];
  return {
    alreadyCollected: Boolean(collected),
    vocabulary: {
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
        ids.has(related.id)
          ? { id: String(related.id), word: related.word, imageUrl: related.imageUrl ?? '', kind }
          : { id: String(related.id), imageUrl: related.imageUrl ?? '' },
      ),
    },
  };
}

export async function createScanAttempt(userId: string, sessionId: string, input: ScanInput) {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status === 'completed' || session.status === 'abandoned') {
    throw new AppError('SESSION_COMPLETED', 'Sesi tidak lagi menerima hasil pindai');
  }
  const db = getPrisma();
  const targets = await db.missionTarget.findMany({
    where: { missionId: session.missionId },
    select: { vocabularyId: true },
  });
  const targetIds = targets.map(({ vocabularyId }) => vocabularyId);
  const detections = await db.detectionLabel.findMany({
    where: { vocabularyId: { in: targetIds }, model: input.model, label: input.label },
    orderBy: [{ vocabularyId: 'asc' }, { id: 'asc' }],
  });
  const match = detections.find((entry) => input.confidence >= Number(entry.minConfidence));
  const matched = Boolean(match);
  const current = await db.$transaction(async (tx) => {
    if (matched && session.status === 'started') {
      await tx.missionSession.updateMany({
        where: { id: sessionId, userId, status: 'started' },
        data: { status: 'scanned', vocabularyId: match!.vocabularyId },
      });
    }
    await tx.scanAttempt.create({
      data: {
        sessionId,
        model: input.model,
        label: input.label,
        confidence: input.confidence,
        latencyMs: Math.round(input.latencyMs),
        matched,
      },
    });
    return tx.missionSession.findFirst({ where: { id: sessionId, userId } });
  });
  if (!current) throw new AppError('SESSION_NOT_FOUND', 'Sesi tidak ditemukan');
  if (current.status === 'completed' || current.status === 'abandoned') {
    throw new AppError('SESSION_COMPLETED', 'Sesi tidak lagi menerima hasil pindai');
  }
  if (current.status !== 'scanned' || current.vocabularyId === null) {
    return { matched: false, alreadyCollected: false, xpAwarded: 0 };
  }
  const [{ vocabulary, alreadyCollected }, mission] = await Promise.all([
    scanVocabulary(current.vocabularyId, userId),
    db.mission.findUnique({ where: { id: current.missionId } }),
  ]);
  if (!mission) throw new AppError('INTERNAL_ERROR', 'Misi sesi tidak tersedia');
  const xp = computeXpComponents({
    scanXp: mission.scanXp,
    practiceXp: 0,
    speakXp: 0,
    alreadyCollected,
  });
  return { matched, alreadyCollected, vocabulary, xpAwarded: xp.scanXp };
}

export async function requireScannedSession(
  userId: string,
  sessionId: string,
): Promise<MissionSession> {
  const session = await getOwnedSession(userId, sessionId);
  if (session.status === 'completed') throw new AppError('SESSION_COMPLETED', 'Sesi telah selesai');
  if (session.status !== 'scanned')
    throw new AppError('SESSION_NOT_SCANNED', 'Sesi belum berhasil dipindai');
  return session;
}
