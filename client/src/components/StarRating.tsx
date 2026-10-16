import { StarIcon } from "lucide-react";

export interface StarRatingProps {
  value: number;
  max?: number;
  label?: string;
}

export function StarRating({ value, max = 3, label = "Bintang" }: StarRatingProps) {
  const safeMax = Math.max(1, max);
  const safeValue = Math.max(0, Math.min(value, safeMax));

  return (
    <div className="flex min-h-11 items-center gap-1" aria-label={`${label}: ${safeValue} dari ${safeMax}`}>
      {Array.from({ length: safeMax }, (_, index) =>
      <StarIcon
        key={index}
        className={index < safeValue ? "fill-accent text-ink" : "fill-card text-ink"}
        size={28}
        strokeWidth={2.25}
        aria-hidden="true" />

      )}
    </div>);

}