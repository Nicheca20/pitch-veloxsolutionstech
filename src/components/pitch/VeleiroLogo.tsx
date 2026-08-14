import { useEffect, useRef, useState } from "react";
import veleiro from "@/assets/veleiro.png.asset.json";

/** Logo Veleiro AI, grande y protagónico, bajo el título de la sección solución. */
export function VeleiroLogo() {
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
    <div ref={ref} className="mt-8">
      <img
        src={veleiro.url}
        alt="Veleiro AI"
        className="h-20 w-auto object-contain transition-opacity duration-1000 ease-out md:h-28 lg:h-32"
        style={{
          opacity: on ? 1 : 0,
          filter: "drop-shadow(0 0 28px rgba(127,119,221,0.45))",
        }}
      />
    </div>
  );
}
