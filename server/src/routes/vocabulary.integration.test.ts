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

describe.skipIf(!dbEnabled)('GET /vocabulary/:id - MySQL', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedMinimal(prisma);
  });
  afterAll(() => prisma.$disconnect());
  it('uncollected and nonexistent vocabulary have identical 404 responses', async () => {
    const guest = await createGuest();
    const read = (id: string) =>
      request(getTestApp())
        .get('/api/v1/vocabulary/' + id)
        .auth(guest.token, { type: 'bearer' });
    const locked = await read('1');
    const missing = await read('9999');
    expect(locked.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(locked.body).toEqual(missing.body);
    expect(locked.body.error.code).toBe('NOT_FOUND');
  });
  it('returns only choice sentence, intact Mandarin/romanization, and no answer metadata', async () => {
    const guest = await createGuest();
    await prisma.userVocabulary.create({ data: { userId: guest.userId, vocabularyId: 1 } });
    const result = await request(getTestApp())
      .get('/api/v1/vocabulary/1')
      .auth(guest.token, { type: 'bearer' });
    expect(result.status).toBe(200);
    expect(result.body.data.exampleSentence.text).toBe('This is a cup.');
    expect(result.body.data.translations).toContainEqual({
      languageCode: 'zh-CN',
      translation: '\u676f\u5b50',
      romanization: 'bei zi',
    });
    expect(result.body.data.exampleSentence.translations[0].text).toBe(
      '\u8fd9\u662f\u4e00\u4e2a\u676f\u5b50\u3002',
    );
    expect(JSON.stringify(result.body)).not.toMatch(
      /___|correctAnswer|blankWord|wordsJson|passwordHash/,
    );
  });
  it('mini-seed can run twice without duplicate rows', async () => {
    await seedMinimal(prisma);
    expect(await prisma.vocabularyItem.count()).toBe(2);
    expect(await prisma.mission.count()).toBe(2);
    expect(await prisma.vocabularySentence.count()).toBe(6);
    expect(await prisma.missionTarget.count()).toBe(2);
  });
});
