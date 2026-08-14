import { useEffect, useRef, useState, type MutableRefObject } from "react";

export type ScrollProgress = {
  /** 0..1 sobre el largo total de la página (ref, sin re-render). */
  progress: MutableRefObject<number>;
  /** Índice de sección fraccional: scrollY / altura de viewport. */
  section: MutableRefObject<number>;
  /** Copia de `progress` en estado, para UI (barra, dots). */
  value: number;
};

export function useScrollProgress(): ScrollProgress {
  const progress = useRef(0);
  const section = useRef(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    let bounds: { top: number; height: number }[] = [];

    const measure = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(".pitch-section"));
      bounds = els.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, height: Math.max(1, r.height) };
      });
    };

    /** Índice de sección fraccional, medido sobre el DOM real (alturas variables). */
    const sectionIndex = (y: number) => {
      if (!bounds.length) return 0;
      const probe = y + window.innerHeight * 0.35;
      for (let i = 0; i < bounds.length; i++) {
        const b = bounds[i]!;
        if (probe < b.top) return i === 0 ? 0 : i;
        if (probe < b.top + b.height) return i + (probe - b.top) / b.height;
      }
      return bounds.length - 1 + 0.999;
    };

    const read = () => {
      const vh = window.innerHeight;
      const max = document.body.scrollHeight - vh;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.current = p;
      section.current = sectionIndex(window.scrollY);
      // perf: sólo re-renderizamos la UI cuando el progreso cambia de forma
      // perceptible (~0.5%). Evita cientos de renders del árbol por scroll.
      setValue((prev) => (Math.abs(prev - p) > 0.005 || p === 0 || p === 1 ? p : prev));
    };
    const onResize = () => {
      measure();
      read();
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    measure();
    read();
    // Las secciones se montan/animan tras el primer render: re-medimos poco después.
    const t1 = window.setTimeout(onResize, 300);
    const t2 = window.setTimeout(onResize, 1500);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };

  }, []);

  return { progress, section, value };
}
