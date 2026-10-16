import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpIcon, CheckIcon } from "lucide-react";

import { Button } from "../components/Button";
import { MascotSlot } from "../components/MascotSlot";
import { XpBar } from "../components/XpBar";
import { celebrationConfetti } from "../data/celebrationConfetti";

export interface Props {
  newLevel: number;
  xpInLevel: number;
  xpForNextLevel: number;
  onContinue: () => void;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export function LevelUpScreen({ newLevel, xpInLevel, xpForNextLevel, onContinue }: Props) {
  const reduceMotion = useReducedMotion();
  const [panelOpen, setPanelOpen] = useState(Boolean(reduceMotion));
  const previousLevel = Math.max(1, newLevel - 1);
  const xpRemaining = Math.max(0, xpForNextLevel - xpInLevel);

  useEffect(() => {
    if (reduceMotion) {
      setPanelOpen(true);
    }
  }, [reduceMotion]);

  const handleFillComplete = () => {
    window.setTimeout(() => setPanelOpen(true), 400);
  };

  return (
    <main className="focus-column relative flex h-full w-full flex-col overflow-y-auto bg-paper px-5 pb-6 pt-8 text-ink">
      <h1 className="font-display text-[28px] font-black leading-8">XP penuh!</h1>

      <section className="mt-6" aria-label={`XP Level ${previousLevel}`}>
        <div className="mb-1 flex items-center justify-between font-body text-[14px] font-bold leading-[18px] tabular-nums">
          <span>Level {previousLevel}</span>
          <span className="inline-flex items-center gap-1">
            <CheckIcon size={16} strokeWidth={2.5} aria-hidden="true" />
            Penuh
          </span>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full border-2 border-ink bg-card"
          role="progressbar"
          aria-label={`XP Level ${previousLevel}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={100}>

          <motion.div
            className="h-full bg-accent"
            initial={reduceMotion ? false : { width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.3, delay: 0.2, ease: easeOut }}
            onAnimationComplete={reduceMotion ? undefined : handleFillComplete} />

        </div>
      </section>

      <div className="mt-auto flex justify-center pb-10">
        <MascotSlot label="cheer" size={120} />
      </div>

      {panelOpen ?
      <div className="fixed inset-0 z-40 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-ink opacity-60" aria-hidden="true" />

          {!reduceMotion ?
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {celebrationConfetti.map((piece, index) =>
          <motion.span
            key={`${piece.x}-${piece.y}`}
            className={`absolute left-1/2 top-1/2 h-3 w-5 border-2 border-ink ${piece.color}`}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1], x: piece.x, y: piece.y }}
            transition={{ duration: 0.26, delay: index * 0.018, ease: easeOut }} />

          )}
            </div> :
        null}

          <motion.section
          className="relative z-10 w-full max-w-md rounded-sheet border-[2.5px] border-ink bg-card px-6 pb-6 pt-5 text-center shadow-sticker"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-up-panel-title"
          aria-describedby="level-up-panel-remaining"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.24, ease: easeOut }}>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-[2.5px] border-ink bg-primary text-white shadow-[2px_3px_0_var(--ink)]">
              <ArrowUpIcon size={32} strokeWidth={2.25} aria-hidden="true" />
            </div>
            <h2 id="level-up-panel-title" className="mt-3 rotate-[-2deg] font-display text-[36px] font-black leading-10">
              Naik level!
            </h2>
            <span className="mt-4 inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-accent px-4 font-display text-[28px] font-extrabold leading-8 shadow-[2px_2px_0_var(--ink)] tabular-nums">
              Level {newLevel}
            </span>
            <div className="mt-5 text-left">
              <XpBar value={xpInLevel} max={xpForNextLevel} />
            </div>
            <p id="level-up-panel-remaining" className="mt-2 font-body text-[16px] font-bold leading-6 tabular-nums">
              {xpRemaining} XP lagi menuju Level {newLevel + 1}
            </p>
            <Button type="button" className="mt-5" onClick={onContinue} autoFocus>Lanjut</Button>
          </motion.section>
        </div> :
      null}
    </main>);

}