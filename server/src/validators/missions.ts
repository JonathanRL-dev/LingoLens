import { z } from 'zod';

const id = z
  .string()
  .regex(/^[1-9]\d*$/)
  .refine((value) => Number(value) <= 2147483647);
export const missionParamsSchema = z.object({ id }).strict();
export const sessionParamsSchema = z.object({ sid: z.string().min(1).max(36) }).strict();
