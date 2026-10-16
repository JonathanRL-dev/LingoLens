import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon, RotateCcwIcon, XIcon } from "lucide-react";

import { Button } from "../components/Button";
import { ExerciseFeedbackPanel } from "../components/ExerciseFeedbackPanel";
import { PracticeActionBar, practiceBarContentPadding } from "../components/PracticeActionBar";
import { ScreenColumn } from "../components/ScreenColumn";
import { MascotSlot } from "../components/MascotSlot";
import { StickerCard } from "../components/StickerCard";

export interface WordChip {
  id: string;
  text: string;
}

export interface Props {
  bank: WordChip[];
  placed: WordChip[];
  endPunctuation: string;
  hintTranslation: string;
  status: "idle" | "correct" | "wrong";
  attemptNo: number;
  hint: string;
  correctAnswerText: string;
  pointsAwarded: number;
  onPlace: (id: string) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
  onCheck: () => void;
  onContinue?: () => void;
  onSkip?: () => void;
}

const focusRing = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens";
const chipBase = `inline-flex min-h-14 min-w-14 items-center justify-center gap-1.5 rounded-chip border-[2.5px] px-4 font-body text-[17px] font-bold leading-[26px] ${focusRing}`;

export function WordBuildScreen({
  bank,
  placed,
  endPunctuation,
  hintTranslation,
  status,
  attemptNo,
  hint,
  correctAnswerText,
  pointsAwarded,
  onPlace,
  onRemove,
  onReset,
  onCheck,
  onContinue,
  onSkip
}: Props) {
  const reduceMotion = useReducedMotion();
  const isChecked = status === "correct" || status === "wrong";
  const placedIds = new Set(placed.map((chip) => chip.id));
  const allPlaced = bank.length > 0 && placed.length === bank.length;
  const slots = bank.map((_, index) => placed[index] ?? null);
  const nextSlotIndex = placed.length;

  const placedChipClasses = status === "correct" ?
  "border-ink bg-primary text-white" :
  status === "wrong" ?
  "border-ink bg-signal text-white" :
  "border-ink bg-card text-ink shadow-[2px_2px_0_var(--ink)]";

  const renderSlot = (chip: WordChip | null, index: number) => {
    if (!chip) {
      const isNext = index === nextSlotIndex && !isChecked;
      return (
        <span
          key={`slot-${index}`}
          className={`inline-flex min-h-14 min-w-[72px] items-center justify-center rounded-chip border-[2.5px] border-dashed font-body text-[15px] font-bold leading-5 tabular-nums ${isNext ? "border-ink bg-card text-ink" : "border-muted bg-paper text-muted"}`}
          aria-label={`Slot ${index + 1}, kosong${isNext ? ", berikutnya" : ""}`}>

          {index + 1}
        </span>);

    }

    return (
      <motion.button
        key={chip.id}
        type="button"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        onClick={() => onRemove(chip.id)}
        disabled={isChecked}
        className={`${chipBase} ${placedChipClasses}`}
        aria-label={`Slot ${index + 1}: ${chip.text}. Ketuk untuk mengembalikan`}>

        {chip.text}
        {status === "correct" ? <CheckIcon size={18} strokeWidth={2.5} aria-hidden="true" /> : null}
        {status === "wrong" ? <XIcon size={18} strokeWidth={2.5} aria-hidden="true" /> : null}
      </motion.button>);

  };

  const lastIndex = slots.length - 1;

  return (
    <main className={`relative flex h-full w-full flex-col overflow-y-auto bg-paper pt-6 text-ink ${onSkip ? practiceBarContentPadding.withSkip : practiceBarContentPadding.withoutSkip}`}>
      <ScreenColumn className="flex flex-1 flex-col">
      <header>
        <h1 className="font-display text-[28px] font-extrabold leading-8">Susun kata</h1>
      </header>

      <StickerCard className="relative mt-5 px-5 py-5">
        <MascotSlot label="idle" size={48} className="absolute -right-1 -top-5" />
        <p className="font-body text-[15px] leading-5 text-muted">Artinya</p>
        <p className="mt-1 pr-8 font-body text-[19px] font-bold leading-7">
          {hintTranslation}
          {endPunctuation}
        </p>
      </StickerCard>

      <div className="mt-4 min-h-11" aria-live="polite">
        {status === "correct" ?
          <p className="inline-flex min-h-11 items-center gap-2 rounded-chip border-[2.5px] border-ink bg-primary px-3 font-body text-[16px] font-bold leading-5 text-white">
            <CheckIcon size={22} strokeWidth={2.25} aria-hidden="true" />
            Benar
          </p> :
          null}
        {status === "wrong" ?
          <p className="inline-flex min-h-11 items-center gap-2 rounded-chip border-[2.5px] border-ink bg-signal px-3 font-body text-[16px] font-bold leading-5 text-white">
            <XIcon size={22} strokeWidth={2.25} aria-hidden="true" />
            Salah — urutannya belum tepat
          </p> :
          null}
      </div>

      <section className="mt-2" aria-label={`Area susunan, ${placed.length} dari ${bank.length} slot terisi`}>
        <div className="flex flex-wrap items-end gap-2">
          {slots.slice(0, lastIndex).map((chip, index) => renderSlot(chip, index))}
          {lastIndex >= 0 ?
            <span className="inline-flex items-end gap-1">
              {renderSlot(slots[lastIndex] ?? null, lastIndex)}
              <span
                className="pb-1 font-display text-[32px] font-extrabold leading-10"
                aria-label={`Tanda baca akhir ${endPunctuation}`}>

                {endPunctuation}
              </span>
            </span> :
            null}
        </div>
      </section>

      <section className="mt-auto pt-6" aria-label="Bank kata">
        <p className="font-body text-[15px] leading-5 text-muted">Ketuk kata untuk menaruhnya</p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {bank.map((chip) => {
              const used = placedIds.has(chip.id);
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onPlace(chip.id)}
                  disabled={used || isChecked}
                  className={`${chipBase} px-5 ${used ? "border-dashed border-ink bg-paper text-muted" : "border-ink bg-accent text-ink shadow-[2px_2px_0_var(--ink)]"}`}
                  aria-label={used ? `${chip.text}, sudah dipakai` : `Taruh ${chip.text}`}>

                {used ? <span aria-hidden="true" className="invisible">{chip.text}</span> : chip.text}
              </button>);

            })}
        </div>
      </section>

      </ScreenColumn>

      <PracticeActionBar onSkip={onSkip} skipDisabled={isChecked}>
        <Button
          type="button"
          variant="ghost"
          className="!h-14 !w-auto min-w-[120px] shrink-0"
          onClick={onReset}
          disabled={placed.length === 0 && !isChecked}>

          <span className="flex items-center justify-center gap-2 whitespace-nowrap">
            <RotateCcwIcon size={20} strokeWidth={2.25} aria-hidden="true" />
            Ulangi
          </span>
        </Button>
        <Button type="button" className="!h-14 !w-auto min-w-0 flex-1 !px-4 disabled:!opacity-50" onClick={onCheck} disabled={!allPlaced || isChecked}>
          Cek
        </Button>
      </PracticeActionBar>

      {isChecked ?
      <ExerciseFeedbackPanel
        status={status}
        attemptNo={attemptNo}
        hint={hint}
        correctAnswerText={correctAnswerText}
        pointsAwarded={pointsAwarded}
        onRetry={onReset}
        onNext={() => onContinue?.()} /> :

      null}
    </main>);

}
