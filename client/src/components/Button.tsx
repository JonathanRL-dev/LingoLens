import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  progress?: number;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantClasses = {
  primary: 'bg-primary text-white shadow-sticker disabled:bg-primary',
  secondary: 'bg-accent text-ink shadow-sticker disabled:bg-accent',
  ghost: 'bg-paper text-ink shadow-none disabled:bg-paper',
};

export function Button({
  children,
  progress,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress ?? 0));

  return (
    <button
      className={`relative min-h-14 w-full overflow-hidden rounded-full border-[2.5px] border-ink px-6 py-3 font-body text-lg font-bold leading-6 transition-[transform,background-color] duration-150 ease-out [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lens ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10 block whitespace-nowrap">{children}</span>
      {typeof progress === 'number' ? (
        <span
          className="absolute inset-x-5 bottom-2 h-1 overflow-hidden rounded-full bg-card"
          aria-hidden="true"
        >
          <span className="block h-full bg-accent" style={{ width: `${clampedProgress}%` }} />
        </span>
      ) : null}
    </button>
  );
}
