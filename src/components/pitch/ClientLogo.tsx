import { useEffect, useRef, useState } from "react";

/** Logo de cliente, monocromático blanco y discreto, anclado en una esquina. */
export function ClientLogo({
  src,
  name,
  eyebrow,
  side = "left",
}: {
  src: string;
  name: string;
  eyebrow: string;
  side?: "left" | "right";
}) {
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
      aria-label={`Cliente ${name}`}
      className={`pointer-events-none absolute bottom-8 z-10 md:bottom-12 ${
        side === "left" ? "left-4 md:left-16 lg:left-24" : "right-4 md:right-16 lg:right-24"
      }`}
    >
      <p
        className={`text-[10px] uppercase tracking-[0.34em] text-foreground/60 transition-opacity duration-700 ${on ? "opacity-100" : "opacity-0"}`}
      >
        {eyebrow}
      </p>
      <img
        src={src}
        alt={`Logo de ${name}`}
        loading="lazy"
        className="mt-4 h-12 w-auto object-contain transition-opacity duration-[900ms] ease-out md:h-16"
        style={{
          opacity: on ? 0.75 : 0,
          transitionDelay: "260ms",
        }}
      />
    </div>
  );
}
