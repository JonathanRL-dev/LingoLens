// Daftar awal Indonesia/Inggris; dapat diperluas tanpa mengubah validator.
const prohibitedWords = [
  'anjing',
  'babi',
  'bangsat',
  'bajingan',
  'kontol',
  'memek',
  'ngentot',
  'fuck',
  'shit',
  'bitch',
  'asshole',
];
const substitutions: Readonly<Record<string, string>> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  $: 's',
};

/** Memeriksa bentuk rapat agar spasi/pemisah dan leetspeak tidak menghindari filter. */
export function containsProfanity(value: string): boolean {
  const normalized = value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[0134$]/g, (character) => substitutions[character]!)
    .replace(/[^a-z]/g, '');
  return prohibitedWords.some((word) => normalized.includes(word));
}
