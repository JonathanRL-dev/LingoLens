import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookIcon, CoffeeIcon, PhoneIcon, type LucideIcon } from 'lucide-react';
import { useStickerSpawner } from '../hooks/useStickerSpawner';
export interface FloatingStickersProps {
  animated?: boolean;
}
interface StaticSticker {
  Icon: LucideIcon;
  colorClass: string;
  size: number;
  rotate: number;
  style: {
    left?: string;
    right?: string;
    top: string;
  };
}
const STATIC_STICKERS: StaticSticker[] = [
  {
    Icon: BookIcon,
    colorClass: 'bg-lens',
    size: 52,
    rotate: 1.5,
    style: {
      right: '8%',
      top: '5%',
    },
  },
  {
    Icon: CoffeeIcon,
    colorClass: 'bg-orange',
    size: 68,
    rotate: -2,
    style: {
      right: '32%',
      top: '12%',
    },
  },
  {
    Icon: PhoneIcon,
    colorClass: 'bg-accent',
    size: 60,
    rotate: -1,
    style: {
      left: '8%',
      top: '78%',
    },
  },
];
const STICKER_CLASS =
  'absolute grid place-items-center rounded-[16px] border-[2.5px] border-ink text-ink shadow-sticker';
export function FloatingStickers({ animated = true }: FloatingStickersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isLive = animated && !prefersReducedMotion;
  const stickers = useStickerSpawner(containerRef, isLive);
  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {isLive ? (
        <AnimatePresence>
          {stickers.map(({ id, Icon, colorClass, size, x, y, rotate }) => (
            <motion.div
              key={id}
              className={`${STICKER_CLASS} ${colorClass}`}
              style={{
                left: x,
                top: y,
                width: size,
                height: size,
              }}
              initial={{
                scale: 0,
                opacity: 0,
                rotate,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate,
                transition: {
                  type: 'spring',
                  stiffness: 520,
                  damping: 16,
                  mass: 0.8,
                },
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
                transition: {
                  duration: 0.25,
                  ease: [0.23, 1, 0.32, 1],
                },
              }}
            >
              <Icon size={Math.round(size * 0.46)} strokeWidth={2.25} />
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        STATIC_STICKERS.map(({ Icon, colorClass, size, rotate, style }) => (
          <div
            key={`${style.top}-${size}`}
            className={`${STICKER_CLASS} ${colorClass}`}
            style={{
              ...style,
              width: size,
              height: size,
              transform: `rotate(${rotate}deg)`,
            }}
          >
            <Icon size={Math.round(size * 0.46)} strokeWidth={2.25} />
          </div>
        ))
      )}
    </div>
  );
}
