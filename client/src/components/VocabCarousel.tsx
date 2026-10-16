import type { ReactNode } from "react";

export interface VocabCarouselProps<Item> {
  item: Item;
  renderItem: (item: Item) => ReactNode;
  label: string;
}

export function VocabCarousel<Item>({ item, renderItem, label }: VocabCarouselProps<Item>) {
  return (
    <section className="w-full" aria-label={label} aria-roledescription="carousel">
      <div role="group" aria-roledescription="slide" aria-label="1 dari 1">
        {renderItem(item)}
      </div>
    </section>);

}