import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Lee el progreso desde un ref con su propio rAF: pinta a 60 fps sin provocar
 * re-renders de React en toda la página.
 */
export function ProgressBar({ progress }: { progress: MutableRefObject<number> }) {
  const bar = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = Math.min(1, Math.max(0, progress.current));
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <div className="fixed inset-x-0 top-0 z-30 h-[3px] bg-white/5 print:hidden">
      <div
        ref={bar}
        className="bg-velox-gradient h-full w-full origin-left"
        style={{ transform: "scaleX(0)", willChange: "transform" }}
      />
    </div>
  );
}
