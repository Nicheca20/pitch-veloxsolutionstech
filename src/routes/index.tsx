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
import { PhaseCards } from "@/components/pitch/PhaseCards";

import VeloxBackground from "@/components/pitch/VeloxBackground";

import cronista from "@/assets/cronista.png.asset.json";
import adium from "@/assets/adium.png.asset.json";
import veloxLogo from "@/assets/velox-logo.png.asset.json";
import qr from "@/assets/qr-diagnostico.png.asset.json";


import { ProgressBar } from "@/components/pitch/ProgressBar";
import { Preloader } from "@/components/pitch/Preloader";
import { useScrollProgress } from "@/hooks/use-scroll-progress";

import { SceneErrorBoundary } from "@/components/pitch/SceneErrorBoundary";
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

  /** Motor de scroll: un solo rAF que interpola hacia un objetivo acumulado.
   *  Los eventos nunca reinician la animación, sólo mueven el objetivo,
   *  así un scroll rápido se traduce en movimiento continuo (sin bloqueos). */
  const targetY = useRef<number | null>(null);

  const runScroll = useCallback(() => {
    if (tween.current !== null) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = targetY.current;
      if (t === null) {
        tween.current = null;
        return;
      }
      const y = window.scrollY;
      const d = t - y;
      if (Math.abs(d) < 0.5) {
        window.scrollTo(0, t);
        targetY.current = null;
        tween.current = null;
        return;
      }
      // suavizado exponencial: ~180 ms para alcanzar el objetivo
      const k = 1 - Math.exp(-dt * 9);
      window.scrollTo(0, y + d * k);
      tween.current = requestAnimationFrame(loop);
    };
    tween.current = requestAnimationFrame(loop);
  }, []);

  const clampY = (y: number) => {
    const max = document.body.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(max, y));
  };

  /** Mueve el objetivo una cantidad relativa (acumulable). */
  const scrollByAmount = useCallback(
    (delta: number) => {
      const base = targetY.current ?? window.scrollY;
      targetY.current = clampY(base + delta);
      if (reducedRef.current) {
        window.scrollTo(0, targetY.current);
        targetY.current = null;
        return;
      }
      runScroll();
    },
    [runScroll],
  );

  /** Va a una posición absoluta (dots, Home/End). */
  const smoothScrollTo = useCallback(
    (to: number) => {
      targetY.current = clampY(to);
      if (reducedRef.current) {
        window.scrollTo(0, targetY.current);
        targetY.current = null;
        return;
      }
      runScroll();
    },
    [runScroll],
  );

  const goTo = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(sections.length - 1, i));
      const el = document.getElementById(sections[idx]!.id);
      if (!el) return;
      smoothScrollTo(el.getBoundingClientRect().top + window.scrollY);
    },
    [smoothScrollTo],
  );

  /** Avance fino: cada paso mueve ~1 % del viewport. */
  const step = useCallback(
    (dir: 1 | -1, ratio = 0.01) => {
      scrollByAmount(dir * window.innerHeight * ratio);
    },
    [scrollByAmount],
  );

  // La rueda del mouse acumula pasos de ~1 % del viewport sobre el mismo
  // objetivo, en lugar del scroll nativo: fluido y sin saltar frames.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      step(e.deltaY > 0 ? 1 : -1, 0.01);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [step]);


  useEffect(() => {
    const NEXT = ["ArrowRight", "ArrowDown", "PageDown", " ", "Spacebar", "Enter"];
    const PREV = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace"];
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (NEXT.includes(e.key)) {
        e.preventDefault();
        step(1);
      } else if (PREV.includes(e.key)) {
        e.preventDefault();
        step(-1);
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
  }, [goTo, step, smoothScrollTo]);

  // Click: avanza un paso. Mantener presionado: avanza de forma continua
  // al mismo ritmo (1 % del viewport cada ~120 ms). Click derecho: retrocede.
  useEffect(() => {
    const interactive = (t: EventTarget | null) =>
      !!(t as HTMLElement | null)?.closest?.("a,button,input,textarea,select,[role='button']");

    let holdTimer: number | null = null;
    let raf = 0;
    let didHold = false;
    let last = 0;

    const stopHold = () => {
      if (holdTimer !== null) window.clearTimeout(holdTimer);
      holdTimer = null;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const startHold = (dir: 1 | -1) => {
      didHold = true;
      last = performance.now();
      const loop = (now: number) => {
        const dt = now - last;
        last = now;
        // misma velocidad que los pasos: 1 % del viewport cada 120 ms
        scrollByAmount(dir * window.innerHeight * 0.01 * (dt / 120));
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    const onDown = (e: MouseEvent) => {
      didHold = false;
      if (interactive(e.target)) return;
      if (e.button !== 0 && e.button !== 2) return;
      const dir: 1 | -1 = e.button === 2 ? -1 : 1;
      holdTimer = window.setTimeout(() => startHold(dir), 280);
    };
    const onUp = () => {
      stopHold();
    };
    const onClick = (e: MouseEvent) => {
      if (interactive(e.target)) return;
      if (didHold) return;
      step(1);
    };
    const onCtx = (e: MouseEvent) => {
      if (interactive(e.target)) return;
      e.preventDefault();
      if (didHold) return;
      step(-1);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseleave", stopHold);
    window.addEventListener("blur", stopHold);
    window.addEventListener("click", onClick);
    window.addEventListener("contextmenu", onCtx);
    return () => {
      stopHold();
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseleave", stopHold);
      window.removeEventListener("blur", stopHold);
      window.removeEventListener("click", onClick);
      window.removeEventListener("contextmenu", onCtx);
    };
  }, [step, scrollByAmount]);






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
          <SceneErrorBoundary>
            <Suspense fallback={null}>
              <Background3D section={section} />
            </Suspense>
          </SceneErrorBoundary>
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
