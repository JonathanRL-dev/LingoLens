import { describe, expect, it } from 'vitest';
import {
  cumulativeThreshold,
  isNextDay,
  jakartaDateKey,
  levelFromXp,
  levelInfo,
  xpForNextLevel,
  xpInLevel,
} from './levels';

describe('level', () => {
  it('cumulativeThreshold', () => {
    expect(cumulativeThreshold(1)).toBe(0);
    expect(cumulativeThreshold(2)).toBe(100);
    expect(cumulativeThreshold(3)).toBe(300);
    expect(cumulativeThreshold(4)).toBe(600);
  });

  it.each([
    [0, 1, 0, 100],
    [99, 1, 99, 100],
    [100, 2, 0, 200],
    [130, 2, 30, 200],
    [299, 2, 199, 200],
    [300, 3, 0, 300],
    [600, 4, 0, 400],
  ])('XP %i â†’ level %i, xpInLevel %i, next %i', (xp, level, inLevel, next) => {
    expect(levelFromXp(xp)).toBe(level);
    expect(xpInLevel(xp)).toBe(inLevel);
    expect(xpForNextLevel(level)).toBe(next);
    expect(levelInfo(xp)).toEqual({ level, xpInLevel: inLevel, xpForNextLevel: next });
  });

  it('XP negatif diperlakukan sebagai 0', () => {
    expect(levelFromXp(-50)).toBe(1);
    expect(xpInLevel(-50)).toBe(0);
  });
});

describe('jakartaDateKey', () => {
  it('23:59 WIB masih tanggal 15', () => {
    expect(jakartaDateKey(new Date('2026-10-15T16:59:59Z'))).toBe('2026-10-15');
  });
  it('00:00 WIB sudah tanggal 16', () => {
    expect(jakartaDateKey(new Date('2026-10-15T17:00:00Z'))).toBe('2026-10-16');
  });
  it('dua timestamp itu menghasilkan tanggal berbeda', () => {
    expect(jakartaDateKey(new Date('2026-10-15T16:59:59Z'))).not.toBe(
      jakartaDateKey(new Date('2026-10-15T17:00:00Z')),
    );
  });
});

describe('isNextDay', () => {
  it('hari biasa', () => {
    expect(isNextDay('2026-10-15', '2026-10-16')).toBe(true);
  });
  it('pergantian bulan', () => {
    expect(isNextDay('2026-01-31', '2026-02-01')).toBe(true);
    expect(isNextDay('2026-04-30', '2026-05-01')).toBe(true);
  });
  it('pergantian tahun', () => {
    expect(isNextDay('2026-12-31', '2027-01-01')).toBe(true);
  });
  it('tahun kabisat', () => {
    expect(isNextDay('2028-02-28', '2028-02-29')).toBe(true);
    expect(isNextDay('2028-02-29', '2028-03-01')).toBe(true);
    expect(isNextDay('2027-02-28', '2027-03-01')).toBe(true);
    expect(isNextDay('2027-02-28', '2027-02-29')).toBe(false);
  });
  it('bukan hari berikutnya', () => {
    expect(isNextDay('2026-10-15', '2026-10-15')).toBe(false);
    expect(isNextDay('2026-10-15', '2026-10-17')).toBe(false);
    expect(isNextDay('2026-10-16', '2026-10-15')).toBe(false);
  });
  it('format tidak valid', () => {
    expect(isNextDay('2026-1-5', '2026-01-06')).toBe(false);
    expect(isNextDay('2026-13-01', '2026-13-02')).toBe(false);
  });
});
describe('streak tengah malam WIB', () => {
  it('dua detik berurutan melintasi tengah malam meneruskan streak', () => {
    const before = jakartaDateKey(new Date('2026-10-15T16:59:59Z'));
    const after = jakartaDateKey(new Date('2026-10-15T17:00:01Z'));
    expect(before).toBe('2026-10-15');
    expect(after).toBe('2026-10-16');
    expect(isNextDay(before, after)).toBe(true);
    expect(isNextDay(before, before)).toBe(false);
    expect(isNextDay(after, before)).toBe(false);
  });
});

describe('batas numerik dan kemurnian level', () => {
  it.each([NaN, Infinity, -Infinity])('XP non-finite %s diperlakukan sebagai nol', (xp) => {
    expect(levelInfo(xp)).toEqual({ level: 1, xpInLevel: 0, xpForNextLevel: 100 });
  });
  it('XP welcome 20 berada pada level satu dan deterministik', () => {
    expect(levelInfo(20)).toEqual({ level: 1, xpInLevel: 20, xpForNextLevel: 100 });
    expect(levelInfo(130)).toEqual(levelInfo(130));
  });
  it('menangani batas level besar tanpa iterasi per level', () => {
    const level = 10_000_000;
    const threshold = cumulativeThreshold(level);
    expect(levelFromXp(threshold - 1)).toBe(level - 1);
    expect(levelFromXp(threshold)).toBe(level);
    expect(levelFromXp(Number.MAX_SAFE_INTEGER)).toBeGreaterThan(level);
  });
  it('menolak XP yang melampaui presisi integer aman', () => {
    expect(() => levelFromXp(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});
