export interface ReviewScreenEntry {
  id: string;
  label: string;
  states: {id: string;label: string;}[];
}

export const reviewViewports = [
{ label: "Ponsel · 360 px", width: 360, height: 780 },
{ label: "Tablet · 768 px", width: 768, height: 1024 },
{ label: "Desktop · 1280 px", width: 1280, height: 800 }];


const dataStates = [
{ id: "ready", label: "Siap" },
{ id: "loading", label: "Memuat" },
{ id: "error", label: "Galat" },
{ id: "empty", label: "Kosong" }];


export const reviewScreens: ReviewScreenEntry[] = [
{ id: "splash", label: "Splash", states: [{ id: "loading", label: "Memuat model" }, { id: "ready", label: "Siap" }] },
{ id: "register", label: "Daftar", states: [{ id: "default", label: "Bawaan" }] },
{ id: "login", label: "Masuk", states: [{ id: "default", label: "Bawaan" }] },
{ id: "home", label: "Beranda", states: dataStates },
{ id: "mission", label: "Misi", states: [{ id: "closed", label: "Bawaan" }, { id: "request", label: "Minta izin kamera" }, { id: "denied", label: "Izin ditolak" }] },
{
  id: "scanner",
  label: "Pemindai",
  states: [
  { id: "loadingModel", label: "Memuat model" },
  { id: "searching", label: "Mencari" },
  { id: "wrongObject", label: "Salah benda" },
  { id: "matched", label: "Cocok" },
  { id: "failed", label: "Waktu habis" },
  { id: "cameraDenied", label: "Kamera ditolak" }]

},
{ id: "vocab", label: "Kartu", states: dataStates },
{ id: "exercise", label: "Latihan", states: dataStates },
{
  id: "order",
  label: "Susun kalimat",
  states: [
  { id: "idle", label: "Kosong" },
  { id: "building", label: "Menyusun" },
  { id: "complete", label: "Lengkap" },
  { id: "correct", label: "Benar" },
  { id: "wrong", label: "Salah" }]

},
{ id: "wordBuild", label: "Bangun kata", states: [{ id: "idle", label: "Kosong" }, { id: "correct", label: "Benar" }, { id: "wrong", label: "Salah" }] },
{ id: "result", label: "Hasil", states: [{ id: "default", label: "Bawaan" }] },
{ id: "levelUp", label: "Naik level", states: [{ id: "default", label: "Bawaan" }] },
{ id: "collection", label: "Koleksi", states: dataStates },
{ id: "profile", label: "Profil", states: [{ id: "guest", label: "Tamu" }, { id: "account", label: "Akun" }] },
{ id: "credits", label: "Kredit", states: [{ id: "default", label: "Bawaan" }] }];