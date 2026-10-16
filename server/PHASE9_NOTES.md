# Fase 9 tahap 1 — Auth, profil, reset, koleksi, dan kartu

## Status

Enam endpoint tahap 1 sudah tersedia. Endpoint misi/sesi/latihan/complete belum
dipasang; tugas 2–5 dapat memakai fondasi dan helper di bawah.

## Menjalankan lokal

Dari akar repo:

    docker compose up -d
    npm run db:migrate -w server -- --name init
    npm run db:seed:minimal -w server
    npm run dev -w server

Pada instalasi baru, salin server/.env.example ke server/.env lalu isi kredensial.
.env diabaikan Git. Jangan memakai contoh secret di produksi.
Container hanya mempublikasikan 127.0.0.1:3307, karena 3306 sudah dipakai layanan
lain pada lingkungan ini; MYSQL_PORT dapat menimpa port Compose. URL env harus
mengikuti port yang dipilih. Volume MySQL lama dipertahankan.

Tiga database terpisah, semuanya utf8mb4:

- lingolens: pengembangan/demo.
- lingolens_test: integrasi, boleh dibersihkan oleh harness.
- lingolens_shadow: shadow Prisma migrate dev, tidak boleh menunjuk dev/test.

Lingkungan lokal saat pengerjaan memakai akun lingolens_api dengan password
acak di .env dan hak terbatas pada tiga database tersebut. Secret JWT dan demo
juga lokal; tidak disimpan di Git. Di instalasi lain, buat akun/hak yang sesuai.

## Environment

Wajib: DATABASE_URL, JWT_SECRET (minimal 32), CORS_ORIGIN (daftar URL dipisah
koma), PORT, NODE_ENV, DEMO_RESET_KEY (minimal 16).
JWT_EXPIRES_IN default 21d; integer positif dengan unit ms/s/m/h/d/w/y.
GLOBAL_RATE_LIMIT_PER_MINUTE default 300 dan minimal 300.
DATABASE_URL_TEST wajib hanya untuk test:db.
SHADOW_DATABASE_URL dipakai Prisma CLI untuk migrate dev.

Server memakai Express 5, CommonJS, tsx dan --env-file, tanpa dotenv tambahan.

## Struktur dan kontrak kecil antar-tugas

- app.ts: createApp(), tanpa listen; index.ts meneruskan ke server.ts.
- routes/profile.routes.ts: enam wiring endpoint, validator, autentikasi.
- controllers/profile.controller.ts: handler HTTP tipis.
- services/profile.service.ts: createGuest, getProfile, updateProfile, resetProfile.
- services/vocabulary.service.ts: getCollection, getVocabulary; DTO allowlist.
- lib/prisma.ts: getPrisma(), singleton lazy. Prisma.TransactionClient untuk transaksi.
- lib/tokens.ts: issueGuestToken(userId), HS256 dan masa berlaku dari env.
- middleware/auth.ts: requireAuth mengisi req.user.id dari JWT sub.
- middleware/validate.ts: validate({body?, params?, query?});
  query hasil validasi berada di res.locals.query.
- middleware/demoReset.ts: allowDemoReset, dipasang SESUDAH requireAuth.
- middleware/rateLimit.ts: createLimiter, globalLimiter, strictLimiter.
  Global 300/menit secara default, guest 100/menit, OPTIONS dilewati.
- lib/errors.ts: AppError(code, message, details?), status dari statusByCode.
  Pertahankan urutan argumen ini; pemanggil yang ada sudah memakainya.
- lib/profanity.ts: containsProfanity, daftar Indonesia/Inggris mudah diperluas.
  Normalisasi NFKD, huruf kecil, pemisah, dan 0/o, 1/i, 3/e, 4/a, $/s.
  Pencocokan substring dapat menolak nama yang mengandung kata terlarang.
- shared: WELCOME_XP, levelInfo/levelDariXp, scoring ucapan/latihan/sesi/XP.
  Semua rumus shared murni. Konstanta Fase 1 di constants.ts.

Kode yang tersedia: VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND,
EXERCISE_NOT_FOUND, MISSION_LOCKED, SESSION_COMPLETED, SESSION_NOT_SCANNED,
ATTEMPTS_EXHAUSTED, PRACTICE_INCOMPLETE, RATE_LIMITED, INTERNAL_ERROR.

INTERNAL_ERROR tetap ekstensi server untuk 500 sesuai keputusan sebelumnya;
enum OpenAPI yang dibekukan tetap sepuluh kode. Penyelarasan formal enum 500
masih perlu keputusan PM; jangan diam-diam mengganti kode atau menyalin enum baru.
Galat tak terduga dicatat di server, respons tidak membawa pesan Prisma/stack.

## Keputusan API

- Kontrak dari feat/p1-api-types-g0 dipakai dengan klarifikasi pengguna sebelumnya.
- Nickname trim 1–20: minimal satu mengikuti kontrak Fase 1, bukan minimum dua
  pada narasi Fase 9. Kata kasar ditolak. Request body strict.
- PATCH /me menerima nickname dan/atau avatarKey; {} adalah no-op.
  avatarKey maksimal 80, nullable untuk menghapus avatar. Profil selalu memuatnya.
  Skema User/PATCH di OpenAPI diselaraskan agar menerima null.
- JWT reset selalu wajib. Non-production boleh reset tanpa kunci. Production
  hanya boleh dengan X-Demo-Key yang cocok lewat timingSafeEqual; selain itu 404.
- Reset memakai satu transaksi serializable: hapus anak sesi pemanggil, XP,
  sesi, koleksi, lalu reset XP/level/streak/tanggal dan tulis satu welcome 20.
  Nickname/avatar tetap. ID pengguna dari body tidak dipakai untuk sasaran reset.
- Koleksi terkunci hanya vocabulary.id dan imageUrl, plus collected/bestScore.
- Kartu kosakata hanya boleh dibaca setelah dikoleksi. Belum dikoleksi maupun
  tidak ada memakai 404 NOT_FOUND yang sama. Tidak memakai kode baru
  VOCABULARY_NOT_FOUND karena tidak ada pada kontrak.
- ID database INT diserialisasikan ke string pada API; parameter ID positif int32.
- Kartu memuat satu exampleSentence choice sesuai kontrak, beserta terjemahannya.
  Tidak memuat kalimat cloze/order, blankWord, wordsJson, atau kunci.
- Related vocabulary yang belum dikoleksi juga hanya ID/gambar.
- Nilai database opsional phonetic/imageUrl menjadi string kosong pada DTO;
  exampleSentence menjadi {} bila tak ada kalimat choice.
- Enam rancangan tabel dengan DDL tidak lengkap tetap ditandai ASUMSI pada schema.
  FK yang tidak disebut DDL sepuluh tabel lainnya tidak ditambahkan.
- Mini-seed hanya 2 kata dan 2 misi, bukan dataset produksi 12 kata/5 misi.
  Mandarin/pinyin di fixture belum ditinjau penutur; bukan materi terkurasi.

## Pengujian

Dari akar repo:

    npm run typecheck -w server
    npm run test -w server
    npm run test:db -w server
    npm run lint
    npm run typecheck
    npm run test

test biasa menjalankan unit/Supertest mock; enam suite integrasi ditandai skip.
test:db memuat server/.env lewat Node, memvalidasi URL test sebelum menulis,
menerapkan migrate deploy HANYA ke lingolens_test, lalu mengaktifkan RUN_DB_TESTS=1.
Runner menolak DB sama dengan dev dan nama tanpa akhiran _test. Suite DB dijalankan
berurutan agar resetDatabase tidak beradu antar-file.

Helper di src/test/helpers/:

- getTestApp(): app untuk Supertest.
- resetDatabase(): cleanup transaksional, guard DB test wajib.
- seedMinimal(prisma): seed idempoten dengan ID eksplisit.
- createGuest(nickname?): { token, userId }.

Mini-seed mandiri: npm run db:seed:minimal -w server (tidak pernah cleanup).
Integrasi membuktikan XP welcome, level batas, token, patch avatar, gate reset,
isolasi dua pengguna, reset berulang, siluet, larangan cloze/kunci pada kartu,
Mandarin utuh dan mini-seed idempoten.

## Bruno

Buka server/bruno dan pilih environment local. Jalankan Guest dahulu agar
script menyimpan token di environment lokal. Ada enam request tahap 1.
Vocabulary yang belum dikoleksi memang 404. Di production, tambahkan X-Demo-Key
secara lokal pada request Reset; jangan commit token/kunci dari environment.
