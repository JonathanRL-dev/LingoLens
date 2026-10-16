import {
  BookOpenIcon,
  HomeIcon,
  UserRoundIcon } from
"lucide-react";

import { Button } from "../components/Button";
import { MascotSlot } from "../components/MascotSlot";
import { MissionStatusCard } from "../components/MissionStatusCard";
import { StickerCard } from "../components/StickerCard";
import { XpBar } from "../components/XpBar";

export interface Props {
  user: {
    nickname: string;
    level: number;
    xp: number;
    xpToNext: number;
    streak: number;
  };
  missions: {
    id: string;
    title: string;
    status: "open" | "locked" | "completed";
    rewardXp: number;
    bestStars?: 0 | 1 | 2 | 3;
    lockedHint?: string;
    difficulty: 1 | 2 | 3;
  }[];
  showBottomNav: boolean;
  unfinishedStep?: string;
  onOpenMission: (id: string) => void;
}

export const mockProps: Props = {
  user: {
    nickname: "Rani",
    level: 1,
    xp: 20,
    xpToNext: 100,
    streak: 0
  },
  missions: [
  {
    id: "m1",
    title: "Temukan sesuatu untuk minum",
    status: "open",
    rewardXp: 110,
    difficulty: 1
  },
  {
    id: "m2",
    title: "Temukan sesuatu untuk dibaca",
    status: "locked",
    lockedHint: "Selesaikan misi pertama",
    rewardXp: 130,
    difficulty: 1
  },
  {
    id: "m3",
    title: "Temukan sesuatu di rumah",
    status: "locked",
    lockedHint: "Selesaikan misi kedua",
    rewardXp: 150,
    difficulty: 2
  }],

  showBottomNav: false,
  onOpenMission: () => undefined
};

const difficultyLabels = {
  1: "Mudah",
  2: "Sedang",
  3: "Sulit"
} as const;

const navItems = [
{ label: "Beranda", icon: HomeIcon, active: true },
{ label: "Koleksi", icon: BookOpenIcon, active: false },
{ label: "Profil", icon: UserRoundIcon, active: false }];


export function HomeScreen({ user, missions, showBottomNav, unfinishedStep, onOpenMission }: Props) {
  const isSkeleton = missions.length === 0;
  const openMission = missions.find((mission) => mission.status === "open");
  const supportingMissions = missions.filter((mission) => mission.id !== openMission?.id);
  const openMissionNumber = openMission ?
  missions.findIndex((mission) => mission.id === openMission.id) + 1 :
  0;

  if (isSkeleton) {
    return (
      <main className="list-column h-full w-full overflow-y-auto bg-paper px-5 pt-7 text-ink" aria-busy="true" aria-label="Memuat beranda">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border-[2.5px] border-ink bg-canvas" />
          <div className="h-8 w-40 rounded-chip bg-canvas" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-11 w-24 rounded-chip bg-canvas" />
          <div className="h-11 w-24 rounded-chip bg-canvas" />
        </div>
        <div className="mt-4 h-4 w-full rounded-full border-2 border-ink bg-card" />
        <div className="mt-16 h-[286px] rounded-card border-[2.5px] border-ink bg-card shadow-sticker">
          <div className="m-5 h-7 w-20 rounded-chip bg-canvas" />
          <div className="mx-5 mt-8 h-8 w-64 max-w-[calc(100%-2.5rem)] rounded-chip bg-canvas" />
          <div className="mx-5 mt-3 h-8 w-48 rounded-chip bg-canvas" />
          <div className="mx-5 mt-10 h-14 rounded-full bg-canvas" />
        </div>
        <span className="sr-only">Memuat misi…</span>
      </main>);

  }

  return (
    <main className="relative flex h-full w-full flex-col overflow-hidden bg-paper text-ink">
      <div className={`list-column flex-1 overflow-y-auto px-5 pt-6 ${showBottomNav ? "pb-28" : "pb-7"}`}>
        <header>
          <div className="flex items-center gap-3">
            <MascotSlot label="avatar" size={40} />
            <h1 className="font-display text-[28px] font-extrabold leading-8">
              Halo, {user.nickname}!
            </h1>
          </div>

          <div className="mt-4 flex gap-2 font-body text-[15px] font-bold leading-5">
            <span className="inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-accent px-4 whitespace-nowrap">
              Level <span className="ml-1 tabular-nums">{user.level}</span>
            </span>
            <span className="inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-orange px-4 whitespace-nowrap">
              <span className="tabular-nums">{user.streak}</span><span className="ml-1">hari</span>
            </span>
          </div>

          <div className="mt-4">
            <XpBar value={user.xp} max={user.xpToNext} />
          </div>
        </header>

        {openMission ?
        <section className="mt-[60px]" aria-labelledby={`mission-${openMission.id}`}>
            <StickerCard className="relative px-5 pb-5 pt-6">
              <div className="absolute -right-1 -top-12">
                <MascotSlot label="searching" size={96} />
              </div>

              <span className="inline-flex min-h-11 items-center rotate-[-2deg] rounded-chip border-[2.5px] border-ink bg-lens px-3 font-display text-[15px] font-black leading-5">
                MISI <span className="ml-1 tabular-nums">{openMissionNumber}</span>
              </span>

              <h2 id={`mission-${openMission.id}`} className="mt-5 max-w-[280px] font-display text-[28px] font-extrabold leading-8">
                {openMission.title}
              </h2>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex min-h-11 items-center gap-2" aria-label={`Kesulitan ${difficultyLabels[openMission.difficulty]}`}>
                  <span className="flex gap-1.5" aria-hidden="true">
                    {[1, 2, 3].map((dot) =>
                  <span
                    key={dot}
                    className={`h-3 w-3 rounded-full border-2 border-ink ${dot <= openMission.difficulty ? "bg-accent" : "bg-card"}`} />

                  )}
                  </span>
                  <span className="font-body text-[15px] font-bold leading-5">
                    {difficultyLabels[openMission.difficulty]}
                  </span>
                </div>
                <span className="inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-blush px-3 font-body text-[15px] font-bold leading-5 whitespace-nowrap tabular-nums">
                  +{openMission.rewardXp} XP
                </span>
              </div>

              {unfinishedStep ?
            <p className="mt-4 font-body text-[15px] font-bold leading-5 text-muted">Langkah: {unfinishedStep}</p> :
            null}
              <Button type="button" className={unfinishedStep ? "mt-2" : "mt-5"} onClick={() => onOpenMission(openMission.id)}>
                {unfinishedStep ? "Lanjutkan misi" : "Mulai Misi"}
              </Button>
            </StickerCard>
          </section> :
        null}

        <section className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-label="Misi lainnya">
          {supportingMissions.map((mission) =>
          <MissionStatusCard
            key={mission.id}
            title={mission.title}
            status={mission.status === "completed" ? "completed" : "locked"}
            bestStars={mission.bestStars}
            lockedHint={mission.lockedHint} />

          )}
        </section>
      </div>

      {showBottomNav ?
      <nav className="absolute inset-x-0 bottom-0 z-20 border-t-[2.5px] border-ink bg-card px-4 pb-3 pt-2" aria-label="Navigasi utama">
          <ul className="grid grid-cols-3 gap-2">
            {navItems.map(({ label, icon: Icon, active }) =>
          <li key={label} className={`flex min-h-14 flex-col items-center justify-center rounded-chip font-body text-[13px] font-bold leading-[18px] ${active ? "bg-accent" : "bg-card"}`}>
                <Icon size={22} strokeWidth={2.25} aria-hidden="true" />
                <span>{label}</span>
              </li>
          )}
          </ul>
        </nav> :
      null}
    </main>);

}