import { useEffect, useRef, useState } from "react";
import { Users, Network, Infinity as InfinityIcon } from "lucide-react";

const PHASES = [
  {
    index: "01",
    icon: Users,
    title: "Levantamiento acelerado",
    line: "Cliente + arquitectos senior con Veleiro.ai.",
  },
  {
    index: "02",
    icon: Network,
    title: "Co-creación en equipo",
    line: "Primer agente Agentforce funcionando.",
  },
  {
    index: "03",
    icon: InfinityIcon,
    title: "Evolución continua",
    line: "Iteramos, medimos y escalamos contigo.",
  },
] as const;

export function SolutionTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);
  const [visible, setVisible] = useState<boolean[]>([false, false, false]);
  const nodes = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.75 - r.top) / Math.max(1, r.height * 0.85);
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
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const i = Number((e.target as HTMLElement).dataset["i"]);
          if (e.isIntersecting)
            setVisible((prev) => (prev[i] ? prev : prev.map((v, j) => (j === i ? true : v))));
        });
      },
      { threshold: 0.4 },
    );
    nodes.current.forEach((n) => n && io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} id="asi-lo-resolvemos" className="relative mx-auto w-full max-w-5xl">
      <div className="text-veil relative mb-14 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-velox-gradient" />
          <span className="text-[11px] uppercase tracking-[0.28em] text-foreground/55">
            Así lo resolvemos
          </span>
          <span className="h-px w-8 bg-velox-gradient" />
        </div>
      </div>

        <div className="relative">
          {/* Línea central */}
          <div className="absolute left-6 top-0 h-full w-px bg-white/10 md:left-1/2 md:-translate-x-1/2">
            <div
              className="w-full origin-top bg-velox-gradient shadow-[0_0_18px_var(--force)] transition-[height] duration-150 ease-out"
              style={{ height: `${fill * 100}%` }}
            />
          </div>

          <ul className="relative flex flex-col gap-20 md:gap-28">
            {PHASES.map((p, i) => {
              const Icon = p.icon;
              const left = i % 2 === 0;
              const on = visible[i];
              return (
                <li
                  key={p.index}
                  data-i={i}
                  ref={(el) => {
                    nodes.current[i] = el;
                  }}
                  className={`relative pl-16 md:grid md:grid-cols-2 md:items-center md:gap-16 md:pl-0 ${
                    on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  } transition-all duration-700 ease-out`}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  {/* Nodo */}
                  <span
                    className={`absolute left-6 top-6 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--force)]/60 bg-[color-mix(in_oklab,var(--galaxy)_75%,black)] transition-transform duration-700 md:left-1/2 ${
                      on
                        ? "scale-100 shadow-[0_0_26px_var(--force)]"
                        : "scale-75 shadow-none"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-[var(--aura)]" strokeWidth={1.6} />
                  </span>

                  <div
                    className={`text-veil relative ${
                      left ? "md:col-start-1 md:pr-16 md:text-right" : "md:col-start-2 md:pl-16"
                    }`}
                  >
                    <span className="text-[11px] font-semibold tracking-[0.3em] text-[var(--force)]">
                      {p.index}
                    </span>
                    <h3 className="mt-2 text-[clamp(1.3rem,2.4vw,2rem)] font-semibold tracking-[-0.02em] text-[var(--ice)]">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-[clamp(0.95rem,1.2vw,1.1rem)] text-foreground/65">
                      {p.line}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
      </div>
    </div>
  );
}
