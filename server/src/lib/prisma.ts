import { PrismaClient } from '@prisma/client';

let client: PrismaClient | undefined;

// Satu client per proses; konstruksi ditunda agar kegagalan inisialisasi menjadi degraded.
export function getPrisma(): PrismaClient {
  return (client ??= new PrismaClient());
}
