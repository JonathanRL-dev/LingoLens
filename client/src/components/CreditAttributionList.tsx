import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDownIcon, ExternalLinkIcon } from 'lucide-react';

export interface CreditAttribution {
  id: string;
  author: string;
  url?: string;
}

export interface CreditAttributionListProps {
  attributions: CreditAttribution[];
}

const easeOut = [0.23, 1, 0.32, 1] as const;
const focusRing =
  'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens';

export function CreditAttributionList({ attributions }: CreditAttributionListProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const panelId = useId();

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-chip border-[2.5px] border-ink bg-card px-4 font-body text-[17px] font-bold leading-[26px] shadow-[2px_2px_0_var(--ink)] ${focusRing}`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span>
          ID dan penulis <span className="tabular-nums text-muted">({attributions.length})</span>
        </span>
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
            <ul className="mt-3 divide-y-2 divide-ink border-y-2 border-ink font-body text-[16px] leading-6">
              {attributions.map((attribution) => {
                const content = (
                  <>
                    <span className="w-24 shrink-0 font-bold tabular-nums">#{attribution.id}</span>
                    <span className="min-w-0 flex-1 truncate">{attribution.author}</span>
                    {attribution.url ? (
                      <ExternalLinkIcon size={18} strokeWidth={2.25} aria-hidden="true" />
                    ) : null}
                  </>
                );

                return (
                  <li key={attribution.id}>
                    {attribution.url ? (
                      <a
                        href={attribution.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex min-h-14 items-center gap-3 ${focusRing}`}
                        aria-label={`Kalimat ${attribution.id} oleh ${attribution.author}, buka di tab baru`}
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="flex min-h-14 items-center gap-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
