import { useState, type FormEvent } from "react";
import { AlertCircleIcon, ArrowLeftIcon } from "lucide-react";

import { Button } from "../components/Button";
import { GuestStartSheet, type GuestLevel } from "../components/GuestStartSheet";
import { MascotSlot } from "../components/MascotSlot";
import { StickerCard } from "../components/StickerCard";

export interface Props {
  onRegister: (name: string, email: string, pass: string) => void;
  onGoToLogin: () => void;
  onGuestStart: (nickname: string, level: GuestLevel) => void;
  onBack: () => void;
  mode?: "new" | "upgrade";
  guestNickname?: string;
}

export const mockProps: Props = {
  onRegister: () => undefined,
  onGoToLogin: () => undefined,
  onGuestStart: () => undefined,
  onBack: () => undefined,
  mode: "new",
  guestNickname: "Rani"
};

type FieldName = "name" | "email" | "pass";
type FieldErrors = Record<FieldName, boolean>;

const initialErrors: FieldErrors = {
  name: false,
  email: false,
  pass: false
};

const fieldClassName = "min-h-14 w-full rounded-chip border-[2.5px] bg-card px-4 font-body text-[17px] leading-[26px] text-ink placeholder:text-muted focus:outline focus:outline-4 focus:outline-offset-2 focus:outline-lens";

export function RegisterScreen({ onRegister, onGoToLogin, onGuestStart, onBack, mode = "new", guestNickname }: Props) {
  const isUpgrade = mode === "upgrade";
  const [guestOpen, setGuestOpen] = useState(false);
  const [name, setName] = useState(isUpgrade ? guestNickname ?? "" : "Rani");
  const [email, setEmail] = useState("rani@email.com");
  const [pass, setPass] = useState("********");
  const [errors, setErrors] = useState<FieldErrors>(initialErrors);

  const updateField = (field: FieldName, value: string) => {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "pass") setPass(value);
    if (value.trim()) {
      setErrors((current) => ({ ...current, [field]: false }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {
      name: !name.trim(),
      email: !email.trim(),
      pass: !pass.trim()
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    onRegister(name.trim(), email.trim(), pass);
  };

  return (
    <main className="narrow-column flex h-full w-full flex-col overflow-y-auto bg-paper px-5 pb-7 pt-6 text-ink">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-card shadow-[2px_2px_0_var(--ink)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
          aria-label={isUpgrade ? "Kembali ke Profil" : "Kembali"}>

          <ArrowLeftIcon size={23} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <h1 className="font-display text-[28px] font-extrabold leading-8">{isUpgrade ? "Simpan Progresmu" : "Daftar Penjelajah"}</h1>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mt-[76px]">
        <StickerCard className="relative px-5 pb-6 pt-16">
          <MascotSlot label="idle" size={96} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 shadow-[2px_3px_0_var(--ink)]" />

          <div>
            <label htmlFor="register-name" className="sr-only">Nama panggilan</label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="nickname"
              value={name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Nama panggilan"
              aria-invalid={errors.name}
              aria-describedby={errors.name ? "register-name-error" : undefined}
              className={`${fieldClassName} ${errors.name ? "border-signal" : "border-ink"}`} />

            {errors.name ? <FieldError id="register-name-error" /> : null}
          </div>

          <div className="mt-4">
            <label htmlFor="register-email" className="sr-only">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="Email"
              aria-invalid={errors.email}
              aria-describedby={errors.email ? "register-email-error" : undefined}
              className={`${fieldClassName} ${errors.email ? "border-signal" : "border-ink"}`} />

            {errors.email ? <FieldError id="register-email-error" /> : null}
          </div>

          <div className="mt-4">
            <label htmlFor="register-pass" className="sr-only">Kata sandi</label>
            <input
              id="register-pass"
              name="password"
              type="password"
              autoComplete="new-password"
              value={pass}
              onChange={(event) => updateField("pass", event.target.value)}
              placeholder="Kata sandi"
              aria-invalid={errors.pass}
              aria-describedby={errors.pass ? "register-pass-error" : undefined}
              className={`${fieldClassName} ${errors.pass ? "border-signal" : "border-ink"}`} />

            {errors.pass ? <FieldError id="register-pass-error" /> : null}
          </div>

          <Button type="submit" className="mt-5">Buat Akun</Button>
        </StickerCard>
      </form>

      {isUpgrade ?
      <p className="mt-5 text-center font-body text-[16px] leading-6 text-muted">
          Progres, XP, dan kata koleksimu akan ikut tersimpan.
        </p> :

      <div className="mt-6 space-y-2">
          <Button type="button" variant="ghost" className="text-lens" onClick={onGoToLogin}>
            Sudah punya album? Masuk
          </Button>
          <Button type="button" variant="ghost" className="text-muted" onClick={() => setGuestOpen(true)}>
            Lanjut sebagai Tamu
          </Button>
        </div>
      }

      {guestOpen && !isUpgrade ?
      <GuestStartSheet onStart={onGuestStart} onDismiss={() => setGuestOpen(false)} /> :
      null}
    </main>);

}

interface FieldErrorProps {
  id: string;
}

function FieldError({ id }: FieldErrorProps) {
  return (
    <p id={id} className="mt-2 flex items-center gap-2 font-body text-[15px] font-bold leading-5 text-error" role="alert">
      <AlertCircleIcon size={20} strokeWidth={2.25} aria-hidden="true" />
      Wajib diisi
    </p>);

}