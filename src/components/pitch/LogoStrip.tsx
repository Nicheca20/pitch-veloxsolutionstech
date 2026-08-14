import { useEffect, useRef, useState } from "react";
import salesforce from "@/assets/salesforce.png.asset.json";
import agentforce from "@/assets/agentforce.png.asset.json";
import slack from "@/assets/slack.png.asset.json";
import github from "@/assets/github.png.asset.json";

type Logo = { name: string; src: string; className: string };

const logos: Logo[] = [
  { name: "Salesforce", src: salesforce.url, className: "h-12 md:h-16" },
  { name: "Agentforce", src: agentforce.url, className: "h-8 md:h-11" },
  { name: "Slack", src: slack.url, className: "h-9 md:h-12" },
  { name: "GitHub", src: github.url, className: "h-12 md:h-16" },
];

export function LogoStrip() {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e && e.isIntersecting && e.intersectionRatio > 0.3 && setOn(true),
      { threshold: [0, 0.3, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="ecosistema"
      aria-label="Construimos y trabajamos con el ecosistema"
      className="relative flex h-screen min-h-[560px] flex-col items-center justify-center gap-12 px-6 py-16 md:px-16"
    >
      <p
        className={`text-veil text-[11px] uppercase tracking-[0.34em] text-foreground/55 transition-opacity duration-700 ${on ? "opacity-100" : "opacity-0"}`}
      >
        Construimos y trabajamos con el ecosistema
      </p>

      <ul className="flex flex-wrap items-center justify-center gap-x-16 gap-y-10 md:gap-x-24">
        {logos.map((l, i) => (
          <li
            key={l.name}
            className="flex items-center transition-all duration-[900ms] ease-out"
            style={{
              transitionDelay: `${250 + i * 260}ms`,
              opacity: on ? 1 : 0.5,
              filter: on
                ? "grayscale(0) brightness(1) drop-shadow(0 0 18px rgba(175,169,236,0.35))"
                : "grayscale(1) brightness(0.9)",
            }}
          >
            <img
              src={l.src}
              alt={`Logo de ${l.name}`}
              loading="lazy"
              className={`w-auto object-contain ${l.className}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
