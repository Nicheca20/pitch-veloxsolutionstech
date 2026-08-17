import { useEffect, useRef, useState } from "react";

export const POCWorkflow = () => {
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
      { threshold: 0.08, rootMargin: "10% 0px 10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full">
      <p
        className={`mb-6 text-center text-[11px] font-medium uppercase tracking-[0.24em] text-foreground/55 transition-all duration-500 sm:text-xs ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        Lo que verás al escanear · 11 flujos reales, de descubrir a entregar
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card, i) => (
          <article
            key={card.phase}
            className={`rounded-[14px] border border-[var(--aura)]/16 bg-[rgba(38,33,92,.3)] p-4 transition-all duration-500 ease-out focus-within:ring-2 focus-within:ring-[var(--force)]/50 sm:p-5 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionDelay: visible ? `${i * 110}ms` : "0ms" }}
            tabIndex={0}
          >
            <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--aura)]/12 pb-2">
              <h3 className="font-poppins text-[1.05rem] font-semibold leading-tight text-[var(--ice)] sm:text-[1.15rem]">
                {card.phase}
              </h3>
              <span className="font-poppins text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--aura)]">
                {card.tag}
              </span>
            </div>

            <ul className="flex flex-col gap-2.5">
              {card.items.map((item) => (
                <li key={item.num} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-[var(--velox)] text-[10px] font-bold text-white">
                    {item.num}
                  </span>
                  <div className="flex flex-1 items-start justify-between gap-2">
                    <span className="font-inter text-[0.82rem] leading-snug text-[#eeedfe] sm:text-[0.88rem]">
                      {item.label}
                    </span>
                    <span className="flex-shrink-0 pt-0.5 text-right text-[10px] font-medium uppercase tracking-wider text-[var(--aura)] sm:text-[11px]">
                      {item.duration}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
};

const CARDS = [
  {
    phase: "Descubrir",
    tag: "DISCOVER",
    items: [
      { num: 1, label: "Investigación de cliente e industria", duration: "1-2 días" },
      { num: 2, label: "Preparación del discovery", duration: "1 día" },
      { num: 3, label: "Workshops de discovery por cloud", duration: "1-2 sem" },
    ],
  },
  {
    phase: "Definir",
    tag: "DEFINE",
    items: [
      { num: 4, label: "Constructor de demos", duration: "3-5 días" },
      { num: 5, label: "Alcance, arquitectura y planificación", duration: "1-2 sem" },
    ],
  },
  {
    phase: "Diseñar",
    tag: "DESIGN",
    items: [
      { num: 6, label: "Estrategia de segmentación", duration: "1 sem" },
      { num: 7, label: "Mapeo de journeys de marketing", duration: "1 sem" },
    ],
  },
  {
    phase: "Entregar",
    tag: "DELIVER",
    items: [
      { num: 8, label: "Entrega de Sales Cloud", duration: "4-8 sem" },
      { num: 9, label: "Procesos de servicio", duration: "4-8 sem" },
      { num: 10, label: "Procesos de marketing", duration: "4-8 sem" },
      { num: 11, label: "Agente de servicio Agentforce", duration: "3-6 sem" },
    ],
  },
];
