import { getPrisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { getProfile } from './profile.service';

const cardInclude = {
  category: true,
  translations: true,
  sentences: {
    where: { kind: 'choice' as const },
    orderBy: { id: 'asc' as const },
    include: { translations: true },
  },
  relationsFrom: { include: { relatedVocabulary: true } },
};

type Card = Awaited<ReturnType<typeof loadCard>>;
/** Kartu hanya dibentuk melalui allowlist, tanpa blankWord, wordsJson atau kunci latihan. */
function publicCard(item: Card, collectedIds: ReadonlySet<number>) {
  if (!item) throw new AppError('NOT_FOUND', 'Kosakata tidak ditemukan');
  const firstSentence = item.sentences[0];
  return {
    id: String(item.id),
    word: item.word,
    phonetic: item.phonetic ?? '',
    meaning: item.meaningId,
    imageUrl: item.imageUrl ?? '',
    category: item.category.name,
    translations: item.translations.map((translation) => ({
      languageCode: translation.languageCode,
      translation: translation.translation,
      romanization: translation.romanization,
    })),
    exampleSentence: firstSentence
      ? {
          id: String(firstSentence.id),
          text: firstSentence.sentenceEn,
          translations: firstSentence.translations.map((translation) => ({
            languageCode: translation.languageCode,
            text: translation.text,
            pinyin: translation.pinyin,
          })),
        }
      : {},
    // Kata terkait yang belum dikoleksi tetap siluet, bukan jalan belakang membuka kartu.
    related: item.relationsFrom.map(({ relatedVocabulary: related, kind }) =>
      collectedIds.has(related.id)
        ? { id: String(related.id), word: related.word, imageUrl: related.imageUrl ?? '', kind }
        : { id: String(related.id), imageUrl: related.imageUrl ?? '' },
    ),
  };
}

function loadCard(id: number) {
  return getPrisma().vocabularyItem.findUnique({ where: { id }, include: cardInclude });
}

/** Semua item dikirim; item terkunci hanya ID/gambar dan metadata koleksi. */
export async function getCollection(userId: string) {
  await getProfile(userId);
  const database = getPrisma();
  const owned = await database.userVocabulary.findMany({ where: { userId } });
  const collected = new Map(owned.map((item) => [item.vocabularyId, item]));
  const ids = new Set(collected.keys());
  const items = await database.vocabularyItem.findMany({ orderBy: { id: 'asc' } });
  return Promise.all(
    items.map(async (item) => {
      const entry = collected.get(item.id);
      return entry
        ? {
            vocabulary: publicCard(await loadCard(item.id), ids),
            collected: true,
            bestScore: entry.bestScore ?? 0,
          }
        : {
            vocabulary: { id: String(item.id), imageUrl: item.imageUrl ?? '' },
            collected: false,
            bestScore: 0,
          };
    }),
  );
}

/** Kepemilikan diperiksa sebelum memuat kartu agar ID yang tidak dimiliki selalu 404 sama. */
export async function getVocabulary(userId: string, id: number) {
  await getProfile(userId);
  const owned = await getPrisma().userVocabulary.findMany({ where: { userId } });
  const ids = new Set(owned.map((item) => item.vocabularyId));
  if (!ids.has(id)) throw new AppError('NOT_FOUND', 'Kosakata tidak ditemukan');
  return publicCard(await loadCard(id), ids);
}
