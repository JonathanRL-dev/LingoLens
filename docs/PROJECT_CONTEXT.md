# Konteks proyek LingoLens

LingoLens adalah aplikasi belajar kosakata Inggris lewat kamera untuk anak.
Inferensi benda berjalan di browser; gambar tidak dikirim ke server. Monorepo npm
memuat client (React/Vite), server, dan shared (TypeScript strict).

Alur: akun tamu → misi → sesi → pindai → kartu kosakata → latihan → ucap kalimat
→ hasil, XP, dan level. Tingkat A memakai choice dan cloze; order termasuk Tingkat B.
Mandarin sederhana (zh-CN, dengan pinyin) hanya terjemahan pendukung, bukan latihan.

## Sumber dan batas fase

Spesifikasi: “LingoLens — Rencana Eksekusi Vibecode per Fase”, 13 Oktober 2026,
bagian Fase 1 dan keputusan D-1–D-9; detail rumus dari lampiran scoring.md.
Fase 1 menyediakan kontrak 16 operasi, skema Zod, contoh respons, tipe frontend,
konstanta, serta fungsi murni skor dan level. Implementasi endpoint dan database
berada di fase berikutnya; keberadaan kontrak tidak berarti backend sudah tersedia.

## Kontrak dan kode bersama

- Basis API /api/v1, JSON, Bearer JWT; reset demo memakai header kunci.
- Amplop sukses { success: true, data }; gagal { success: false, error: { code, message, details } }.
- Skema runtime: shared/src/schemas/index.ts. Definisi endpoint dan contoh:
  scripts/api-contract.ts. npm run api:generate menghasilkan docs/openapi.yaml,
  docs/examples/*.json, dan client/src/api/schema.d.ts.
- npm run api:check mendeteksi artefak tidak sinkron; npm run api:lint memvalidasi OpenAPI.
- Fungsi skor, XP, dan level hanya di shared. Dokumen rumus: docs/scoring.md.
- Kunci tidak ada di Exercise, Vocabulary, atau Mission. Respons jawaban boleh
  memuat correctAnswer hanya setelah gagal dan kesempatan habis.
- Kartu hanya membuka kalimat choice; cloze/order tetap terpisah.
- Scan menampilkan XP yang akan diterima. Kredit XP hanya pada complete yang idempoten.
- Welcome 20 XP; misi sempurna 110 XP menghasilkan total 130: level 2, 30 dari 200.
- Akurasi latihan dibulatkan sesuai scoring.md; bobot sesi 0,55 latihan / 0,45 ucapan.
- Level kumulatif di 100, 300, 600; streak memakai tanggal Asia/Jakarta.

## Asumsi yang masih perlu ditinjau

ID string, index latihan mulai 0; category, difficulty, status berupa teks tanpa enum.
translations, related, dan exampleSentence adalah objek minimal sampai data Fase 2
dirinci. Entri koleksi terkunci hanya membuka vocabulary.id. Header reset diasumsikan
X-Demo-Reset-Key. Kebijakan nickname kasar dipasok server, bukan daftar rekaan.
Enum sepuluh kode error tidak mencantumkan error internal; pemetaan body 500 perlu
diputuskan PM. Lihat komentar ASUMSI pada kontrak dan sumber skema.

Pembekuan G0 belum ditandatangani. Lihat docs/DECISIONS.md.
