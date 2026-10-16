import { useEffect, useState, type RefObject } from 'react';
import {
  AppleIcon,
  BookIcon,
  CameraIcon,
  CoffeeIcon,
  LightbulbIcon,
  PencilIcon,
  PhoneIcon,
  SparklesIcon,
  type LucideIcon,
} from 'lucide-react';

export interface SpawnedSticker {
  id: number;
  Icon: LucideIcon;
  colorClass: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
}

interface Zone {
  top: [number, number];
  weight: number;
}

const ICONS: LucideIcon[] = [
  CoffeeIcon,
  BookIcon,
  PhoneIcon,
  CameraIcon,
  SparklesIcon,
  LightbulbIcon,
  AppleIcon,
  PencilIcon,
];
const COLOR_CLASSES = ['bg-orange', 'bg-lens', 'bg-accent'];
// Fractions of the screen height. The top band sits above the mascot + board; the bottom band sits below the button.
const ZONES: Zone[] = [
  { top: [0.03, 0.19], weight: 0.72 },
  { top: [0.75, 0.86], weight: 0.28 },
];

const MAX_ACTIVE = 4;
const MIN_ACTIVE = 2;
const ENTRY_MS = 300;
const EDGE_PADDING = 16;
const GAP = 14;

export function useStickerSpawner(containerRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const [stickers, setStickers] = useState<SpawnedSticker[]>([]);

  useEffect(() => {
    if (!enabled) {
      setStickers([]);
      return undefined;
    }

    const timers = new Set<number>();
    let active: SpawnedSticker[] = [];
    let nextId = 0;

    const schedule = (fn: () => void, ms: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
    };

    const spawn = () => {
      const container = containerRef.current;
      if (!container || active.length >= MAX_ACTIVE) return;
      const sticker = createSticker(nextId, container.clientWidth, container.clientHeight, active);
      if (!sticker) return;
      nextId += 1;
      active = [...active, sticker];
      setStickers(active);
      schedule(
        () => {
          active = active.filter((item) => item.id !== sticker.id);
          setStickers(active);
        },
        ENTRY_MS + randomBetween(1500, 3000),
      );
    };

    const loop = () => {
      spawn();
      schedule(loop, active.length < MIN_ACTIVE ? 260 : randomBetween(650, 1300));
    };

    schedule(loop, 200);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, [containerRef, enabled]);

  return stickers;
}

function createSticker(
  id: number,
  width: number,
  height: number,
  active: SpawnedSticker[],
): SpawnedSticker | null {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const zone = Math.random() < ZONES[0]!.weight ? ZONES[0]! : ZONES[1]!;
    const size = Math.round(randomBetween(44, 72));
    const x = randomBetween(EDGE_PADDING, Math.max(EDGE_PADDING, width - size - EDGE_PADDING));
    const y = randomBetween(zone.top[0] * height, zone.top[1] * height);
    const overlaps = active.some(
      (other) =>
        x < other.x + other.size + GAP &&
        x + size + GAP > other.x &&
        y < other.y + other.size + GAP &&
        y + size + GAP > other.y,
    );
    if (!overlaps) {
      return {
        id,
        Icon: ICONS[Math.floor(Math.random() * ICONS.length)]!,
        colorClass: COLOR_CLASSES[Math.floor(Math.random() * COLOR_CLASSES.length)]!,
        size,
        x,
        y,
        rotate: randomBetween(-3, 3),
      };
    }
  }
  return null;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}
