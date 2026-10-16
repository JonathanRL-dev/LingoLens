import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { StarIcon } from 'lucide-react';

import { Button } from '../components/Button';
import { MascotSlot } from '../components/MascotSlot';
import { ResultBreakdown, type XpBreakdown } from '../components/ResultBreakdown';
import { StickerCard } from '../components/StickerCard';
import { XpBar } from '../components/XpBar';

export interface Props {
  stars: 0 | 1 | 2 | 3;
  practiceAccuracy: number;
  xpBreakdown: XpBreakdown;
  alreadyCollected?: boolean;
  level: {
    before: number;
    after: number;
    xp: number;
    xpToNext: number;
  };
  collected: {
    word: string;
    isNew: boolean;
  };
  nextMission?: {
    title: string;
  };
  onNextMission: () => void;
  onOpenCollection: () => void;
  onHome: () => void;
}

export const mockProps: Props = {
  stars: 3,
  practiceAccuracy: 83,
  xpBreakdown: {
    scan: 50,
    practice: 60,
    total: 110,
  },
  alreadyCollected: false,
  level: {
    before: 1,
    after: 2,
    xp: 30,
    xpToNext: 200,
  },
  collected: {
    word: 'Cup',
    isNew: true,
  },
  nextMission: {
    title: 'Temukan sesuatu untuk dibaca',
  },
  onNextMission: () => undefined,
  onOpenCollection: () => undefined,
  onHome: () => undefined,
};

export function ResultScreen({
  stars,
  practiceAccuracy,
  xpBreakdown,
  alreadyCollected = false,
  level,
  collected,
  nextMission,
  onNextMission,
  onOpenCollection,
  onHome,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [visibleStars, setVisibleStars] = useState(0);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [levelUpDismissed, setLevelUpDismissed] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const calculationTimer = window.setTimeout(() => {
      setLoading(false);
      if (reduceMotion) {
        setVisibleStars(stars);
      }
    }, 1000);

    const starTimers = reduceMotion
      ? []
      : Array.from({ length: stars }, (_, index) =>
          window.setTimeout(() => setVisibleStars(index + 1), 1060 + index * 60),
        );

    const levelTimer =
      level.after > level.before ? window.setTimeout(() => setLevelUpOpen(true), 2500) : undefined;

    return () => {
      window.clearTimeout(calculationTimer);
      starTimers.forEach((timer) => window.clearTimeout(timer));
      if (levelTimer !== undefined) {
        window.clearTimeout(levelTimer);
      }
    };
  }, [level.after, level.before, reduceMotion, stars]);

  const handleDismissLevelUp = () => {
    setLevelUpOpen(false);
    setLevelUpDismissed(true);
  };

  if (loading) {
    return (
      <main
        className="focus-column flex h-full w-full flex-col overflow-y-auto bg-paper px-5 pb-7 pt-8 text-ink"
        aria-busy="true"
      >
        <h1 className="font-display text-[28px] font-extrabold leading-8">Menghitung skor…</h1>
        <div className="mt-8 flex justify-center gap-3" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <span
              key={item}
              className="h-16 w-16 rounded-card border-[2.5px] border-ink bg-canvas"
            />
          ))}
        </div>
        <div className="mt-8" aria-hidden="true">
          <span className="block h-24 rounded-card border-[2.5px] border-ink bg-card" />
        </div>
        <div className="mt-5 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <span key={item} className="block h-10 rounded-chip bg-canvas" />
          ))}
        </div>
        <div
          className="action-width mt-auto h-14 rounded-full border-[2.5px] border-ink bg-canvas"
          aria-hidden="true"
        />
        <span className="sr-only" aria-live="polite">
          Menghitung skor…
        </span>
      </main>
    );
  }

  return (
    <main className="focus-column relative flex h-full w-full flex-col overflow-y-auto bg-paper px-5 pb-6 pt-6 text-ink">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-black leading-8">Misi selesai!</h1>
          <div className="mt-3 flex gap-2" aria-label={`${stars} dari 3 bintang`}>
            {[0, 1, 2].map((index) => {
              const filled = index < visibleStars;
              return (
                <motion.span
                  key={index}
                  initial={reduceMotion ? false : { opacity: 0.45, scale: 0.96 }}
                  animate={{ opacity: 1, scale: filled ? 1 : 0.96 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <StarIcon
                    size={58}
                    strokeWidth={2.25}
                    className={filled ? 'fill-accent text-ink' : 'fill-card text-ink'}
                    aria-hidden="true"
                  />
                </motion.span>
              );
            })}
          </div>
          <p className="mt-1 font-body text-[15px] font-bold leading-5 tabular-nums">
            {stars} dari 3 bintang
          </p>
        </div>
        <MascotSlot label="cheer" size={120} className="-mr-6 -mt-2" />
      </div>

      <ResultBreakdown
        xpBreakdown={xpBreakdown}
        practiceAccuracy={practiceAccuracy}
        alreadyCollected={alreadyCollected}
      />

      <StickerCard className="relative mt-5 flex min-h-[82px] items-center justify-between gap-3 overflow-hidden bg-lens px-5 py-4">
        <div>
          <p className="font-body text-[14px] font-bold leading-[18px]">Masuk koleksi</p>
          <p className="font-display text-[28px] font-black leading-8">{collected.word}</p>
        </div>
        {collected.isNew ? (
          <span className="rotate-[-2deg] rounded-chip border-[2.5px] border-ink bg-orange px-3 py-2 font-display text-[15px] font-black leading-5 shadow-[2px_2px_0_var(--ink)]">
            BARU
          </span>
        ) : null}
      </StickerCard>

      <div className="action-width mt-auto space-y-3 pt-5">
        {nextMission ? (
          <div>
            <p className="mb-2 truncate text-center font-body text-[14px] font-bold leading-[18px] text-muted">
              {nextMission.title}
            </p>
            <Button type="button" onClick={onNextMission}>
              Misi berikutnya
            </Button>
          </div>
        ) : null}
        <Button type="button" variant="secondary" onClick={onOpenCollection}>
          Lihat koleksi
        </Button>
        <Button type="button" variant="ghost" onClick={onHome}>
          Ke Beranda
        </Button>
      </div>

      {levelUpOpen && !levelUpDismissed ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink bg-opacity-60 px-5"
          role="presentation"
        >
          <motion.section
            className="w-full max-w-md rounded-sheet border-[2.5px] border-ink bg-card px-6 pb-6 pt-7 text-center shadow-sticker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-up-title"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <MascotSlot label="cheer" size={120} className="mx-auto" />
            <h2 id="level-up-title" className="mt-4 font-display text-[36px] font-black leading-10">
              Naik level!
            </h2>
            <p className="mt-2 font-display text-[28px] font-extrabold leading-8 tabular-nums">
              Level {level.after}
            </p>
            <div className="mt-5 text-left">
              <XpBar value={level.xp} max={level.xpToNext} />
            </div>
            <Button type="button" className="mt-6" onClick={handleDismissLevelUp}>
              Lanjut
            </Button>
          </motion.section>
        </div>
      ) : null}
    </main>
  );
}
