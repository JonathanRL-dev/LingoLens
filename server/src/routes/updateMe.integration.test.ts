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

describe.skipIf(!dbEnabled)('PATCH /me - MySQL', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedMinimal(prisma);
  });
  afterAll(() => prisma.$disconnect());
  it('updates nickname and avatar independently, supports clearing avatar', async () => {
    const guest = await createGuest();
    const patch = (body: object) =>
      request(getTestApp()).patch('/api/v1/me').auth(guest.token, { type: 'bearer' }).send(body);
    expect((await patch({ nickname: ' Dewi ', avatarKey: 'owl' })).body.data).toMatchObject({
      nickname: 'Dewi',
      avatarKey: 'owl',
    });
    expect((await patch({ avatarKey: null })).body.data).toMatchObject({
      nickname: 'Dewi',
      avatarKey: null,
    });
    expect((await patch({})).status).toBe(200);
  });
  it.each([
    { nickname: '  ' },
    { nickname: 'b4b1' },
    { totalXp: 999 },
    { avatarKey: 'x'.repeat(81) },
  ])('rejects invalid/unknown fields %j', async (body) => {
    const guest = await createGuest();
    const result = await request(getTestApp())
      .patch('/api/v1/me')
      .auth(guest.token, { type: 'bearer' })
      .send(body);
    expect(result.status).toBe(422);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: guest.userId } })).totalXp).toBe(20);
  });
});
