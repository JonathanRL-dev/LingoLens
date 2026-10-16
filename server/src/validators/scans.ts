import { z } from 'zod';

export const scanAttemptRequestSchema = z
  .object({
    model: z.string().trim().min(1).max(20),
    label: z.string().trim().min(1).max(60),
    confidence: z.number().finite().min(0).max(1),
    latencyMs: z.number().finite().min(0).max(2147483647),
  })
  .strict();
