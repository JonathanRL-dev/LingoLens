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

describe.skipIf(!dbEnabled)('mission and hint endpoints - MySQL', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedMinimal(prisma);
  });
  afterAll(() => prisma.$disconnect());

  it('lists ordered statuses, reward, and keeps the locked word out of the list', async () => {
    const guest = await createGuest();
    const read = await request(getTestApp())
      .get('/api/v1/missions')
      .auth(guest.token, { type: 'bearer' });
    expect(read.status).toBe(200);
    expect(read.body.data.map((row: { id: string }) => row.id)).toEqual(['1', '2']);
    expect(read.body.data.map((row: { status: string }) => row.status)).toEqual(['open', 'locked']);
    expect(read.body.data[0].rewardXp).toBe(110);
    expect(read.body.data[1]).not.toHaveProperty('acceptedLabels');
    expect(read.body.data[1]).not.toHaveProperty('word');
    await prisma.missionSession.create({
      data: {
        id: '00000000-0000-4000-8000-000000000001',
        userId: guest.userId,
        missionId: 1,
        status: 'completed',
        stars: 2,
      },
    });
    const advanced = await request(getTestApp())
      .get('/api/v1/missions')
      .auth(guest.token, { type: 'bearer' });
    expect(advanced.body.data.map((row: { status: string }) => row.status)).toEqual([
      'completed',
      'open',
    ]);
    expect(advanced.body.data[0].bestStars).toBe(2);
    expect((await request(getTestApp()).get('/api/v1/missions')).status).toBe(401);
  });

  it('returns mission details and labels, or 404 for an unknown mission', async () => {
    const guest = await createGuest();
    const detail = await request(getTestApp())
      .get('/api/v1/missions/1')
      .auth(guest.token, { type: 'bearer' });
    expect(detail.status).toBe(200);
    expect(detail.body.data.acceptedLabels).toEqual([
      { model: 'coco-ssd', label: 'cup', minConfidence: 0.6, vocabularyId: '1' },
    ]);
    expect(detail.body.data.targetCount).toBe(1);
    const missing = await request(getTestApp())
      .get('/api/v1/missions/999')
      .auth(guest.token, { type: 'bearer' });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('MISSION_NOT_FOUND');
  });

  it('abandons only active prior sessions and rejects locked or unknown missions', async () => {
    const guest = await createGuest();
    const locked = await request(getTestApp())
      .post('/api/v1/missions/2/sessions')
      .auth(guest.token, { type: 'bearer' });
    expect(locked.status).toBe(409);
    expect(locked.body.error.code).toBe('MISSION_LOCKED');
    const oldStarted = '00000000-0000-4000-8000-000000000011';
    const oldScanned = '00000000-0000-4000-8000-000000000012';
    const oldComplete = '00000000-0000-4000-8000-000000000013';
    await prisma.missionSession.createMany({
      data: [
        { id: oldStarted, userId: guest.userId, missionId: 1, status: 'started' },
        { id: oldScanned, userId: guest.userId, missionId: 1, status: 'scanned' },
        { id: oldComplete, userId: guest.userId, missionId: 1, status: 'completed' },
      ],
    });
    const started = await request(getTestApp())
      .post('/api/v1/missions/1/sessions')
      .auth(guest.token, { type: 'bearer' });
    expect(started.status).toBe(201);
    expect(started.body.data.acceptedLabels[0].label).toBe('cup');
    expect(
      await prisma.missionSession
        .findUniqueOrThrow({ where: { id: oldStarted } })
        .then((row) => row.status),
    ).toBe('abandoned');
    expect(
      await prisma.missionSession
        .findUniqueOrThrow({ where: { id: oldScanned } })
        .then((row) => row.status),
    ).toBe('abandoned');
    expect(
      await prisma.missionSession
        .findUniqueOrThrow({ where: { id: oldComplete } })
        .then((row) => row.status),
    ).toBe('completed');
    expect(
      await prisma.missionSession.count({
        where: { userId: guest.userId, missionId: 1, status: { in: ['started', 'scanned'] } },
      }),
    ).toBe(1);
    const missing = await request(getTestApp())
      .post('/api/v1/missions/999/sessions')
      .auth(guest.token, { type: 'bearer' });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('MISSION_NOT_FOUND');
  });

  it('returns tiered hints, enforces ownership/status/limit, and keeps concurrent calls under three', async () => {
    const guest = await createGuest();
    const other = await createGuest('Other');
    await prisma.mission.update({ where: { id: 1 }, data: { hintText: 'Cari cup' } });
    const sid = '00000000-0000-4000-8000-000000000021';
    await prisma.missionSession.create({ data: { id: sid, userId: guest.userId, missionId: 1 } });
    const hint = () =>
      request(getTestApp())
        .post(`/api/v1/sessions/${sid}/hints`)
        .auth(guest.token, { type: 'bearer' });
    const first = await hint();
    const second = await hint();
    const third = await hint();
    expect([
      first.body.data.hintCount,
      second.body.data.hintCount,
      third.body.data.hintCount,
    ]).toEqual([1, 2, 3]);
    expect(first.body.data.hint).toBe('Cari cup');
    expect(second.body.data.hint).toBe('Benda');
    expect(third.body.data.hint).toBe('Kata target dimulai dengan “c”');
    const exhausted = await hint();
    expect(exhausted.status).toBe(409);
    expect(exhausted.body.error.code).toBe('HINT_LIMIT_REACHED');
    const foreign = await request(getTestApp())
      .post(`/api/v1/sessions/${sid}/hints`)
      .auth(other.token, { type: 'bearer' });
    expect(foreign.status).toBe(404);
    expect(foreign.body.error.code).toBe('SESSION_NOT_FOUND');
    const completedId = '00000000-0000-4000-8000-000000000022';
    await prisma.missionSession.create({
      data: { id: completedId, userId: guest.userId, missionId: 1, status: 'completed' },
    });
    const completed = await request(getTestApp())
      .post(`/api/v1/sessions/${completedId}/hints`)
      .auth(guest.token, { type: 'bearer' });
    expect(completed.status).toBe(409);
    expect(completed.body.error.code).toBe('SESSION_COMPLETED');
    const racingId = '00000000-0000-4000-8000-000000000023';
    await prisma.missionSession.create({
      data: { id: racingId, userId: guest.userId, missionId: 1, hintCount: 2 },
    });
    const race = await Promise.all(
      [1, 2].map(() =>
        request(getTestApp())
          .post(`/api/v1/sessions/${racingId}/hints`)
          .auth(guest.token, { type: 'bearer' }),
      ),
    );
    expect(race.filter((response) => response.status === 200)).toHaveLength(1);
    expect(
      await prisma.missionSession
        .findUniqueOrThrow({ where: { id: racingId } })
        .then((row) => row.hintCount),
    ).toBe(3);
    const abandonedId = '00000000-0000-4000-8000-000000000024';
    await prisma.missionSession.create({
      data: { id: abandonedId, userId: guest.userId, missionId: 1, status: 'abandoned' },
    });
    const abandoned = await request(getTestApp())
      .post(`/api/v1/sessions/${abandonedId}/hints`)
      .auth(guest.token, { type: 'bearer' });
    expect(abandoned.status).toBe(409);
    expect(abandoned.body.error.code).toBe('SESSION_COMPLETED');
  });
});
