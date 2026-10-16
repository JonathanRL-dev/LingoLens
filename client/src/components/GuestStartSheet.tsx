import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";

import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { Chip } from "./Chip";

export type GuestLevel = "anak" | "pemula";

export interface GuestStartSheetProps {
  onStart: (nickname: string, level: GuestLevel) => void;
  onDismiss: () => void;
}

export function GuestStartSheet({ onStart, onDismiss }: GuestStartSheetProps) {
  const [nickname, setNickname] = useState("");
  const [level, setLevel] = useState<GuestLevel>("anak");
  const [showError, setShowError] = useState(false);

  const handleStart = () => {
    if (!nickname.trim()) {
      setShowError(true);
      return;
    }
    onStart(nickname.trim(), level);
  };

  return (
    <BottomSheet title="Siapa namamu, Penjelajah?" onDismiss={onDismiss}>
      <div className="mt-5">
        <label htmlFor="guest-nickname" className="sr-only">Nama panggilan</label>
        <input
          id="guest-nickname"
          value={nickname}
          autoComplete="nickname"
          onChange={(event) => {
            setNickname(event.target.value);
            if (event.target.value.trim()) setShowError(false);
          }}
          placeholder="Nama panggilan"
          aria-invalid={showError}
          aria-describedby={showError ? "guest-nickname-error" : undefined}
          className={`min-h-14 w-full rounded-chip border-[2.5px] bg-card px-4 font-body text-[17px] leading-[26px] text-ink placeholder:text-muted focus:outline focus:outline-4 focus:outline-offset-2 focus:outline-lens ${showError ? "border-signal" : "border-ink"}`} />

        {showError ?
        <p id="guest-nickname-error" className="mt-2 flex items-center gap-2 font-body text-[15px] font-bold leading-5 text-error" role="alert">
            <AlertCircleIcon size={20} strokeWidth={2.25} aria-hidden="true" />
            Isi nama dulu, ya
          </p> :
        null}
      </div>

      <div className="mt-4 flex gap-2" aria-label="Pilih tingkat" role="group">
        <Chip type="button" className="min-h-14" selected={level === "anak"} onClick={() => setLevel("anak")}>Anak</Chip>
        <Chip type="button" className="min-h-14" selected={level === "pemula"} onClick={() => setLevel("pemula")}>Pemula</Chip>
      </div>

      <Button type="button" className="mt-5" onClick={handleStart}>Ayo mulai</Button>
      <p className="mt-4 text-center font-body text-[13px] leading-[18px] text-muted">
        Kamera hanya dipakai di perangkatmu. Progres tamu akan hilang jika keluar.
      </p>
    </BottomSheet>);

}