import { Mascot, type Props as MascotProps } from "./Mascot";

export interface MascotSlotProps {
  label: string;
  size?: number;
  className?: string;
  tint?: MascotProps["tint"];
}

type MascotMood = MascotProps["mood"];

const MOODS: MascotMood[] = ["idle", "searching", "found", "speaking", "oops", "cheer", "peek"];

// Legacy slot labels that are not mascot moods map to the closest mood.
const LABEL_TO_MOOD: Record<string, MascotMood> = {
  avatar: "idle",
  ready: "searching",
  loading: "searching",
  "camera off": "oops",
  "mic off": "oops",
  "no voice": "oops",
  empty: "oops"
};

// Visual classes belonged to the old placeholder circle; keep only layout classes.
const PLACEHOLDER_CLASS = /^(shadow-|bg-|text-|border|rounded)/;

export function MascotSlot({ label, size = 96, className = "", tint }: MascotSlotProps) {
  const mood: MascotMood = MOODS.includes(label as MascotMood) ? label as MascotMood : LABEL_TO_MOOD[label] ?? "idle";
  const layoutClassName = className.
  split(/\s+/).
  filter((token) => token && !PLACEHOLDER_CLASS.test(token)).
  join(" ");

  return (
    <div className={`shrink-0 ${layoutClassName}`} style={{ width: size, height: mood === "peek" ? size * 0.58 : size }}>
      <Mascot mood={mood} size={size} tint={tint} />
    </div>);

}