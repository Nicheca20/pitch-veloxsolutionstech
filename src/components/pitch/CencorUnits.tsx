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
      className="pointer-events-none absolute bottom-8 left-4 z-10 md:bottom-12 md:left-16 lg:left-24"
    >
      <p
        className={`text-[10px] uppercase tracking-[0.34em] text-foreground/60 transition-all duration-700 ${
          on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        Grupo Cencor
      </p>
      <ul className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-5 md:gap-x-16">
        {units.map((u, i) => (
          <li
            key={u.name}
            className="transition-all duration-[900ms] ease-out"
            style={{
              transitionDelay: `${300 + i * 180}ms`,
              opacity: on ? 1 : 0,
              transform: on ? "translateY(0)" : "translateY(8px)",
              filter: on
                ? "drop-shadow(0 0 14px rgba(10,8,32,0.7))"
                : "drop-shadow(0 0 14px rgba(10,8,32,0.7))",
            }}
          >
            <img
              src={u.src}
              alt={`Logo de ${u.name}`}
              loading="lazy"
              className="h-12 w-auto object-contain md:h-16"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
