import { SkipForwardIcon } from "lucide-react";

export interface SkipPracticeButtonProps {
  onSkip: () => void;
  disabled?: boolean;
  label?: string;
}

export function SkipPracticeButton({ onSkip, disabled = false, label = "Lewati latihan" }: SkipPracticeButtonProps) {
  return (
    <button
      type="button"
      onClick={onSkip}
      disabled={disabled}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-chip font-body text-[16px] font-bold leading-6 text-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens">

      <SkipForwardIcon size={20} strokeWidth={2.25} aria-hidden="true" />
      <span className="whitespace-nowrap">{label}</span>
    </button>);

}