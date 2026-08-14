import { useEffect, useRef, useState } from "react";
import enlace from "@/assets/cencor-enlace.png.asset.json";
import biva from "@/assets/cencor-biva.png.asset.json";
import mei from "@/assets/cencor-mei.png.asset.json";
import pip from "@/assets/cencor-pip.png.asset.json";

const units = [
  { name: "Enlace", src: enlace.url },
  { name: "BIVA", src: biva.url },
  { name: "MEI", src: mei.url },
  { name: "PiP", src: pip.url },
];

export function CencorUnits() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e && e.isIntersecting && e.intersectionRatio > 0.2 && setOn(true),
      { threshold: [0, 0.2, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-label="Unidades de Grupo Cencor"
      className="pointer-events-none absolute bottom-10 left-6 z-10 max-w-[52rem] md:left-16 lg:left-24"
    >
      <p
        className={`text-[9px] uppercase tracking-[0.34em] text-foreground/40 transition-all duration-700 ${
          on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        Grupo Cencor
      </p>
      <ul className="mt-5 flex flex-wrap items-center gap-x-14 gap-y-6">
        {units.map((u, i) => (
          <li
            key={u.name}
            className="transition-all duration-[900ms] ease-out"
            style={{
              transitionDelay: `${300 + i * 180}ms`,
              opacity: on ? 0.45 : 0,
              transform: on ? "translateY(0)" : "translateY(6px)",
            }}
          >
            <img
              src={u.src}
              alt={`Logo de ${u.name}`}
              loading="lazy"
              className="h-11 w-auto object-contain grayscale md:h-14"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
