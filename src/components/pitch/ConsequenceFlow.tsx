import { useEffect, useRef, useState } from "react";
import { CalendarX, BatteryWarning, Snowflake, TrendingDown } from "lucide-react";

const STEPS = [
  {
    icon: CalendarX,
    title: "Trimestres perdidos",
    tag: "el deal no cierra",
  },
  {
    icon: BatteryWarning,
    title: "Consumo que no arranca",
    tag: "Agentforce sin uso real",
  },
  {
    icon: Snowflake,
    title: "El sponsor se enfría",
    tag: "prioridad cae",
  },
  {
    icon: TrendingDown,
    title: "Deal muerto antes del go-live",
    tag: "sin renovación",
  },
] as const;

export function ConsequenceFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.75 - r.top) / Math.max(1, r.height * 0.95);
      setFill(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-2xl md:min-h-[80vh]">
      <div className="relative flex flex-col justify-between gap-8 md:min-h-[80vh] md:gap-6">
        {/* Eje vertical: se degrada hacia el rojo conforme baja */}
        <div className="absolute left-7 top-0 h-full w-px md:left-1/2 md:-translate-x-1/2">
          <div className="absolute inset-0 bg-white/10" />
          <div
            className="absolute top-0 w-full"
            style={{
              height: `${fill * 100}%`,
              backgroundImage:
                "linear-gradient(to bottom, var(--velox) 0%, rgba(232,76,136,0.9) 55%, rgba(232,76,136,0.15) 100%)",
            }}
          />
        </div>

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const left = i % 2 === 0;
          const on = fill > 0.08 + i * 0.19;
          const decay = i / (STEPS.length - 1); // 0 → 1, cuánto se "apaga"
          const last = i === STEPS.length - 1;

          return (
            <div
              key={step.title}
              className={`relative grid grid-cols-1 items-center gap-4 pl-16 md:grid-cols-2 md:pl-0 transition-all duration-700 ease-out ${
                on ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
              }`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <span
                className={`absolute left-7 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-700 md:left-1/2 ${
                  last
                    ? "border-[var(--force)]/70 bg-[var(--galaxy)]/85 animate-pulse-error"
                    : "border-[var(--force)]/45 bg-[color-mix(in_oklab,var(--galaxy)_80%,black)]"
                }`}
                style={{
                  boxShadow: on ? `0 0 ${22 - decay * 10}px rgba(232,76,136,${0.5 - decay * 0.25})` : "none",
                }}
              >
                <Icon
                  className="h-6 w-6 text-[var(--force)]"
                  strokeWidth={1.5}
                  style={{ opacity: 1 - decay * 0.35 }}
                />
              </span>

              <div
                className={`text-veil relative ${
                  left ? "md:col-start-1 md:pr-16 md:text-right" : "md:col-start-2 md:pl-16"
                }`}
              >
                <h3
                  className="text-[clamp(1.35rem,2.4vw,2.1rem)] font-semibold tracking-[-0.02em]"
                  style={{
                    color: last ? "var(--force)" : "var(--ice)",
                    opacity: 1 - decay * 0.2,
                  }}
                >
                  {step.title}
                </h3>
                <span
                  className="mt-2 inline-block rounded-full bg-[var(--force)]/12 px-3 py-1 text-[clamp(0.75rem,1vw,0.95rem)] font-medium uppercase tracking-wider text-[var(--force)]/85"
                >
                  {step.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
