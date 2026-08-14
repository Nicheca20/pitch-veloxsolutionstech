import { useEffect, useRef, useState } from "react";

const STAGES = [
  { label: "Descubrir", side: "top" as const },
  { label: "Definir", side: "right" as const },
  { label: "Diseñar", side: "bottom" as const },
  { label: "Entregar", side: "left" as const },
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
      // El diagrama empieza a animarse cuando su centro superior entra a ~65% de viewport
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
  const radialProgress = Math.min(1, Math.max(0, (progress - 0.25) * 1.7));
  const nodeProgress = Math.min(1, Math.max(0, (progress - 0.45) * 2));

  const cycleOffset = pathLen * (1 - cycleProgress);
  const radialOpacity = radialProgress;

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-square w-full max-w-[520px] select-none overflow-visible"
      aria-label="Ciclo de trabajo: Activo de datos único conecta Descubrir, Definir, Diseñar y Entregar"
    >
      {/* SVG: ciclo exterior + radiales */}
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
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

        {/* Ciclo exterior: rombo más compacto para dejar espacio a los labels */}
        <path
          ref={pathRef}
          d="M200 124 L276 200 L200 276 L124 200 Z"
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
        <g opacity={radialOpacity}>
          {[
            [200, 124, 200, 200],
            [276, 200, 200, 200],
            [200, 276, 200, 200],
            [124, 200, 200, 200],
          ].map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#data-cycle-gradient)"
              strokeWidth="1"
              opacity={0.45}
              filter="url(#data-cycle-glow)"
            />
          ))}
        </g>
      </svg>

      {/* Nodo central */}
      <div
        className="absolute left-1/2 top-1/2 z-20 flex h-[clamp(7.5rem,26vw,11rem)] w-[clamp(7.5rem,26vw,11rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--force)]/40 bg-[var(--galaxy)]/35 p-4 text-center shadow-[0_0_40px_-8px_var(--velox)] backdrop-blur-sm transition-opacity duration-700"
        style={{ opacity: 0.25 + progress * 0.75 }}
      >
        <span className="text-[clamp(0.65rem,1.6vw,0.85rem)] font-bold uppercase leading-tight tracking-[0.12em] text-[var(--ice)]">
          Activo de datos único
        </span>
        {/* Halo sutil */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full border border-[var(--force)]/20"
          style={{
            animation: progress > 0.5 ? "pulse-halo 3s ease-in-out infinite" : "none",
          }}
        />
      </div>

      {/* Nodos periféricos */}
      {STAGES.map((stage, i) => {
        const delay = i * 0.12;
        const local = Math.min(1, Math.max(0, (nodeProgress - delay) / (1 - delay * 0.5)));
        const baseClasses: Record<string, string> = {
          top: "left-1/2 top-[clamp(2rem,10%,3.25rem)] -translate-x-1/2 -translate-y-1/2",
          right: "right-[clamp(2rem,10%,3.25rem)] top-1/2 translate-x-1/2 -translate-y-1/2",
          bottom: "left-1/2 bottom-[clamp(2rem,10%,3.25rem)] -translate-x-1/2 translate-y-1/2",
          left: "left-[clamp(2rem,10%,3.25rem)] top-1/2 -translate-x-1/2 -translate-y-1/2",
        };
        const dotClasses: Record<string, string> = {
          top: "-bottom-1.5 left-1/2 -translate-x-1/2",
          right: "-left-1.5 top-1/2 -translate-y-1/2",
          bottom: "-top-1.5 left-1/2 -translate-x-1/2",
          left: "-right-1.5 top-1/2 -translate-y-1/2",
        };

        return (
          <div
            key={stage.label}
            className={`absolute z-20 flex flex-col items-center ${baseClasses[stage.side]}`}
            style={{
              opacity: local,
              transform: `translate(${stage.side === "left" || stage.side === "right" ? (stage.side === "left" ? "-" : "") + "50%" : "-50%"}, ${stage.side === "top" || stage.side === "bottom" ? (stage.side === "top" ? "-" : "") + "50%" : "-50%"}) scale(${0.85 + local * 0.15})`,
              transition: "opacity 600ms ease-out, transform 600ms ease-out",
            }}
          >
            <div className="relative rounded-lg border border-[var(--force)]/25 bg-[color-mix(in_oklab,var(--galaxy)_82%,black)] px-5 py-2.5 text-center shadow-[0_0_22px_-6px_var(--velox)] backdrop-blur-sm">
              <span className="text-[clamp(0.7rem,1.6vw,0.85rem)] font-semibold uppercase tracking-[0.16em] text-[var(--ice)]">
                {stage.label}
              </span>
              {/* Punto luminoso */}
              <span
                className={`absolute h-2 w-2 rounded-full bg-[var(--force)] shadow-[0_0_12px_var(--aura)] ${dotClasses[stage.side]}`}
              />
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
