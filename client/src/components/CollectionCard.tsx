import type { ComponentType } from 'react';

type IconComponent = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: boolean;
}>;

export interface CollectionCardProps {
  collected: boolean;
  word: string;
  imageUrl?: string;
  icon: IconComponent;
  colorClass: string;
  onOpen: () => void;
}

const focusRing =
  'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens';

export function CollectionCard({
  collected,
  word,
  imageUrl,
  icon: Icon,
  colorClass,
  onOpen,
}: CollectionCardProps) {
  if (!collected) {
    return (
      <div
        className="relative flex h-[132px] flex-col items-center justify-center rounded-card border-[2.5px] border-dashed border-ink bg-paper"
        role="img"
        aria-label="Stiker belum dikoleksi"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-[54px] w-[54px] object-contain opacity-[0.12] [filter:brightness(0)]"
            aria-hidden="true"
          />
        ) : (
          <Icon
            className="text-ink opacity-[0.12]"
            size={54}
            strokeWidth={2.25}
            aria-hidden={true}
          />
        )}
        <span className="mt-1 font-display text-[22px] font-black text-muted" aria-hidden="true">
          ?
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex h-[132px] flex-col items-center justify-center rounded-card border-[2.5px] border-ink px-2 shadow-sticker ${focusRing} ${colorClass}`}
      aria-label={`Buka ${word}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-[52px] w-[52px] object-contain"
          aria-hidden="true"
        />
      ) : (
        <Icon size={52} strokeWidth={2.25} aria-hidden={true} />
      )}
      <span className="mt-2 font-display text-[18px] font-black leading-6">{word}</span>
    </button>
  );
}
