# LingoLens

========================================================================================
LINK DEPLOYMENT (PROTOTYPE) : https://lingo-lens-rghv15dlb-jonathanrl-dev.vercel.app/
========================================================================================

Kerangka monorepo client, server, dan shared. Setelah setup, jalankan client dan server
bersama dengan satu perintah: `npm run dev`.

## Prasyarat

- Node 20 atau 22; gunakan `nvm use` sesuai `.nvmrc` (22).
- Docker Desktop yang berjalan, dengan port 3306 tersedia.
- `cloudflared` untuk uji HTTPS di HP Android.
- Akun GitHub tim dan akses ke repo.

## Mulai cepat

Clone repo dan masuk ke direktori root. Panduan lengkap ini memerlukan berkas P0-B
(`docker-compose.yml` dan kedua `.env.example`) serta P0-C (dokumen konteks)
sudah digabung; saat penulisan keduanya masih berada di branch fitur masing-masing.

```sh
nvm use
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
docker compose up -d --wait
npm run dev
```

Client: http://localhost:5173. Health server: http://localhost:4000/health.
Server Fase 0 belum memuat berkas `.env`; contoh environment menyiapkan fase berikutnya.

## Tujuh skrip root

| Skrip        | Perintah             | Fungsi                          |
| ------------ | -------------------- | ------------------------------- |
| `dev`        | `npm run dev`        | Menjalankan client dan server.  |
| `dev:client` | `npm run dev:client` | Menjalankan client.             |
| `dev:server` | `npm run dev:server` | Menjalankan server.             |
| `typecheck`  | `npm run typecheck`  | Memeriksa tipe semua workspace. |
| `lint`       | `npm run lint`       | Menjalankan ESLint.             |
| `test`       | `npm run test`       | Menjalankan Vitest sekali.      |
| `format`     | `npm run format`     | Memformat repo dengan Prettier. |

## Uji di HP: HTTPS tunnel

Hentikan client yang sudah berjalan agar port 5173 tersedia. Di terminal pertama:

```sh
npm run dev:host -w @lingolens/client
```

Di terminal kedua:

```sh
cloudflared tunnel --url http://localhost:5173
```

Buka URL `https://....trycloudflare.com` yang dicetak cloudflared di Chrome Android.
Pastikan judul **LingoLens** tampil dan koneksi HTTPS ditandai aman/ikon gembok.
HTTPS wajib agar kamera bisa dipakai pada fase berikutnya; kamera belum tersedia di Fase 0.
Hot reload yang belum berjalan lewat tunnel bukan blocker Fase 0; catat nanti di
`docs/DECISIONS.md` setelah pengujian manusia. Tunnel ini meneruskan halaman client.

## Jebakan umum

- **Charset MySQL:** wajib `utf8mb4`. Bila volume awal memakai charset salah, jalankan
  `docker compose down -v` lalu `docker compose up -d --wait`; reset ini menghapus data volume.
  Hentikan MySQL lokal bila port 3306 sudah terpakai.
- **Host Vite:** jika muncul "Blocked request. This host is not allowed", periksa versi Vite
  dan `server.allowedHosts` di `client/vite.config.ts`. `.trycloudflare.com` mencakup subdomain;
  tambahkan domain tunnel lain secara eksplisit, jangan gunakan `allowedHosts: true`.
  Lihat [dokumentasi resmi Vite](https://vite.dev/config/server-options#server-allowedhosts).
- **Akhir baris Windows/Unix:** `.gitattributes` memakai `* text=auto` agar Git menormalkan teks;
  ikuti LF pada `.editorconfig` saat mengedit.
- **Versi Node:** samakan versi tim melalui `.nvmrc` dan `nvm use`; Node 24 di luar rentang proyek.
- **Environment:** `.env` tidak boleh di-commit. Simpan hanya contoh tanpa secret aktual.

## Konteks dan aturan cabang

Baca [AGENTS.md](AGENTS.md) dan [PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) setelah P0-C digabung.
Gunakan cabang `feat/p<fase>-<nama>`; tidak ada push langsung ke `main` setelah G0.

## Kontrak dan kode bersama Fase 1

Sumber skema runtime ada di shared/src/schemas/index.ts; definisi endpoint dan
contoh ada di scripts/api-contract.ts. Setelah mengubah sumber tersebut:

- npm run api:generate — menghasilkan OpenAPI, contoh JSON, dan tipe frontend.
- npm run api:check — memeriksa artefak tetap sinkron tanpa menulis ulang.
- npm run api:lint — memvalidasi docs/openapi.yaml.
- npm run typecheck, npm run lint, npm run test — memverifikasi kode dan uji.

Tipe frontend tersedia di client/src/api/schema.d.ts. Rumus dibaca di
docs/scoring.md; asumsi dan status tinjauan PM ada di docs/DECISIONS.md.
Fase ini belum mengimplementasikan handler API atau database.
Gunakan Node 22 sesuai .nvmrc (Redocly memerlukan minimal 22.12 atau 20.19).
