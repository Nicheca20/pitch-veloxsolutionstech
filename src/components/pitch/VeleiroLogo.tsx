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
      ([e]) => e && e.isIntersecting && setOn(true),
      { threshold: 0, rootMargin: "30% 0px 30% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-8">
      <img
        src={veleiro.url}
        alt="Veleiro AI"
        className="h-20 w-auto object-contain transition-all duration-1000 ease-out md:h-28 lg:h-32"
        style={{
          opacity: on ? 1 : 0,
          transform: on ? "scale(1)" : "scale(0.94)",
          filter: "drop-shadow(0 0 28px rgba(127,119,221,0.45))",
        }}
      />
    </div>
  );
}
