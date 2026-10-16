import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createGuest,
  dbEnabled,
  getTestApp,
  prisma,
  resetDatabase,
  seedMinimal,
} from '../test/helpers';

describe.skipIf(!dbEnabled)('GET /me/collection - MySQL', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedMinimal(prisma);
  });
  afterAll(() => prisma.$disconnect());
  it('locked cards contain only ID/image and no word, meaning, category or answer', async () => {
    const guest = await createGuest();
    const result = await request(getTestApp())
      .get('/api/v1/me/collection')
      .auth(guest.token, { type: 'bearer' });
    expect(result.status).toBe(200);
    expect(result.body.data).toHaveLength(2);
    for (const item of result.body.data) {
      expect(item.collected).toBe(false);
      expect(Object.keys(item.vocabulary).sort()).toEqual(['id', 'imageUrl']);
      expect(JSON.stringify(item)).not.toMatch(
        /cup|book|cangkir|buku|Benda|correctAnswer|blankWord|wordsJson/,
      );
    }
  });
  it('collected cards are complete, related uncollected cards remain silhouettes', async () => {
    const guest = await createGuest();
    await prisma.userVocabulary.create({
      data: { userId: guest.userId, vocabularyId: 1, bestScore: 85 },
    });
    const result = await request(getTestApp())
      .get('/api/v1/me/collection')
      .auth(guest.token, { type: 'bearer' });
    expect(result.body.data[0]).toMatchObject({
      collected: true,
      bestScore: 85,
      vocabulary: { word: 'cup', meaning: 'cangkir' },
    });
    expect(Object.keys(result.body.data[0].vocabulary.related[0]).sort()).toEqual([
      'id',
      'imageUrl',
    ]);
    expect(result.body.data[1].collected).toBe(false);
  });
});
