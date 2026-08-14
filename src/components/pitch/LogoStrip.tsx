import { useEffect, useRef, useState } from "react";
import salesforce from "@/assets/salesforce-cloud.png.asset.json";
import slack from "@/assets/slack.png.asset.json";
import github from "@/assets/github.png.asset.json";

type Logo = { name: string; src: string; className: string; caption?: string };

const logos: Logo[] = [
  { name: "Salesforce", src: salesforce.url, className: "h-20 md:h-28", caption: "Data Cloud 360" },
  { name: "Slack", src: slack.url, className: "h-16 md:h-22" },
  { name: "GitHub", src: github.url, className: "h-20 md:h-28" },
];


export function LogoStrip() {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e && e.isIntersecting && setOn(true),
      { threshold: 0.01, rootMargin: "0px 0px -5% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="ecosistema"
      aria-label="Construimos y trabajamos con el ecosistema"
      className="relative flex min-h-[46vh] flex-col items-center justify-center gap-12 px-6 py-16 md:px-16"
    >
      <p
        className={`text-veil text-[clamp(0.95rem,1.6vw,1.4rem)] font-semibold uppercase tracking-[0.28em] text-foreground/80 transition-all duration-700 ${
          on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        Construimos y trabajamos con el ecosistema
      </p>


      <ul className="flex flex-wrap items-center justify-center gap-x-16 gap-y-10 md:gap-x-24">
        {logos.map((l, i) => (
          <li
            key={l.name}
            className="flex flex-col items-center transition-all duration-[900ms] ease-out"
            style={{
              transitionDelay: `${120 + i * 90}ms`,
              opacity: on ? 1 : 0.5,
              filter: on
                ? "grayscale(0) brightness(1) drop-shadow(0 0 18px rgba(175,169,236,0.35))"
                : "grayscale(1) brightness(0.9)",
              transform: on ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <img
              src={l.src}
              alt={`Logo de ${l.name}`}
              loading="lazy"
              className={`w-auto object-contain ${l.className}`}
            />
            {l.caption && (
              <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70 md:text-[11px]">
                {l.caption}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
