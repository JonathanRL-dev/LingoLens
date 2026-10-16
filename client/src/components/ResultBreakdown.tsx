import { InfoIcon } from "lucide-react";

import { StickerCard } from "./StickerCard";

export interface XpBreakdown {
  scan: number;
  practice: number;
  total: number;
}

export interface ResultBreakdownProps {
  xpBreakdown: XpBreakdown;
  practiceAccuracy: number;
  alreadyCollected?: boolean;
}

export function ResultBreakdown({ xpBreakdown, practiceAccuracy, alreadyCollected = false }: ResultBreakdownProps) {
  return (
    <>
      <section className="mt-5 border-y-[2.5px] border-ink py-3 font-body text-[16px] font-bold leading-6" aria-label="XP didapat">
        <dl className="space-y-1.5 tabular-nums">
          <div className="flex items-center justify-between gap-4">
            <dt>Pindai</dt>
            <dd>+{xpBreakdown.scan}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>Latihan</dt>
            <dd>+{xpBreakdown.practice}</dd>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 border-t-2 border-ink pt-2 font-extrabold">
            <dt>Total</dt>
            <dd>+{xpBreakdown.total} XP</dd>
          </div>
        </dl>
        {alreadyCollected ?
        <p className="mt-2 flex items-start gap-2 font-body text-[14px] font-bold leading-[18px] text-muted">
            <InfoIcon className="mt-px shrink-0" size={18} strokeWidth={2.25} aria-hidden="true" />
            Kata ini sudah kamu miliki, jadi XP pindai 50%.
          </p> :
        null}
      </section>

      <section className="mt-5" aria-label="Ringkasan skor">
        <StickerCard className="flex min-h-[92px] flex-col justify-between px-3 py-3">
          <p className="font-body text-[14px] font-bold leading-[18px] text-muted">Akurasi latihan</p>
          <p className="font-display text-[28px] font-black leading-8 tabular-nums">{practiceAccuracy}%</p>
        </StickerCard>
      </section>
    </>);

}