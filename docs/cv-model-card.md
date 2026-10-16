# COCO-SSD model card: batas verifikasi server

## Implementasi dan sumber

- Paket client mendeklarasikan `@tensorflow/tfjs` versi `^4.22.0` dan `@tensorflow-models/coco-ssd` versi `^2.2.3` (`client/package.json`).
- Konfigurasi yang dipakai: `lite_mobilenet_v2`; model dimuat dari aset lokal `client/public/models/coco-ssd/`.
- Tanggal model lokal ditambahkan/diunduh: **2026-10-16**, berdasarkan commit `deff119` (`feat(scanner): add Detector interface, CocoDetector, and local model`).
- Lisensi kode paket: **Apache-2.0**, dinyatakan metadata paket terpasang dan [package.json upstream](https://github.com/tensorflow/tfjs-models/blob/master/coco-ssd/package.json). README paket tidak memuat keterangan lisensi. ⚠️ Lisensi bobot model terlatih/aset model lokal belum terverifikasi secara terpisah; isi setelah sumber lisensinya diperiksa.

## Label yang dievaluasi

Nilai pengukuran di bawah mengikuti `shared/seed/detection_labels.json`. Semua nilainya masih `null`, jadi belum ada hasil atau ambang yang dapat dilaporkan.

| Kata | Label COCO-SSD | minConfidence | Lolos | Percobaan | Persentase | Rata-rata confidence |
| --- | --- | --- | --- | --- | --- | --- |
| cup | cup | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| bottle | bottle | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| bowl | bowl | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| spoon | spoon | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| banana | banana | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| apple | apple | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| book | book | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| clock | clock | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| backpack | backpack | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| chair | chair | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| laptop | laptop | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |
| phone | cell phone | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) | (belum diukur) |

## Kondisi uji

| Kondisi | Data |
| --- | --- |
| Perangkat dan model HP | (isi manusia) |
| Sistem operasi dan versi | (isi manusia) |
| Browser dan versi | (isi manusia) |
| Pencahayaan dan latar | (isi manusia) |
| Jarak, ukuran, dan orientasi objek | (isi manusia) |
| Cara uji dan variasi objek per kata | (isi manusia) |
| Jumlah percobaan | (belum diukur; lab menyediakan maksimal 20 percobaan per kata) |

## Kinerja

| Ukuran | Hasil |
| --- | --- |
| Persentase lolos per kata | (belum diukur) |
| Rata-rata confidence per kata | (belum diukur) |
| Waktu muat model | (isi manusia) |
| Latensi inferensi | (isi manusia) |
| Penggunaan memori/perubahan jumlah tensor | (isi manusia) |

Hasil pengukuran dari halaman `/dev/cv-lab` dapat dipakai untuk mengisi tabel label. Ambang yang diunduh adalah nilai eksperimen; tinjau sebelum menetapkannya untuk misi.

## Batasan verifikasi sisi server

COCO-SSD berjalan di klien. Server tidak menerima gambar atau bukti atestasi
model, sehingga tidak dapat memastikan bahwa label dan confidence yang dikirim
benar-benar dihasilkan oleh COCO-SSD atau bahwa gambar memuat objek tersebut.
Server hanya memeriksa pasangan model/label terhadap label yang diterima untuk
target misi, menerapkan ambang confidence tersimpan, dan mencatat klaim tersebut.
Karena itu respons pindai bukan verifikasi forensik atas gambar atau model.

## Privasi

Inferensi berjalan di browser. Gambar dan video kamera diproses di perangkat dan tidak dikirim ke server.
