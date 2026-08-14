import { useEffect, useRef, useState } from "react";
import veleiro from "@/assets/veleiro.png.asset.json";
import agentforce from "@/assets/agentforce-logo.png.asset.json";

/** Logo Veleiro AI junto al logo de AgentForce, bajo el título de la sección solución. */
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
      <div
        className="flex items-center justify-center gap-4 md:gap-6"
        style={{
          opacity: on ? 1 : 0,
          transform: on ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 700ms ease-out, transform 700ms ease-out",
        }}
      >
        <img
          src={veleiro.url}
          alt="Veleiro AI"
          className="h-10 w-auto object-contain md:h-12 lg:h-14"
          style={{
            filter: "drop-shadow(0 0 20px rgba(127,119,221,0.4))",
          }}
        />
        <img
          src={agentforce.url}
          alt="AgentForce"
          className="h-10 w-auto object-contain md:h-12 lg:h-14"
          style={{
            filter: "drop-shadow(0 0 20px rgba(83,74,183,0.4))",
          }}
        />
      </div>
    </div>
  );
}
