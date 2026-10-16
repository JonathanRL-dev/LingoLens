import type { HTMLAttributes, ReactNode } from 'react';

export interface StickerCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function StickerCard({ children, className = '', ...props }: StickerCardProps) {
  return (
    <div
      className={`rounded-card border-[2.5px] border-ink bg-card shadow-sticker ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
