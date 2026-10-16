export const statusByCode = {
  VALIDATION_ERROR: 422, UNAUTHORIZED: 401, NOT_FOUND: 404, EXERCISE_NOT_FOUND: 404,
  MISSION_LOCKED: 409, SESSION_COMPLETED: 409, SESSION_NOT_SCANNED: 409,
  ATTEMPTS_EXHAUSTED: 409, PRACTICE_INCOMPLETE: 409, RATE_LIMITED: 429, INTERNAL_ERROR: 500,
} as const;
// Sementara dari tabel prompt: main belum mengekspor ErrorCodeSchema dari @shared.
export type ErrorCode = Exclude<keyof typeof statusByCode, 'INTERNAL_ERROR'>;
export type AppErrorCode = ErrorCode | 'INTERNAL_ERROR';
export class AppError extends Error {
  readonly status: number;
  constructor(readonly code: AppErrorCode, message: string, readonly details: unknown = null) {
    super(message);
    this.name = 'AppError';
    this.status = statusByCode[code];
  }
}
