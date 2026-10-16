import { CheckIcon, LightbulbIcon, XIcon } from "lucide-react";

import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";

export interface ExerciseFeedbackPanelProps {
  status: "correct" | "wrong";
  attemptNo: number;
  hint: string;
  correctAnswerText: string;
  pointsAwarded: number;
  onRetry: () => void;
  onNext: () => void;
}

const resultIconClasses = "grid h-14 w-14 shrink-0 place-items-center rounded-full border-[2.5px] border-ink text-white shadow-[2px_2px_0_var(--ink)]";

export function ExerciseFeedbackPanel({
  status,
  attemptNo,
  hint,
  correctAnswerText,
  pointsAwarded,
  onRetry,
  onNext
}: ExerciseFeedbackPanelProps) {
  const isCorrect = status === "correct";
  const revealAnswer = !isCorrect && attemptNo >= 2;
  const title = isCorrect ? "Benar!" : revealAnswer ? "Jawaban yang benar:" : "Hampir! Coba lagi.";

  return (
    <div aria-live="polite">
      <BottomSheet title={title}>
        {isCorrect ?
        <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3 font-body text-[17px] font-bold leading-[26px]">
                <span className={`${resultIconClasses} bg-primary`}>
                  <CheckIcon size={30} strokeWidth={2.25} aria-hidden="true" />
                </span>
                Benar
              </span>
              <span className="inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-blush px-4 font-body text-[17px] font-bold leading-[26px] shadow-[2px_2px_0_var(--ink)] tabular-nums">
                +{pointsAwarded} XP
              </span>
            </div>
            <Button type="button" className="mt-5" onClick={onNext}>Lanjut</Button>
          </div> :
        null}

        {!isCorrect && !revealAnswer ?
        <div className="mt-4">
            <div className="flex items-center gap-3 font-body text-[17px] font-bold leading-[26px]">
              <span className={`${resultIconClasses} bg-signal`}>
                <XIcon size={30} strokeWidth={2.25} aria-hidden="true" />
              </span>
              Salah
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-card border-[2.5px] border-ink bg-accent px-4 py-3 font-body text-[16px] font-bold leading-6">
              <LightbulbIcon className="mt-0.5 shrink-0" size={22} strokeWidth={2.25} aria-hidden="true" />
              Petunjuk: {hint}
            </div>
            <Button type="button" className="mt-5" onClick={onRetry}>Coba lagi</Button>
          </div> :
        null}

        {revealAnswer ?
        <div className="mt-4">
            <div className="flex items-center gap-3 font-body text-[17px] font-bold leading-[26px]">
              <span className={`${resultIconClasses} bg-signal`}>
                <XIcon size={30} strokeWidth={2.25} aria-hidden="true" />
              </span>
              Salah
            </div>
            <p className="mt-4 flex items-center gap-2 font-display text-[28px] font-extrabold leading-8">
              <CheckIcon className="shrink-0" size={26} strokeWidth={2.5} aria-hidden="true" />
              {correctAnswerText}
            </p>
            <p className="mt-3 font-body text-[17px] leading-[26px] text-muted">Tidak apa-apa, ayo lanjut.</p>
            <Button type="button" className="mt-5" onClick={onNext}>Lanjut</Button>
          </div> :
        null}
      </BottomSheet>
    </div>);

}