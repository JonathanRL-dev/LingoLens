import { ErrorCodeSchema, errorResponseSchema, healthDataSchema, successSchema } from './common';
import {
  guestRequestSchema,
  guestDataSchema,
  meDataSchema,
  updateMeRequestSchema,
  updateMeDataSchema,
  userSchema,
} from './auth';
import {
  acceptedLabelSchema,
  missionSchema,
  missionsDataSchema,
  missionDetailDataSchema,
  nextMissionSchema,
} from './missions';
import {
  exerciseKindSchema,
  exerciseStateSchema,
  exerciseOptionSchema,
  ChoiceExerciseSchema,
  ClozeExerciseSchema,
  OrderExerciseSchema,
  ExerciseSchema,
  exercisesDataSchema,
  answerRequestSchema,
  answerDataSchema,
} from './exercises';
import { collectionDataSchema, vocabularyDataSchema } from './vocabulary';
import {
  startSessionDataSchema,
  hintDataSchema,
  scanRequestSchema,
  scanDataSchema,
  pronunciationRequestSchema,
  pronunciationDataSchema,
  completeRequestSchema,
  completeDataSchema,
} from './sessions';

export * from './common';
export * from './auth';
export * from './missions';
export * from './sessions';
export * from './exercises';
export * from './vocabulary';

// Kunci registry lama dipertahankan agar pemakai dan skrip generator tetap kompatibel.
export const dataSchemas = {
  Health: healthDataSchema,
  Guest: guestDataSchema,
  Me: meDataSchema,
  UpdateMe: updateMeDataSchema,
  Collection: collectionDataSchema,
  Missions: missionsDataSchema,
  MissionDetail: missionDetailDataSchema,
  StartSession: startSessionDataSchema,
  Hint: hintDataSchema,
  Scan: scanDataSchema,
  Exercises: exercisesDataSchema,
  Answer: answerDataSchema,
  Pronunciation: pronunciationDataSchema,
  Complete: completeDataSchema,
  Vocabulary: vocabularyDataSchema,
};
export const schemas = {
  ErrorCode: ErrorCodeSchema,
  ErrorResponse: errorResponseSchema,
  User: userSchema,
  Vocabulary: vocabularyDataSchema,
  Mission: missionSchema,
  MissionDetail: missionDetailDataSchema,
  AcceptedLabel: acceptedLabelSchema,
  ExerciseKind: exerciseKindSchema,
  ExerciseState: exerciseStateSchema,
  ExerciseOption: exerciseOptionSchema,
  ChoiceExercise: ChoiceExerciseSchema,
  ClozeExercise: ClozeExerciseSchema,
  OrderExercise: OrderExerciseSchema,
  Exercise: ExerciseSchema,
  nextMission: nextMissionSchema,
  GuestRequest: guestRequestSchema,
  UpdateMeRequest: updateMeRequestSchema,
  ScanRequest: scanRequestSchema,
  AnswerRequest: answerRequestSchema,
  PronunciationRequest: pronunciationRequestSchema,
  CompleteRequest: completeRequestSchema,
  HealthResponse: successSchema(healthDataSchema),
  GuestResponse: successSchema(guestDataSchema),
  MeResponse: successSchema(meDataSchema),
  UpdateMeResponse: successSchema(updateMeDataSchema),
  CollectionResponse: successSchema(collectionDataSchema),
  MissionsResponse: successSchema(missionsDataSchema),
  MissionDetailResponse: successSchema(missionDetailDataSchema),
  StartSessionResponse: successSchema(startSessionDataSchema),
  HintResponse: successSchema(hintDataSchema),
  ScanResponse: successSchema(scanDataSchema),
  ExercisesResponse: successSchema(exercisesDataSchema),
  AnswerResponse: successSchema(answerDataSchema),
  PronunciationResponse: successSchema(pronunciationDataSchema),
  CompleteResponse: successSchema(completeDataSchema),
  VocabularyResponse: successSchema(vocabularyDataSchema),
};
