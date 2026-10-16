import { CameraIcon, CheckIcon, LightbulbIcon } from "lucide-react";

import { Button } from "../components/Button";
import { CameraPermissionSheet } from "../components/CameraPermissionSheet";
import { MascotSlot } from "../components/MascotSlot";
import { StickerCard } from "../components/StickerCard";

export interface Props {
  permissionState: "closed" | "request" | "denied";
  onBack: () => void;
  onRequestCamera: () => void;
  onDismissPermission: () => void;
  onOpenCamera: () => void;
  onDenyCamera: () => void;
  onUpload: () => void;
  onDemo: () => void;
}

export const mockProps: Props = {
  permissionState: "closed",
  onBack: () => undefined,
  onRequestCamera: () => undefined,
  onDismissPermission: () => undefined,
  onOpenCamera: () => undefined,
  onDenyCamera: () => undefined,
  onUpload: () => undefined,
  onDemo: () => undefined
};

export function MissionScreen({
  permissionState,
  onRequestCamera,
  onDismissPermission,
  onOpenCamera,
  onDenyCamera,
  onUpload,
  onDemo
}: Props) {
  return (
    <main className="focus-column relative flex h-full w-full flex-col overflow-y-auto bg-paper px-5 pb-7 pt-6 text-ink">
      <header className="flex justify-end">
        <span className="inline-flex min-h-11 items-center rotate-[-2deg] rounded-chip border-[2.5px] border-ink bg-lens px-4 font-display text-[16px] font-black leading-5 shadow-[2px_2px_0_var(--ink)]">
          MISI 1
        </span>
      </header>

      <section className="mt-12" aria-labelledby="mission-title">
        <StickerCard className="relative px-5 pb-6 pt-14">
          <MascotSlot label="ready" size={96} className="absolute -right-1 -top-12" />
          <p className="font-body text-[15px] font-bold leading-5 text-muted">Targetmu</p>
          <h1 id="mission-title" className="mt-1 max-w-[290px] font-display text-[28px] font-extrabold leading-8">
            Temukan sesuatu untuk minum
          </h1>

          <div className="mt-6 space-y-4 border-t-[2.5px] border-ink pt-5 font-body text-[17px] leading-[26px]">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-chip border-[2.5px] border-ink bg-accent">
                <CameraIcon size={22} strokeWidth={2.25} aria-hidden="true" />
              </span>
              <p><strong className="font-bold">Arahkan kamera</strong><br />ke benda yang cocok.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-chip border-[2.5px] border-ink bg-blush">
                <CheckIcon size={22} strokeWidth={2.25} aria-hidden="true" />
              </span>
              <p><strong className="font-bold">Tunggu tanda cocok</strong><br />lalu pelajari katanya.</p>
            </div>
          </div>
        </StickerCard>

        <div className="mt-5 flex items-center justify-between rounded-card border-[2.5px] border-ink bg-orange px-4 py-3 font-body font-bold shadow-sticker">
          <span className="flex items-center gap-2"><LightbulbIcon size={22} strokeWidth={2.25} aria-hidden="true" />Hadiah misi</span>
          <span className="tabular-nums">+110 XP</span>
        </div>
      </section>

      <div className="action-width mt-auto">
        <Button type="button" onClick={onRequestCamera}>
          <span className="flex items-center justify-center gap-2">
            <CameraIcon size={22} strokeWidth={2.25} aria-hidden="true" />
            Buka Kamera
          </span>
        </Button>
      </div>

      {permissionState !== "closed" ?
      <CameraPermissionSheet
        state={permissionState}
        onGrant={onOpenCamera}
        onUpload={onUpload}
        onDemo={onDemo}
        onDecline={onDenyCamera}
        onDismiss={onDismissPermission} /> :

      null}
    </main>);

}