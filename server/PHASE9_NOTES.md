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

## Fase 9 tahap 2 — Misi dan hint sesi

Empat endpoint misi/hint memakai `mission.routes.ts` → `mission.controller.ts` →
`missionEndpoints.service.ts`. `mission.service.ts` memuat misi aktif dan sesi
selesai pengguna dalam dua query; `getMissionStatusesForUser(userId)` dipakai
ulang untuk daftar, detail, dan pembukaan sesi. Daftar mengambil nama kategori
sekali untuk semua misi, sehingga tidak melakukan query per misi. `session.service.ts`
menyediakan `getOwnedSession(userId, sessionId)` dan menyamakan sesi asing/tidak
ada sebagai 404.

Kode server tambahan tahap ini: `MISSION_NOT_FOUND` (404), `SESSION_NOT_FOUND`
(404), dan `HINT_LIMIT_REACHED` (409). Kontrak OpenAPI beku belum mencantumkan
ketiganya; endpoints tetap memakai kode ini sesuai aturan tahap 2. `MISSION_LOCKED`
tetap 409 seperti kontrak. Sesi `abandoned` untuk hint memakai
`SESSION_COMPLETED` 409 karena kontrak tidak menyediakan kode status lain.

Asumsi: API mengirim status `open | locked | completed` sesuai aturan tahap 2,
walaupun contoh OpenAPI lama memakai `available`; `titleId` langsung menjadi
`title`, integer difficulty dipetakan 1/2/3 menjadi easy/medium/hard, dan hint
ketiga berupa satu huruf awal target ber-ID terkecil. Kontrak hint hanya memiliki
`hint` dan `hintCount`, jadi jumlah sisa hint tidak dikirim terpisah.
`hintText` yang null menghasilkan string kosong untuk tetap memenuhi schema.
Tidak ada target kata atau teks kata pada daftar misi.

Bruno tahap 2: `07-missions.bru`, `08-mission-detail.bru`,
`09-start-session.bru`, dan `10-hint.bru`.

## Fase 9 tahap 3 — Pindai dan latihan

`POST /sessions/:sid/scan-attempts` memeriksa pasangan model/label target dan
ambang confidence di database, mencatat tiap input, lalu mengubah sesi started
menjadi scanned secara bersyarat. XP pada `xpAwarded` hanya pratinjau komponen
scan; tidak ada `xp_events` atau perubahan `users.total_xp` sebelum complete.
`GET /sessions/:sid/exercises` hanya melayani sesi scanned. `loadSessionExercises(session)`
di `exercise-session.service.ts` memuat data dan mengembalikan `{ exercises, keys }`;
controller hanya mengirim latihan beserta state dari `exercise_attempts`.
`computeXpComponents({ scanXp, practiceXp, speakXp, alreadyCollected })` di
`reward.service.ts` membungkus faktor dan pembulatan dari `shared.computeXp`.

Asumsi: `exercise_plan` berupa daftar jenis (`choice`, `cloze`) dipetakan ke
kalimat target dengan jenis sama dan ID terkecil yang belum dipakai. Bentuk
objek dengan `sentenceId` dan `kind` juga diterima. Latency desimal dibulatkan
ke bilangan terdekat karena kolom Prisma adalah INT. Terjemahan hint latihan
memilih `id-ID`, lalu `zh-CN`, atau string kosong. Generator shared belum
mendukung `order`; plan tersebut menghasilkan 500 generik dan rincian dicatat
di log. Data mini-seed belum cukup untuk membuat seluruh pengecoh, sehingga tes
integrasi menambah kosakata fixture khusus.

Kode error mengikuti kontrak beku: sesi completed/abandoned memakai
`SESSION_COMPLETED`, sesi belum dipindai memakai `SESSION_NOT_SCANNED`, dan ID
sesi hilang/asing memakai `SESSION_NOT_FOUND` dari ekstensi tahap 2. `xpAwarded`
adalah angka scan XP saja, mengikuti contoh respons OpenAPI.

Bruno tahap 3: `11-scan-attempt.bru` dan `12-exercises.bru`. Batasan verifikasi
COCO-SSD dicatat di `docs/cv-model-card.md`.

## Fase 9 tahap 4 — Jawaban dan pronunciation

`POST /sessions/:sid/exercises/:eid/answers` memvalidasi ownership/status,
memuat latihan dan key privat dari `loadSessionExercises`, lalu menilai dengan
`shared.gradeAnswer`. Hasil disimpan sebagai teks jawaban pada kunci unik
`session_id + sentence_id + attempt_no`; collision P2002 membaca kembali hasil
baris yang sudah ada. Replay setelah jawaban benar mengembalikan benar dengan
`pointsAwarded: 0`. `POST /sessions/:sid/pronunciation-attempts` memakai
`shared.scorePronunciation` dan menyimpan transkrip/skor/confidence/sentence ID.
Kedua endpoint tidak menulis XP.

Respons answer mengikuti field OpenAPI: `correct`, `attemptNo`, `attemptsLeft`,
`pointsAwarded`; `hint` hanya untuk salah pertama dan `correctAnswer` hanya pada
salah kedua. Body answer dibatasi string 1–255 karakter, karena shared saat ini
hanya menyediakan choice/cloze string; array pada OpenAPI hanya diperlukan order.
`gradeAnswer` menghasilkan skor 0.5 pada jawaban benar percobaan kedua, walaupun
`AnswerResponse.pointsAwarded` OpenAPI saat ini bertipe integer; server mengikuti
skor dari shared sehingga field ini dapat berisi desimal.
Respons pronunciation mengembalikan `score`, `level`, `passed`,
`targetWordHeard`, serta feedback kode `good | almost | retry | target_missing`.

Celah/asumsi: OpenAPI pronunciation mencontohkan feedback sebagai teks, sedangkan
instruksi tahap ini meminta kode; server mengikuti instruksi tahap ini. Kolom
`pronunciation_attempts` tidak memiliki tempat untuk menyimpan kode feedback,
jadi kode hanya diturunkan dari hasil shared saat respons dibuat; DB menyimpan
transkrip, skor, confidence, dan sentenceId. Schema juga membatasi transcript ke
255 karakter (bukan 300) agar tidak melampaui `VARCHAR(255)`. Tanpa sentenceId,
kalimat choice target dengan ID terkecil dipakai. ID kalimat berupa angka string
DB seperti ID latihan; contoh OpenAPI `s-cup-choice` tidak cocok dengan skema INT.
Sentence yang tidak ditemukan/bukan choice/milik kata lain menggunakan 404
`NOT_FOUND`, satu-satunya kode generik kontrak. Recognition confidence yang
tidak dikirim memakai default 0.85 dari shared.

Bruno tahap 4: `13-answer.bru` dan `14-pronunciation.bru`.

## Fase 9 tahap 5 — Penyelesaian sesi

`POST /sessions/:sid/complete` divalidasi lalu diproses oleh
`complete.service.ts`. Hanya sesi milik pengguna berstatus `scanned` yang dapat
diselesaikan. Semua soal harus solved atau exhausted kecuali
`skippedPractice: true`; akurasi, skor sesi, bintang, dan ambang ucapan memakai
fungsi `@shared`. Skor ucapan memakai nilai tertinggi dari percobaan sesi.

Klaim perubahan `scanned → completed`, tiga event XP, total XP/level/streak,
koleksi kata, dan snapshot `result_json` ditulis dalam satu transaksi Prisma.
Klaim sesi bersyarat dan unique key event menangani permintaan serentak; replay
mengirim snapshot JSON yang tersimpan tanpa kredit ulang. `nextMission` dihitung
dalam transaksi sesudah status completed berubah dengan helper status misi yang
sama. Streak memakai tanggal kalender Asia/Jakarta; nilai MySQL `DATE` disimpan
sebagai UTC midnight dan dibaca sebagai tanggal UTC agar tidak bergeser sehari.
`lib/time.ts` hanya mengubah instant yang diberikan menjadi tanggal Jakarta.

Kode galat yang dipakai tetap kode kontrak: `SESSION_NOT_FOUND` (404),
`SESSION_NOT_SCANNED` (409), `PRACTICE_INCOMPLETE` (409), dan
`INTERNAL_ERROR` (500). Body completion hanya menerima dua boolean opsional dan
body kosong dinormalisasi sebagai `{}` oleh Express JSON. Response snapshot
memuat amplop `{ success, data }` lengkap supaya replay identik dengan respons
pertama. `alreadyCollected` diperiksa di dalam transaksi sebelum upsert. Kolom
`times_practiced` dibuat dengan default 1 lalu bertambah satu pada penyelesaian
berikutnya.

Asumsi: `practiceXp` dasar misi diskalakan oleh akurasi dan dibulatkan sebelum
`computeXpComponents`; speak XP diberikan bila skor mencapai `SPEAK_PASS` dari
shared. Skor ucapan adalah maksimum semua percobaan, bukan rata-rata. Jika tidak
ada latihan/ucapan atau bagian dilewati, skornya 0. `result_json` menyimpan
seluruh amplop respons; OpenAPI mendeskripsikan bentuk objek `data`.
`nextMission` adalah misi open dengan `order_index` paling kecil sesudah misi
yang selesai. `best_score` sesi dan koleksi memakai `sessionScore`.

Tes MySQL tahap 5 mencakup alur pertama (130 total XP termasuk welcome, level 2),
replay dan complete serentak, komponen setengah untuk kata terkoleksi, skip,
ownership/status, kunci respons publik, invariant total XP terhadap seluruh
event, serta batas streak WIB. Jalankan `npm run test:db -w server` untuk
menjalankan integrasi terhadap database `lingolens_test`.

Bruno memiliki workflow `01-misi-pertama-lengkap`, `02-lewati-latihan`,
`03-lewati-ucapan`, dan `04-kata-sudah-dikoleksi`. Tiga alur pertama membuat
guest dan menyimpan token; semua menyimpan session ID, ID latihan, dan jawaban
dari respons sebelumnya. Alur kata terkoleksi menyelesaikan misi pertama dua
kali pada guest yang sama, sehingga pembelian/akun sebelumnya tidak diperlukan.
