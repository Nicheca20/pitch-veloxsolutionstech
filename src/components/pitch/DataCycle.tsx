import { useEffect, useRef, useState } from "react";

const STAGES = [
  { label: "Descubrir", pos: "left-1/2 top-2 -translate-x-1/2", dot: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" },
  { label: "Definir", pos: "right-2 top-1/2 translate-x-1/2 -translate-y-1/2", dot: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" },
  { label: "Diseñar", pos: "left-1/2 bottom-2 -translate-x-1/2 translate-y-1/2", dot: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" },
  { label: "Entregar", pos: "left-2 top-1/2 -translate-x-1/2 -translate-y-1/2", dot: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2" },
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
      className="relative mx-auto aspect-square w-full max-w-[640px] select-none"
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

        {/* Ciclo exterior: rombo que toca los bordes del viewBox */}
        <path
          ref={pathRef}
          d="M200 16 L384 200 L200 384 L16 200 Z"
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
            [200, 16, 200, 200],
            [384, 200, 200, 200],
            [200, 384, 200, 200],
            [16, 200, 200, 200],
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
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        style={{
          opacity: 0.25 + progress * 0.75,
          transition: "opacity 700ms ease-out",
        }}
      >
        <div className="relative flex h-[clamp(6.5rem,22vw,10rem)] w-[clamp(6.5rem,22vw,10rem)] items-center justify-center rounded-full border border-[var(--force)]/40 bg-[var(--galaxy)]/60 p-4 text-center shadow-[0_0_50px_-10px_var(--velox)] backdrop-blur-sm">
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
            className={`absolute z-20 ${stage.pos}`}
            style={{
              opacity: local,
              transform: `translate(${stage.pos.includes("-translate-x-1/2") ? "-50%" : stage.pos.includes("translate-x-1/2") ? "50%" : "0"}, ${stage.pos.includes("-translate-y-1/2") ? "-50%" : stage.pos.includes("translate-y-1/2") ? "50%" : "0"}) scale(${0.85 + local * 0.15})`,
              transition: "opacity 600ms ease-out, transform 600ms ease-out",
            }}
          >
            <div className="relative rounded-lg border border-[var(--force)]/40 bg-[var(--galaxy)]/80 px-5 py-3 text-center shadow-[0_0_26px_-4px_var(--velox)] backdrop-blur-md">
              <span className="text-[clamp(0.85rem,2vw,1.1rem)] font-semibold uppercase tracking-[0.12em] text-[var(--ice)]">
                {stage.label}
              </span>
              <span
                className={`absolute h-2.5 w-2.5 rounded-full bg-[var(--force)] shadow-[0_0_14px_var(--aura)] ${stage.dot}`}
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
