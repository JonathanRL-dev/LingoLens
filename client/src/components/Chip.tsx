import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: ReactNode;
}

export function Chip({ selected = false, children, className = "", ...props }: ChipProps) {
  return (
    <button
      className={`min-h-11 flex-1 rounded-chip border-[2.5px] border-ink px-4 font-body text-[17px] font-bold leading-[26px] text-ink transition-[transform,background-color] duration-150 ease-out [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens ${selected ? "bg-accent" : "bg-card"} ${className}`}
      aria-pressed={selected}
      {...props}>

      <span className="whitespace-nowrap">{children}</span>
    </button>);

}