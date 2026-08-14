import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { brand, sections } from "@/content";
import { Section } from "@/components/pitch/Section";
import { NavDots } from "@/components/pitch/NavDots";
import { LogoStrip } from "@/components/pitch/LogoStrip";
import { SolutionTimeline } from "@/components/pitch/SolutionTimeline";
import { ProblemFlow } from "@/components/pitch/ProblemFlow";
import { ConsequenceFlow } from "@/components/pitch/ConsequenceFlow";
import { DataCycle } from "@/components/pitch/DataCycle";
import { CencorUnits } from "@/components/pitch/CencorUnits";
import { ClientLogo } from "@/components/pitch/ClientLogo";
import { VeleiroLogo } from "@/components/pitch/VeleiroLogo";
import { GrowthEngine } from "@/components/pitch/GrowthEngine";
import { CronistaFronts } from "@/components/pitch/CronistaFronts";
import { CapabilityWheel } from "@/components/pitch/CapabilityWheel";
import { AdiumAssistants } from "@/components/pitch/AdiumAssistants";

import VeloxBackground from "@/components/pitch/VeloxBackground";

import cronista from "@/assets/cronista.png.asset.json";
import adium from "@/assets/adium.png.asset.json";
import veloxLogo from "@/assets/velox-logo.png.asset.json";
import qr from "@/assets/qr-diagnostico.png.asset.json";


import { ProgressBar } from "@/components/pitch/ProgressBar";
import { Preloader } from "@/components/pitch/Preloader";
import { useScrollProgress } from "@/hooks/use-scroll-progress";

const Background3D = lazy(() =>
  import("@/components/pitch/Background3D").then((m) => ({ default: m.Background3D })),
);

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
  const { section, progress } = useScrollProgress();
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [use3D, setUse3D] = useState(false);
  const [loading, setLoading] = useState(100);
  const [ready, setReady] = useState(false);
  const tween = useRef<number | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = reduce;
    // Fallback móvil: por debajo de 768px no intentamos WebGL completo
    setUse3D(window.innerWidth >= 768);
    // El scroll animado lo controlamos nosotros (rAF + easing)
    document.documentElement.style.scrollBehavior = "auto";

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

  // El índice activo y el hint de scroll se leen desde el ref en un rAF propio:
  // así el scroll no re-renderiza toda la página cuadro a cuadro.
  const hintRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let raf = 0;
    let lastIdx = -1;
    let lastHint = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = progress.current;
      const idx = Math.min(sections.length - 1, Math.round(p * (sections.length - 1)));
      if (idx !== lastIdx) {
        lastIdx = idx;
        setActive(idx);
      }
      const hint = p > 0.01 ? 0 : 1;
      if (hint !== lastHint) {
        lastHint = hint;
        if (hintRef.current) hintRef.current.style.opacity = String(hint);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  /** Scroll animado con easing (~1.2s), cancelable por el scroll del mouse. */
  const smoothScrollTo = useCallback((to: number) => {
    if (tween.current !== null) cancelAnimationFrame(tween.current);
    const from = window.scrollY;
    const max = document.body.scrollHeight - window.innerHeight;
    const target = Math.max(0, Math.min(max, to));
    const delta = target - from;
    if (Math.abs(delta) < 1) return;
    if (reducedRef.current) {
      window.scrollTo(0, target);
      return;
    }
    const duration = 1200;
    const start = performance.now();
    // easeInOutCubic
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + delta * ease(p));
      if (p < 1) tween.current = requestAnimationFrame(step);
      else tween.current = null;
    };
    tween.current = requestAnimationFrame(step);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(sections.length - 1, i));
      const el = document.getElementById(sections[idx]!.id);
      if (!el) return;
      smoothScrollTo(el.getBoundingClientRect().top + window.scrollY);
    },
    [smoothScrollTo],
  );

  // Si el usuario usa la rueda/gesto del mouse, cancelamos el tween en curso
  useEffect(() => {
    const cancel = () => {
      if (tween.current !== null) {
        cancelAnimationFrame(tween.current);
        tween.current = null;
      }
    };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    return () => {
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
    };
  }, []);

  useEffect(() => {
    const NEXT = ["ArrowRight", "ArrowDown", "PageDown", " ", "Spacebar", "Enter"];
    const PREV = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace"];
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (NEXT.includes(e.key)) {
        e.preventDefault();
        goTo(active + 1);
      } else if (PREV.includes(e.key)) {
        e.preventDefault();
        goTo(active - 1);
      } else if (e.key === "Home" || e.key === "Escape") {
        e.preventDefault();
        smoothScrollTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(sections.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo, smoothScrollTo]);


  return (
    <div className="relative bg-background text-foreground">
      <VeloxBackground />
      <Preloader progress={loading} done={ready} />
      <ProgressBar progress={progress} />

      {/* Canvas 3D de modelos, por encima del fondo 2D */}
      <div
        id="pitch-canvas"
        className="pointer-events-none fixed inset-0 z-[1] print:hidden"
      >
        {mounted && use3D ? (
          <Suspense fallback={null}>
            <Background3D section={section} />
          </Suspense>
        ) : null}
      </div>


      <main className="relative z-10">
        <h1 className="sr-only">
          {brand.name} — {brand.tagline}
        </h1>
        {sections.map((s, i) => (
          <div key={s.id} className="relative">
            <Section
              data={s}
              first={i === 0}
              afterTitle={s.id === "solucion" ? <VeleiroLogo /> : undefined}
              extra={
                s.id === "cta" ? (
                  <div className="mt-10">
                    <div className="w-fit rounded-2xl border border-white/15 bg-white p-2">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={qr.url}
                        alt="Código QR para agendar el diagnóstico con Velox Solutions"
                        className="size-[15rem] object-contain sm:size-[17rem] md:size-[19rem] lg:size-[22rem]"
                      />
                    </div>
                  </div>
                ) : undefined
              }
              below={
                s.id === "problema" ? (
                  <ProblemFlow />
                ) : s.id === "consecuencia" ? (
                  <ConsequenceFlow />
                ) : s.id === "solucion" ? (
                  <SolutionTimeline />
                ) : s.id === "como" ? (
                  <DataCycle />
                ) : s.id === "diferencial" ? (
                  <GrowthEngine />
                ) : s.id === "cronista" ? (
                  <div className="mt-[6vh] md:mt-[10vh]">
                    <CronistaFronts />
                  </div>
                ) : s.id === "adium" ? (
                  <div className="mt-[6vh] md:mt-[10vh]">
                    <AdiumAssistants />
                  </div>
                ) : undefined
              }
              right={
                s.id === "hook" ? (
                  <img
                    loading="lazy"
                    decoding="async"
                    src={veloxLogo.url}
                    alt="Velox Solutions"
                    className="h-auto w-[min(58vw,14rem)] object-contain opacity-90 md:w-[min(38vw,19rem)]"
                  />
                ) : s.id === "cta" ? (
                  <div className="w-full pt-[18vh] lg:pt-[22vh]">
                    <CapabilityWheel />
                  </div>
                ) : undefined
              }
              align={s.id === "cta" ? "start" : undefined}
              /* Ritmo vertical ajustado: en móvil/tablet las secciones se
                 compactan para evitar huecos enormes al scrollear. */
              className={
                s.id === "hook"
                  ? "!min-h-[70vh] !justify-start !pt-[10vh] md:!min-h-[72vh] md:!pt-[12vh]"
                  : s.id === "problema" ||
                      s.id === "consecuencia" ||
                      s.id === "solucion" ||
                      s.id === "diferencial" ||
                      s.id === "cronista" ||
                      s.id === "adium" ||
                      s.id === "cta"
                    ? "py-[6vh] min-h-[100vh] md:py-[10vh] md:min-h-[170vh]"
                    : undefined
              }


            />
            {s.id === "cencor" && <CencorUnits />}
            {s.id === "cronista" && (
              <ClientLogo src={cronista.url} name="El Cronista" eyebrow="El Cronista" side="right" />
            )}
            {s.id === "adium" && (
              <ClientLogo src={adium.url} name="Adium" eyebrow="Adium Pharma" side="right" />
            )}
            {i === 0 && <LogoStrip />}
          </div>
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
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-foreground/50">
                  {c.role}
                </div>
                <div className="mt-4 text-sm text-[var(--aura)] group-hover:underline">
                  {c.email}
                </div>
              </a>
            ))}
          </div>
          <p className="mt-10 text-[10px] uppercase tracking-[0.3em] text-foreground/35">
            {brand.name} · {brand.tagline}
          </p>
        </footer>
      </main>

      <NavDots
        count={sections.length}
        active={active}
        onSelect={goTo}
        labels={sections.map((s) => s.kicker)}
      />

      <div
        ref={hintRef}
        style={{ opacity: 1 }}
        className="fixed inset-x-0 bottom-8 z-20 flex justify-center text-[10px] uppercase tracking-[0.3em] text-foreground/45 transition-opacity duration-500 print:hidden"
      >
        <span className="animate-bounce">Scroll ↓</span>
      </div>
    </div>
  );
}
