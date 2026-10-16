import { InfoIcon } from "lucide-react";

export interface MandarinText {
  hanzi: string;
  pinyin: string;
}

export interface MandarinTranslationProps {
  zh: MandarinText;
  reviewed: boolean;
}

export function MandarinTranslation({ zh, reviewed }: MandarinTranslationProps) {
  return (
    <div className="mt-4 rounded-chip border-[2.5px] border-ink bg-card px-3 py-2">
      <p className="font-body text-[14px] font-bold leading-[18px] text-muted">Mandarin</p>
      <p lang="zh-Hans" className="mt-1 font-language text-[32px] font-bold leading-10">{zh.hanzi}</p>
      <p lang="zh-Latn-pinyin" className="font-language text-[16px] leading-6 text-muted">{zh.pinyin}</p>
      {!reviewed ?
      <p className="mt-2 flex items-start gap-1.5 font-body text-[14px] font-bold leading-[18px] text-muted">
          <InfoIcon className="mt-px shrink-0" size={16} strokeWidth={2.25} aria-hidden="true" />
          Terjemahan ini belum ditinjau.
        </p> :
      null}
    </div>);

}