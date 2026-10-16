import { z } from 'zod';

export const exerciseParamsSchema = z
  .object({
    sid: z.string().min(1).max(36),
    eid: z.string().min(1).max(36),
  })
  .strict();

export const answerRequestSchema = z
  .object({
    answer: z.union([z.string().min(1).max(255), z.array(z.string().min(1).max(255)).min(1)]),
  })
  .strict();

export const pronunciationRequestSchema = z
  .object({
    heardText: z.string().min(1).max(255),
    recognitionConfidence: z.number().finite().min(0).max(1).optional(),
    sentenceId: z.string().min(1).max(64).optional(),
  })
  .strict();
