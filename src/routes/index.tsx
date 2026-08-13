import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { brand, sections } from "@/content";
import { Section } from "@/components/pitch/Section";
import { NavDots } from "@/components/pitch/NavDots";
import { ProgressBar } from "@/components/pitch/ProgressBar";
import { Preloader } from "@/components/pitch/Preloader";

const Scene = lazy(() => import("@/components/pitch/Scene").then((m) => ({ default: m.Scene })));

const TITLE = "Velox Solutions — Agentes que construyen agentes";
const DESCRIPTION =
  "Pitch interactivo de Velox Solutions: partner AI-first de Agentforce en LATAM. Veleiro, tres casos y una oferta Partner Connect.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pitch,
});

function Pitch() {
  const progress = useRef(0);
  const [barProgress, setBarProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [use3D, setUse3D] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [quality, setQuality] = useState(1);
  const [loading, setLoading] = useState(100);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduce);
    // Fallback móvil: por debajo de 768px no intentamos WebGL completo
    setUse3D(window.innerWidth >= 768);
    if (!reduce) document.documentElement.style.scrollBehavior = "smooth";

    let v = 0;
    const iv = setInterval(() => {
      v = Math.min(100, v + 12 + Math.random() * 18);
      setLoading(v);
      if (v >= 100) {
        clearInterval(iv);
        setTimeout(() => setReady(true), 350);
      }
    }, 110);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.body.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        progress.current = p;
        setBarProgress(p);
        setActive(Math.min(sections.length - 1, Math.round(p * (sections.length - 1))));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = useCallback((i: number) => {
    const el = document.getElementById(sections[Math.max(0, Math.min(sections.length - 1, i))]!.id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goTo(active + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(active - 1);
      } else if (e.key === "Escape") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo]);

  return (
    <div className="relative bg-background text-foreground">
      <Preloader progress={loading} done={ready} />
      <ProgressBar progress={barProgress} />

      {/* Canvas fijo detrás del contenido; nunca bloquea la selección de texto */}
      <div id="pitch-canvas" className="pointer-events-none fixed inset-0 z-0 print:hidden">
        {mounted && use3D ? (
          <Suspense fallback={null}>
            <Scene progress={progress} quality={quality} reduced={reduced} onLowPerf={() => setQuality(0.5)} />
          </Suspense>
        ) : (
          <div className="h-full w-full animate-pulse bg-[radial-gradient(60%_60%_at_30%_35%,var(--velox)_0%,transparent_60%),radial-gradient(50%_50%_at_75%_70%,var(--force)_0%,transparent_65%)] opacity-40" />
        )}
      </div>

      <main className="relative z-10">
        <h1 className="sr-only">
          {brand.name} — {brand.tagline}
        </h1>
        {sections.map((s, i) => (
          <Section key={s.id} data={s} first={i === 0} />
        ))}

        <footer className="relative z-10 px-6 pb-24 md:px-16 lg:px-24">
          <div className="text-veil relative grid gap-6 sm:grid-cols-2">
            {brand.contacts.map((c) => (
              <a
                key={c.email}
                href={`mailto:${c.email}`}
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-[var(--force)]"
              >
                <div className="text-lg font-semibold">{c.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-foreground/50">{c.role}</div>
                <div className="mt-4 text-sm text-[var(--aura)] group-hover:underline">{c.email}</div>
              </a>
            ))}
          </div>
          <p className="mt-10 text-[10px] uppercase tracking-[0.3em] text-foreground/35">
            {brand.name} · {brand.tagline}
          </p>
        </footer>
      </main>

      <NavDots count={sections.length} active={active} onSelect={goTo} labels={sections.map((s) => s.kicker)} />

      <div
        className={`fixed inset-x-0 bottom-8 z-20 flex justify-center text-[10px] uppercase tracking-[0.3em] text-foreground/45 transition-opacity duration-500 print:hidden ${
          barProgress > 0.01 ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="animate-bounce">Scroll ↓</span>
      </div>
    </div>
  );
}
