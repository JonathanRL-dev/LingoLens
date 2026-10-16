import { getPrisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

/** Return only a session owned by the caller; missing and foreign IDs are indistinguishable. */
export async function getOwnedSession(userId: string, sessionId: string) {
  const session = await getPrisma().missionSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new AppError('SESSION_NOT_FOUND', 'Sesi tidak ditemukan');
  return session;
}
