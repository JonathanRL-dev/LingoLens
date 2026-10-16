# Catatan keputusan

D-1 sampai D-9 belum dapat disalin karena BAHAN hanya berisi penanda kosong.
D-10 sampai D-12 berasal dari arahan prompt; status implementasinya tidak disimpulkan dari judul.
Konfigurasi dan flag P0-B dibaca dari `feat/p0-docker-env`, yang belum masuk ke `main`.

| ID   | Judul                | Status                                |
| ---- | -------------------- | ------------------------------------- |
| D-1  | Belum tersedia       | Menunggu sumber                       |
| D-2  | Belum tersedia       | Menunggu sumber                       |
| D-3  | Belum tersedia       | Menunggu sumber                       |
| D-4  | Belum tersedia       | Menunggu sumber                       |
| D-5  | Belum tersedia       | Menunggu sumber                       |
| D-6  | Belum tersedia       | Menunggu sumber                       |
| D-7  | Belum tersedia       | Menunggu sumber                       |
| D-8  | Belum tersedia       | Menunggu sumber                       |
| D-9  | Belum tersedia       | Menunggu sumber                       |
| D-10 | COCO-SSD             | Arahan awal; model belum tersedia     |
| D-11 | guest-first          | Arahan awal; alur belum tersedia      |
| D-12 | Inferensi di browser | Arahan awal; inferensi belum tersedia |

## D-1: Belum tersedia

**Status:**

TODO(user): isi dari dokumen sumber

**Konteks:**

TODO(user): isi dari dokumen sumber

**Keputusan:**

TODO(user): isi dari dokumen sumber

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:**

TODO(user): isi dari dokumen sumber

## D-2: Belum tersedia

**Status:**

TODO(user): isi dari dokumen sumber

**Konteks:**

TODO(user): isi dari dokumen sumber

**Keputusan:**

TODO(user): isi dari dokumen sumber

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:**

TODO(user): isi dari dokumen sumber

## D-3: Belum tersedia

**Status:**

TODO(user): isi dari dokumen sumber

**Konteks:**

TODO(user): isi dari dokumen sumber

**Keputusan:**

TODO(user): isi dari dokumen sumber

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:**

TODO(user): isi dari dokumen sumber

## D-4: Belum tersedia

**Status:**

TODO(user): isi dari dokumen sumber

**Konteks:**

TODO(user): isi dari dokumen sumber

**Keputusan:**

TODO(user): isi dari dokumen sumber

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:**

TODO(user): isi dari dokumen sumber

## D-5: Belum tersedia

**Status:**

TODO(user): isi dari dokumen sumber

**Konteks:**

TODO(user): isi dari dokumen sumber

**Keputusan:**

TODO(user): isi dari dokumen sumber

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:**

TODO(user): isi dari dokumen sumber

## D-6: Belum tersedia

**Status:**

TODO(user): isi dari dokumen sumber

**Konteks:**

TODO(user): isi dari dokumen sumber

**Keputusan:**

TODO(user): isi dari dokumen sumber

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:**

TODO(user): isi dari dokumen sumber

## D-7: Belum tersedia

**Status:**

TODO(user): isi dari dokumen sumber

**Konteks:**

TODO(user): isi dari dokumen sumber

**Keputusan:**

TODO(user): isi dari dokumen sumber

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:**

TODO(user): isi dari dokumen sumber

## D-8: Belum tersedia

**Status:**

TODO(user): isi dari dokumen sumber

**Konteks:**

TODO(user): isi dari dokumen sumber

**Keputusan:**

TODO(user): isi dari dokumen sumber

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:**

TODO(user): isi dari dokumen sumber

## D-9: Belum tersedia

**Status:**

TODO(user): isi dari dokumen sumber

**Konteks:**

TODO(user): isi dari dokumen sumber

**Keputusan:**

TODO(user): isi dari dokumen sumber

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:**

TODO(user): isi dari dokumen sumber

## D-10: COCO-SSD

**Status:** Arahan awal dari prompt; model belum tersedia di repo.

**Konteks:** `client/public/models/` berisi placeholder. `docs/cv-model-card.md`
disebut sebagai referensi dalam prompt, tetapi berkas tersebut belum ada.

**Keputusan:** Catat COCO-SSD sebagai pilihan awal sesuai prompt, dengan
`client/public/models/` sebagai lokasi aset model dan `docs/cv-model-card.md`
sebagai referensi dokumentasi yang belum tersedia. Repo belum membuktikan model terpasang.

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:** Aset model dan model card belum dapat diperiksa.
Versi model, label, dan detail implementasi belum tersedia dalam bahan.

## D-11: guest-first

**Status:** Arahan awal dari prompt; alur guest belum tersedia di repo.

**Konteks:** Contoh environment pada P0-B memuat `VITE_ENABLE_COLLECTION=true`
dan `VITE_ENABLE_PROFILE=true`. Flag tersebut tidak menetapkan aturan autentikasi.

**Keputusan:** Catat guest-first sebagai arahan awal sesuai prompt.
Kedua flag tetap dicatat sebagai konfigurasi fitur, tanpa menyimpulkan aturan aksesnya.

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:** Hak akses guest, kebutuhan akun, dan penyimpanan data belum dapat
ditentukan dari flag atau struktur repo.

## D-12: Inferensi di browser

**Status:** Arahan awal dari prompt; inferensi belum tersedia di repo.

**Konteks:** `client/public/models/` tersedia sebagai placeholder aset client.
HTTPS tunnel untuk HP disebut dalam prompt, tetapi konfigurasi tunnel belum ada.

**Keputusan:** Catat inferensi di browser sebagai arahan awal sesuai prompt,
bersama kebutuhan HTTPS tunnel untuk HP. Struktur repo belum membuktikan
inferensi atau tunnel sudah diimplementasikan.

**Alasan:**

TODO(user): isi dari dokumen sumber

**Konsekuensi:** Inferensi dan akses HP melalui HTTPS belum dapat diverifikasi.
Library inferensi serta penyedia tunnel belum ditentukan dalam bahan.

## 2026-10-16 — Kerangka server Express dan environment

- Express 5 dipilih; penerusan galat handler async mengikuti perilaku Express 5.
- Server memakai CommonJS, TypeScript ES2022 strict, dan tsx untuk dev/demo;
  build produksi berada di luar lingkup prompt ini.
- Prisma CLI dan @prisma/client dipin pada major 6.x. url datasource akan berada
  di schema.prisma saat fase database dikerjakan; tidak ada perubahan Prisma schema di sini.
- .env berada di server/ dan dimuat melalui --env-file; tanpa dotenv.
  server/.env.example yang sudah ada diperbarui, tanpa membuat contoh kedua di akar.
- Enam variabel divalidasi saat impor; pesan galat hanya menyebut nama variabel.
  Waktu data aplikasi akan disimpan UTC; belum ada penyimpanan pada scaffold ini.
- Alias @shared menuju ../shared/src/index.ts di tsconfig dan Vitest; shared tidak diubah.
- Main masih berbasis Fase 0.2; cabang Fase 1 tidak digabung dalam prompt ini.
- Catatan integrasi: skrip dev:server akar masih menyebut @lingolens/server;
  gunakan npm run dev -w server. Batas perubahan prompt melarang perbaikan skrip akar itu.
- Pada main, shared belum mendeklarasikan Zod; gunakan Zod 4.6.7 yang sebelumnya
  dipakai jalur Fase 1. Vitest server dan root terpasang pada versi 4.1.12 yang sama.
- Audit instalasi mencatat tiga temuan high pada rantai Prisma 6 / @prisma/config /
  deepmerge-ts. Saran npm berpindah ke Prisma 7; tidak diterapkan karena batas major 6.

## 2026-10-16 — Middleware server dan usulan INTERNAL_ERROR ke PM

- Usulan PM: INTERNAL_ERROR khusus server untuk HTTP 500, di luar sepuluh kode
  Fase 1; belum merupakan perubahan shared atau persetujuan kontrak OpenAPI.
- Shared di main hanya mengekspor APP_NAME. Atas persetujuan pengguna pada prompt
  ini, tipe ErrorCode sementara diturunkan dari tabel status di lib/errors.ts,
  tanpa menyalin enum Zod. Impor ErrorCodeSchema menunggu integrasi Fase 1.
- Batas per IP: global 300/15 menit, ketat 60/menit; OPTIONS dilewati.
  strictLimiter belum dipasang ke rute, pemasangannya masuk Fase 9.
- JSON rusak atau di atas 10 kb memakai 400 VALIDATION_ERROR, details.reason.
- CORS mengizinkan header Authorization, Content-Type, X-Demo-Key.
- JWT memverifikasi HS256 dan sub string tanpa lookup database.
- Galat internal dicatat ke Pino; respons tidak memuat stack atau pesan aslinya.
  Header Authorization dan X-Demo-Key disamarkan pada log request.
