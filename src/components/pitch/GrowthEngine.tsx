import { useEffect, useRef, useState } from "react";
import { Rocket, Radar, Sparkles, Layers } from "lucide-react";

const STATIONS = [
  {
    icon: Rocket,
    title: "Producción",
    tag: "soluciones ya implementadas",
  },
  {
    icon: Radar,
    title: "Señal de upsell",
    tag: "nuestros agentes la detectan",
  },
  {
    icon: Sparkles,
    title: "Créditos AgentForce / IA",
    tag: "consumo constante y creciente",
  },
] as const;

const LANES = [
  { label: "Sector financiero", delay: 0 },
  { label: "Industria farma", delay: 0.12 },
  { label: "Retail", delay: 0.24 },
] as const;

export function GrowthEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.82 - r.top) / Math.max(1, r.height * 0.75);
      setFill(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const railFill = Math.min(1, fill * 1.25);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-5xl">
      {/* ---------- Riel: motor de upsell ---------- */}
      <div className="relative">
        <div className="mb-8 text-center text-[1.22rem] uppercase tracking-[0.32em] text-foreground">
          Motor de upsell continuo
        </div>

        {/* Pista */}
        <div className="relative">
          <div className="absolute left-0 right-0 top-[2.6rem] h-px bg-white/10 md:top-[3rem]" />
          <div
            className="absolute left-0 top-[2.6rem] h-px origin-left bg-gradient-to-r from-velox via-force to-aura shadow-[0_0_18px_rgba(83,74,183,0.9)] transition-transform duration-300 ease-out md:top-[3rem]"
            style={{ right: 0, transform: `scaleX(${railFill})` }}
          />
          {/* Pulso viajero */}
          <div
            className="absolute top-[2.6rem] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ice shadow-[0_0_22px_8px_rgba(255,255,255,0.35)] md:top-[3rem]"
            style={{ left: `${railFill * 100}%`, opacity: railFill > 0.02 ? 1 : 0 }}
          />

          <div className="relative grid gap-10 sm:grid-cols-3 sm:gap-6">
            {STATIONS.map((s, i) => {
              const t = Math.min(1, Math.max(0, (fill - i * 0.16) / 0.28));
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="flex flex-col items-center text-center transition-all duration-500"
                  style={{ opacity: 0.25 + t * 0.75, transform: `translateY(${(1 - t) * 14}px)` }}
                >
                  <div
                    className="relative z-10 flex size-[5.2rem] items-center justify-center rounded-2xl border border-white/10 bg-galaxy/80 md:size-24"
                    style={{
                      boxShadow: `0 0 ${18 + t * 34}px rgba(83,74,183,${0.15 + t * 0.45})`,
                      borderColor: `rgba(255,255,255,${0.08 + t * 0.16})`,
                    }}
                  >
                    <Icon className="size-7 text-ice" strokeWidth={1.4} />
                  </div>
                  <div className="mt-5 text-[1.7rem] font-semibold tracking-tight text-foreground md:text-[1.8rem]">
                    {s.title}
                  </div>
                  <div className="mt-1 text-[1.35rem] leading-snug text-foreground">{s.tag}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- Capa base replicable ---------- */}
      <div className="relative mt-16">
        <div className="mb-6 text-center text-[1.22rem] uppercase tracking-[0.32em] text-foreground">
          Capa base replicable
        </div>

        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-galaxy/60 p-5 transition-all duration-500 md:p-7"
          style={{
            opacity: 0.3 + Math.min(1, Math.max(0, (fill - 0.35) / 0.3)) * 0.7,
            boxShadow: `0 0 ${20 + fill * 40}px rgba(83,74,183,0.25)`,
          }}
        >
          <div className="space-y-4">
            {LANES.map((l, i) => {
              const t = Math.min(1, Math.max(0, (fill - 0.42 - l.delay) / 0.26));
              return (
                <div key={l.label} className="flex items-center gap-4">
                  <div className="w-44 shrink-0 text-[1.26rem] uppercase tracking-[0.16em] text-foreground md:w-52">
                    {l.label}
                  </div>
                  <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-velox to-aura transition-[width] duration-500 ease-out"
                      style={{ width: `${t * 100}%` }}
                    />
                  </div>
                  <div
                    className="w-32 shrink-0 text-right text-[1.26rem] font-semibold text-foreground transition-opacity duration-500 md:w-36"
                    style={{ opacity: t > 0.9 ? 1 : 0 }}
                  >
                    semanas
                  </div>
                  <span className="sr-only">{i}</span>
                </div>
              );
            })}
          </div>

          <p className="mt-6 border-t border-white/10 pt-5 text-center text-[1.5rem] leading-relaxed text-foreground md:text-[1.7rem]">
            Replicamos nuestros agentes en distintas industrias sobre una misma capa base:
            <span className="text-foreground"> avanzamos en semanas, no en trimestres.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
