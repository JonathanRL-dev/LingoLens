import { CameraOffIcon, ShieldCheckIcon, UploadIcon } from "lucide-react";

import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";

export interface CameraPermissionSheetProps {
  state: "request" | "denied";
  onGrant: () => void;
  onUpload: () => void;
  onDemo: () => void;
  onDecline?: () => void;
  onDismiss?: () => void;
}

export function CameraPermissionSheet({ state, onGrant, onUpload, onDemo, onDecline, onDismiss }: CameraPermissionSheetProps) {
  if (state === "denied") {
    return (
      <div aria-live="polite">
        <BottomSheet title="Kamera tidak diizinkan" onDismiss={onDismiss}>
          <div className="mt-4 flex items-center gap-3 font-body text-[17px] font-bold leading-[26px]">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-signal text-white shadow-[2px_2px_0_var(--ink)]">
              <CameraOffIcon size={28} strokeWidth={2.25} aria-hidden="true" />
            </span>
            Akses kamera ditolak
          </div>
          <p className="mt-3 font-body text-[17px] leading-[26px] text-muted">
            Kamu tetap bisa menyelesaikan misi dengan foto atau mode demo.
          </p>
          <div className="mt-5 space-y-3">
            <Button type="button" onClick={onUpload}>
              <span className="flex items-center justify-center gap-2">
                <UploadIcon size={22} strokeWidth={2.25} aria-hidden="true" />
                Unggah foto
              </span>
            </Button>
            <Button type="button" variant="secondary" onClick={onDemo}>Mode demo</Button>
          </div>
        </BottomSheet>
      </div>);

  }

  return (
    <BottomSheet title="Izinkan kamera?" onDismiss={onDismiss}>
      <p className="mt-3 font-body text-[17px] leading-[26px] text-muted">
        Kamera dipakai untuk mencari benda di depanmu.
      </p>
      <p className="mt-3 flex items-start gap-2 rounded-chip border-[2.5px] border-ink bg-card px-4 py-3 font-body text-[16px] font-bold leading-6">
        <ShieldCheckIcon className="mt-0.5 shrink-0" size={20} strokeWidth={2.25} aria-hidden="true" />
        Gambar diproses di perangkatmu dan tidak dikirim ke server.
      </p>
      <div className="mt-5 space-y-3">
        <Button type="button" onClick={onGrant}>Izinkan</Button>
        <Button type="button" variant="ghost" onClick={onDecline}>Jangan izinkan</Button>
      </div>
    </BottomSheet>);

}