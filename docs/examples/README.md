# Contoh respons Fase 1

Satu berkas per operationId (nama berkas memakai huruf awal kapital).
Seluruh data merupakan ilustrasi, bukan seed produksi atau data pengguna nyata.
Kalimat ditulis sendiri; token JWT hanyalah penanda dan tidak dapat dipakai autentikasi.

Contoh ditulis oleh npm run api:generate dari scripts/api-contract.ts,
divalidasi terhadap skema Zod, lalu disertakan pula sebagai example di OpenAPI.
Contoh Exercises menampilkan ketiga jenis untuk kontrak Tingkat B. Tingkat A
dapat memakai exercisePlan ["choice", "cloze"].

Reset.json berisi null sebagai penanda tidak ada body. Respons HTTP DELETE /dev/reset
sebenarnya harus 204 dengan body kosong; jangan mengirim JSON null.

correctAnswer hanya boleh dikirim oleh respons answers setelah gagal dan kesempatan
habis. Contoh sukses Answer tidak mengandung kunci. Contoh kartu hanya memakai
kalimat choice; kalimat cloze dan order berbeda.

ASUMSI: Struktur exampleSentence tidak dirinci Fase 1; contoh memakai { id, text }.
translations dan related berupa array kosong sampai data Fase 2 tersedia.
Status/difficulty misi dalam contoh bukan pembatasan enum kontrak.
