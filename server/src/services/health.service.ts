import { getPrisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

/** Memeriksa koneksi database tanpa membaca tabel aplikasi. */
export async function checkHealth() {
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'ok' } as const;
  } catch {
    throw new AppError('INTERNAL_ERROR', 'Database tidak tersedia', {
      status: 'degraded',
      db: 'error',
    });
  }
}
