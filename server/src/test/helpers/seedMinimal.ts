import type { PrismaClient } from '@prisma/client';

/** Seed kecil deterministik/idempoten; tidak menghapus data dan memakai ID eksplisit. */
export async function seedMinimal(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.category.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, slug: 'objects', name: 'Benda' },
    });
    for (const item of [
      { id: 1, slug: 'cup', word: 'cup', meaningId: 'cangkir' },
      { id: 2, slug: 'book', word: 'book', meaningId: 'buku' },
    ]) {
      await tx.vocabularyItem.upsert({
        where: { id: item.id },
        update: {},
        create: {
          ...item,
          categoryId: 1,
          imageUrl: '/images/' + item.id + '.svg',
          phonetic: '/test/',
        },
      });
      const sentences = [
        {
          id: item.id * 10,
          kind: 'choice' as const,
          sentenceEn: 'This is a ' + item.word + '.',
          blankWord: null,
        },
        {
          id: item.id * 10 + 1,
          kind: 'cloze' as const,
          sentenceEn: 'This is a ___.',
          blankWord: item.word,
        },
        {
          id: item.id * 10 + 2,
          kind: 'order' as const,
          sentenceEn: item.word === 'cup' ? 'I put the cup here.' : 'I read the book here.',
          blankWord: null,
          wordsJson:
            item.word === 'cup'
              ? ['I', 'put', 'the', 'cup', 'here']
              : ['I', 'read', 'the', 'book', 'here'],
        },
      ];
      for (const sentence of sentences) {
        await tx.vocabularySentence.upsert({
          where: { id: sentence.id },
          update: {},
          create: { ...sentence, vocabularyId: item.id },
        });
      }
      await tx.detectionLabel.upsert({
        where: {
          vocabularyId_model_label: { vocabularyId: item.id, model: 'coco-ssd', label: item.word },
        },
        update: {},
        create: { vocabularyId: item.id, model: 'coco-ssd', label: item.word },
      });
      await tx.mission.upsert({
        where: { id: item.id },
        update: {},
        create: {
          id: item.id,
          slug: 'find-' + item.slug,
          titleId: 'Temukan ' + item.word,
          categoryId: 1,
          prerequisiteMissionId: item.id === 1 ? null : 1,
          orderIndex: item.id,
          exercisePlan: ['choice', 'cloze'],
        },
      });
      await tx.missionTarget.upsert({
        where: { missionId_vocabularyId: { missionId: item.id, vocabularyId: item.id } },
        update: {},
        create: { missionId: item.id, vocabularyId: item.id },
      });
    }
    await tx.vocabularyTranslation.upsert({
      where: { vocabularyId_languageCode: { vocabularyId: 1, languageCode: 'zh-CN' } },
      update: {},
      create: {
        vocabularyId: 1,
        languageCode: 'zh-CN',
        translation: '\u676f\u5b50',
        romanization: 'bei zi',
        source: 'test-fixture',
      },
    });
    await tx.sentenceTranslation.upsert({
      where: { sentenceId_languageCode: { sentenceId: 10, languageCode: 'zh-CN' } },
      update: {},
      create: {
        sentenceId: 10,
        languageCode: 'zh-CN',
        text: '\u8fd9\u662f\u4e00\u4e2a\u676f\u5b50\u3002',
        pinyin: 'zhe shi yi ge bei zi',
        source: 'test-fixture',
        license: 'own',
      },
    });
    for (const [sentenceId, text] of [
      [12, 'Saya meletakkan cangkir itu di sini.'],
      [22, 'Saya membaca buku itu di sini.'],
    ] as const) {
      await tx.sentenceTranslation.upsert({
        where: { sentenceId_languageCode: { sentenceId, languageCode: 'id-ID' } },
        update: {},
        create: {
          sentenceId,
          languageCode: 'id-ID',
          text,
          source: 'test-fixture',
          license: 'own',
        },
      });
    }
    await tx.vocabularyRelation.upsert({
      where: {
        vocabularyId_relatedVocabularyId_kind: {
          vocabularyId: 1,
          relatedVocabularyId: 2,
          kind: 'related',
        },
      },
      update: {},
      create: { vocabularyId: 1, relatedVocabularyId: 2, kind: 'related' },
    });
  });
}
