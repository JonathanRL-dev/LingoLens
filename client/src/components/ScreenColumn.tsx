import type { ReactNode } from "react";

export interface ScreenColumnProps {
  children: ReactNode;
  className?: string;
}

/** Shared content column: full width with 20px gutters below 640px, centred 640px column above. */
export function ScreenColumn({ children, className = "" }: ScreenColumnProps) {
  return <div className={`mx-auto w-full max-w-[640px] px-5 ${className}`}>{children}</div>;
}