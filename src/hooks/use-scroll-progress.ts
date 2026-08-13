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
    const read = () => {
      const vh = window.innerHeight;
      const max = document.body.scrollHeight - vh;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.current = p;
      section.current = vh > 0 ? window.scrollY / vh : 0;
      setValue(p);
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

  return { progress, section, value };
}
