import { z } from 'zod';

const envSchema = z
  .object({
    DATABASE_URL: z.string().startsWith('mysql://'),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^[1-9]\d*(ms|s|m|h|d|w|y)$/)
      .default('21d'),
    GLOBAL_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(300).default(300),
    CORS_ORIGIN: z
      .string()
      .transform((value) => value.split(',').map((origin) => origin.trim()))
      .pipe(z.array(z.string().url()).min(1)),
    PORT: z.coerce.number().int().min(1).max(65535),
    NODE_ENV: z.enum(['development', 'test', 'production']),
    DEMO_RESET_KEY: z.string().min(16),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production' && value.JWT_SECRET.startsWith('ganti-')) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'Placeholder tidak boleh dipakai di produksi',
      });
    }
  });

export function loadEnv(source: NodeJS.ProcessEnv) {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    // Jangan sertakan nilai input atau rincian Zod yang dapat memuat rahasia.
    throw new Error('Variabel environment tidak valid: ' + names.join(', '));
  }
  return result.data;
}

export const env = loadEnv(process.env);
