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

## G0 — Pembekuan kontrak API Fase 1

Tanggal pemeriksaan teknis: 16 Oktober 2026 (Asia/Jakarta).
Status: entri pembekuan disiapkan, menunggu tinjauan dan tanda tangan PM.
Hasil pemeriksaan teknis ini tidak menyatakan seluruh ketidakcocokan telah selesai.

Hal yang diajukan untuk dibekukan:

- Basis /api/v1, 16 operasi beserta operationId, request, respons, dan status HTTP
  pada docs/openapi.yaml; Bearer JWT serta header reset demo X-Demo-Key.
- Amplop sukses/error, sepuluh kode error, dan batas pembukaan kunci jawaban.
- Bentuk Exercise choice/cloze/order, Vocabulary, Mission, dan komponen bersama.
- Skema Zod di shared/src/schemas, 16 contoh JSON per operationId, dan skenario M4.
- Konstanta serta fungsi murni skor, XP, level kumulatif, dan tanggal streak WIB.
- Tipe frontend hasil OpenAPI di client/src/api/schema.d.ts.

ASUMSI jalur: workspace frontend Fase 0 bernama client, bukan frontend.
api:types menggunakan jalur tipe yang sudah ada agar tidak membuat salinan kedua.

Verifikasi:

- npm run api:lint: tanpa error; tiga peringatan (lisensi API belum ditentukan,
  respons komponen 409 tidak digunakan, security scheme demoKey tidak digunakan).
- npm run api:types: berhasil; 16 referensi operations pada tipe hasil generator.
- Audit silang: 16 operationId memiliki skema Zod berpadanan; sepuluh kode error
  identik. Tidak ada bidang kunci jawaban pada Exercise, Vocabulary, Mission,
  atau contoh exercises/vocabulary. correctAnswer hanya pada respons answers.
- npm run typecheck, npm run lint, npm run test, dan npm run test -w shared:
  lulus; 185 uji. Lingkungan pemeriksaan memakai Node 24.20.0; Node 22 sesuai
  .nvmrc belum diverifikasi pada pemeriksaan ini.
- Tiga belas konstanta Fase 1 sesuai nilai spesifikasi; uji batas level, tengah
  malam WIB, bobot/pita, ucapan, susun kata token ganda, serta XP lulus.
- Angka contoh dihitung manual sesuai M4 dan diuji konsistensinya; contoh tidak
  mengimpor scoring.ts. Tidak ada dependensi yang ditambahkan pada M5.

Ketidakcocokan yang ditemukan dan tidak diperbaiki dalam M5:

1. GuestRequest dan UpdateMeRequest: Zod melakukan trim dan membatasi nickname
   1–20 karakter sesuai M3. OpenAPI belum memiliki maxLength 20 dan tidak
   menjelaskan normalisasi trim. Bentuk 34 komponen lainnya selaras setelah
   perbedaan representasi union dan metadata dokumentasi dinormalisasi.
2. Sumber generator scripts/generate-api.ts dan scripts/api-contract.ts masih
   memakai format/nama contoh lama dan belum mencerminkan penyesuaian M2–M4.
   npm run api:check gagal pada docs/examples/Health.json. Jangan menjalankan
   api:generate untuk menyinkronkan sebelum sumber generator diperbaiki lewat
   tugas yang disetujui PM; perintah itu dapat menimpa kontrak dan contoh baru.
   Skrip api:types hanya membaca OpenAPI dan aman untuk regenerasi tipe saja.
3. Asumsi pada bagian lama dokumen ini dan PROJECT_CONTEXT.md masih menyebut
   X-Demo-Reset-Key serta nicknameWithPolicy. Kontrak M2 dan skema M3 kini
   memakai X-Demo-Key; aturan kata kasar berada di server, tanpa helper tersebut
   di shared. Catatan lama dipertahankan sesuai batas perubahan M5.

Perubahan setelah entri ini atas kontrak, skema, contoh, atau rumus yang diajukan
untuk dibekukan hanya melalui persetujuan PM dan dicatat di DECISIONS.md.
PM perlu meninjau ketidakcocokan di atas sebelum menetapkan pembekuan efektif.

Nama PM:
Tanggal persetujuan:
Tanda tangan PM:

## Keputusan implementasi server (16 Oktober 2026)

- Server memakai Express 5, Prisma 6.x, TypeScript CommonJS, dan tsx; `.env`
  dimuat melalui `--env-file` dari `server/`, tanpa dotenv.
- Validasi environment dilakukan saat modul env diimpor. Pesan validasi hanya
  menyebut nama variabel, bukan nilainya.
- JWT memakai HS256. Reset mewajibkan JWT untuk menentukan pemilik data dan
  menerima `X-Demo-Key` sebagai kunci tambahan ketika kebijakan deployment
  mensyaratkannya.
- CORS mengizinkan `Authorization`, `Content-Type`, dan `X-Demo-Key`; body
  JSON dibatasi 10 kb. Galat internal dicatat lewat Pino tanpa mengirim stack
  atau pesan internal ke respons.
- `INTERNAL_ERROR` dipakai server untuk HTTP 500. Kode tersebut berada di luar
  sepuluh nilai `ErrorCode` kontrak Fase 1 sampai ada persetujuan perubahan
  kontrak.
