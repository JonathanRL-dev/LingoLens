import { randomUUID } from 'node:crypto';
import { getPrisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import {
  getAcceptedLabels,
  getMissionCategoryName,
  getMissionStatusesForUser,
  missionDto,
  requireMission,
} from './mission.service';
import { getOwnedSession } from './session.service';

export async function listMissions(userId: string) {
  const rows = await getMissionStatusesForUser(userId);
  const categories = await getPrisma().category.findMany({
    where: { id: { in: [...new Set(rows.map(({ mission }) => mission.categoryId))] } },
    select: { id: true, name: true },
  });
  const names = new Map(categories.map(({ id, name }) => [id, name]));
  return rows.map((row) => missionDto(row, names.get(row.mission.categoryId) ?? ''));
}

export async function missionDetail(userId: string, missionId: number) {
  const row = requireMission(await getMissionStatusesForUser(userId), missionId);
  const [category, acceptedLabels, targetCount] = await Promise.all([
    getMissionCategoryName(row.mission.categoryId),
    getAcceptedLabels(missionId),
    getPrisma().missionTarget.count({ where: { missionId } }),
  ]);
  return { ...missionDto(row, category), acceptedLabels, targetCount };
}

export async function startMissionSession(userId: string, missionId: number) {
  const row = requireMission(await getMissionStatusesForUser(userId), missionId);
  if (row.status === 'locked') throw new AppError('MISSION_LOCKED', 'Prasyarat misi belum selesai');
  const acceptedLabels = await getAcceptedLabels(missionId);
  const id = randomUUID();
  await getPrisma().$transaction(async (tx) => {
    await tx.missionSession.updateMany({
      where: { userId, missionId, status: { in: ['started', 'scanned'] } },
      data: { status: 'abandoned' },
    });
    await tx.missionSession.create({ data: { id, userId, missionId, status: 'started' } });
  });
  return { sessionId: id, acceptedLabels };
}

export async function requestHint(userId: string, sessionId: string) {
  const owned = await getOwnedSession(userId, sessionId);
  if (owned.status === 'completed' || owned.status === 'abandoned') {
    throw new AppError('SESSION_COMPLETED', 'Sesi tidak lagi menerima petunjuk');
  }
  const db = getPrisma();
  const mission = await db.mission.findUnique({ where: { id: owned.missionId } });
  if (!mission) throw new AppError('MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  const result = await db.missionSession.updateMany({
    where: { id: sessionId, userId, status: { in: ['started', 'scanned'] }, hintCount: { lt: 3 } },
    data: { hintCount: { increment: 1 } },
  });
  if (result.count !== 1) {
    const current = await getOwnedSession(userId, sessionId);
    if (current.status === 'completed' || current.status === 'abandoned') {
      throw new AppError('SESSION_COMPLETED', 'Sesi tidak lagi menerima petunjuk');
    }
    throw new AppError('HINT_LIMIT_REACHED', 'Batas petunjuk sesi tercapai');
  }
  const hintCount = owned.hintCount + 1;
  let hint = mission.hintText ?? '';
  if (hintCount === 2) hint = await getMissionCategoryName(mission.categoryId);
  if (hintCount === 3) {
    const target = await db.missionTarget.findFirst({
      where: { missionId: mission.id },
      orderBy: { vocabularyId: 'asc' },
      select: { vocabularyId: true },
    });
    const word = target
      ? await db.vocabularyItem.findUnique({
          where: { id: target.vocabularyId },
          select: { word: true },
        })
      : null;
    const firstCharacter = word?.word.trim().normalize('NFC').slice(0, 1);
    hint = firstCharacter ? `Kata target dimulai dengan “${firstCharacter}”` : '';
  }
  return { hint, hintCount };
}
