import type { CreditSection } from "../screens/CreditsScreen";

export const creditSections: CreditSection[] = [
{
  id: "tatoeba",
  kind: "sentences",
  title: "Kalimat contoh",
  description:
  "Kalimat contoh dan terjemahannya berasal dari Tatoeba, kumpulan kalimat yang ditulis dan diterjemahkan oleh para relawan. Setiap kalimat tetap menjadi karya penulisnya.",
  items: [{ name: "Tatoeba", license: "CC BY 2.0 FR", url: "https://tatoeba.org" }],
  attributions: [
  { id: "1563", author: "CK", url: "https://tatoeba.org/sentences/show/1563" },
  { id: "2390719", author: "Hybrid", url: "https://tatoeba.org/sentences/show/2390719" },
  { id: "4730581", author: "Eldad", url: "https://tatoeba.org/sentences/show/4730581" },
  { id: "6112547", author: "Guybrush88", url: "https://tatoeba.org/sentences/show/6112547" }]

},
{
  id: "dictionary",
  kind: "dictionary",
  title: "Kamus",
  description: "Arti kata dan lambang bunyi diambil dari Wiktionary melalui data olahan kaikki.org.",
  items: [
  { name: "Wiktionary", license: "CC BY-SA 4.0", url: "https://www.wiktionary.org" },
  { name: "kaikki.org", license: "CC BY-SA 4.0", url: "https://kaikki.org" }]

},
{
  id: "model",
  kind: "model",
  title: "Model deteksi",
  description: "Benda dikenali langsung di perangkatmu. Gambar dari kamera tidak dikirim ke server.",
  items: [{ name: "COCO-SSD untuk TensorFlow.js", license: "Apache 2.0", url: "https://github.com/tensorflow/tfjs-models" }]
},
{
  id: "fonts",
  kind: "fonts",
  title: "Font",
  description: "Huruf yang dipakai di aplikasi ini.",
  items: [
  { name: "Grandstander", license: "SIL OFL 1.1", url: "https://fonts.google.com/specimen/Grandstander" },
  { name: "Atkinson Hyperlegible", license: "SIL OFL 1.1", url: "https://fonts.google.com/specimen/Atkinson+Hyperlegible" },
  { name: "Noto Sans dan Noto Sans SC", license: "SIL OFL 1.1", url: "https://fonts.google.com/noto" }]

},
{
  id: "icons",
  kind: "icons",
  title: "Ikon",
  description: "Ikon garis di seluruh aplikasi.",
  items: [{ name: "Lucide", license: "ISC", url: "https://lucide.dev" }]
},
{
  id: "illustrations",
  kind: "illustrations",
  title: "Ilustrasi",
  description: "Maskot dan gambar pendukung dibuat khusus untuk LingoLens.",
  items: [{ name: "Tim LingoLens", license: "Hak cipta dilindungi" }]
}];