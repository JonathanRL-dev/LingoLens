import { z } from 'zod';
import { countSchema, idSchema } from './common';

// Aturan kata kasar berada di server; shared hanya memvalidasi bentuk nickname.
export const nicknameSchema = z.string().trim().min(1).max(20);
export const userSchema = z
  .object({
    id: idSchema,
    nickname: z.string(),
    level: z.number().int().min(1),
    totalXp: countSchema,
    xpInLevel: countSchema,
    xpForNextLevel: countSchema,
    streak: countSchema,
    collectedCount: countSchema,
    avatarKey: z.string().optional(),
  })
  .strict();
export const guestRequestSchema = z.object({ nickname: nicknameSchema }).strict();
export const guestDataSchema = z.object({ token: z.string(), user: userSchema }).strict();
export const meDataSchema = userSchema;
export const updateMeRequestSchema = z
  .object({
    nickname: nicknameSchema.optional(),
    avatarKey: z.string().optional(),
  })
  .strict();
export const updateMeDataSchema = userSchema;
// ASUMSI M2: header wajib reset demo adalah X-Demo-Key; tidak memakai JWT.
export const resetHeadersSchema = z.object({ 'X-Demo-Key': z.string().min(1) }).strict();
// Status 204 tidak memiliki body atau amplop sukses.
export const resetResponseSchema = z.undefined();

export const createGuestRequestSchema = guestRequestSchema;
export const createGuestDataSchema = guestDataSchema;
export const User = userSchema;
export const Nickname = nicknameSchema;
export const GuestRequest = guestRequestSchema;
export const UpdateMeRequest = updateMeRequestSchema;
export type User = z.infer<typeof userSchema>;
export type GuestRequest = z.infer<typeof guestRequestSchema>;
export type GuestData = z.infer<typeof guestDataSchema>;
export type CreateGuestRequest = z.infer<typeof createGuestRequestSchema>;
export type CreateGuestData = z.infer<typeof createGuestDataSchema>;
export type MeData = z.infer<typeof meDataSchema>;
export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>;
export type UpdateMeData = z.infer<typeof updateMeDataSchema>;
export type ResetHeaders = z.infer<typeof resetHeadersSchema>;
export type Nickname = z.infer<typeof nicknameSchema>;
export type ResetResponse = z.infer<typeof resetResponseSchema>;
