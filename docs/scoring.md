# scoring.md — Rumus skor, XP, dan level

Sumber kebenaran: `shared/src/scoring.ts`, `shared/src/levels.ts`, `shared/src/constants.ts`. Dokumen ini hanya salinan dalam bahasa manusia. Bila berbeda dengan kode, kode yang benar dan dokumen ini diperbaiki.

## Konstanta

| Nama                       | Nilai                           | Arti                                          |
| -------------------------- | ------------------------------- | --------------------------------------------- |
| `SCAN_XP`                  | 50                              | XP pindai (benda cocok)                       |
| `PRACTICE_XP`              | 30                              | XP maksimum latihan                           |
| `SPEAK_XP`                 | 30                              | XP ucapan bila lolos                          |
| `ATTEMPTS_PER_QUESTION`    | 2                               | Kesempatan per soal                           |
| `PRACTICE_WEIGHT`          | 0,55                            | Bobot latihan pada skor sesi                  |
| `SPEAK_WEIGHT`             | 0,45                            | Bobot ucapan pada skor sesi                   |
| `WELCOME_XP`               | 20                              | XP awal akun tamu                             |
| `COLLECTED_XP_FACTOR`      | 0,5                             | Pengali XP bila kata sudah dikoleksi          |
| `SPEAK_PASS`               | 50                              | Skor ucapan minimal untuk lolos               |
| `SPEAK_CAP_WITHOUT_TARGET` | 60                              | Batas skor bila kata target tidak terdengar   |
| `STAR_BANDS`               | tiga bintang 80, dua bintang 50 | Pita bintang pada skor sesi                   |
| `DEFAULT_ASR_CONFIDENCE`   | 0,85                            | Keyakinan bila pengenal ucapan tidak mengirim |
| `LEVEL_STEP`               | 100                             | Langkah level                                 |

Pembulatan: setengah ke atas (`Math.round`).

## Latihan

- Nilai tiap soal: benar pada percobaan pertama = 1; benar pada percobaan kedua = 0,5; gagal (kesempatan habis) = 0.
- Akurasi latihan = rata-rata nilai soal × 100, dibulatkan. Latihan dilewati = 0.
- Poin per jawaban untuk tampilan = `PRACTICE_XP / jumlahSoal × nilai`, dibulatkan.
- Jawaban yang sudah benar tidak memberi poin lagi.

## Ucapan

1. Normalisasi teks: huruf kecil, hapus tanda baca kecuali apostrof, rapikan spasi, perluas kontraksi umum (`i'm`, `it's`, `that's`, `don't`, `can't`, `what's`, `there's`, `let's`, dan sejenisnya).
2. `sim = 1 − jarakLevenshteinKata / max(panjangTarget, panjangDengar)`.
3. `skor = round(100 × sim × (0,7 + 0,3 × keyakinan))`.
4. Bila kata target (atau salah satu `alternates`) tidak ada di transkrip: skor dibatasi 60.
5. Lolos bila skor 50 atau lebih. Pita: 80 sampai 100 bagus, 50 sampai 79 hampir tepat, di bawah 50 coba lagi.
6. Skor ucapan sesi = skor tertinggi dari percobaan di sesi itu. Dilewati atau tak ada percobaan = 0.

Catatan jujur: skor ini mengukur apakah mesin pengenal ucapan mengenali kalimat, bukan kualitas pelafalan.

## Skor sesi dan bintang

- `skorSesi = round(0,55 × akurasiLatihan + 0,45 × skorUcapan)`.
- Bintang: 80 atau lebih tiga; 50 sampai 79 dua; di bawah 50 satu.

## XP

- `scanXp = 50`
- `practiceXp = round(30 × akurasi / 100)`
- `speakXp = 30` bila ucapan lolos, selain itu 0
- Bila kata sudah dikoleksi: tiap komponen dikali 0,5 lalu dibulatkan (50 menjadi 25; 30 menjadi 15; 25 menjadi 13).
- XP dikreditkan hanya saat `POST /sessions/:sid/complete`.

## Level (kumulatif)

- Batas naik ke level n: `100 × n × (n − 1) / 2`. Level 2 di 100, level 3 di 300, level 4 di 600, level 5 di 1000.
- `levelDariXp(total)` = n terbesar yang batasnya terpenuhi.
- `xpInLevel = total − batas(level)`; `xpForNextLevel = 100 × level`.

## Streak

Tanggal dihitung di zona Asia/Jakarta, bukan UTC.

## Contoh perhitungan (akun baru, 20 XP, misi pertama)

| Skenario                        | Akurasi | Ucapan | Skor sesi | Bintang | XP pindai / latihan / ucapan | Total XP | Level           |
| ------------------------------- | ------- | ------ | --------- | ------- | ---------------------------- | -------- | --------------- |
| A. Sempurna                     | 100     | 100    | 100       | 3       | 50 / 30 / 30 = 110           | 130      | 2 (30 dari 200) |
| B. Latihan 83, ucapan 60        | 83      | 60     | 73        | 2       | 50 / 25 / 30 = 105           | 125      | 2               |
| C. Latihan dilewati, ucapan 70  | 0       | 70     | 32        | 1       | 50 / 0 / 30 = 80             | 100      | 2 (0 dari 200)  |
| D. Latihan 100, ucapan dilewati | 100     | 0      | 55        | 2       | 50 / 30 / 0 = 80             | 100      | 2               |
| E. Latihan 83, ucapan dilewati  | 83      | 0      | 46        | 1       | 50 / 25 / 0 = 75             | 95       | 1 (tidak naik)  |
| F. Keduanya dilewati            | 0       | 0      | 0         | 1       | 50 / 0 / 0 = 50              | 70       | 1 (tidak naik)  |

Kesimpulan untuk demo: naik level pada misi pertama terjadi bila hadiah yang didapat minimal 80 XP, yaitu pindai ditambah ucapan lolos (skenario A sampai D), atau pindai ditambah latihan sempurna. Bila ucapan dilewati dengan latihan tidak sempurna, atau keduanya dilewati, level tidak naik. Karena itu naskah demo harus menyertakan ucapan yang lolos, dan tombol reset demo harus tersedia.

## Perbandingan bobot

Latihan 83 dan ucapan 60: bobot 0,55 dan 0,45 memberi 73 (dua bintang); bobot 0,5 dan 0,5 memberi 72. Perbedaannya kecil, sesuai maksud sedikit lebih besar.
