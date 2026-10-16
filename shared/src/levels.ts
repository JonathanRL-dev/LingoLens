import { APP_TIMEZONE, LEVEL_STEP } from './constants';

const MIN_LEVEL = 1;

export interface LevelInfo {
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
}

/** Total XP minimum untuk mencapai level n. */
export function cumulativeThreshold(n: number): number {
  return (LEVEL_STEP * n * (n - 1)) / 2;
}

function sanitizeXp(totalXp: number): number {
  if (Number.isFinite(totalXp) && totalXp > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('totalXp exceeds safe integer precision');
  }
  return Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0;
}

export function levelFromXp(totalXp: number): number {
  const xp = sanitizeXp(totalXp);
  // Invers rumus kuadrat menghindari loop yang bertambah bersama total XP.
  let level = Math.max(MIN_LEVEL, Math.floor((1 + Math.sqrt(1 + (8 * xp) / LEVEL_STEP)) / 2));
  while (cumulativeThreshold(level + 1) <= xp) level++;
  // Koreksi pembulatan floating point pada batas level.
  while (cumulativeThreshold(level) > xp) level--;
  return level;
}

export function xpInLevel(totalXp: number): number {
  const xp = sanitizeXp(totalXp);
  return xp - cumulativeThreshold(levelFromXp(xp));
}

export function xpForNextLevel(level: number): number {
  return LEVEL_STEP * level;
}

export function levelInfo(totalXp: number): LevelInfo {
  const level = levelFromXp(totalXp);
  return {
    level,
    xpInLevel: xpInLevel(totalXp),
    xpForNextLevel: xpForNextLevel(level),
  };
}

// ---------- Streak (WIB) ----------

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Tanggal kalender WIB dalam format YYYY-MM-DD. */
export function jakartaDateKey(date: Date): string {
  const parts = dateKeyFormatter.formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y: number, m: number): number {
  const lengths = [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[m - 1] ?? 31;
}

function parseKey(key: string): [number, number, number] | null {
  const match = DATE_KEY_PATTERN.exec(key);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return [y, m, d];
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

/** true jika nextKey tepat sehari setelah prevKey (murni dari komponen tanggal). */
export function isNextDay(prevKey: string, nextKey: string): boolean {
  const prev = parseKey(prevKey);
  if (!prev || !parseKey(nextKey)) return false;
  const [y, m, d] = prev;

  let ny = y;
  let nm = m;
  let nd = d + 1;
  if (nd > daysInMonth(y, m)) {
    nd = 1;
    nm = m + 1;
    if (nm > 12) {
      nm = 1;
      ny = y + 1;
    }
  }
  return nextKey === `${pad(ny, 4)}-${pad(nm, 2)}-${pad(nd, 2)}`;
}

// Alias untuk pemanggil Fase 9; rumus tetap satu implementasi.
export const batasKumulatif = cumulativeThreshold;
export const levelDariXp = levelFromXp;
export const xpUntukNaik = xpForNextLevel;
