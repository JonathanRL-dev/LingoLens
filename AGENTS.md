# Panduan coding assistant

## Ringkasan proyek

LingoLens saat ini berupa kerangka monorepo dengan paket client, server, dan shared.
Ringkasan produk dari dokumen sumber belum tersedia; lihat [konteks proyek](docs/PROJECT_CONTEXT.md).

## Perintah

| Skrip root   | Perintah             | Fungsi                               |
| ------------ | -------------------- | ------------------------------------ |
| `dev`        | `npm run dev`        | Menjalankan client dan server.       |
| `dev:client` | `npm run dev:client` | Menjalankan Vite untuk client.       |
| `dev:server` | `npm run dev:server` | Menjalankan server dengan tsx watch. |
| `typecheck`  | `npm run typecheck`  | Memeriksa tipe semua workspace.      |
| `lint`       | `npm run lint`       | Menjalankan ESLint.                  |
| `test`       | `npm run test`       | Menjalankan Vitest sekali.           |
| `format`     | `npm run format`     | Memformat berkas dengan Prettier.    |

MySQL lokal: `docker compose up -d` setelah konfigurasi P0-B tersedia pada branch kerja.
Konfigurasi P0-B saat penulisan berada di branch `feat/p0-docker-env`, belum di `main`.

## Struktur repo

Pohon FASE tidak disertakan dalam BAHAN; pohon berikut mencatat struktur repo yang tersedia.

TODO(user): isi dari dokumen sumber

```text
lingolens/
├── AGENTS.md
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── eslint.config.js
├── vitest.config.ts
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/models/
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── vite-env.d.ts
│       ├── theme/
│       ├── copy/
│       ├── api/
│       ├── hooks/
│       ├── lib/
│       ├── types/
│       ├── mocks/
│       ├── pages/
│       ├── components/
│       │   ├── ui/
│       │   └── domain/
│       └── features/
│           ├── scanner/
│           ├── speech/
│           └── practice/
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   └── src/
│       ├── index.ts
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── middlewares/
│       ├── validators/
│       └── lib/
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   ├── seed/
│   └── src/
│       ├── index.ts
│       ├── constants.ts
│       ├── constants.test.ts
│       ├── scoring.ts
│       ├── levels.ts
│       └── schemas/
├── scripts/
│   ├── dev.mjs
│   └── data/
└── docs/
    ├── PROJECT_CONTEXT.md
    └── DECISIONS.md
```

## Aturan git

- Gunakan cabang `feat/p<fase>-<nama>`.
- Tidak ada push langsung ke `main` setelah G0.
- Buat satu commit per prompt.

## Aturan kode

- Pertahankan TypeScript `strict` dan `noUncheckedIndexedAccess`.
- Jangan menambah library di luar daftar yang diizinkan untuk fase terkait.
- Jangan commit `.env` atau kredensial aktual; gunakan contoh environment bila tersedia.
- Database wajib menggunakan `utf8mb4`.

## Lampiran A

TODO(user): isi dari dokumen sumber

## Sebelum selesai

Jalankan `npm run typecheck && npm run lint && npm run test`.
