import { useEffect, useRef, useState } from "react";

const PHASES = [
  {
    name: "Descubrir",
    tag: "DISCOVER",
    line: "Entender al cliente, su industria y sus procesos actuales.",
  },
  {
    name: "Definir",
    tag: "DEFINE",
    line: "Convertir los hallazgos en alcance, arquitectura y plan de proyecto.",
  },
  {
    name: "Diseñar",
    tag: "DESIGN",
    line: "Diseñar la estrategia comercial y de marketing sobre el CRM.",
  },
  {
    name: "Entregar",
    tag: "DELIVER",
    line: "Configurar, probar y poner la solución en producción.",
  },
];

export function PhaseCards() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.12, rootMargin: "10% 0px 10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PHASES.map((phase, i) => (
          <article
            key={phase.name}
            className={`rounded-[14px] border border-[var(--aura)]/16 bg-[rgba(38,33,92,.3)] p-4 transition-all duration-500 ease-out focus-within:ring-2 focus-within:ring-[var(--force)]/50 sm:p-5 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionDelay: visible ? `${i * 110}ms` : "0ms" }}
            tabIndex={0}
          >
            <div className="flex items-baseline gap-2">
              <h3 className="font-poppins text-[1.05rem] font-semibold leading-tight text-[var(--ice)] sm:text-[1.15rem]">
                {phase.name}
              </h3>
              <span className="font-poppins text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--aura)]">
                {phase.tag}
              </span>
            </div>
            <p className="mt-2 font-inter text-[0.85rem] leading-relaxed text-[#b9b4e6] sm:text-[0.9rem]">
              {phase.line}
            </p>
          </article>
        ))}
      </div>

      <p
        className={`mt-6 text-center text-[0.8rem] font-medium uppercase tracking-[0.18em] text-[var(--aura)] transition-all duration-600 ease-out sm:text-[0.85rem] ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
        style={{ transitionDelay: visible ? "520ms" : "0ms" }}
      >
        Nada se pierde entre fases: todo queda en el activo de datos único.
      </p>
    </div>
  );
}
