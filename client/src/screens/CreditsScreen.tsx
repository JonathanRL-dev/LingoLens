import { ArrowLeftIcon, BookOpenIcon, ExternalLinkIcon, MessageSquareQuoteIcon, PaletteIcon, ScanEyeIcon, ShapesIcon, TypeIcon, BoxIcon } from "lucide-react";
import { CreditAttributionList, CreditAttribution } from "../components/CreditAttributionList";
export interface CreditItem {
  name: string;
  license: string;
  url?: string;
}
export interface CreditSection {
  id: string;
  kind: "sentences" | "dictionary" | "model" | "fonts" | "icons" | "illustrations";
  title: string;
  description: string;
  items: CreditItem[];
  attributions?: CreditAttribution[];
}
export interface Props {
  sections: CreditSection[];
  backLabel?: string;
  onBack: () => void;
}
const sectionIcons: Record<CreditSection["kind"], typeof BoxIcon> = {
  sentences: MessageSquareQuoteIcon,
  dictionary: BookOpenIcon,
  model: ScanEyeIcon,
  fonts: TypeIcon,
  icons: ShapesIcon,
  illustrations: PaletteIcon
};
const focusRing = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens";
export function CreditsScreen({
  sections,
  backLabel = "Kembali ke Profil",
  onBack
}: Props) {
  return <main className="narrow-column flex h-full w-full flex-col overflow-y-auto bg-paper px-5 pb-8 pt-6 text-ink">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onBack} className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-card shadow-[2px_2px_0_var(--ink)] ${focusRing}`} aria-label={backLabel}>
          <ArrowLeftIcon size={23} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <h1 className="font-display text-[28px] font-black leading-8">Kredit</h1>
      </header>
      <p className="mt-4 font-body text-[17px] leading-[26px] text-muted">
        LingoLens dibuat dengan bantuan karya dan data terbuka berikut.
      </p>

      <div className="mt-4 divide-y-[2.5px] divide-ink border-y-[2.5px] border-ink">
        {sections.map((section) => {
        const Icon = sectionIcons[section.kind];
        return <section key={section.id} className="py-5" aria-labelledby={`credit-${section.id}`}>
              <h2 id={`credit-${section.id}`} className="flex items-center gap-3 font-display text-[20px] font-extrabold leading-7">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-chip border-[2.5px] border-ink bg-accent">
                  <Icon size={22} strokeWidth={2.25} aria-hidden="true" />
                </span>
                {section.title}
              </h2>
              <p className="mt-3 font-body text-[16px] leading-6">{section.description}</p>

              <ul className="mt-2">
                {section.items.map((item) => {
              const content = <>
                      <span className="min-w-0 flex-1">
                        <span className="block font-body text-[17px] font-bold leading-[26px]">{item.name}</span>
                        <span className="block font-body text-[14px] leading-[18px] text-muted">{item.license}</span>
                      </span>
                      {item.url ? <ExternalLinkIcon className="shrink-0" size={20} strokeWidth={2.25} aria-hidden="true" /> : null}
                    </>;
              return <li key={item.name}>
                      {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className={`flex min-h-14 items-center gap-3 py-1 ${focusRing}`} aria-label={`${item.name}, lisensi ${item.license}, buka di tab baru`}>
                          {content}
                        </a> : <div className="flex min-h-14 items-center gap-3 py-1">{content}</div>}
                    </li>;
            })}
              </ul>

              {section.attributions && section.attributions.length > 0 ? <CreditAttributionList attributions={section.attributions} /> : null}
            </section>;
      })}
      </div>
    </main>;
}