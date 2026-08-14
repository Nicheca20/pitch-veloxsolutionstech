import { useEffect, useRef, useState } from "react";

type Logo = { name: string; color: string; svg: React.ReactNode; wordmark?: boolean };

const logos: Logo[] = [
  {
    name: "Salesforce",
    color: "#00A1E0",
    svg: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full">
        <path
          fill="currentColor"
          d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.176 5.22c-.345 0-.69-.044-1.02-.104a3.75 3.75 0 01-3.3 1.95c-.6 0-1.155-.15-1.65-.375A4.314 4.314 0 018.88 20.4a4.302 4.302 0 01-4.05-2.82c-.27.062-.54.076-.825.076-2.204 0-4.005-1.8-4.005-4.05 0-1.5.811-2.805 2.01-3.51-.255-.57-.39-1.2-.39-1.846 0-2.58 2.1-4.65 4.65-4.65 1.53 0 2.85.705 3.72 1.8"
        />
      </svg>
    ),
  },
  {
    name: "Agentforce",
    color: "#0D9DDA",
    wordmark: true,
    svg: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full">
        <path
          fill="currentColor"
          d="M12 1.6l2.7 4.9 5.5 1-3.8 4.1.7 5.5-5.1-2.4-5.1 2.4.7-5.5L3.8 7.5l5.5-1L12 1.6zm0 14.3c2.6 0 4.7 1.4 5.6 3.4.2.5-.1 1-.7 1H7.1c-.6 0-.9-.5-.7-1 .9-2 3-3.4 5.6-3.4z"
        />
      </svg>
    ),
  },
  {
    name: "Slack",
    color: "#E01E5A",
    svg: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full">
        <path
          fill="currentColor"
          d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
        />
      </svg>
    ),
  },
  {
    name: "GitHub",
    color: "#EEEDFE",
    svg: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-full w-full">
        <path
          fill="currentColor"
          d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        />
      </svg>
    ),
  },
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
      aria-label="Construido con el ecosistema"
      className="relative flex min-h-[46vh] flex-col items-center justify-center gap-10 px-6 py-16 md:px-16"
    >
      <p
        className={`text-veil text-[11px] uppercase tracking-[0.34em] text-foreground/55 transition-all duration-700 ${
          on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        Construido con el ecosistema
      </p>

      <ul className="flex flex-wrap items-center justify-center gap-x-14 gap-y-10 md:gap-x-24">
        {logos.map((l, i) => (
          <li
            key={l.name}
            className="flex items-center gap-3 transition-all duration-[900ms] ease-out"
            style={{
              transitionDelay: `${250 + i * 260}ms`,
              opacity: on ? 1 : 0.5,
              filter: on ? "grayscale(0) brightness(1)" : "grayscale(1) brightness(0.8)",
              color: on ? l.color : "var(--ice, #EEEDFE)",
              transform: on ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <span
              className="h-9 w-9 md:h-11 md:w-11"
              style={{ filter: on ? `drop-shadow(0 0 14px ${l.color}66)` : "none" }}
            >
              {l.svg}
            </span>
            <span
              className="text-base font-semibold tracking-tight text-foreground/85 md:text-lg"
              style={{ opacity: on ? 1 : 0.6 }}
            >
              {l.name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
