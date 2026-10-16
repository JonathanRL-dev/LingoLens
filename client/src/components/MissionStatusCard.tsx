import { CheckIcon, LockIcon } from "lucide-react";

import { StarRating } from "./StarRating";
import { StickerCard } from "./StickerCard";

export interface MissionStatusCardProps {
  title: string;
  status: "locked" | "completed";
  bestStars?: 0 | 1 | 2 | 3;
  lockedHint?: string;
}

export function MissionStatusCard({ title, status, bestStars = 0, lockedHint }: MissionStatusCardProps) {
  if (status === "completed") {
    return (
      <StickerCard className="px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[18px] font-extrabold leading-6">{title}</p>
            <p className="mt-1 flex items-center gap-1.5 font-body text-[15px] font-bold leading-5 text-primary">
              <CheckIcon size={18} strokeWidth={2.5} aria-hidden="true" />
              Selesai
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-body text-[13px] font-bold leading-[18px] text-muted">Bintang terbaik</p>
            <StarRating value={bestStars} label="Bintang terbaik" />
          </div>
        </div>
      </StickerCard>);

  }

  return (
    <StickerCard className="px-4 py-3.5" aria-disabled="true">
      <div className="flex items-center gap-3 text-muted">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-chip border-[2.5px] border-ink bg-canvas text-ink">
          <LockIcon size={22} strokeWidth={2.25} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[17px] font-extrabold leading-[22px] text-ink">{title}</p>
          <p className="mt-1 font-body text-[14px] font-bold leading-[18px]">
            Terkunci{lockedHint ? ` · ${lockedHint}` : ""}
          </p>
        </div>
      </div>
    </StickerCard>);

}