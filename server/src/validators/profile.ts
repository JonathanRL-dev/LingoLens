import { z } from 'zod';
import { containsProfanity } from '../lib/profanity';

// Kontrak Fase 1 menerima satu karakter; batas 20 mengikuti kebijakan nickname proyek.
export const nicknameSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .refine((value) => !containsProfanity(value), { message: 'Nickname tidak diizinkan' });
export const createGuestRequestSchema = z.object({ nickname: nicknameSchema }).strict();
export const updateMeRequestSchema = z
  .object({
    nickname: nicknameSchema.optional(),
    avatarKey: z.string().max(80).nullable().optional(),
  })
  .strict();
export const vocabularyParamsSchema = z
  .object({
    id: z
      .string()
      .regex(/^[1-9]\d*$/)
      .refine((value) => Number(value) <= 2147483647),
  })
  .strict();
