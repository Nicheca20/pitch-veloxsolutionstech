import { useEffect, useRef, useState } from "react";
import type { Section as SectionData } from "@/content";
import { MetricValue } from "./Metric";

export function Section({
  data,
  first,
  afterTitle,
  extra,
  below,
  right,
  align,
  className,
}: {
  data: SectionData;
  first?: boolean;
  afterTitle?: React.ReactNode;
  extra?: React.ReactNode;
  below?: React.ReactNode;
  right?: React.ReactNode;
  align?: "center" | "start" | undefined;
  className?: string | undefined;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Se revela apenas asoma en pantalla y no se vuelve a ocultar:
    // evita el efecto "pop" al hacer scroll rápido.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      // Se revela ANTES de entrar al viewport: cuando el usuario llega, la
      // sección ya está visible y el scroll se siente continuo, no por fases.
      { threshold: 0, rootMargin: "40% 0px 40% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={data.id}
      className={`pitch-section relative flex min-h-[85vh] flex-col justify-center px-5 py-16 sm:px-6 md:min-h-screen md:px-16 md:py-0 lg:px-24 ${
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } [transition:opacity_500ms_linear,transform_500ms_cubic-bezier(0.22,1,0.36,1)] [backface-visibility:hidden] ${className ?? ""}`}

    >
      <div
        className={`relative z-10 flex w-full gap-8 ${
          align === "start" ? "items-start" : "items-center"
        } ${right ? "flex-col lg:flex-row lg:justify-between" : ""}`}
      >
        {/* Kicker + título: SIEMPRE alineados a la izquierda */}
        <div className={`text-veil text-left ${right ? "w-full lg:max-w-[42%]" : "w-full max-w-[46rem]"}`}>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-velox-gradient" />
            <span className="text-[11px] uppercase tracking-[0.28em] text-foreground/55">{data.kicker}</span>
          </div>

          <h2
            className={`text-balance font-bold leading-[1.02] tracking-[-0.03em] ${
              first ? "text-[clamp(2.4rem,6vw,5rem)]" : "text-[clamp(2rem,5.2vw,4.4rem)]"
            }`}
          >
            {data.title}
          </h2>

          {afterTitle}

          {data.body && (
            <p className={`max-w-[62ch] text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed text-foreground/70 ${first ? "mt-4" : "mt-6"}`}>
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

          {extra}
        </div>

        {right && (
          <div className={`flex w-full justify-center lg:w-[58%] lg:justify-start lg:pl-8 ${align === "start" ? "items-start" : "items-center"}`}>
            {right}
          </div>
        )}
      </div>

      {/* Todo lo demás (flujos, timelines, diagramas) va centrado */}
      {below && (
        <div className="relative z-10 mt-10 flex w-full justify-center md:mt-14">
          <div className="w-full max-w-5xl">{below}</div>
        </div>
      )}

    </section>
  );
}
