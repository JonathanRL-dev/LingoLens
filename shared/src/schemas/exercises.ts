import { z } from 'zod';
import { countSchema, idSchema } from './common';

export const exerciseKindSchema = z.enum(['choice', 'cloze', 'order']);
export const exerciseStateSchema = z
  .object({
    attemptsUsed: z.number().int().min(0).max(2),
    solved: z.boolean(),
    exhausted: z.boolean(),
  })
  .strict();
export const exerciseOptionSchema = z.object({ id: idSchema, text: z.string() }).strict();
const fields = {
  id: idSchema,
  kind: exerciseKindSchema,
  // ASUMSI OpenAPI: index mulai 0; id adalah ID kalimat.
  index: countSchema,
  state: exerciseStateSchema,
};
export const ChoiceExerciseSchema = z
  .object({
    ...fields,
    kind: z.literal('choice'),
    word: z.string(),
    imageUrl: z.string(),
    contextSentence: z.string(),
    options: z.array(exerciseOptionSchema).length(4),
  })
  .strict();
export const ClozeExerciseSchema = z
  .object({
    ...fields,
    kind: z.literal('cloze'),
    parts: z.tuple([z.string(), z.string()]),
    chips: z.array(exerciseOptionSchema).min(3).max(4),
    hintTranslation: z.string(),
    speakText: z.string(),
  })
  .strict();
export const OrderExerciseSchema = z
  .object({
    ...fields,
    kind: z.literal('order'),
    tokens: z.array(exerciseOptionSchema).min(1),
    hintTranslation: z.string(),
    endPunctuation: z.string(),
  })
  .strict();
export const ExerciseSchema = z.discriminatedUnion('kind', [
  ChoiceExerciseSchema,
  ClozeExerciseSchema,
  OrderExerciseSchema,
]);
export const exercisesDataSchema = z.object({ exercises: z.array(ExerciseSchema) }).strict();
export const answerRequestSchema = z
  .object({
    // choice: ID opsi; cloze: ID chip; order: array ID token berurutan.
    // Batas nonkosong mengikuti minLength/minItems pada OpenAPI.
    answer: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  })
  .strict();
export const AnswerData = z
  .object({
    correct: z.boolean(),
    attemptNo: z.number().int().min(1).max(2),
    attemptsLeft: z.number().int().min(0).max(1),
    pointsAwarded: countSchema,
    hint: z.string().optional(),
    correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .strict();
export const answerDataSchema = z.union([
  AnswerData.omit({ correctAnswer: true }),
  AnswerData.extend({ correct: z.literal(false), attemptsLeft: z.literal(0) }),
]);

export const ExerciseKind = exerciseKindSchema;
export const ExerciseState = exerciseStateSchema;
export const ExerciseOption = exerciseOptionSchema;
export const ChoiceExercise = ChoiceExerciseSchema;
export const ClozeExercise = ClozeExerciseSchema;
export const OrderExercise = OrderExerciseSchema;
export const Exercise = ExerciseSchema;
export const AnswerRequest = answerRequestSchema;
export const AnswerResult = answerDataSchema;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ChoiceExercise = z.infer<typeof ChoiceExerciseSchema>;
export type ClozeExercise = z.infer<typeof ClozeExerciseSchema>;
export type OrderExercise = z.infer<typeof OrderExerciseSchema>;
export type ExerciseState = z.infer<typeof exerciseStateSchema>;
export type ExercisesData = z.infer<typeof exercisesDataSchema>;
export type AnswerRequest = z.infer<typeof answerRequestSchema>;
export type AnswerData = z.infer<typeof answerDataSchema>;
export type ExerciseKind = z.infer<typeof exerciseKindSchema>;
export type ExerciseOption = z.infer<typeof exerciseOptionSchema>;
