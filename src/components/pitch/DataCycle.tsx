import { useEffect, useRef, useState } from "react";

const STAGES = [
  { label: "Descubrir", x: 50, y: 8, card: "left-1/2 bottom-5 -translate-x-1/2" },
  { label: "Definir", x: 92, y: 50, card: "left-5 top-1/2 -translate-y-1/2" },
  { label: "Diseñar", x: 50, y: 92, card: "left-1/2 top-5 -translate-x-1/2" },
  { label: "Entregar", x: 8, y: 50, card: "right-5 top-1/2 -translate-y-1/2" },
];

export function DataCycle() {
  const ref = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [progress, setProgress] = useState(0);
  const [pathLen, setPathLen] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLen(len);
    }
  }, []);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.65 - r.top) / Math.max(1, r.height * 0.9);
      setProgress(Math.min(1, Math.max(0, p)));
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

  const cycleProgress = Math.min(1, progress * 1.35);
  const radialProgress = Math.min(1, Math.max(0, (progress - 0.15) * 1.7));
  const nodeProgress = Math.min(1, Math.max(0, (progress - 0.25) * 2.5));

  const cycleOffset = pathLen * (1 - cycleProgress);

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-square w-[74%] max-w-[640px] select-none sm:w-[86%] md:w-full"
      style={{ overflow: "visible" }}
      aria-label="Ciclo de trabajo: Activo de datos único conecta Descubrir, Definir, Diseñar y Entregar"
    >

      {/* SVG: ciclo exterior + radiales */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="data-cycle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--velox)" />
            <stop offset="50%" stopColor="var(--force)" />
            <stop offset="100%" stopColor="var(--aura)" />
          </linearGradient>
          <filter id="data-cycle-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ciclo exterior: rombo con vértices alineados a los labels (8% del borde) */}
        <path
          ref={pathRef}
          d="M200 32 L368 200 L200 368 L32 200 Z"
          fill="none"
          stroke="url(#data-cycle-gradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLen || 1000}
          strokeDashoffset={cycleOffset}
          filter="url(#data-cycle-glow)"
          opacity={0.55 + cycleProgress * 0.35}
        />

        {/* Líneas radiales al centro */}
        <g opacity={radialProgress}>
          {[
            [200, 32, 200, 200],
            [368, 200, 200, 200],
            [200, 368, 200, 200],
            [32, 200, 200, 200],
          ].map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#data-cycle-gradient)"
              strokeWidth="1.2"
              opacity={0.55}
              filter="url(#data-cycle-glow)"
            />
          ))}
        </g>
      </svg>

      {/* Nodo central */}
      <div
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        style={{
          opacity: 0.25 + progress * 0.75,
          transition: "opacity 700ms ease-out",
        }}
      >
        <div className="relative flex h-[clamp(6.5rem,22vw,10rem)] w-[clamp(6.5rem,22vw,10rem)] items-center justify-center rounded-full border border-[var(--force)]/40 bg-[var(--galaxy)]/60 p-4 text-center shadow-[0_0_50px_-10px_var(--velox)]">
          <span className="text-[clamp(0.7rem,1.4vw,0.9rem)] font-bold uppercase leading-tight tracking-[0.1em] text-[var(--ice)]">
            Activo de datos único
          </span>
          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-[var(--force)]/20"
            style={{
              animation: progress > 0.5 ? "pulse-halo 3s ease-in-out infinite" : "none",
            }}
          />
        </div>
      </div>

      {/* Nodos periféricos */}
      {STAGES.map((stage, i) => {
        const delay = i * 0.12;
        const local = Math.min(1, Math.max(0, (nodeProgress - delay) / (1 - delay * 0.5)));
        return (
          <div
            key={stage.label}
            className="absolute z-20 h-0 w-0"
            style={{
              left: `${stage.x}%`,
              top: `${stage.y}%`,
              opacity: local,
              transition: "opacity 600ms ease-out",
            }}
          >
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--force)] shadow-[0_0_14px_var(--aura)]" />
            <div
              className={`absolute whitespace-nowrap rounded-lg border border-[var(--force)]/40 bg-[var(--galaxy)]/80 px-3 py-2 text-center shadow-[0_0_26px_-4px_var(--velox)] sm:px-5 sm:py-3 ${stage.card}`}
              style={{
                transform: `${stage.card.includes("-translate-x-1/2") ? "translateX(-50%) " : ""}${stage.card.includes("-translate-y-1/2") ? "translateY(-50%) " : ""}scale(${0.85 + local * 0.15})`,
                transition: "transform 600ms ease-out",
              }}
            >
              <span className="text-[clamp(0.7rem,2vw,1.1rem)] font-semibold uppercase tracking-[0.12em] text-[var(--ice)]">
                {stage.label}
              </span>

            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes pulse-halo {
          0%, 100% {
            transform: scale(1);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.45;
          }
        }
      `}</style>
    </div>
  );
}
