import { ChevronRightIcon } from "lucide-react";

export interface SentenceSource {
  name: string;
  id: string;
}

export interface SentenceSourceLinkProps {
  source: SentenceSource;
  onOpenCredits: () => void;
}

export function SentenceSourceLink({ source, onOpenCredits }: SentenceSourceLinkProps) {
  return (
    <button
      type="button"
      onClick={onOpenCredits}
      className="-ml-1 mt-1 inline-flex min-h-14 items-center gap-1 rounded-chip px-1 font-body text-[14px] font-bold leading-[18px] text-muted underline decoration-2 underline-offset-[3px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
      aria-label={`Sumber kalimat: ${source.name} nomor ${source.id}. Buka Kredit`}>

      Sumber: {source.name} <span className="tabular-nums">#{source.id}</span>
      <ChevronRightIcon size={16} strokeWidth={2.5} aria-hidden="true" />
    </button>);

}