export interface CollectionCounterProps {
  count: number;
  total: number;
}

export function CollectionCounter({ count, total }: CollectionCounterProps) {
  return (
    <span
      className="inline-flex min-h-11 shrink-0 items-center rounded-chip border-[2.5px] border-ink bg-accent px-3 font-body text-[16px] font-bold leading-5 shadow-[2px_2px_0_var(--ink)] tabular-nums"
      role="status"
      aria-label={`${count} dari ${total} stiker terkumpul`}
    >
      <span aria-hidden="true">
        {count} / {total}
      </span>
      <span className="ml-1.5 text-[14px] leading-[18px]" aria-hidden="true">
        terkumpul
      </span>
    </span>
  );
}
