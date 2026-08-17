import { useEffect, useRef, useState } from "react";

const ITEMS = [
  {
    tag: "Pharma",
    title: "Operaciones Comerciales con IA",
    body: "IA para acelerar discovery, pricing y flujos de ventas en Sales Cloud y Revenue Cloud. 60%+ menos esfuerzo en análisis funcional.",
  },
  {
    tag: "Manufactura",
    title: "Integración ERP + Salesforce",
    body: "Discovery y arquitectura de integración ERP-Salesforce asistidos por IA. Fase de análisis drásticamente reducida.",
  },
  {
    tag: "Distribución",
    title: "Gestión Inteligente de Órdenes",
    body: "IA para descomponer procesos complejos en backlogs listos para sprint. Entregas iterativas aceleradas.",
  },
  {
    tag: "Medios",
    title: "Operaciones de Publicidad",
    body: "Campañas digitales, Work Orders, facturación y post-venta sobre Media Cloud. Planificación end-to-end con IA.",
  },
  {
    tag: "Gobernanza",
    title: "Gobernanza y Seguridad Salesforce",
    body: "Análisis de perfiles, permisos, validaciones y metadata con IA. Documentación de gobernanza lista para stakeholders.",
  },
  {
    tag: "Agentforce",
    title: "Asistentes IA Operativos",
    body: "Asistentes enterprise para pricing, aprobaciones, inventario, órdenes y navegación de workflows — todo dentro de Salesforce.",
  },
];

const STEP = 360 / ITEMS.length;

export function CapabilityWheel({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e?.isIntersecting && setVisible(true),
      { threshold: 0, rootMargin: "30% 0px 30% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Avance automático mientras el bloque está en pantalla
  useEffect(() => {
    if (!visible) return;
    const iv = window.setInterval(() => setActive((a) => a + 1), 2600);
    return () => window.clearInterval(iv);
  }, [visible]);

  return (
    <div ref={ref} className="w-full">
      <div
        className={`relative mx-auto w-full overflow-hidden ${
          compact ? "h-[16rem] sm:h-[14rem]" : "h-[26rem] sm:h-[22rem]"
        }`}
        style={{ perspective: "1400px" }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-0 w-0 transition-transform duration-[900ms] ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate(-50%,-50%) rotateY(${-active * STEP}deg)`,
          }}
        >
          {ITEMS.map((it, i) => {
            const rel = ((i - active) % ITEMS.length + ITEMS.length) % ITEMS.length;
            const dist = Math.min(rel, ITEMS.length - rel);
            const front = dist === 0;
            return (
              <article
                key={it.title}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border text-left transition-all duration-[900ms] ease-out ${
                  compact
                    ? "w-[min(78vw,18rem)] p-3 sm:p-4"
                    : "w-[min(84vw,26rem)] p-5 sm:p-6"
                }`}
                style={{
                  transform: `rotateY(${i * STEP}deg) translateZ(${
                    compact ? "min(28vw,12rem)" : "min(50vw,23rem)"
                  })`,

                  opacity: front ? 1 : Math.max(0.12, 0.5 - dist * 0.14),
                  borderColor: front
                    ? "color-mix(in oklab, var(--force) 70%, transparent)"
                    : "rgba(255,255,255,0.08)",
                  background: front
                    ? "color-mix(in oklab, var(--velox) 16%, transparent)"
                    : "rgba(255,255,255,0.03)",
                  boxShadow: front
                    ? "0 0 60px -18px color-mix(in oklab, var(--force) 80%, transparent)"
                    : "none",
                }}
                aria-hidden={!front}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`uppercase tracking-[0.24em] text-foreground/55 ${
                      compact ? "text-[10px]" : "text-[11px]"
                    }`}
                  >
                    {it.tag}
                  </span>
                </div>
                <h3
                  className={`font-semibold leading-tight ${
                    compact ? "mt-2 text-base" : "mt-3 text-xl"
                  }`}
                >
                  {it.title}
                </h3>
                <p
                  className={`leading-relaxed text-foreground/70 ${
                    compact ? "mt-2 text-[11px] line-clamp-3" : "mt-3 text-sm"
                  }`}
                >
                  {it.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>

      <div className={`flex justify-center gap-2 ${compact ? "mt-3" : "mt-6"}`}>
        {ITEMS.map((it, i) => {
          const on = ((active % ITEMS.length) + ITEMS.length) % ITEMS.length === i;
          return (
            <button
              key={it.title}
              type="button"
              aria-label={it.title}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-500 ${
                compact ? "h-1" : "h-1.5"
              } ${
                on
                  ? `bg-[var(--force)] ${compact ? "w-6" : "w-8"}`
                  : `bg-foreground/25 hover:bg-foreground/50 ${compact ? "w-1" : "w-1.5"}`
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
