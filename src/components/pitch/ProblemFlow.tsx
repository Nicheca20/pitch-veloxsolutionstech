import { useEffect, useRef, useState } from "react";
import { Clock, Search, FlaskConical, Server, Lock, X } from "lucide-react";

const STEPS = [
  {
    index: "01",
    icon: Clock,
    title: "Preventa lenta",
    tag: "semanas perdidas",
  },
  {
    index: "02",
    icon: Search,
    title: "Discovery eterno",
    tag: "sin fin",
  },
  {
    index: "03",
    icon: FlaskConical,
    title: "Piloto",
    tag: "prueba aislada",
  },
  {
    index: "04",
    icon: Server,
    title: "Producción",
    tag: "bloqueada",
    blocked: true,
  },
] as const;

export function ProblemFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);
  const [visible, setVisible] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // La sección empieza a "dibujarse" cuando su parte superior está en el 70% del viewport
      // y termina cuando su parte inferior pasa el 25%.
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

  useEffect(() => {
    // Encender nodos conforme la línea los alcanza.
    // Nodos 1-3 se encienden en secuencia; el nodo 4 queda apagado.
    const next = STEPS.map((_, i) => {
      if (i === 3) return false; // Producción bloqueada
      return fill > 0.12 + i * 0.20;
    });
    setVisible((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
  }, [fill]);

  return (
    <div ref={ref} className="relative mt-6 w-full max-w-xl md:min-h-[85vh]">
      <div className="relative flex flex-col justify-between md:min-h-[85vh] gap-4 md:gap-5">
        {/* Línea central */}
        <div className="absolute left-6 top-0 h-full w-px md:left-1/2 md:-translate-x-1/2">
          {/* Track tenue */}
          <div className="absolute inset-0 bg-white/10" />
          {/* Línea activa: avanza hasta el corte (~76%) */}
          <div
            className="absolute top-0 w-full origin-top bg-velox-gradient"
            style={{ height: `${Math.min(76, fill * 100)}%` }}
          />
          {/* Tramo roto hacia Producción */}
          <div
            className="absolute top-[76%] w-full origin-top bg-gradient-to-b from-[var(--force)] to-[var(--force)]/30"
            style={{
              height: `${Math.min(18, Math.max(0, fill * 100 - 76))}%`,
              opacity: fill > 0.76 ? 0.55 : 0,
              backgroundImage:
                "linear-gradient(to bottom, rgba(232,76,136,0.8) 0%, rgba(232,76,136,0.2) 100%)",
              backgroundSize: "1px 10px",
              backgroundRepeat: "repeat-y",
            }}
          />
        </div>

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const left = i % 2 === 0;
          const on = visible[i];
          const isLast = i === 3;

          return (
            <div
              key={step.index}
              className={`relative grid grid-cols-1 items-center gap-4 pl-14 md:grid-cols-2 md:pl-0 ${
                on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              } transition-all duration-600 ease-out`}
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              {/* Nodo */}
              <span
                className={`absolute left-6 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-600 md:left-1/2 ${
                  isLast
                    ? "border-[var(--force)]/40 bg-[var(--galaxy)]/80"
                    : on
                      ? "border-[var(--force)]/70 bg-[color-mix(in_oklab,var(--galaxy)_80%,black)] shadow-[0_0_18px_var(--force)]"
                      : "border-white/15 bg-[var(--galaxy)]/60"
                } ${isLast ? "animate-pulse-error" : ""}`}
              >
                {isLast ? (
                  <div className="relative flex items-center justify-center">
                    <Icon className="h-4 w-4 text-foreground/30" strokeWidth={1.5} />
                    <X className="absolute -right-0.5 -top-0.5 h-3 w-3 text-[var(--force)]" strokeWidth={3} />
                  </div>
                ) : (
                  <Icon
                    className={`h-4 w-4 transition-colors duration-500 ${
                      on ? "text-[var(--aura)]" : "text-foreground/40"
                    }`}
                    strokeWidth={1.6}
                  />
                )}
              </span>

              {/* Texto */}
              <div
                className={`text-veil relative ${
                  left ? "md:col-start-1 md:pr-14 md:text-right" : "md:col-start-2 md:pl-14"
                }`}
              >
                <span
                  className={`text-[10px] font-semibold tracking-[0.28em] ${
                    isLast ? "text-[var(--force)]/60" : on ? "text-[var(--force)]" : "text-foreground/40"
                  }`}
                >
                  {step.index}
                </span>
                <h3
                  className={`mt-0.5 text-[clamp(1rem,1.6vw,1.3rem)] font-semibold tracking-[-0.02em] ${
                    isLast ? "text-foreground/40 line-through decoration-[var(--force)]" : "text-[var(--ice)]"
                  }`}
                >
                  {step.title}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
                      isLast
                        ? "bg-[var(--force)]/10 text-[var(--force)]/80"
                        : on
                          ? "bg-[var(--velox)]/15 text-[var(--aura)]"
                          : "bg-white/5 text-foreground/40"
                    }`}
                  >
                    {step.tag}
                  </span>
                  {isLast && <Lock className="h-3 w-3 text-[var(--force)]/70" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
