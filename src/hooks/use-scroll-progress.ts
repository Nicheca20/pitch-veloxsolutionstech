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

    let target = 0;
    let targetSection = 0;
    let idle = 0;
    let running = false;

    const sample = () => {
      const vh = window.innerHeight;
      const max = document.body.scrollHeight - vh;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      targetSection = sectionIndex(window.scrollY);
    };

    // Loop continuo con interpolación: el valor nunca "salta" de una posición a
    // otra, se desliza hacia el destino (misma sensación a 30 o 144 fps).
    let lastT = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const k = 1 - Math.exp(-dt * 12);
      const dp = target - progress.current;
      const ds = targetSection - section.current;
      progress.current += dp * k;
      section.current += ds * k;
      setValue((prev) =>
        Math.abs(prev - progress.current) > 0.001 ? progress.current : prev,
      );
      if (Math.abs(dp) < 0.0002 && Math.abs(ds) < 0.0005) {
        idle += dt;
      } else {
        idle = 0;
      }
      if (idle > 0.3) {
        progress.current = target;
        section.current = targetSection;
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      idle = 0;
      lastT = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const read = () => {
      sample();
      start();
    };
    const onResize = () => {
      measure();
      read();
    };

    const onScroll = () => {
      sample();
      start();
    };
    measure();
    sample();
    progress.current = target;
    section.current = targetSection;
    setValue(target);
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
