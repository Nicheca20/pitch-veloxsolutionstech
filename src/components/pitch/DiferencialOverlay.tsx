import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";

export function DiferencialOverlay({ section }: { section: MutableRefObject<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tick = () => {
      const s = section.current;
      const fadeInStart = 5.60;
      const fadeInEnd = 5.68;
      const fadeOutStart = 5.88;
      const fadeOutEnd = 5.97;

      let v = 0;
      if (s >= fadeInStart && s < fadeInEnd) {
        v = (s - fadeInStart) / (fadeInEnd - fadeInStart);
      } else if (s >= fadeInEnd && s < fadeOutStart) {
        v = 1;
      } else if (s >= fadeOutStart && s < fadeOutEnd) {
        v = 1 - (s - fadeOutStart) / (fadeOutEnd - fadeOutStart);
      }

      const smooth = v * v * (3 - 2 * v);
      el.style.opacity = String(smooth);
      el.style.transform = `translateY(${(1 - smooth) * 24}px)`;
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [section]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center px-6 opacity-0 print:hidden"
      aria-hidden="true"
    >
      <div className="text-veil max-w-4xl text-center">
        <p className="text-[clamp(1.1rem,2.2vw,1.65rem)] font-medium leading-relaxed text-foreground">
          Nuestros agentes detectan upsell con las soluciones implementadas/producción, eso hace que
          constantemente detectemos oportunidades de consumo de créditos de AgentForce/IA.
        </p>
        <p className="mt-6 text-[clamp(1.1rem,2.2vw,1.65rem)] font-medium leading-relaxed text-foreground">
          Replicamos nuestros agentes en diferentes industrias, generando una capa base con la que
          avanzamos rápidamente en semanas.
        </p>
      </div>
    </div>
  );
}
