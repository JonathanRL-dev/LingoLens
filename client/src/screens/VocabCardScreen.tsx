import { useState } from "react";
import { CoffeeIcon, InfoIcon, Volume2Icon } from "lucide-react";

import { BottomSheet } from "../components/BottomSheet";
import { Button } from "../components/Button";
import { MandarinTranslation, type MandarinText } from "../components/MandarinTranslation";
import { MascotSlot } from "../components/MascotSlot";
import { SentenceSourceLink, type SentenceSource } from "../components/SentenceSourceLink";
import { TranslationDisclosure, type SentenceTranslations } from "../components/TranslationDisclosure";
import { StickerCard } from "../components/StickerCard";
import { VocabCarousel } from "../components/VocabCarousel";

export interface Props {
  word: {
    word: string;
    phonetic: string;
    meaningId: string;
    sentenceEn: string;
    target: string;
    related: string[];
  };
  translations: {
    zh?: MandarinText;
  };
  sentence: {
    translations: SentenceTranslations;
    source?: SentenceSource;
  };
  reviewed: boolean;
  showThirdLanguage: boolean;
  voiceAvailable: boolean;
  onSpeak: () => void;
  onStartPractice: () => void;
  onOpenSource: () => void;
  onOpenCredits?: () => void;
}

export const mockProps: Props = {
  word: {
    word: "Cup",
    phonetic: "/kʌp/",
    meaningId: "cangkir",
    sentenceEn: "I drink water from a cup.",
    target: "cup",
    related: ["Bottle", "Bowl", "Spoon"]
  },
  translations: {
    zh: {
      hanzi: "杯子",
      pinyin: "bēizi"
    }
  },
  sentence: {
    translations: {
      id: "Aku minum air dari cangkir.",
      zh: {
        hanzi: "我用杯子喝水。",
        pinyin: "Wǒ yòng bēizi hē shuǐ."
      }
    },
    source: {
      name: "Tatoeba",
      id: "2390719"
    }
  },
  reviewed: false,
  showThirdLanguage: true,
  voiceAvailable: true,
  onSpeak: () => undefined,
  onStartPractice: () => undefined,
  onOpenSource: () => undefined
};

export function VocabCardScreen({
  word,
  translations,
  sentence,
  reviewed,
  showThirdLanguage,
  voiceAvailable,
  onSpeak,
  onStartPractice,
  onOpenSource,
  onOpenCredits
}: Props) {
  const [sourceOpen, setSourceOpen] = useState(false);

  const handleOpenSource = () => {
    onOpenSource();
    setSourceOpen(true);
  };

  return (
    <main className="focus-column relative flex h-full w-full flex-col overflow-y-auto bg-paper px-5 pb-6 pt-7 text-ink">
      <VocabCarousel
        item={word}
        label="Kartu kosakata"
        renderItem={(item) =>
        <StickerCard className="relative px-5 pb-6 pt-5">
            <MascotSlot label="idle" size={64} className="absolute -right-2 -top-5" />

            <div className="flex h-14 w-14 items-center justify-center rounded-full border-[2.5px] border-ink bg-orange shadow-[2px_3px_0_var(--ink)]">
              <CoffeeIcon size={30} strokeWidth={2.25} aria-hidden="true" />
            </div>

            <button
            type="button"
            onClick={handleOpenSource}
            className="absolute right-4 top-[72px] inline-flex min-h-11 items-center gap-1.5 rounded-chip border-[2.5px] border-ink bg-card px-3 font-body text-[14px] font-bold leading-[18px] shadow-[2px_2px_0_var(--ink)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
            aria-label="Sumber">

              <InfoIcon size={19} strokeWidth={2.25} aria-hidden="true" />
              Sumber
            </button>

            <div className="mt-5 flex items-center gap-3 pr-20">
              <h1 className="font-display text-[56px] font-black leading-[60px] tracking-[-0.03em]">
                {item.word}
              </h1>
              {voiceAvailable ?
            <button
              type="button"
              onClick={onSpeak}
              className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-lens shadow-[2px_2px_0_var(--ink)] after:absolute after:-inset-1.5 after:content-[''] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
              aria-label={`Dengarkan kata ${item.word}`}>

                  <Volume2Icon size={22} strokeWidth={2.25} aria-hidden="true" />
                </button> :
            null}
            </div>

            <p className="font-language text-[20px] leading-7 text-muted">{item.phonetic}</p>

            <span className="mt-5 inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-accent px-4 font-body text-[17px] font-bold leading-[26px]">
              {item.meaningId}
            </span>

            {showThirdLanguage && translations.zh ?
          <MandarinTranslation zh={translations.zh} reviewed={reviewed} /> :
          null}

            <div className="mt-6 border-t-[2.5px] border-ink pt-5">
              <div className="flex items-start gap-3">
                <p className="min-w-0 flex-1 font-body text-[19px] font-bold leading-7">
                  {renderSentence(item.sentenceEn, item.target)}
                </p>
                {voiceAvailable ?
              <button
                type="button"
                onClick={onSpeak}
                className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-accent shadow-[2px_2px_0_var(--ink)] after:absolute after:-inset-1.5 after:content-[''] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
                aria-label="Dengarkan kalimat">

                    <Volume2Icon size={20} strokeWidth={2.25} aria-hidden="true" />
                  </button> :
              null}
              </div>
              {sentence.source && onOpenCredits ?
            <SentenceSourceLink source={sentence.source} onOpenCredits={onOpenCredits} /> :
            null}
              <TranslationDisclosure translations={sentence.translations} showMandarin={showThirdLanguage} />
            </div>
          </StickerCard>
        } />


      <section className="mt-6" aria-labelledby="related-title">
        <h2 id="related-title" className="font-display text-[20px] font-extrabold leading-7">Kata terkait</h2>
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-2" role="list">
          {word.related.map((relatedWord) =>
          <span
            key={relatedWord}
            className="inline-flex min-h-11 shrink-0 items-center rounded-chip border-[2.5px] border-ink bg-card px-4 font-body text-[16px] font-bold leading-5 shadow-[2px_2px_0_var(--ink)]"
            role="listitem">

              {relatedWord}
            </span>
          )}
        </div>
      </section>

      <div className="action-width mt-auto pt-4">
        <Button type="button" onClick={onStartPractice}>Mulai Latihan</Button>
      </div>

      {sourceOpen ?
      <BottomSheet title="Sumber" onDismiss={() => setSourceOpen(false)}>
          <div className="mt-5 space-y-3 font-body text-[17px] leading-[26px] text-ink">
            <p className="rounded-chip border-[2.5px] border-ink bg-card px-4 py-3">Kalimat: Tatoeba (CC BY 2.0 FR)</p>
            <p className="rounded-chip border-[2.5px] border-ink bg-card px-4 py-3">Arti dan fonetik: Wiktionary via kaikki.org</p>
          </div>
          <Button type="button" className="mt-5" onClick={() => setSourceOpen(false)}>Tutup</Button>
        </BottomSheet> :
      null}
    </main>);

}

function renderSentence(sentence: string, target: string) {
  const targetIndex = sentence.toLocaleLowerCase().indexOf(target.toLocaleLowerCase());

  if (targetIndex === -1) {
    return sentence;
  }

  const before = sentence.slice(0, targetIndex);
  const match = sentence.slice(targetIndex, targetIndex + target.length);
  const after = sentence.slice(targetIndex + target.length);

  return (
    <>
      {before}
      <strong className="relative inline-block font-extrabold underline decoration-accent decoration-[5px] underline-offset-[5px]">
        {match}
      </strong>
      {after}
    </>);

}