export interface XpBarProps {
  value: number;
  max: number;
  label?: string;
}

export function XpBar({ value, max, label = "XP" }: XpBarProps) {
  const safeMax = Math.max(1, max);
  const safeValue = Math.max(0, Math.min(value, safeMax));
  const percentage = safeValue / safeMax * 100;

  return (
    <div className="w-full font-body text-ink">
      <div className="mb-1 text-right text-[14px] font-bold leading-[18px] tabular-nums">
        {safeValue} / {safeMax} {label}
      </div>
      <div
        className="h-3 overflow-hidden rounded-full border-2 border-ink bg-card"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}>

        <div className="h-full bg-accent" style={{ width: `${percentage}%` }} />
      </div>
    </div>);

}