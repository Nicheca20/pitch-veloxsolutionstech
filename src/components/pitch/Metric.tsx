import { useEffect, useRef, useState } from "react";

export function MetricValue({
  value,
  prefix = "",
  suffix = "",
  label,
  active,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  active: boolean;
}) {
  const [shown, setShown] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (!active || done.current) return;
    done.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);

  return (
    <div className="min-w-[9rem]">
      <div className="bg-velox-gradient bg-clip-text text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-none tracking-tighter text-transparent">
        {prefix}
        {shown}
        {suffix}
      </div>
      <div className="mt-2 max-w-[16ch] text-[10px] uppercase leading-relaxed tracking-[0.22em] text-foreground/55">
        {label}
      </div>
    </div>
  );
}
