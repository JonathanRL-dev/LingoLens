# Catatan keputusan

Sumber D-1–D-9: rencana eksekusi proyek, 13 Oktober 2026.
Status kontrak Fase 1: draft untuk tinjauan PM; belum dibekukan atau ditandatangani.
Dokumen ini tidak menyatakan fitur fase berikutnya sudah diimplementasikan.

| ID   | Keputusan                                                                                                    | Dampak                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| D-1  | Terjemahan kalimat memakai sentence_translations; atribusi per kalimat                                       | Database Fase 8: 16 tabel, utf8mb4                               |
| D-2  | Tiga kalimat berbeda per kata, satu per kind                                                                 | Kartu dan ucapan memakai choice; kartu tidak membuka cloze/order |
| D-3  | Bobot sesi 0,55 latihan / 0,45 ucapan                                                                        | Konstanta dan rumus tunggal di shared                            |
| D-4  | XP dikreditkan hanya pada complete; welcome 20 saat guest dibuat                                             | scan-attempts hanya menampilkan XP yang akan diterima            |
| D-5  | Ambang level kumulatif: 100, 300, 600                                                                        | Kelebihan XP terbawa; 130 XP = level 2, 30/200                   |
| D-6  | complete menerima skippedPractice?, skippedSpeak?                                                            | Tanpa skip, latihan belum selesai ditolak PRACTICE_INCOMPLETE    |
| D-7  | Workspace shared untuk kode murni, konstanta, skema, seed                                                    | MSW dan server memakai kode yang sama                            |
| D-8  | result_json untuk respons complete idempoten, latihan deterministik dari sessionId, state pada GET exercises | Persistensi dan pembentukan soal dikerjakan pada fase berikutnya |
| D-9  | Mandarin hanya terjemahan pendukung, label jika belum ditinjau, suara zh-CN bila tersedia                    | Bukan bahasa latihan                                             |
| D-10 | COCO-SSD sebagai model awal                                                                                  | Inferensi browser; model dan evaluasi di Fase 4                  |
| D-11 | guest-first                                                                                                  | JWT akun tamu melalui auth/guest                                 |
| D-12 | Inferensi di browser                                                                                         | Gambar tidak dikirim ke API                                      |

## Penyesuaian Fase 1 berdasarkan berkas penilaian

Rencana fase menyebut rata-rata nilai soal × 100 tanpa memperinci pembulatan.
scoring.md yang disediakan pengguna secara eksplisit meminta pembulatan. Implementasi
practiceAccuracy mengikuti detail tersebut: [1, 1, 0.5] → 83, [1, 0, 0] → 33.
Poin jawaban, skor sesi, dan komponen XP tetap memakai Math.round sesuai spesifikasi.

## Asumsi kontrak untuk tinjauan PM

- ID berupa string; index exercise mulai 0.
- Nilai kategori, difficulty, dan status tidak dibatasi enum rekaan.
- Bentuk translations, related, exampleSentence tidak dirinci Fase 1:
  objek minimal; contoh kalimat memakai id dan text sebagai ilustrasi.
- User mengikuti profil GET /me; avatarKey opsional mengikuti PATCH /me.
- vocabulary pada koleksi terkunci hanya berisi id.
- POST guest dan pembuatan sesi memakai 201; operasi lain 200, reset 204.
- Nama header kunci reset: X-Demo-Reset-Key.
- details error berupa objek atau null. Enum tetap tepat sepuluh kode;
  spesifikasi belum menetapkan kode internal untuk body 500.
- Kata kasar belum memiliki daftar resmi. nicknameWithPolicy menerima kebijakan
  murni dari pemanggil; server wajib memasok kebijakan ketika diimplementasikan.

## Tinjauan dan pembekuan G0

Status: menunggu tinjauan serta tanda tangan PM.
PM perlu memeriksa skema, contoh, asumsi di atas, dan pemetaan kode error sebelum
mencatat nama serta tanggal persetujuan di sini. Tidak ada tanda tangan yang direkayasa.
