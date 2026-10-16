import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";

export interface BottomSheetProps {
  title: string;
  children: ReactNode;
  onDismiss?: () => void;
}

export const SHEET_ROOT_ID = "phone-sheet-root";

const easeOut = [0.23, 1, 0.32, 1] as const;

export function BottomSheet({ title, children, onDismiss }: BottomSheetProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRoot(document.getElementById(SHEET_ROOT_ID));
  }, []);

  useEffect(() => {
    if (!onDismiss) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  const sheet =
  <div className="pointer-events-auto absolute inset-0 z-50 flex items-end justify-center" role="presentation">
      <motion.button
      type="button"
      className="absolute inset-0 h-full w-full cursor-default bg-ink focus-visible:outline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-lens"
      aria-label="Tutup"
      tabIndex={onDismiss ? 0 : -1}
      onClick={onDismiss}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ duration: 0.2, ease: easeOut }} />

      <motion.section
      ref={(node) => {
        if (node && !node.contains(document.activeElement)) node.focus({ preventScroll: true });
      }}
      tabIndex={-1}
      className="relative z-10 flex max-h-[85%] w-full max-w-[640px] flex-col rounded-t-sheet border-x-[2.5px] border-t-[2.5px] border-ink bg-paper shadow-[0_-4px_0_var(--ink)] focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduceMotion ? false : { y: "100%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.26, ease: easeOut }}>

        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-muted" aria-hidden="true" />
          <h2 id={titleId} className="font-display text-[28px] font-extrabold leading-8 text-ink">
            {title}
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </motion.section>
    </div>;


  if (!root) {
    return null;
  }

  return createPortal(sheet, root);
}