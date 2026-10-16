import { z } from 'zod';

export const completeRequestSchema = z
  .object({
    skippedPractice: z.boolean().optional(),
    skippedSpeak: z.boolean().optional(),
  })
  .strict();
