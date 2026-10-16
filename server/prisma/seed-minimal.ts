import { PrismaClient } from '@prisma/client';
import { seedMinimal } from '../src/test/helpers/seedMinimal';

// Seed eksplisit untuk dev/demo; tidak menjalankan cleanup atau memakai helper DB uji.
const prisma = new PrismaClient();
seedMinimal(prisma)
  .then(() => console.info('Mini-seed siap: 2 kata dan 2 misi.'))
  .catch(() => {
    console.error('Mini-seed gagal; periksa koneksi dan migrasi.');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
