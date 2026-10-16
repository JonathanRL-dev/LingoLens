import { useState, type ComponentType } from "react";
import {
  AppleIcon,
  ArmchairIcon,
  BananaIcon,
  BookOpenIcon,
  Clock3Icon,
  CoffeeIcon,
  LaptopIcon,
  MilkIcon,
  SmartphoneIcon,
  SoupIcon,
  UmbrellaIcon,
  UtensilsIcon,
  Volume2Icon } from
"lucide-react";

import { BottomSheet } from "../components/BottomSheet";
import { Button } from "../components/Button";
import { CollectionCard } from "../components/CollectionCard";
import { CollectionCounter } from "../components/CollectionCounter";

export interface Props {
  items: {
    id: string;
    word: string;
    category: "minum-makan" | "baca-belajar" | "rumah" | "telepon";
    collected: boolean;
    imageUrl?: string;
    bestScore?: number;
  }[];
  count?: number;
  total: number;
  onOpenItem: (id: string) => void;
  onStartMission: () => void;
  onStartPractice: (id: string) => void;
}

export const mockProps: Props = {
  items: [
  { id: "cup", word: "Cup", category: "minum-makan", collected: true, bestScore: 81 },
  { id: "bottle", word: "Bottle", category: "minum-makan", collected: false },
  { id: "bowl", word: "Bowl", category: "minum-makan", collected: false },
  { id: "spoon", word: "Spoon", category: "minum-makan", collected: false },
  { id: "banana", word: "Banana", category: "minum-makan", collected: false },
  { id: "apple", word: "Apple", category: "minum-makan", collected: false },
  { id: "book", word: "Book", category: "baca-belajar", collected: false },
  { id: "clock", word: "Clock", category: "rumah", collected: false },
  { id: "chair", word: "Chair", category: "rumah", collected: false },
  { id: "laptop", word: "Laptop", category: "baca-belajar", collected: false },
  { id: "umbrella", word: "Umbrella", category: "rumah", collected: false },
  { id: "phone", word: "Phone", category: "telepon", collected: false }],

  total: 12,
  onOpenItem: () => undefined,
  onStartMission: () => undefined,
  onStartPractice: () => undefined
};

type IconComponent = ComponentType<{size?: number;strokeWidth?: number;className?: string;"aria-hidden"?: boolean;}>;

const itemIcons: Record<string, IconComponent> = {
  cup: CoffeeIcon,
  bottle: MilkIcon,
  bowl: SoupIcon,
  spoon: UtensilsIcon,
  banana: BananaIcon,
  apple: AppleIcon,
  book: BookOpenIcon,
  clock: Clock3Icon,
  chair: ArmchairIcon,
  laptop: LaptopIcon,
  umbrella: UmbrellaIcon,
  phone: SmartphoneIcon
};

const categoryClasses = {
  "minum-makan": "bg-orange",
  "baca-belajar": "bg-lens",
  rumah: "bg-blush",
  telepon: "bg-accent"
} as const;

export function CollectionScreen({ items, count, total, onOpenItem, onStartMission, onStartPractice }: Props) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const collectedCount = count ?? items.filter((item) => item.collected).length;
  const openItem = items.find((item) => item.id === openItemId && item.collected);

  const handleOpenItem = (id: string) => {
    onOpenItem(id);
    setOpenItemId(id);
  };

  return (
    <main className="relative flex h-full w-full flex-col overflow-hidden bg-paper text-ink">
      <header className="list-column flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-7">
        <h1 className="font-display text-[28px] font-black leading-8">Album Stikerku</h1>
        <CollectionCounter count={collectedCount} total={total} />
      </header>

      <div className="list-column flex-1 overflow-y-auto px-5 pb-28 pt-3">
        <section className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" aria-label="Koleksi kosakata">
          {items.map((item) =>
          <CollectionCard
            key={item.id}
            collected={item.collected}
            word={item.word}
            imageUrl={item.imageUrl}
            icon={itemIcons[item.id] ?? CoffeeIcon}
            colorClass={categoryClasses[item.category]}
            onOpen={() => handleOpenItem(item.id)} />

          )}
        </section>
      </div>

      <div className="absolute inset-x-5 bottom-6 mx-auto max-w-md">
        <Button type="button" onClick={onStartMission}>Mulai misi</Button>
      </div>

      {openItem ?
      <BottomSheet title={openItem.word} onDismiss={() => setOpenItemId(null)}>
          <div className="mt-5 rounded-card border-[2.5px] border-ink bg-card px-5 pb-5 pt-4 shadow-sticker">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-[2.5px] border-ink bg-orange shadow-[2px_2px_0_var(--ink)]">
                <CoffeeIcon size={30} strokeWidth={2.25} aria-hidden="true" />
              </div>
              <span className="inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-accent px-3 font-body text-[15px] font-bold leading-5 tabular-nums">
                Skor terbaik {openItem.bestScore ?? 0}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <h2 className="font-display text-[44px] font-black leading-[52px]">Cup</h2>
              <button
              type="button"
              className="relative grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-ink bg-lens shadow-[2px_2px_0_var(--ink)] after:absolute after:-inset-1.5 after:content-[''] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens"
              aria-label="Dengarkan kata Cup">

                <Volume2Icon size={21} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>
            <p className="font-language text-[19px] leading-7 text-muted">/kʌp/</p>
            <span className="mt-4 inline-flex min-h-11 items-center rounded-chip border-[2.5px] border-ink bg-accent px-4 font-body text-[17px] font-bold leading-[26px]">cangkir</span>
            <div className="mt-5 border-t-[2.5px] border-ink pt-4">
              <p className="font-body text-[17px] font-bold leading-[26px]">I drink water from a <strong className="underline decoration-accent decoration-[4px] underline-offset-[5px]">cup</strong>.</p>
              <p className="mt-2 font-body text-[16px] leading-6 text-muted">Aku minum air dari cangkir.</p>
            </div>
          </div>
          <Button
          type="button"
          className="mt-5"
          onClick={() => {
            setOpenItemId(null);
            onStartPractice(openItem.id);
          }}>

            Latihan lagi
          </Button>
          <Button type="button" variant="ghost" className="mt-3" onClick={() => setOpenItemId(null)}>Tutup</Button>
        </BottomSheet> :
      null}
    </main>);

}