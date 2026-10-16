import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { levelInfo, WELCOME_XP } from '@shared';
import { getPrisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { issueGuestToken } from '../lib/tokens';

type Database = Prisma.TransactionClient;

/** DTO publik; tidak mengirim email, hash password, atau field database internal. */
export async function getProfile(userId: string, database: Database = getPrisma()) {
  const user = await database.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('UNAUTHORIZED', 'Autentikasi tidak sah');
  const collectedCount = await database.userVocabulary.count({ where: { userId } });
  return {
    id: user.id,
    nickname: user.nickname,
    avatarKey: user.avatarKey,
    totalXp: user.totalXp,
    ...levelInfo(user.totalXp),
    streak: user.streakCount,
    collectedCount,
  };
}

/** Pengguna dan tepat satu event welcome dibuat secara atomik. */
export async function createGuest(nickname: string) {
  const user = await getPrisma().$transaction(async (tx) => {
    const id = randomUUID();
    await tx.user.create({
      data: {
        id,
        nickname,
        totalXp: WELCOME_XP,
        level: levelInfo(WELCOME_XP).level,
        streakCount: 0,
      },
    });
    await tx.xpEvent.create({ data: { userId: id, source: 'welcome', amount: WELCOME_XP } });
    return getProfile(id, tx);
  });
  return { token: issueGuestToken(user.id), user };
}

/** Field yang dapat diperbarui telah dibatasi validator sebelum mencapai service. */
export async function updateProfile(
  userId: string,
  fields: { nickname?: string; avatarKey?: string | null },
) {
  return getPrisma().$transaction(async (tx) => {
    await getProfile(userId, tx);
    await tx.user.update({ where: { id: userId }, data: fields });
    return getProfile(userId, tx);
  });
}

/** Reset hanya milik pengguna JWT; seluruh penghapusan dan welcome berada dalam satu transaksi. */
export async function resetProfile(userId: string): Promise<void> {
  await getPrisma().$transaction(
    async (tx) => {
      await getProfile(userId, tx);
      const sessions = await tx.missionSession.findMany({
        where: { userId },
        select: { id: true },
      });
      const where = { sessionId: { in: sessions.map((session) => session.id) } };
      await tx.scanAttempt.deleteMany({ where });
      await tx.exerciseAttempt.deleteMany({ where });
      await tx.pronunciationAttempt.deleteMany({ where });
      await tx.xpEvent.deleteMany({ where: { userId } });
      await tx.missionSession.deleteMany({ where: { userId } });
      await tx.userVocabulary.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: {
          totalXp: WELCOME_XP,
          level: levelInfo(WELCOME_XP).level,
          streakCount: 0,
          lastActiveDate: null,
        },
      });
      await tx.xpEvent.create({ data: { userId, source: 'welcome', amount: WELCOME_XP } });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
