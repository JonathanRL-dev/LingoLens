import '../../test/setup';
import request from 'supertest';
import { createApp } from '../../app';
import { getPrisma } from '../../lib/prisma';
export { seedMinimal } from './seedMinimal';
export const prisma = getPrisma();
export const dbEnabled = process.env.RUN_DB_TESTS === '1';

export function getTestApp() {
  return createApp();
}

/** Fail closed: cleanup tidak dapat dijalankan di database dev atau saat gate DB mati. */
export async function resetDatabase(): Promise<void> {
  const active = new URL(process.env.DATABASE_URL ?? '');
  const expected = new URL(process.env.DATABASE_URL_TEST ?? '');
  if (
    !dbEnabled ||
    active.href !== expected.href ||
    !/^\/[a-zA-Z0-9_]+_test$/.test(active.pathname)
  ) {
    throw new Error('Refusing reset outside explicitly enabled test database');
  }
  await prisma.$transaction([
    prisma.exerciseAttempt.deleteMany(),
    prisma.scanAttempt.deleteMany(),
    prisma.pronunciationAttempt.deleteMany(),
    prisma.xpEvent.deleteMany(),
    prisma.userVocabulary.deleteMany(),
    prisma.missionSession.deleteMany(),
    prisma.missionTarget.deleteMany(),
    prisma.mission.deleteMany(),
    prisma.sentenceTranslation.deleteMany(),
    prisma.vocabularySentence.deleteMany(),
    prisma.vocabularyRelation.deleteMany(),
    prisma.vocabularyTranslation.deleteMany(),
    prisma.detectionLabel.deleteMany(),
    prisma.vocabularyItem.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function createGuest(nickname = 'Guest'): Promise<{ token: string; userId: string }> {
  const response = await request(getTestApp()).post('/api/v1/auth/guest').send({ nickname });
  if (response.status !== 201) throw new Error('createGuest helper failed: ' + response.status);
  return { token: response.body.data.token, userId: response.body.data.user.id };
}
