import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "./Button";
import { MascotSlot } from "./MascotSlot";
import { ScreenSkeleton, type ScreenSkeletonLayout } from "./ScreenSkeleton";

export interface ScreenStatusCopy {
  loadingLabel: string;
  errorMessage: string;
  emptyTitle: string;
  emptyMessage: string;
  emptyActionLabel?: string;
}

export interface ScreenStatusViewProps {
  status: "loading" | "error" | "empty";
  layout: ScreenSkeletonLayout;
  copy: ScreenStatusCopy;
  onRetry: () => void;
  onEmptyAction?: () => void;
}

const listLayouts: ScreenSkeletonLayout[] = ["home", "collection"];

export function ScreenStatusView({ status, layout, copy, onRetry, onEmptyAction }: ScreenStatusViewProps) {
  if (status === "loading") {
    return (
      <main className={`${listLayouts.includes(layout) ? "list-column" : "focus-column"} flex h-full w-full flex-col overflow-y-auto bg-paper px-5 pb-6 pt-7 text-ink`} aria-busy="true">
        <ScreenSkeleton layout={layout} />
        <span className="sr-only" aria-live="polite">{copy.loadingLabel}</span>
      </main>);

  }

  if (status === "error") {
    return (
      <main className="focus-column flex h-full w-full flex-col overflow-y-auto bg-paper px-6 pb-8 pt-7 text-ink">
        <div className="flex flex-1 flex-col items-center justify-center text-center" role="alert">
          <MascotSlot label="oops" size={120} />
          <p className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-chip border-[2.5px] border-ink bg-signal px-3 font-body text-[16px] font-bold leading-5 text-white">
            <AlertTriangleIcon size={22} strokeWidth={2.25} aria-hidden="true" />
            Gagal memuat
          </p>
          <p className="mt-3 max-w-[310px] font-body text-[17px] leading-[26px] text-muted">{copy.errorMessage}</p>
        </div>
        <div className="action-width">
          <Button type="button" onClick={onRetry}>
            <span className="flex items-center justify-center gap-2">
              <RotateCcwIcon size={20} strokeWidth={2.25} aria-hidden="true" />
              Coba lagi
            </span>
          </Button>
        </div>
      </main>);

  }

  return (
    <main className="focus-column flex h-full w-full flex-col overflow-y-auto bg-paper px-6 pb-8 pt-7 text-ink">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <MascotSlot label="empty" size={120} />
        <h1 className="mt-7 font-display text-[28px] font-extrabold leading-8">{copy.emptyTitle}</h1>
        <p className="mt-3 max-w-[310px] font-body text-[17px] leading-[26px] text-muted">{copy.emptyMessage}</p>
      </div>
      {copy.emptyActionLabel && onEmptyAction ?
      <div className="action-width">
          <Button type="button" onClick={onEmptyAction}>{copy.emptyActionLabel}</Button>
        </div> :
      null}
    </main>);

}