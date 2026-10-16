import { useLayoutEffect, useState, type RefObject } from "react";

const DESKTOP_MIN_WIDTH = 1024;
const MAX_SCALE = 2;
// Breathing room kept around the scaled group so nothing touches the screen edges.
const VERTICAL_MARGIN = 64;
const HORIZONTAL_MARGIN = 48;

/**
 * Width-based scale for the Splash centre group: 1.6× at 1280 px rising smoothly to 2× at 1920 px
 * (0.8 + width / 1600), clamped so the group always fits the available height and width.
 * Returns 1 below 1024 px so phone and tablet layouts stay untouched.
 */
export function useSplashScale(containerRef: RefObject<HTMLElement | null>, groupRef: RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const group = groupRef.current;
    if (!container || !group) return undefined;

    const update = () => {
      const viewportWidth = window.innerWidth;
      if (viewportWidth < DESKTOP_MIN_WIDTH) {
        setScale(1);
        return;
      }
      const widthScale = 0.8 + viewportWidth / 1600;
      const fitHeight = (container.clientHeight - VERTICAL_MARGIN) / group.offsetHeight;
      const fitWidth = (container.clientWidth - HORIZONTAL_MARGIN) / group.offsetWidth;
      setScale(Math.max(1, Math.min(MAX_SCALE, widthScale, fitHeight, fitWidth)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [containerRef, groupRef]);

  return scale;
}
