import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CheckIcon,
  LightbulbIcon,
  UploadIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from 'lucide-react';

import { celebrationConfetti } from '../data/celebrationConfetti';
import { Button } from '../components/Button';
import { MascotSlot } from '../components/MascotSlot';
import { ScanTimeoutSheet } from '../components/ScanTimeoutSheet';
import { StickerCard } from '../components/StickerCard';

export interface Props {
  status: 'loadingModel' | 'searching' | 'wrongObject' | 'matched' | 'failed' | 'cameraDenied';
  targetText: string;
  hint?: string;
  secondsLeft: number;
  timeoutSeconds: number;
  muted: boolean;
  confidence?: number;
  xpAwarded: number;
  alreadyCollected: boolean;
  onHint: () => void;
  onRetry: () => void;
  onClose: () => void;
  onUpload: () => void;
  onDemo: () => void;
  onToggleMute: () => void;
  onContinue: () => void;
}

export const mockProps: Props = {
  status: 'searching',
  targetText: 'sesuatu untuk minum',
  hint: 'Benda ini ada di dapur dan bisa diisi air.',
  secondsLeft: 8,
  timeoutSeconds: 10,
  muted: false,
  confidence: 0.87,
  xpAwarded: 50,
  alreadyCollected: false,
  onHint: () => undefined,
  onRetry: () => undefined,
  onClose: () => undefined,
  onUpload: () => undefined,
  onDemo: () => undefined,
  onToggleMute: () => undefined,
  onContinue: () => undefined,
};

// Bracket positions are relative to the fixed-ratio camera frame, so they scale with it.
const bracketPositions = [
  {
    position: 'left-[12%] top-[16%]',
    outer: 'border-l-[7px] border-t-[7px]',
    inner: '-left-1 -top-1 border-l-[3px] border-t-[3px]',
  },
  {
    position: 'right-[12%] top-[16%]',
    outer: 'border-r-[7px] border-t-[7px]',
    inner: '-right-1 -top-1 border-r-[3px] border-t-[3px]',
  },
  {
    position: 'bottom-[10%] right-[12%]',
    outer: 'border-b-[7px] border-r-[7px]',
    inner: '-bottom-1 -right-1 border-b-[3px] border-r-[3px]',
  },
  {
    position: 'bottom-[10%] left-[12%]',
    outer: 'border-b-[7px] border-l-[7px]',
    inner: '-bottom-1 -left-1 border-b-[3px] border-l-[3px]',
  },
];

const confetti = celebrationConfetti;

export function ScannerScreen({
  status,
  targetText,
  hint,
  secondsLeft,
  timeoutSeconds,
  muted,
  confidence,
  xpAwarded,
  alreadyCollected,
  onHint,
  onRetry,
  onClose,
  onUpload,
  onDemo,
  onToggleMute,
  onContinue,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [showHint, setShowHint] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const isMatched = status === 'matched';
  const isWrong = status === 'wrongObject';
  const displayXp = alreadyCollected ? 25 : xpAwarded;
  const confidencePercent = Math.round((confidence ?? 0) * 100);

  useEffect(() => {
    if (!isMatched) {
      setShowSuccessOverlay(false);
      return undefined;
    }

    const overlayTimer = window.setTimeout(() => setShowSuccessOverlay(true), 800);
    return () => window.clearTimeout(overlayTimer);
  }, [isMatched]);

  const handleHint = () => {
    setShowHint((visible) => !visible);
    onHint();
  };

  if (status === 'cameraDenied') {
    return (
      <main className="focus-column flex h-full w-full flex-col overflow-y-auto bg-paper px-6 pb-8 pt-7 text-ink">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <MascotSlot label="camera off" size={120} />
          <h1 className="mt-7 font-display text-[28px] font-extrabold leading-8">
            Kamera tidak tersedia
          </h1>
          <p className="mt-3 max-w-[310px] font-body text-[17px] leading-[26px] text-muted">
            Kamu tetap bisa menyelesaikan misi dengan foto atau mode demo.
          </p>
        </div>

        <div className="action-width space-y-3">
          <Button type="button" onClick={onUpload}>
            <span className="flex items-center justify-center gap-2">
              <UploadIcon size={22} strokeWidth={2.25} aria-hidden="true" />
              Unggah foto
            </span>
          </Button>
          <Button type="button" variant="secondary" onClick={onDemo}>
            Mode demo
          </Button>
        </div>
      </main>
    );
  }

  if (status === 'loadingModel') {
    return (
      <main className="relative flex h-full w-full flex-col overflow-y-auto bg-[var(--camera-dark)] px-6 pb-9 pt-7 text-paper">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <MascotSlot label="loading" size={120} className="bg-paper text-ink" tint="loading" />
          <h1 className="mt-7 font-display text-[28px] font-extrabold leading-8">
            Menyiapkan kamera pintar…
          </h1>
          <div
            className="mt-6 h-3 w-full max-w-[280px] overflow-hidden rounded-full border-2 border-paper bg-ink"
            role="progressbar"
            aria-label="Menyiapkan kamera pintar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={62}
          >
            <div className="h-full w-[62%] bg-accent" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex h-full w-full flex-col overflow-y-auto bg-[var(--camera)] text-ink lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-8 lg:px-8 lg:pb-8">
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-4 lg:col-span-2 lg:px-0">
        <span className="inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-accent px-4 font-display text-[16px] font-black leading-5 whitespace-nowrap">
          Misi 1
        </span>
        <button
          type="button"
          onClick={onToggleMute}
          className="group -m-1.5 grid h-14 w-14 shrink-0 place-items-center rounded-full focus-visible:outline-none"
          aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}
          aria-pressed={muted}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-ink bg-card shadow-[2px_2px_0_var(--ink)] group-focus-visible:outline group-focus-visible:outline-4 group-focus-visible:outline-offset-2 group-focus-visible:outline-lens">
            {muted ? (
              <VolumeXIcon size={22} strokeWidth={2.25} aria-hidden="true" />
            ) : (
              <Volume2Icon size={22} strokeWidth={2.25} aria-hidden="true" />
            )}
          </span>
        </button>
      </header>

      <div className="flex min-h-0 flex-1 items-start justify-center px-4 lg:items-center lg:px-0">
        <div className="relative aspect-[3/4] w-full max-w-[min(100%,calc((100dvh-22rem)*0.75))] min-w-[min(100%,15rem)] overflow-hidden rounded-card border-[2.5px] border-ink lg:aspect-[4/3] lg:max-w-[min(100%,calc((100dvh-12rem)*1.333))]">
          <div className="absolute inset-0 grid place-items-center" aria-label="Pratinjau kamera">
            <span className="font-body text-[15px] font-bold tracking-[0.14em] text-paper">
              FOTO MEJA TIM
            </span>
          </div>

          {status === 'searching' ? (
            <span className="absolute right-3 top-3 z-20 inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-card px-3 font-body text-[15px] font-bold leading-5 tabular-nums">
              {secondsLeft} dtk
            </span>
          ) : null}

          <div className="absolute inset-0 z-10" aria-hidden="true">
            {bracketPositions.map((bracket) => (
              <motion.span
                key={bracket.position}
                className={`absolute h-14 w-14 border-ink ${bracket.position} ${bracket.outer}`}
                animate={isWrong && !reduceMotion ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              >
                <span
                  className={`absolute h-[52px] w-[52px] ${bracket.inner} ${isWrong ? 'border-signal' : isMatched ? 'border-primary' : 'border-accent'}`}
                />
              </motion.span>
            ))}

            {status === 'searching' ? (
              <motion.span
                className="absolute left-[14%] right-[14%] h-[3px] bg-lens shadow-[0_2px_0_var(--ink)]"
                initial={false}
                animate={reduceMotion ? { top: '50%' } : { top: ['19%', '87%'] }}
                transition={
                  reduceMotion
                    ? undefined
                    : { duration: 2.2, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }
                }
              />
            ) : null}
          </div>

          {isWrong ? (
            <motion.div
              className="absolute inset-x-4 top-4 z-30 flex min-h-14 items-center gap-3 rounded-card border-[2.5px] border-ink bg-signal px-4 py-3 font-body text-[16px] font-bold leading-5 text-white shadow-sticker"
              role="status"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <XIcon size={24} strokeWidth={2.25} aria-hidden="true" />
              Belum ketemu. Coba benda lain!
            </motion.div>
          ) : null}

          {isMatched ? (
            <div className="absolute inset-x-0 top-4 z-20 flex justify-center">
              <span className="inline-flex min-h-11 items-center gap-2 rounded-chip border-[2.5px] border-paper bg-ink px-4 font-body text-[16px] font-bold leading-5 text-paper shadow-[3px_4px_0_var(--paper)] tabular-nums">
                <CheckIcon size={22} strokeWidth={2.25} aria-hidden="true" />
                Cocok! {confidencePercent}%
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 px-5 pb-5 pt-4 lg:justify-center lg:px-0 lg:py-0">
        {showHint && hint ? (
          <motion.div
            className="order-first rounded-card border-[2.5px] border-ink bg-accent px-4 py-3 font-body text-[15px] font-bold leading-5 shadow-sticker"
            role="status"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {hint}
          </motion.div>
        ) : null}

        <div className="relative z-20 mt-4 lg:mt-8">
          <StickerCard className="relative px-4 pb-4 pt-3">
            <p className="pr-20 font-body text-[15px] font-bold leading-5 text-muted">Cari:</p>
            <p className="pr-20 font-display text-[22px] font-extrabold leading-7">{targetText}</p>
            {hint ? (
              <button
                type="button"
                onClick={handleHint}
                aria-expanded={showHint}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-chip border-[2.5px] border-ink bg-accent px-3 font-body text-[15px] font-bold leading-5 shadow-[2px_2px_0_var(--ink)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
              >
                <LightbulbIcon size={20} strokeWidth={2.25} aria-hidden="true" />
                Petunjuk
              </button>
            ) : null}
            <MascotSlot label="searching" size={64} className="absolute -right-2 -top-7" />
          </StickerCard>
        </div>
      </div>

      {status === 'failed' ? (
        <ScanTimeoutSheet
          seconds={timeoutSeconds}
          onRetry={onRetry}
          onUpload={onUpload}
          onDemo={onDemo}
          onDismiss={onClose}
        />
      ) : null}

      {isMatched && showSuccessOverlay ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-ink opacity-60" aria-hidden="true" />

          {!alreadyCollected && !reduceMotion ? (
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              aria-hidden="true"
            >
              {confetti.map((piece, index) => (
                <motion.span
                  key={`${piece.x}-${piece.y}`}
                  className={`absolute left-1/2 top-1/2 h-3 w-5 border-2 border-ink ${piece.color}`}
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 1], x: piece.x, y: piece.y }}
                  transition={{ duration: 0.26, delay: index * 0.018, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
          ) : null}

          <motion.section
            className="relative z-10 w-full max-w-md rounded-sheet border-[2.5px] border-ink bg-card px-6 pb-6 pt-5 text-center shadow-sticker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="matched-title"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-[2.5px] border-ink bg-primary text-white shadow-[2px_3px_0_var(--ink)]">
              <CheckIcon size={32} strokeWidth={2.25} aria-hidden="true" />
            </div>
            <h1
              id="matched-title"
              className={`mt-3 font-display text-[36px] font-black leading-10 ${alreadyCollected ? '' : 'rotate-[-2deg]'}`}
            >
              {alreadyCollected ? 'Sudah kamu miliki' : 'Ketemu!'}
            </h1>
            <div className="mt-4 flex justify-center">
              <MascotSlot label="found" size={120} />
            </div>
            <span className="mt-4 inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-blush px-4 font-body text-[17px] font-bold leading-[26px] shadow-[2px_2px_0_var(--ink)] tabular-nums">
              +{displayXp} XP
            </span>
            <Button type="button" className="mt-5" onClick={onContinue}>
              Lanjut
            </Button>
          </motion.section>
        </div>
      ) : null}
    </main>
  );
}
