import { z } from 'zod';
import { idSchema, scoreSchema } from './common';

// ASUMSI OpenAPI: translations, exampleSentence, dan related belum memiliki bidang wajib.
const unspecifiedObject = z.looseObject({});
export const vocabularyDataSchema = z
  .object({
    id: idSchema,
    word: z.string(),
    phonetic: z.string(),
    meaning: z.string(),
    imageUrl: z.string(),
    category: z.string(),
    translations: z.array(unspecifiedObject),
    exampleSentence: unspecifiedObject,
    related: z.array(unspecifiedObject),
  })
  .strict();
export const collectionItemSchema = z.discriminatedUnion('collected', [
  z
    .object({
      vocabulary: vocabularyDataSchema,
      collected: z.literal(true),
      bestScore: scoreSchema,
    })
    .strict(),
  z
    .object({
      // ASUMSI OpenAPI: kartu terkunci hanya membuka ID.
      vocabulary: z.object({ id: idSchema }).strict(),
      collected: z.literal(false),
      bestScore: scoreSchema,
    })
    .strict(),
]);
export const collectionDataSchema = z.array(collectionItemSchema);
export const vocabularySchema = vocabularyDataSchema;
export const Vocabulary = vocabularyDataSchema;
export const CollectionItem = collectionItemSchema;
export type Vocabulary = z.infer<typeof vocabularyDataSchema>;
export type CollectionItem = z.infer<typeof collectionItemSchema>;
export type CollectionData = z.infer<typeof collectionDataSchema>;
export type VocabularyData = z.infer<typeof vocabularyDataSchema>;
