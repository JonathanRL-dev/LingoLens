import { useState, type ReactNode } from 'react';
import { ArrowLeftIcon, XIcon } from 'lucide-react';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { ScreenColumn } from './ScreenColumn';

export type MissionStep = 'scan' | 'word' | 'practice';

export interface MissionFlowShellProps {
  currentStep: MissionStep;
  children: ReactNode;
  onBack: () => void;
  onExit: () => void;
  lockContent?: boolean;
}

const steps: { id: MissionStep; label: string }[] = [
  { id: 'scan', label: 'Pindai' },
  { id: 'word', label: 'Kata' },
  { id: 'practice', label: 'Latihan' },
];

// 56px hit area around the unchanged 44px visual circle.
const headerButtonClass =
  'group -m-1.5 grid h-14 w-14 place-items-center rounded-full focus-visible:outline-none';
const headerButtonFace =
  'grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-ink bg-card shadow-[2px_2px_0_var(--ink)] group-focus-visible:outline group-focus-visible:outline-4 group-focus-visible:outline-offset-2 group-focus-visible:outline-lens';

export function MissionFlowShell({
  currentStep,
  children,
  onBack,
  onExit,
  lockContent = false,
}: MissionFlowShellProps) {
  const [exitOpen, setExitOpen] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-paper text-ink">
      <header className="relative z-30 shrink-0 border-b-[2.5px] border-ink bg-card pb-2 pt-2">
        <ScreenColumn className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className={`${headerButtonClass} shrink-0`}
            aria-label="Kembali ke langkah sebelumnya"
          >
            <span className={headerButtonFace}>
              <ArrowLeftIcon size={23} strokeWidth={2.25} aria-hidden="true" />
            </span>
          </button>

          <ol className="grid min-w-0 flex-1 grid-cols-3 gap-1" aria-label="Langkah misi">
            {steps.map((step, index) => {
              const active = step.id === currentStep;
              return (
                <li
                  key={step.id}
                  aria-current={active ? 'step' : undefined}
                  className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-chip border-2 px-1 font-body text-[12px] leading-4 sm:flex-row sm:gap-1 ${active ? 'border-ink bg-accent font-bold text-ink' : 'border-transparent bg-card font-normal text-muted'}`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 tabular-nums ${active ? 'border-ink bg-card font-bold text-ink' : 'border-muted text-muted'}`}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate">{step.label}</span>
                </li>
              );
            })}
          </ol>

          <button
            type="button"
            onClick={() => setExitOpen(true)}
            className={`${headerButtonClass} shrink-0`}
            aria-label="Keluar dari misi"
          >
            <span className={headerButtonFace}>
              <XIcon size={23} strokeWidth={2.25} aria-hidden="true" />
            </span>
          </button>
        </ScreenColumn>
      </header>

      <div
        className={`min-h-0 flex-1 ${lockContent ? 'overflow-hidden' : 'overflow-y-auto [&>main]:!overflow-y-auto'}`}
      >
        {children}
      </div>

      {exitOpen ? (
        <BottomSheet title="Keluar dari misi?" onDismiss={() => setExitOpen(false)}>
          <div className="mt-5 space-y-3">
            <Button type="button" onClick={() => setExitOpen(false)}>
              Lanjut misi
            </Button>
            <Button type="button" variant="secondary" onClick={onExit}>
              Keluar
            </Button>
          </div>
        </BottomSheet>
      ) : null}
    </div>
  );
}
