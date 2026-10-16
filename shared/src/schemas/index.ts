import { z } from 'zod';

// ASUMSI: ID API berupa string nonkosong (termasuk ID kalimat dan opsi).
const id = z.string().min(1);
const text = z.string();
const count = z.number().int().min(0);
const score = z.number().min(0).max(100);
const confidence = z.number().min(0).max(1);
const object = z.strictObject;

export const ErrorCode = z.enum([
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
export const ErrorResponse = object({
  success: z.literal(false),
  error: object({
    code: ErrorCode,
    message: text,
    // ASUMSI: details berupa objek bebas atau null; tanpa bidang tambahan wajib.
    details: z.record(z.string(), z.unknown()).nullable(),
  }),
});
export const User = object({
  id,
  nickname: text,
  level: z.number().int().min(1),
  totalXp: count,
  xpInLevel: count,
  xpForNextLevel: count,
  streak: count,
  collectedCount: count,
  avatarKey: text.optional(),
});
// ASUMSI: Bentuk translations, related, dan exampleSentence belum dirinci.
// Objek terbuka tanpa bidang wajib; tidak menebak kontrak data Fase 2.
const unspecifiedObject = z.looseObject({});
export const Vocabulary = object({
  id,
  word: text,
  phonetic: text,
  meaning: text,
  imageUrl: text,
  category: text,
  translations: z.array(unspecifiedObject),
  exampleSentence: unspecifiedObject,
  related: z.array(unspecifiedObject),
});
export const ExerciseKind = z.enum(['choice', 'cloze', 'order']);
export const AcceptedLabel = object({
  model: text,
  label: text,
  minConfidence: confidence,
  vocabularyId: id,
});
export const Mission = object({
  id,
  slug: text,
  title: text,
  hint: text.optional(),
  category: text,
  // ASUMSI: Nilai difficulty dan status belum ditetapkan; teks tanpa enum rekaan.
  difficulty: text,
  rewardXp: count,
  status: text,
  bestStars: z.number().int().min(0).max(3),
  exercisePlan: z.array(ExerciseKind),
});
export const MissionDetail = Mission.extend({
  acceptedLabels: z.array(AcceptedLabel),
  targetCount: count,
});
export const nextMission = Mission.nullable();
export const ExerciseState = object({
  attemptsUsed: z.number().int().min(0).max(2),
  solved: z.boolean(),
  exhausted: z.boolean(),
});
const exerciseFields = {
  id,
  kind: ExerciseKind,
  // ASUMSI: index dimulai dari 0.
  index: count,
  state: ExerciseState,
};
export const ExerciseOption = object({ id, text });
export const ChoiceExercise = object({
  ...exerciseFields,
  kind: z.literal('choice'),
  word: text,
  imageUrl: text,
  contextSentence: text,
  options: z.array(ExerciseOption).length(4),
});
export const ClozeExercise = object({
  ...exerciseFields,
  kind: z.literal('cloze'),
  parts: z.tuple([text, text]),
  chips: z.array(ExerciseOption).min(3).max(4),
  hintTranslation: text,
  speakText: text,
});
export const OrderExercise = object({
  ...exerciseFields,
  kind: z.literal('order'),
  tokens: z.array(ExerciseOption).min(1),
  hintTranslation: text,
  endPunctuation: text,
});
export const Exercise = z.discriminatedUnion('kind', [
  ChoiceExercise,
  ClozeExercise,
  OrderExercise,
]);
// Kebijakan kata kasar wajib dipasok pemanggil; bukan daftar tersembunyi dalam kontrak.
export const Nickname = z.string().min(1).regex(/\S/, 'Nickname tidak boleh kosong');
export function nicknameWithPolicy(isAllowed: (nickname: string) => boolean) {
  return Nickname.refine(isAllowed, 'Nickname tidak diizinkan');
}
export const GuestRequest = object({ nickname: Nickname });
export const UpdateMeRequest = object({
  nickname: Nickname.optional(),
  avatarKey: text.optional(),
});
export const ScanRequest = object({
  label: text,
  confidence,
  model: text,
  latencyMs: z.number().min(0),
});
export const AnswerRequest = object({ answer: z.union([id, z.array(id).min(1)]) });
export const PronunciationRequest = object({
  heardText: text,
  recognitionConfidence: confidence.optional(),
  sentenceId: id.optional(),
});
export const CompleteRequest = object({
  skippedPractice: z.boolean().optional(),
  skippedSpeak: z.boolean().optional(),
});
export const AnswerData = object({
  correct: z.boolean(),
  attemptNo: z.number().int().min(1).max(2),
  attemptsLeft: z.number().int().min(0).max(1),
  pointsAwarded: count,
  hint: text.optional(),
  // Hanya respons jawaban boleh membuka kunci; hanya setelah kesempatan habis.
  correctAnswer: z.union([text, z.array(text)]).optional(),
});
export const AnswerResult = z.union([
  AnswerData.omit({ correctAnswer: true }),
  AnswerData.extend({ correct: z.literal(false), attemptsLeft: z.literal(0) }),
]);
export const CollectionItem = z.discriminatedUnion('collected', [
  object({ vocabulary: Vocabulary, collected: z.literal(true), bestScore: score }),
  // ASUMSI: Entri terkunci hanya membuka ID, bukan isi kartu penuh.
  object({ vocabulary: object({ id }), collected: z.literal(false), bestScore: score }),
]);
export const PronunciationData = object({
  score,
  level: z.enum(['good', 'almost', 'retry']),
  passed: z.boolean(),
  feedback: text,
  targetWordHeard: z.boolean(),
});
export const CompleteData = object({
  stars: z.number().int().min(1).max(3),
  sessionScore: score,
  practiceAccuracy: score,
  speakScore: score,
  xpBreakdown: object({ scanXp: count, practiceXp: count, speakXp: count }),
  totalXpAwarded: count,
  levelUp: z.boolean(),
  newLevel: z.number().int().min(1),
  xpInLevel: count,
  xpForNextLevel: count,
  collectedWord: Vocabulary,
  alreadyCollected: z.boolean(),
  nextMission,
});
export const dataSchemas = {
  Health: object({ status: text, db: text }),
  Guest: object({ token: text, user: User }),
  Me: User,
  UpdateMe: User,
  Collection: z.array(CollectionItem),
  Missions: z.array(Mission),
  MissionDetail,
  StartSession: object({ sessionId: id, acceptedLabels: z.array(AcceptedLabel) }),
  Hint: object({ hint: text, hintCount: count }),
  Scan: object({
    matched: z.boolean(),
    alreadyCollected: z.boolean(),
    vocabulary: Vocabulary.optional(),
    xpAwarded: count.describe(
      'XP pindai yang akan dikreditkan saat complete; bukan kredit langsung.',
    ),
  }),
  Exercises: object({ exercises: z.array(Exercise) }),
  Answer: AnswerResult,
  Pronunciation: PronunciationData,
  Complete: CompleteData,
  Vocabulary,
};
export const success = <T extends z.ZodType>(data: T) => object({ success: z.literal(true), data });
export const schemas = {
  ErrorCode,
  ErrorResponse,
  User,
  Vocabulary,
  Mission,
  MissionDetail,
  AcceptedLabel,
  ExerciseKind,
  ExerciseState,
  ExerciseOption,
  ChoiceExercise,
  ClozeExercise,
  OrderExercise,
  Exercise,
  nextMission,
  GuestRequest,
  UpdateMeRequest,
  ScanRequest,
  AnswerRequest,
  PronunciationRequest,
  CompleteRequest,
  HealthResponse: success(dataSchemas.Health),
  GuestResponse: success(dataSchemas.Guest),
  MeResponse: success(dataSchemas.Me),
  UpdateMeResponse: success(dataSchemas.UpdateMe),
  CollectionResponse: success(dataSchemas.Collection),
  MissionsResponse: success(dataSchemas.Missions),
  MissionDetailResponse: success(dataSchemas.MissionDetail),
  StartSessionResponse: success(dataSchemas.StartSession),
  HintResponse: success(dataSchemas.Hint),
  ScanResponse: success(dataSchemas.Scan),
  ExercisesResponse: success(dataSchemas.Exercises),
  AnswerResponse: success(dataSchemas.Answer),
  PronunciationResponse: success(dataSchemas.Pronunciation),
  CompleteResponse: success(dataSchemas.Complete),
  VocabularyResponse: success(dataSchemas.Vocabulary),
};
export type Exercise = z.infer<typeof Exercise>;
export type Vocabulary = z.infer<typeof Vocabulary>;
export type Mission = z.infer<typeof Mission>;
