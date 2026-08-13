export function NavDots({
  count,
  active,
  onSelect,
  labels,
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
  labels: string[];
}) {
  return (
    <nav
      aria-label="Secciones"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 md:flex print:hidden"
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          aria-label={labels[i]}
          aria-current={i === active}
          onClick={() => onSelect(i)}
          className="group flex items-center justify-end gap-2"
        >
          <span className="pointer-events-none whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-foreground/0 transition-colors group-hover:text-foreground/60">
            {labels[i]}
          </span>
          <span
            className={`block rounded-full transition-all duration-300 ${
              i === active
                ? "h-2.5 w-2.5 bg-[var(--force)] shadow-[0_0_12px_var(--force)]"
                : "h-1.5 w-1.5 bg-foreground/25 group-hover:bg-foreground/60"
            }`}
          />
        </button>
      ))}
    </nav>
  );
}
