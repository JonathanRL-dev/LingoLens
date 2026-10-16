import { describe, expect, test } from 'vitest';
import {
  generateExercises,
  gradeAnswer,
  isExerciseSettled,
  startsWithVowelSound,
  type Exercise,
  type GenerateExercisesInput,
  type Vocabulary,
} from './exercises';

const word = (id: string, text: string, meaning: string, categoryId = 'objects'): Vocabulary => ({
  id,
  word: text,
  meaning,
  categoryId,
});
const target = word('cup', 'cup', 'cangkir');
const same = [
  word('plate', 'plate', 'piring'),
  word('spoon', 'spoon', 'sendok'),
  word('bowl', 'bowl', 'mangkuk'),
];
const other = [
  word('dog', 'dog', 'anjing', 'animals'),
  word('cat', 'cat', 'kucing', 'animals'),
  word('horse', 'horse', 'kuda', 'animals'),
  word('apple', 'apple', 'apel', 'fruit'),
  word('orange', 'orange', 'jeruk', 'fruit'),
  word('egg', 'egg', 'telur', 'food'),
];
const fixture = (): GenerateExercisesInput => ({
  sessionId: 'session-1',
  vocabulary: target,
  sentences: [
    { id: 'choice', vocabularyId: target.id, text: 'This is a cup.' },
    { id: 'cloze', vocabularyId: target.id, text: 'I have a ___.' },
  ],
  allVocabulary: [target, ...same, ...other],
  plan: [
    { sentenceId: 'choice', kind: 'choice' },
    { sentenceId: 'cloze', kind: 'cloze' },
  ],
});
const orderFixture = (sessionId = 'order-session'): GenerateExercisesInput => ({
  ...fixture(),
  sessionId,
  sentences: [
    {
      id: 'order-sentence',
      vocabularyId: target.id,
      text: 'I see the the cup.',
      wordsJson: ['I', 'see', 'the', 'the', 'cup'],
      hintTranslation: 'Saya melihat cangkir itu.',
    },
  ],
  plan: [{ sentenceId: 'order-sentence', kind: 'order' }],
});
const norm = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');
const texts = (exercise: Exercise) => {
  if (exercise.kind === 'choice') return exercise.options.map((option) => option.text);
  if (exercise.kind === 'cloze') return exercise.chips.map((option) => option.text);
  return exercise.tokens.map((token) => token.text);
};
function clozeInput(text: string, vocabulary = target): GenerateExercisesInput {
  return {
    ...fixture(),
    vocabulary,
    sentences: [{ id: 'cloze', vocabularyId: vocabulary.id, text }],
    plan: [{ sentenceId: 'cloze', kind: 'cloze' }],
  };
}
function freezeDeep(value: unknown): void {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
}

describe('generateExercises', () => {
  test('same session is identical; several sessions produce distinct permutations', () => {
    expect(generateExercises(fixture())).toEqual(generateExercises(fixture()));
    const results = Array.from({ length: 12 }, (_, index) =>
      JSON.stringify(generateExercises({ ...fixture(), sessionId: String(index) })),
    );
    expect(new Set(results).size).toBeGreaterThan(1);
  });

  test('array order and adding or removing another sentence do not change a sentence', () => {
    const input = fixture();
    const expected = generateExercises(input);
    expect(
      generateExercises({
        ...input,
        sentences: [...input.sentences].reverse(),
        allVocabulary: [...input.allVocabulary].reverse(),
        plan: [...input.plan].reverse(),
      }),
    ).toEqual(expected);
    expect(generateExercises({ ...input, plan: [input.plan[1]!] }).exercises[0]).toEqual(
      expected.exercises.find((exercise) => exercise.id === 'cloze'),
    );
    const extra = { id: 'another', vocabularyId: target.id, text: 'A cup.' };
    const extended = generateExercises({
      ...input,
      sentences: [extra, ...input.sentences],
      plan: [{ sentenceId: extra.id, kind: 'choice' }, ...input.plan],
    });
    expect(extended.exercises.filter((exercise) => exercise.id !== extra.id)).toEqual(
      expected.exercises,
    );
  });

  test('choice has four distinct meanings and prefers its own category', () => {
    const exercise = generateExercises(fixture()).exercises[0]!;
    expect(new Set(texts(exercise).map(norm)).size).toBe(4);
    expect(texts(exercise).sort()).toEqual(
      [target.meaning, ...same.map((item) => item.meaning)].sort(),
    );
    const input = fixture();
    const fallback = generateExercises({ ...input, allVocabulary: [target, same[0]!, ...other] })
      .exercises[0]!;
    expect(texts(fallback)).toContain(same[0]!.meaning);
    expect(texts(fallback)).toHaveLength(4);
  });

  test('duplicate normalized meanings never appear in choice options', () => {
    const input = fixture();
    const duplicates = [
      word('duplicate-correct', 'mug', ' CANGKIR  '),
      word('duplicate-plate', 'dish', ' PIRING '),
      word('empty', 'empty', '  '),
    ];
    const result = generateExercises({
      ...input,
      allVocabulary: [...duplicates, ...input.allVocabulary],
    });
    expect(new Set(texts(result.exercises[0]!).map(norm)).size).toBe(4);
  });

  test('target substrings are excluded in both kinds, ignoring case', () => {
    const input = fixture();
    const prohibited = [
      word('cupboard', 'CUPboard', 'lemari', 'animals'),
      word('meaning-leak', 'glass', 'a CUP', 'objects'),
    ];
    const output = generateExercises({
      ...input,
      allVocabulary: [...input.allVocabulary, ...prohibited],
    });
    expect(texts(output.exercises[0]!)).not.toContain('lemari');
    expect(texts(output.exercises[0]!)).not.toContain('a CUP');
    expect(texts(output.exercises[1]!)).not.toContain('CUPboard');
  });

  test('cloze chips are unique, have unique IDs, and distractors use other categories', () => {
    const exercise = generateExercises(fixture()).exercises[1]!;
    expect(exercise.kind).toBe('cloze');
    if (exercise.kind !== 'cloze') throw new Error('Expected cloze');
    expect(exercise.chips).toHaveLength(3);
    expect(new Set(exercise.chips.map((chip) => chip.id)).size).toBe(3);
    expect(new Set(texts(exercise).map(norm)).size).toBe(3);
    for (const chip of exercise.chips.filter((chip) => chip.text !== target.word)) {
      expect(other.map((item) => item.word)).toContain(chip.text);
      expect(startsWithVowelSound(chip.text)).toBe(false);
    }
  });

  test('an cannot single out target by its vowel sound; a never alters a mismatched target', () => {
    const apple = word('target-apple', 'apple', 'apel', 'target-fruit');
    for (const [article, expectedSound] of [
      ['an', true],
      ['a', false],
    ] as const) {
      const exercise = generateExercises(clozeInput('I see ' + article + ' ___.', apple))
        .exercises[0]!;
      expect(texts(exercise)).toContain('apple');
      for (const text of texts(exercise).filter((text) => text !== 'apple')) {
        expect(startsWithVowelSound(text)).toBe(expectedSound);
      }
    }
  });

  test.each(['___ is mine.', 'I use ___', '___'])(
    'blank at either boundary is safe: %s',
    (text) => {
      const exercise = generateExercises(clozeInput(text)).exercises[0]!;
      expect(exercise.kind).toBe('cloze');
      if (exercise.kind !== 'cloze') throw new Error('Expected cloze');
      expect(exercise.parts.join('___')).toBe(text);
      expect(exercise.speakText).toBe(text.replace('___', 'blank'));
      expect(exercise.speakText).not.toContain(target.word);
    },
  );

  test('exercise objects have only public fields, including after serialization', () => {
    const { exercises, keys } = generateExercises(fixture());
    expect(keys).toEqual([
      { exerciseId: 'choice', answer: 'cangkir' },
      { exerciseId: 'cloze', answer: 'cup' },
    ]);
    for (const exercise of exercises) {
      const fields =
        exercise.kind === 'choice'
          ? ['id', 'kind', 'text', 'options']
          : exercise.kind === 'cloze'
            ? ['id', 'kind', 'parts', 'chips', 'speakText']
            : ['id', 'kind', 'tokens', 'hintTranslation', 'endPunctuation'];
      expect(Reflect.ownKeys(exercise).sort()).toEqual(fields.sort());
      expect(JSON.parse(JSON.stringify(exercise))).toEqual(exercise);
      expect(JSON.stringify(exercise)).not.toMatch(/correctAnswer|correctOption|answer|key/i);
      const options =
        exercise.kind === 'choice'
          ? exercise.options
          : exercise.kind === 'cloze'
            ? exercise.chips
            : exercise.tokens;
      options.forEach((option, index) => {
        expect(Reflect.ownKeys(option).sort()).toEqual(['id', 'text']);
        expect(option.id).toBe(
          exercise.kind === 'order' ? `t${index}` : JSON.stringify([exercise.id, index]),
        );
      });
    }
  });

  test.each(['no blank', '___ and ___'])('rejects invalid marker: %s', (text) => {
    expect(() => generateExercises(clozeInput(text))).toThrow('exactly one ___');
  });

  test('rejects insufficient distinct meanings and article-filtered cloze candidates', () => {
    expect(() => generateExercises({ ...fixture(), allVocabulary: [target, same[0]!] })).toThrow(
      'Not enough unique distractors',
    );
    const input = clozeInput('I see a ___.');
    expect(() =>
      generateExercises({
        ...input,
        allVocabulary: other.filter((item) => startsWithVowelSound(item.word)),
      }),
    ).toThrow('Not enough unique distractors');
    expect(() => generateExercises({ ...input, allVocabulary: [target, ...same] })).toThrow(
      'Not enough unique distractors',
    );
  });

  test('rejects unsupported kinds, missing or duplicate sentences, and speakText leaks', () => {
    expect(() =>
      generateExercises({ ...fixture(), plan: [{ sentenceId: 'choice', kind: 'other' }] }),
    ).toThrow('Unsupported exercise kind: other');
    expect(() => generateExercises({ ...fixture(), sentences: [] })).toThrow(
      'Expected one target sentence',
    );
    const input = fixture();
    expect(() => generateExercises({ ...input, plan: [...input.plan, input.plan[0]!] })).toThrow(
      'Duplicate sentence',
    );
    expect(() => generateExercises(clozeInput('The cup is ___'))).toThrow(
      'speakText exposes target',
    );
  });

  test('generation and grading do not mutate deeply frozen inputs', () => {
    const input = fixture();
    const snapshot = structuredClone(input);
    freezeDeep(input);
    const output = generateExercises(input);
    freezeDeep(output);
    const outputSnapshot = structuredClone(output);
    gradeAnswer(output.exercises[0]!, output.keys[0]!, 'wrong', 1);
    expect(input).toEqual(snapshot);
    expect(output).toEqual(outputSnapshot);
  });
});

describe('order exercises', () => {
  test('uses a seeded shuffle, lowercase words except I, Indonesian hint, and sentence punctuation', () => {
    const generated = generateExercises(orderFixture());
    const exercise = generated.exercises[0]!;
    expect(exercise.kind).toBe('order');
    if (exercise.kind !== 'order') throw new Error('Expected order exercise');

    expect(exercise.tokens.map(({ text }) => text).join(' ')).not.toBe('I see the the cup');
    expect(exercise.tokens.map(({ id }) => id)).toEqual(['t0', 't1', 't2', 't3', 't4']);
    for (const { text } of exercise.tokens) {
      if (text !== 'I') expect(text).toBe(text.toLowerCase());
    }
    expect(exercise.hintTranslation).toBe('Saya melihat cangkir itu.');
    expect(exercise.endPunctuation).toBe('.');
    expect(generated.keys[0]).toEqual({
      exerciseId: 'order-sentence',
      answer: 'i see the the cup',
      hint: 'I',
    });
  });

  test('accepts swapped duplicate-word token IDs and compares case-insensitively', () => {
    const { exercises, keys } = generateExercises(orderFixture());
    const exercise = exercises[0]!;
    if (exercise.kind !== 'order') throw new Error('Expected order exercise');

    const wanted = ['I', 'see', 'the', 'the', 'cup'];
    const unused = [...exercise.tokens];
    const answer = wanted.map((text) => {
      const index = unused.findIndex((token) => token.text.toLowerCase() === text.toLowerCase());
      return unused.splice(index, 1)[0]!.id;
    });
    const duplicatePositions = wanted.flatMap((text, index) => (text === 'the' ? [index] : []));
    [answer[duplicatePositions[0]!], answer[duplicatePositions[1]!]] = [
      answer[duplicatePositions[1]!]!,
      answer[duplicatePositions[0]!]!,
    ];
    expect(gradeAnswer(exercise, keys[0]!, answer, 1)).toEqual({ correct: true, score: 1 });
  });

  test('rejects unknown token IDs and hints with the first word on an incorrect first attempt', () => {
    const { exercises, keys } = generateExercises(orderFixture());
    const exercise = exercises[0]!;
    if (exercise.kind !== 'order') throw new Error('Expected order exercise');
    expect(() => gradeAnswer(exercise, keys[0]!, ['unknown'], 1)).toThrow('Unknown order token ID');

    const wrongAnswer = [...exercise.tokens].reverse().map(({ id }) => id);
    expect(gradeAnswer(exercise, keys[0]!, wrongAnswer, 1)).toEqual({
      correct: false,
      score: 0,
      hint: 'I',
    });
  });

  test('is deterministic for the same sessionId and sentenceId', () => {
    expect(generateExercises(orderFixture('same-session'))).toEqual(
      generateExercises(orderFixture('same-session')),
    );
  });
});

describe('startsWithVowelSound', () => {
  test.each([
    ['apple', true],
    ['Egg', true],
    ['ICE', true],
    ['orange', true],
    ['umbrella', true],
    ['HOUR', true],
    ['honest', true],
    ['heir', true],
    ['university', false],
    ['UNIT', false],
    ['user', false],
    ['European', false],
    ['one', false],
    ['dog', false],
  ])('%s has vowel sound = %s', (word, expected) => {
    expect(startsWithVowelSound(word)).toBe(expected);
  });
});

describe('gradeAnswer', () => {
  test.each([0, 1])('scores, hint timing, final answer and normalization for kind %i', (index) => {
    const output = generateExercises(fixture());
    const exercise = output.exercises[index]!;
    const key = output.keys[index]!;
    expect(gradeAnswer(exercise, key, key.answer, 1)).toEqual({ correct: true, score: 1 });
    expect(gradeAnswer(exercise, key, 'wrong', 1)).toEqual({
      correct: false,
      score: 0,
      hint: key.answer[0],
    });
    expect(gradeAnswer(exercise, key, '  ' + key.answer.toUpperCase() + '  ', 2)).toEqual({
      correct: true,
      score: 0.5,
    });
    expect(gradeAnswer(exercise, key, 'wrong', 2)).toEqual({
      correct: false,
      score: 0,
      correctAnswer: key.answer,
    });
    if (exercise.kind === 'order') throw new Error('Fixture intentionally covers choice and cloze');
    const options = exercise.kind === 'choice' ? exercise.options : exercise.chips;
    const remapped = options.map((option) => ({ ...option, id: 'remapped-' + option.id }));
    const changed: Exercise =
      exercise.kind === 'choice'
        ? { ...exercise, options: remapped }
        : { ...exercise, chips: remapped };
    const correct = remapped.find((option) => option.text === key.answer)!;
    expect(gradeAnswer(changed, key, correct.id, 1)).toEqual({ correct: true, score: 1 });
  });

  test('normalizes interior whitespace and gives only one letter of the meaning', () => {
    const exercise: Exercise = {
      id: 'phrase',
      kind: 'choice',
      text: '',
      options: [{ id: 'option', text: '  AIR   PANAS ' }],
    };
    const key = { exerciseId: exercise.id, answer: 'air panas' };
    expect(gradeAnswer(exercise, key, 'option', 1)).toEqual({ correct: true, score: 1 });
    expect(gradeAnswer(exercise, key, ' Air    Panas ', 1)).toEqual({ correct: true, score: 1 });
    expect(gradeAnswer(exercise, key, 'wrong', 1)).toEqual({ correct: false, score: 0, hint: 'a' });
  });

  test.each([0, -1, 1.5, 3, Infinity, NaN])('rejects attemptNo %s', (attemptNo) => {
    const output = generateExercises(fixture());
    expect(() => gradeAnswer(output.exercises[0]!, output.keys[0]!, 'wrong', attemptNo)).toThrow(
      'attemptNo',
    );
  });

  test('rejects a key belonging to a different exercise', () => {
    const output = generateExercises(fixture());
    expect(() => gradeAnswer(output.exercises[0]!, output.keys[1]!, 'cup', 1)).toThrow(
      'does not match',
    );
  });

  test('settled helper lets callers prevent repeated points after success or exhaustion', () => {
    expect(isExerciseSettled({ solved: false, attemptsUsed: 1 })).toBe(false);
    expect(isExerciseSettled({ solved: true, attemptsUsed: 1 })).toBe(true);
    expect(isExerciseSettled({ solved: false, attemptsUsed: 2 })).toBe(true);
    expect(isExerciseSettled({ solved: false, attemptsUsed: 1, exhausted: true })).toBe(true);
  });
});
