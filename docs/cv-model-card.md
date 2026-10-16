# COCO-SSD model card: batas verifikasi server

## Batasan verifikasi sisi server

COCO-SSD berjalan di klien. Server tidak menerima gambar atau bukti atestasi
model, sehingga tidak dapat memastikan bahwa label dan confidence yang dikirim
benar-benar dihasilkan oleh COCO-SSD atau bahwa gambar memuat objek tersebut.
Server hanya memeriksa pasangan model/label terhadap label yang diterima untuk
target misi, menerapkan ambang confidence tersimpan, dan mencatat klaim tersebut.
Karena itu respons pindai bukan verifikasi forensik atas gambar atau model.
