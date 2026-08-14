import { useEffect, useRef, useState } from "react";
import type { Section as SectionData } from "@/content";
import { MetricValue } from "./Metric";

export function Section({
  data,
  first,
  afterTitle,
  className,
}: {
  data: SectionData;
  first?: boolean;
  afterTitle?: React.ReactNode;
  className?: string | undefined;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry && setActive(entry.isIntersecting && entry.intersectionRatio > 0.35),
      { threshold: [0, 0.35, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={data.id}
      className={`pitch-section relative flex min-h-screen items-center px-6 md:px-16 lg:px-24 ${
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } transition-all duration-700 ease-out ${className ?? ""}`}
    >
      <div className="text-veil relative z-10 max-w-[46rem]">
        <div className="mb-5 flex items-center gap-3">
          <span className="text-[11px] font-semibold tracking-[0.3em] text-[var(--force)]">{data.index}</span>
          <span className="h-px w-8 bg-velox-gradient" />
          <span className="text-[11px] uppercase tracking-[0.28em] text-foreground/55">{data.kicker}</span>
        </div>

        <h2
          className={`text-balance font-bold leading-[1.02] tracking-[-0.03em] ${
            first ? "text-[clamp(2.6rem,8vw,7rem)]" : "text-[clamp(2rem,5.2vw,4.4rem)]"
          }`}
        >
          {data.title}
        </h2>

        {afterTitle}

        {data.body && (
          <p className="mt-6 max-w-[62ch] text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed text-foreground/70">
            {data.body}
          </p>
        )}

        {data.bullets && (
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {data.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--force)]" />
                {b}
              </li>
            ))}
          </ul>
        )}

        {data.metrics && (
          <div className="mt-10 flex flex-wrap gap-x-12 gap-y-8">
            {data.metrics.map((m) => (
              <MetricValue key={m.label} {...m} active={active} />
            ))}
          </div>
        )}

        {data.note && (
          <p className="mt-8 border-l-2 border-[var(--velox)] pl-4 text-sm italic text-foreground/55">{data.note}</p>
        )}
      </div>
    </section>
  );
}
