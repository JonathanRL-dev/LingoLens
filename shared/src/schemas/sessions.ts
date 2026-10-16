import { z } from 'zod';
import { confidenceSchema, countSchema, idSchema, scoreSchema } from './common';
import { acceptedLabelSchema, nextMissionSchema } from './missions';
import { vocabularyDataSchema } from './vocabulary';

export const startSessionDataSchema = z
  .object({
    sessionId: idSchema,
    acceptedLabels: z.array(acceptedLabelSchema),
  })
  .strict();
export const hintDataSchema = z.object({ hint: z.string(), hintCount: countSchema }).strict();
export const scanRequestSchema = z
  .object({
    label: z.string(),
    confidence: confidenceSchema,
    model: z.string(),
    latencyMs: z.number().min(0),
  })
  .strict();
export const scanDataSchema = z
  .object({
    matched: z.boolean(),
    alreadyCollected: z.boolean(),
    vocabulary: vocabularyDataSchema.optional(),
    xpAwarded: countSchema.describe(
      'XP pindai yang akan dikreditkan saat complete; bukan kredit langsung.',
    ),
  })
  .strict();
export const pronunciationRequestSchema = z
  .object({
    heardText: z.string(),
    recognitionConfidence: confidenceSchema.optional(),
    sentenceId: idSchema.optional(),
  })
  .strict();
export const pronunciationDataSchema = z
  .object({
    score: scoreSchema,
    level: z.enum(['good', 'almost', 'retry']),
    passed: z.boolean(),
    feedback: z.string(),
    targetWordHeard: z.boolean(),
  })
  .strict();
export const completeRequestSchema = z
  .object({
    skippedPractice: z.boolean().optional(),
    skippedSpeak: z.boolean().optional(),
  })
  .strict();
export const completeDataSchema = z
  .object({
    stars: z.number().int().min(1).max(3),
    sessionScore: scoreSchema,
    practiceAccuracy: scoreSchema,
    speakScore: scoreSchema,
    xpBreakdown: z
      .object({ scanXp: countSchema, practiceXp: countSchema, speakXp: countSchema })
      .strict(),
    totalXpAwarded: countSchema,
    levelUp: z.boolean(),
    newLevel: z.number().int().min(1),
    xpInLevel: countSchema,
    xpForNextLevel: countSchema,
    collectedWord: vocabularyDataSchema,
    alreadyCollected: z.boolean(),
    nextMission: nextMissionSchema,
  })
  .strict();

export const completeSessionRequestSchema = completeRequestSchema;
export const completeSessionDataSchema = completeDataSchema;
export const ScanRequest = scanRequestSchema;
export const PronunciationRequest = pronunciationRequestSchema;
export const CompleteRequest = completeRequestSchema;
export const PronunciationData = pronunciationDataSchema;
export const CompleteData = completeDataSchema;
export type StartSessionData = z.infer<typeof startSessionDataSchema>;
export type HintData = z.infer<typeof hintDataSchema>;
export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type ScanData = z.infer<typeof scanDataSchema>;
export type PronunciationRequest = z.infer<typeof pronunciationRequestSchema>;
export type PronunciationData = z.infer<typeof pronunciationDataSchema>;
export type CompleteRequest = z.infer<typeof completeRequestSchema>;
export type CompleteData = z.infer<typeof completeDataSchema>;
export type CompleteSessionRequest = z.infer<typeof completeSessionRequestSchema>;
export type CompleteSessionData = z.infer<typeof completeSessionDataSchema>;
