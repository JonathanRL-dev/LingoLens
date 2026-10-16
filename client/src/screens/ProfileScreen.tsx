import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  AlertCircleIcon,
  AwardIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronRightIcon,
  LogOutIcon,
  PencilIcon,
  Volume2Icon,
  VolumeXIcon } from
"lucide-react";

import { BottomSheet } from "../components/BottomSheet";
import { Button } from "../components/Button";
import { MascotSlot } from "../components/MascotSlot";
import { StickerCard } from "../components/StickerCard";
import { XpBar } from "../components/XpBar";

export interface Props {
  user: {
    nickname: string;
    level: number;
    xp: number;
    xpToNext: number;
  };
  stats: {
    totalXp: number;
    wordsCollected: number;
  };
  soundOn: boolean;
  isGuest: boolean;
  onRename: (nickname: string) => void;
  onToggleSound: () => void;
  onOpenSources: () => void;
  onOpenCredits?: () => void;
  onUpgradeToAccount?: () => void;
  onGoToLogin?: () => void;
  onSignOut: () => void;
}

export const mockProps: Props = {
  user: {
    nickname: "Rani",
    level: 2,
    xp: 30,
    xpToNext: 200
  },
  stats: {
    totalXp: 130,
    wordsCollected: 1
  },
  soundOn: true,
  isGuest: true,
  onRename: () => undefined,
  onToggleSound: () => undefined,
  onOpenSources: () => undefined,
  onSignOut: () => undefined
};

const sources = [
"Tatoeba (kalimat, CC BY 2.0 FR)",
"Wiktionary via kaikki.org (arti dan fonetik, CC BY-SA)",
"COCO-SSD TensorFlow.js (Apache 2.0)",
"Grandstander, Atkinson Hyperlegible, Noto (SIL OFL)",
"Lucide (ISC)"];


const MAX_NAME_LENGTH = 20;

export function ProfileScreen({
  user,
  stats,
  soundOn,
  isGuest,
  onRename,
  onToggleSound,
  onOpenSources,
  onOpenCredits,
  onUpgradeToAccount,
  onGoToLogin,
  onSignOut
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(user.nickname);
  const [nameError, setNameError] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const startEditing = () => {
    setDraftName(user.nickname);
    setNameError(false);
    setEditing(true);
  };

  const saveName = (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = draftName.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    onRename(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setEditing(false);
      setNameError(false);
    }
  };

  const handleOpenSources = () => {
    onOpenSources();
    setSourcesOpen(true);
  };

  const handleSignOut = () => {
    setSignOutOpen(false);
    onSignOut();
  };

  return (
    <main className="profile-column relative flex h-full w-full flex-col overflow-y-auto bg-paper px-5 pb-6 pt-8 text-ink">
      <header className="flex items-center gap-4">
        <MascotSlot label="avatar" size={64} className="shadow-[2px_3px_0_var(--ink)]" />
        <div className="min-w-0 flex-1">
          {editing ?
          <form onSubmit={saveName} className="flex items-center gap-2">
              <label htmlFor="profile-nickname" className="sr-only">Nama panggilan</label>
              <input
              id="profile-nickname"
              value={draftName}
              maxLength={MAX_NAME_LENGTH}
              autoFocus
              onChange={(event) => {
                setDraftName(event.target.value);
                setNameError(false);
              }}
              onKeyDown={handleKeyDown}
              aria-invalid={nameError}
              aria-describedby="profile-nickname-hint"
              className={`min-h-12 w-full min-w-0 rounded-chip border-[2.5px] bg-card px-3 font-display text-[22px] font-extrabold leading-7 text-ink focus:outline focus:outline-4 focus:outline-offset-2 focus:outline-lens ${nameError ? "border-signal" : "border-ink"}`} />

              <button
              type="submit"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-primary text-white shadow-[2px_2px_0_var(--ink)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
              aria-label="Simpan nama">

                <CheckIcon size={22} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </form> :

          <div className="flex items-center gap-1">
              <h1 className="truncate font-display text-[28px] font-black leading-8">{user.nickname}</h1>
              {isGuest ?
            <span className="ml-1 inline-flex shrink-0 items-center rounded-chip border-2 border-ink bg-lens px-2 py-0.5 font-body text-[13px] font-bold leading-[18px]">
                  Tamu
                </span> :
            null}
              <button
              type="button"
              onClick={startEditing}
              className="-my-1.5 grid h-14 w-14 shrink-0 place-items-center rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
              aria-label="Ubah nama">

                <PencilIcon size={20} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>
          }
          {editing ?
          <p id="profile-nickname-hint" className={`mt-1 flex items-center gap-1.5 font-body text-[14px] font-bold leading-[18px] ${nameError ? "text-error" : "text-muted"}`}>
              {nameError ?
            <>
                  <AlertCircleIcon size={16} strokeWidth={2.25} aria-hidden="true" />
                  Isi nama dulu, ya
                </> :

            <span className="tabular-nums">{draftName.length} / {MAX_NAME_LENGTH}</span>
            }
            </p> :
          null}
        </div>
      </header>

      <section className="mt-7" aria-label="Kemajuan level">
        <XpBar value={user.xp} max={user.xpToNext} />
      </section>

      <section className="mt-7 grid grid-cols-3 gap-3" aria-label="Statistik">
        <StickerCard className="flex min-h-[88px] flex-col items-center justify-center bg-accent px-2 py-3 text-center">
          <p className="font-display text-[24px] font-black leading-8 tabular-nums">{user.level}</p>
          <p className="font-body text-[14px] font-bold leading-[18px]">Level</p>
        </StickerCard>
        <StickerCard className="flex min-h-[88px] flex-col items-center justify-center bg-orange px-2 py-3 text-center">
          <p className="font-display text-[24px] font-black leading-8 tabular-nums">{stats.totalXp}</p>
          <p className="font-body text-[14px] font-bold leading-[18px]">XP</p>
        </StickerCard>
        <StickerCard className="flex min-h-[88px] flex-col items-center justify-center bg-lens px-2 py-3 text-center">
          <p className="font-display text-[24px] font-black leading-8 tabular-nums">{stats.wordsCollected}</p>
          <p className="font-body text-[14px] font-bold leading-[18px]">kata</p>
        </StickerCard>
      </section>

      {isGuest ?
      <StickerCard className="mt-5 shrink-0 px-5 py-5" role="region" aria-labelledby="save-progress-title">
          <h2 id="save-progress-title" className="font-display text-[20px] font-extrabold leading-7">Simpan progresmu</h2>
          <p className="mt-2 font-body text-[16px] leading-6 text-muted">
            Kamu masuk sebagai tamu. Buat akun supaya XP dan koleksi tidak hilang.
          </p>
          <Button type="button" className="mt-4" onClick={onUpgradeToAccount}>Buat Akun</Button>
          <Button type="button" variant="ghost" className="mt-3 text-lens" onClick={onGoToLogin}>
            Sudah punya album? Masuk
          </Button>
        </StickerCard> :
      null}

      <section className="mt-7" aria-labelledby="settings-title">
        <h2 id="settings-title" className="font-display text-[20px] font-extrabold leading-7">Pengaturan</h2>
        <div className="mt-2 divide-y-2 divide-ink border-y-[2.5px] border-ink">
          <div className="flex min-h-14 items-center justify-between gap-3">
            <span id="sound-label" className="flex items-center gap-3 font-body text-[17px] font-bold leading-[26px]">
              {soundOn ? <Volume2Icon size={22} strokeWidth={2.25} aria-hidden="true" /> : <VolumeXIcon size={22} strokeWidth={2.25} aria-hidden="true" />}
              Suara
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={soundOn}
              aria-labelledby="sound-label"
              onClick={onToggleSound}
              className={`relative h-11 w-[72px] shrink-0 rounded-full border-[2.5px] border-ink transition-[background-color] duration-150 ease-out focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens ${soundOn ? "bg-primary" : "bg-card"}`}>

              <span
                className={`absolute left-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-[2.5px] border-ink bg-card transition-transform duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${soundOn ? "translate-x-[26px]" : "translate-x-0"}`}
                aria-hidden="true" />

            </button>
          </div>
          <button
            type="button"
            onClick={startEditing}
            className="flex min-h-14 w-full items-center gap-3 text-left font-body text-[17px] font-bold leading-[26px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens">

            <PencilIcon size={22} strokeWidth={2.25} aria-hidden="true" />
            <span className="flex-1">Ganti nama panggilan</span>
            <ChevronRightIcon size={20} strokeWidth={2.25} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleOpenSources}
            className="flex min-h-14 w-full items-center gap-3 text-left font-body text-[17px] font-bold leading-[26px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens">

            <BookOpenIcon size={22} strokeWidth={2.25} aria-hidden="true" />
            <span className="flex-1">Sumber kata dan kalimat</span>
            <ChevronRightIcon size={20} strokeWidth={2.25} aria-hidden="true" />
          </button>
          {onOpenCredits ?
          <button
            type="button"
            onClick={onOpenCredits}
            className="flex min-h-14 w-full items-center gap-3 text-left font-body text-[17px] font-bold leading-[26px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens">

              <AwardIcon size={22} strokeWidth={2.25} aria-hidden="true" />
              <span className="flex-1">Kredit</span>
              <ChevronRightIcon size={20} strokeWidth={2.25} aria-hidden="true" />
            </button> :
          null}
        </div>
      </section>

      <footer className="mt-auto pt-5 md:mx-auto md:w-full md:max-w-md">
        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-[2.5px] border-signal bg-card px-6 font-body text-[18px] font-bold leading-6 text-error focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens">

          <LogOutIcon size={22} strokeWidth={2.25} aria-hidden="true" />
          Keluar
        </button>
      </footer>

      {sourcesOpen ?
      <BottomSheet title="Sumber kata dan kalimat" onDismiss={() => setSourcesOpen(false)}>
          <ul className="mt-4 divide-y-2 divide-ink border-y-2 border-ink font-body text-[16px] leading-6">
            {sources.map((source) =>
          <li key={source} className="py-3">{source}</li>
          )}
          </ul>
          <p className="mt-3 font-body text-[14px] leading-5 text-muted">Daftar ini perlu diverifikasi sebelum rilis.</p>
          <Button type="button" className="mt-5" onClick={() => setSourcesOpen(false)}>Tutup</Button>
        </BottomSheet> :
      null}

      {signOutOpen ?
      <BottomSheet title="Keluar dari akun?" onDismiss={() => setSignOutOpen(false)}>
          <p className="mt-4 font-body text-[17px] leading-[26px] text-muted">
            {isGuest ?
          "Progresmu di perangkat ini akan hilang. Daftar dulu kalau mau menyimpannya." :
          "Kamu bisa masuk lagi kapan saja."}
          </p>
          <div className="mt-5 space-y-3">
            {isGuest ?
          <>
                <Button
              type="button"
              onClick={() => {
                setSignOutOpen(false);
                onUpgradeToAccount?.();
              }}>

                  Daftar dulu
                </Button>
                <button
              type="button"
              onClick={handleSignOut}
              className="min-h-14 w-full rounded-full border-[2.5px] border-ink bg-signal px-6 font-body text-[18px] font-bold leading-6 text-white shadow-sticker focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens">

                  Tetap keluar
                </button>
                <Button type="button" variant="ghost" onClick={() => setSignOutOpen(false)}>Batal</Button>
              </> :

          <>
                <button
              type="button"
              onClick={handleSignOut}
              className="min-h-14 w-full rounded-full border-[2.5px] border-ink bg-signal px-6 font-body text-[18px] font-bold leading-6 text-white shadow-sticker focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens">

                  Keluar
                </button>
                <Button type="button" variant="secondary" onClick={() => setSignOutOpen(false)}>Batal</Button>
              </>
          }
          </div>
        </BottomSheet> :
      null}
    </main>);

}