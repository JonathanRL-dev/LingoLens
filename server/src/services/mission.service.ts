import type { Prisma } from '@prisma/client';
import { getPrisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

export type MissionStatus = 'completed' | 'open' | 'locked';
export type MissionWithStatus = {
  mission: Prisma.MissionGetPayload<object>;
  status: MissionStatus;
  bestStars: number;
};

/** Read active missions and this user's completed sessions in two bounded queries. */
export async function getMissionStatusesForUser(
  userId: string,
  database: Prisma.TransactionClient | ReturnType<typeof getPrisma> = getPrisma(),
): Promise<MissionWithStatus[]> {
  const db = database;
  const [missions, completed] = await Promise.all([
    db.mission.findMany({ where: { isActive: true }, orderBy: { orderIndex: 'asc' } }),
    db.missionSession.findMany({
      where: { userId, status: 'completed' },
      select: { missionId: true, stars: true },
    }),
  ]);
  const completedIds = new Set(completed.map((session) => session.missionId));
  const bestStars = new Map<number, number>();
  for (const session of completed) {
    const stars = session.stars ?? 0;
    bestStars.set(session.missionId, Math.max(bestStars.get(session.missionId) ?? 0, stars));
  }
  return missions.map((mission) => ({
    mission,
    status: completedIds.has(mission.id)
      ? 'completed'
      : mission.prerequisiteMissionId === null || completedIds.has(mission.prerequisiteMissionId)
        ? 'open'
        : 'locked',
    bestStars: bestStars.get(mission.id) ?? 0,
  }));
}

export function requireMission(rows: MissionWithStatus[], id: number): MissionWithStatus {
  const row = rows.find(({ mission }) => mission.id === id);
  if (!row) throw new AppError('MISSION_NOT_FOUND', 'Misi tidak ditemukan');
  return row;
}

export function rewardXp(mission: MissionWithStatus['mission']): number {
  return mission.scanXp + mission.practiceXp + mission.speakXp;
}

export async function getMissionCategoryName(categoryId: number): Promise<string> {
  const category = await getPrisma().category.findUnique({
    where: { id: categoryId },
    select: { name: true },
  });
  if (!category) throw new AppError('INTERNAL_ERROR', 'Kategori misi tidak tersedia');
  return category.name;
}

export async function getAcceptedLabels(missionId: number) {
  const db = getPrisma();
  const targets = await db.missionTarget.findMany({
    where: { missionId },
    orderBy: { vocabularyId: 'asc' },
    select: { vocabularyId: true },
  });
  const labels = await db.detectionLabel.findMany({
    where: { vocabularyId: { in: targets.map(({ vocabularyId }) => vocabularyId) } },
    orderBy: [{ vocabularyId: 'asc' }, { id: 'asc' }],
  });
  return labels.map((entry) => ({
    model: entry.model,
    label: entry.label,
    minConfidence: Number(entry.minConfidence),
    vocabularyId: String(entry.vocabularyId),
  }));
}

export function missionDto(row: MissionWithStatus, category: string) {
  const difficulty =
    ['easy', 'medium', 'hard'][Math.max(0, Math.min(2, row.mission.difficulty - 1))] ?? 'easy';
  const plan = Array.isArray(row.mission.exercisePlan) ? row.mission.exercisePlan : [];
  return {
    id: String(row.mission.id),
    slug: row.mission.slug,
    title: row.mission.titleId,
    ...(row.mission.hintText === null ? {} : { hint: row.mission.hintText }),
    category,
    difficulty,
    rewardXp: rewardXp(row.mission),
    status: row.status,
    bestStars: row.bestStars,
    exercisePlan: plan,
  };
}
