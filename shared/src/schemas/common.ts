import { z } from 'zod';

export const idSchema = z.string().min(1);
export const countSchema = z.number().int().min(0);
export const scoreSchema = z.number().min(0).max(100);
export const confidenceSchema = z.number().min(0).max(1);
export const ErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'NOT_FOUND',
  'MISSION_LOCKED',
  'SESSION_COMPLETED',
  'RATE_LIMITED',
  'SESSION_NOT_SCANNED',
  'ATTEMPTS_EXHAUSTED',
  'EXERCISE_NOT_FOUND',
  'PRACTICE_INCOMPLETE',
]);
export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z
      .object({
        code: ErrorCodeSchema,
        message: z.string(),
        // ASUMSI OpenAPI: details berupa objek bebas atau null.
        details: z.record(z.string(), z.unknown()).nullable(),
      })
      .strict(),
  })
  .strict();
export function successSchema<T extends z.ZodType>(data: T) {
  return z.object({ success: z.literal(true), data }).strict();
}
export const healthDataSchema = z.object({ status: z.string(), db: z.string() }).strict();

// Alias menjaga kompatibilitas registry generator yang sudah ada.
export const ErrorCode = ErrorCodeSchema;
export const ErrorResponse = errorResponseSchema;
export const success = successSchema;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type HealthData = z.infer<typeof healthDataSchema>;
