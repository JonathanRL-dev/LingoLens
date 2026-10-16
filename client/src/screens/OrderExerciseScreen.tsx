import { CheckIcon, RotateCcwIcon, XIcon } from 'lucide-react';

import { Button } from '../components/Button';
import { ExerciseFeedbackPanel } from '../components/ExerciseFeedbackPanel';
import { MascotSlot } from '../components/MascotSlot';
import { PracticeActionBar, practiceBarContentPadding } from '../components/PracticeActionBar';
import { ScreenColumn } from '../components/ScreenColumn';
import { StickerCard } from '../components/StickerCard';

export interface Props {
  progress: number;
  prompt: string;
  bank: { id: string; label: string; placed: boolean }[];
  placed: { id: string; label: string }[];
  state: 'idle' | 'building' | 'complete' | 'correct' | 'wrong';
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

export const mockProps: Props = {
  progress: 3,
  prompt: 'Aku minum air dari cangkir.',
  bank: [
    { id: 'from', label: 'from', placed: false },
    { id: 'a', label: 'a', placed: false },
    { id: 'cup', label: 'cup', placed: false },
    { id: 'i', label: 'I', placed: false },
    { id: 'drink', label: 'drink', placed: false },
    { id: 'water', label: 'water', placed: false },
  ],

  placed: [],
  state: 'idle',
  attemptNo: 1,
  hint: 'Mulai dengan siapa yang melakukan: I.',
  correctAnswerText: 'I drink water from a cup.',
  pointsAwarded: 10,
  onPlace: () => undefined,
  onRemove: () => undefined,
  onReset: () => undefined,
  onCheck: () => undefined,
  onContinue: () => undefined,
};

export function OrderExerciseScreen({
  progress,
  prompt,
  bank,
  placed,
  state,
  attemptNo,
  hint,
  correctAnswerText,
  pointsAwarded,
  onPlace,
  onRemove,
  onReset,
  onCheck,
  onContinue,
  onSkip,
}: Props) {
  const isChecked = state === 'correct' || state === 'wrong';

  return (
    <main
      className={`relative flex h-full w-full flex-col overflow-y-auto bg-paper pt-6 text-ink ${onSkip ? practiceBarContentPadding.withSkip : practiceBarContentPadding.withoutSkip}`}
    >
      <ScreenColumn className="flex flex-1 flex-col">
        <header>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-orange px-3 font-body text-[15px] font-bold leading-5 shadow-[2px_2px_0_var(--ink)] tabular-nums">
              Latihan {progress} dari 3
            </span>
            <div className="flex gap-2" aria-label={`${progress} dari 3 latihan`}>
              {[1, 2, 3].map((segment) => (
                <span
                  key={segment}
                  className={`h-4 w-12 rounded-chip border-2 border-ink ${segment <= progress ? 'bg-accent' : 'bg-card'}`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
          <h1 className="mt-5 font-display text-[28px] font-extrabold leading-8">
            Susun kalimat ini
          </h1>
        </header>

        <StickerCard className="relative mt-5 px-5 py-5">
          <MascotSlot label="idle" size={48} className="absolute -right-1 -top-5" />
          <p className="pr-8 font-body text-[19px] font-bold leading-7">{prompt}</p>
        </StickerCard>

        <div className="mt-4 min-h-11" aria-live="polite">
          {state === 'correct' ? (
            <p className="inline-flex min-h-11 items-center gap-2 rounded-chip border-[2.5px] border-ink bg-primary px-3 font-body text-[16px] font-bold leading-5 text-white">
              <CheckIcon size={22} strokeWidth={2.25} aria-hidden="true" />
              Benar
            </p>
          ) : null}
          {state === 'wrong' ? (
            <p className="inline-flex min-h-11 items-center gap-2 rounded-chip border-[2.5px] border-ink bg-signal px-3 font-body text-[16px] font-bold leading-5 text-white">
              <XIcon size={22} strokeWidth={2.25} aria-hidden="true" />
              Salah
            </p>
          ) : null}
        </div>

        <section className="relative mt-2 min-h-[136px]" aria-label="Kalimat yang disusun">
          <span
            className="absolute inset-x-0 top-[62px] h-0 border-t-2 border-ink"
            aria-hidden="true"
          />
          <span
            className="absolute inset-x-0 top-[126px] h-0 border-t-2 border-ink"
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap content-start gap-x-2 gap-y-2">
            {placed.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onRemove(chip.id)}
                disabled={isChecked}
                className={`min-h-14 rounded-chip border-[2.5px] border-ink px-4 font-body text-[17px] font-bold leading-[26px] shadow-[2px_2px_0_var(--ink)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens ${state === 'correct' ? 'bg-primary text-white' : state === 'wrong' ? 'bg-signal text-white' : 'bg-card text-ink'}`}
                aria-label={`Kembalikan ${chip.label}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 flex flex-wrap gap-2.5" aria-label="Pilihan kata">
          {bank.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onPlace(chip.id)}
              disabled={chip.placed || isChecked}
              className={`min-h-14 rounded-chip border-[2.5px] px-5 font-body text-[17px] font-bold leading-[26px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens ${chip.placed ? 'border-dashed border-ink bg-paper text-muted' : 'border-ink bg-accent text-ink shadow-[2px_2px_0_var(--ink)]'}`}
              aria-label={chip.placed ? `${chip.label}, sudah dipakai` : chip.label}
            >
              {chip.label}
            </button>
          ))}
        </section>
      </ScreenColumn>

      <PracticeActionBar onSkip={onSkip} skipDisabled={isChecked}>
        <Button
          type="button"
          variant="ghost"
          className="!h-14 !w-auto min-w-[120px] shrink-0"
          onClick={onReset}
          disabled={state === 'idle'}
        >
          <span className="flex items-center justify-center gap-2 whitespace-nowrap">
            <RotateCcwIcon size={20} strokeWidth={2.25} aria-hidden="true" />
            Ulangi
          </span>
        </Button>
        <Button
          type="button"
          className="!h-14 !w-auto min-w-0 flex-1 !px-4 disabled:!opacity-50"
          onClick={onCheck}
          disabled={state !== 'complete'}
        >
          Cek
        </Button>
      </PracticeActionBar>

      {isChecked ? (
        <ExerciseFeedbackPanel
          status={state === 'correct' ? 'correct' : 'wrong'}
          attemptNo={attemptNo}
          hint={hint}
          correctAnswerText={correctAnswerText}
          pointsAwarded={pointsAwarded}
          onRetry={onReset}
          onNext={() => onContinue?.()}
        />
      ) : null}
    </main>
  );
}
