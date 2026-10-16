import { useRef } from 'react';

import { Button } from '../components/Button';
import { useSplashScale } from '../hooks/useSplashScale';
import { FloatingStickers } from '../components/FloatingStickers';
import { MascotSlot } from '../components/MascotSlot';
import { StickerCard } from '../components/StickerCard';

export type LearnerLevel = 'anak' | 'pemula';

export interface Props {
  modelStatus: 'loading' | 'ready';
  progress?: number;
  onStart: () => void;
}

export const mockProps: Props = {
  modelStatus: 'ready',
  progress: 100,
  onStart: () => undefined,
};

// Board top edge sits at viewBox y=62 of the 70-unit peek mascot (150px wide → 87px tall).
const PEEK_SIZE = 150;
const PEEK_EDGE_OFFSET = Math.round((62 / 70) * PEEK_SIZE * 0.58);

export function SplashScreen({ modelStatus, progress = 0, onStart }: Props) {
  const isLoading = modelStatus === 'loading';
  const mainRef = useRef<HTMLElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const scale = useSplashScale(mainRef, groupRef);

  return (
    <main
      ref={mainRef}
      className="relative flex h-full min-h-[34rem] w-full flex-col items-center justify-center overflow-hidden bg-paper px-5 text-ink"
    >
      <FloatingStickers />

      <div
        ref={groupRef}
        className="relative z-10 flex w-full max-w-md flex-col items-center"
        style={{
          paddingTop: PEEK_EDGE_OFFSET,
          transform: scale > 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center',
        }}
      >
        <section className="w-full max-w-[300px]" aria-labelledby="splash-title">
          <div className="relative rotate-[-2deg]">
            <div
              className="absolute left-1/2 z-0 -translate-x-1/2"
              style={{ top: -PEEK_EDGE_OFFSET }}
              aria-hidden="true"
            >
              <MascotSlot label="peek" size={PEEK_SIZE} tint={isLoading ? 'loading' : 'leaf'} />
            </div>

            <div
              className="absolute left-[24%] top-[140px] z-0 h-[30px] w-[10px] rounded-b-[5px] bg-ink"
              aria-hidden="true"
            />
            <div
              className="absolute right-[24%] top-[140px] z-0 h-[30px] w-[10px] rounded-b-[5px] bg-ink"
              aria-hidden="true"
            />

            <StickerCard className="relative z-10 flex h-[150px] flex-col items-center justify-center px-5 text-center">
              <h1
                id="splash-title"
                className="flex items-center font-display text-[44px] font-black leading-[52px] tracking-[-0.035em]"
                aria-label="LingoLens"
              >
                <span aria-hidden="true">Ling</span>
                <span
                  className="relative mx-0.5 inline-grid h-[37px] w-[37px] place-items-center rounded-full border-[3px] border-ink bg-lens"
                  aria-hidden="true"
                >
                  <span className="absolute right-[6px] top-[5px] h-[8px] w-[8px] rounded-full bg-white" />
                </span>
                <span aria-hidden="true">Lens</span>
              </h1>
              <p className="mt-2 font-body text-[17px] font-normal leading-[26px] text-muted">
                Pindai benda. Pelajari katanya.
              </p>
            </StickerCard>
          </div>
        </section>

        <div className="mt-11 w-full" aria-live="polite">
          {isLoading ? (
            <Button type="button" disabled progress={progress} className="pb-5">
              Menyiapkan kamera pintar…
            </Button>
          ) : (
            <Button type="button" onClick={onStart}>
              Mulai Menjelajah
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
