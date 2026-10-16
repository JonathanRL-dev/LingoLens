import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDownIcon } from 'lucide-react';

import type { MandarinText } from './MandarinTranslation';

export interface SentenceTranslations {
  id: string;
  zh?: MandarinText;
}

export interface TranslationDisclosureProps {
  translations: SentenceTranslations;
  showMandarin: boolean;
}

const easeOut = [0.23, 1, 0.32, 1] as const;

export function TranslationDisclosure({ translations, showMandarin }: TranslationDisclosureProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const panelId = useId();

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-chip border-[2.5px] border-ink bg-card px-4 font-body text-[17px] font-bold leading-[26px] shadow-[2px_2px_0_var(--ink)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
        aria-expanded={open}
        aria-controls={panelId}
      >
        Terjemahan
        <ChevronDownIcon
          size={22}
          strokeWidth={2.25}
          className={`shrink-0 transition-transform duration-200 ease-out [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            className="overflow-hidden"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={
              reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }
            }
            transition={{ duration: 0.2, ease: easeOut }}
          >
            <dl className="space-y-3 pt-3">
              <div>
                <dt className="font-body text-[14px] font-bold leading-[18px] text-muted">
                  Indonesia
                </dt>
                <dd className="mt-1 font-body text-[17px] leading-[26px]">{translations.id}</dd>
              </div>
              {showMandarin && translations.zh ? (
                <div>
                  <dt className="font-body text-[14px] font-bold leading-[18px] text-muted">
                    Mandarin
                  </dt>
                  <dd className="mt-1">
                    <span
                      lang="zh-Hans"
                      className="block font-language text-[20px] font-bold leading-7"
                    >
                      {translations.zh.hanzi}
                    </span>
                    <span
                      lang="zh-Latn-pinyin"
                      className="block font-language text-[15px] leading-5 text-muted"
                    >
                      {translations.zh.pinyin}
                    </span>
                  </dd>
                </div>
              ) : null}
            </dl>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
