import { RotateCcwIcon, SearchXIcon, UploadIcon } from "lucide-react";

import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";

export interface ScanTimeoutSheetProps {
  seconds: number;
  onRetry: () => void;
  onUpload: () => void;
  onDemo: () => void;
  onDismiss?: () => void;
}

export function ScanTimeoutSheet({ seconds, onRetry, onUpload, onDemo, onDismiss }: ScanTimeoutSheetProps) {
  return (
    <div aria-live="polite">
      <BottomSheet title="Belum ketemu" onDismiss={onDismiss}>
        <p className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-chip border-[2.5px] border-ink bg-card px-3 font-body text-[15px] font-bold leading-5 tabular-nums">
          <SearchXIcon size={20} strokeWidth={2.25} aria-hidden="true" />
          Tidak ada hasil dalam {seconds} detik
        </p>
        <p className="mt-3 font-body text-[17px] leading-[26px] text-muted">
          Tenang, kamu bisa mencoba lagi atau pilih cara lain.
        </p>
        <div className="mt-5 space-y-3">
          <Button type="button" onClick={onRetry}>
            <span className="flex items-center justify-center gap-2">
              <RotateCcwIcon size={20} strokeWidth={2.25} aria-hidden="true" />
              Coba lagi
            </span>
          </Button>
          <Button type="button" variant="secondary" onClick={onUpload}>
            <span className="flex items-center justify-center gap-2">
              <UploadIcon size={20} strokeWidth={2.25} aria-hidden="true" />
              Unggah foto
            </span>
          </Button>
          <Button type="button" variant="ghost" onClick={onDemo}>Mode demo</Button>
        </div>
      </BottomSheet>
    </div>);

}