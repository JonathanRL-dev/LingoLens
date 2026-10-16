# Konteks proyek LingoLens

## Ringkasan dari dokumen sumber

TODO(user): isi dari dokumen sumber

## Kondisi repo yang terverifikasi

- Monorepo bernama `lingolens`, dengan workspace `@lingolens/client`, `@lingolens/server`, dan `@lingolens/shared`.
- Client React merender judul dari `APP_NAME`; server HTTP menyediakan `GET /health`.
- Shared mengekspor `APP_NAME = 'LingoLens'`; ada satu uji konstanta tersebut.
- `client/public/models/` tersedia sebagai direktori placeholder, tanpa model terpasang.
- `docs/cv-model-card.md` belum tersedia; HTTPS tunnel untuk HP belum dikonfigurasi.
- P0-B berada di `feat/p0-docker-env`, belum di `main` yang menjadi dasar branch dokumen ini.
- Contoh environment P0-B mengaktifkan `VITE_ENABLE_COLLECTION` dan `VITE_ENABLE_PROFILE`; flag tidak membuktikan fitur sudah diimplementasikan.

## Tumpukan teknologi

- npm workspaces untuk client, server, dan shared.
- TypeScript strict dengan `noUncheckedIndexedAccess`.
- Vite untuk client React.
- MySQL 8 dengan charset `utf8mb4` dan collation `utf8mb4_unicode_ci` pada konfigurasi P0-B.
- Vitest untuk pengujian.

## Keputusan dan aturan kerja

Lihat [catatan keputusan](DECISIONS.md) dan [panduan assistant](../AGENTS.md).
D-1 sampai D-9 menunggu dokumen sumber; D-10 sampai D-12 mencatat arahan prompt,
referensi repo, dan bagian yang belum dapat dijelaskan dari bahan yang tersedia.
