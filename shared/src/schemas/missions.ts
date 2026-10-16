import { z } from 'zod';
import { confidenceSchema, countSchema, idSchema } from './common';
import { exerciseKindSchema } from './exercises';

export const acceptedLabelSchema = z
  .object({
    model: z.string(),
    label: z.string(),
    minConfidence: confidenceSchema,
    vocabularyId: idSchema,
  })
  .strict();
export const missionSchema = z
  .object({
    id: idSchema,
    slug: z.string(),
    title: z.string(),
    hint: z.string().optional(),
    category: z.string(),
    // ASUMSI OpenAPI: difficulty dan status teks tanpa enum rekaan.
    difficulty: z.string(),
    rewardXp: countSchema,
    status: z.string(),
    bestStars: z.number().int().min(0).max(3),
    exercisePlan: z.array(exerciseKindSchema),
  })
  .strict();
export const missionsDataSchema = z.array(missionSchema);
export const missionDetailDataSchema = missionSchema.extend({
  acceptedLabels: z.array(acceptedLabelSchema),
  targetCount: countSchema,
});
export const nextMissionSchema = missionSchema.nullable();

export const AcceptedLabel = acceptedLabelSchema;
export const Mission = missionSchema;
export const MissionDetail = missionDetailDataSchema;
export const nextMission = nextMissionSchema;
export type AcceptedLabel = z.infer<typeof acceptedLabelSchema>;
export type Mission = z.infer<typeof missionSchema>;
export type MissionsData = z.infer<typeof missionsDataSchema>;
export type MissionDetail = z.infer<typeof missionDetailDataSchema>;
export type NextMission = z.infer<typeof nextMissionSchema>;
export type MissionDetailData = z.infer<typeof missionDetailDataSchema>;
