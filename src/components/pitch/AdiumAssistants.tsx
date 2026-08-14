import { useEffect, useRef, useState } from "react";
import { MessageCircle, Headphones, ShieldCheck } from "lucide-react";

const CARDS = [
  {
    icon: MessageCircle,
    eyebrow: "Asistente paciente",
    title: "WhatsApp 24/7",
    tag: "Atención continua, respuestas validadas y derivación sensible al equipo humano.",
  },
  {
    icon: Headphones,
    eyebrow: "Copiloto PSP",
    title: "Dentro del CRM",
    tag: "Resume la consulta, registra el caso y sugiere el próximo mejor contacto.",
  },
] as const;

export function AdiumAssistants() {
  const ref = useRef<HTMLDivElement>(null);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.85 - r.top) / Math.max(1, r.height * 0.7);
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

  const base = Math.min(1, Math.max(0, (fill - 0.45) / 0.3));

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-3xl px-6 md:px-0 lg:pr-40">
      <div className="mb-8 text-center text-[0.68rem] uppercase tracking-[0.32em] text-muted-foreground">
        Dos asistentes, una base de confianza
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {CARDS.map((c, i) => {
          const t = Math.min(1, Math.max(0, (fill - i * 0.14) / 0.3));
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="rounded-2xl border border-white/10 bg-galaxy/70 p-6 transition-all duration-500 md:p-7"
              style={{
                opacity: 0.25 + t * 0.75,
                transform: `translateY(${(1 - t) * 16}px)`,
                boxShadow: `0 0 ${16 + t * 34}px rgba(83,74,183,${0.12 + t * 0.35})`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Icon className="size-5 text-ice" strokeWidth={1.4} />
                </div>
                <div className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
                  {c.eyebrow}
                </div>
              </div>
              <div className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                {c.title}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.tag}</p>
            </div>
          );
        })}
      </div>

      {/* Conector hacia la base */}
      <div className="relative mx-auto h-12 w-px">
        <div className="absolute inset-0 bg-white/10" />
        <div
          className="absolute inset-x-0 top-0 origin-top bg-gradient-to-b from-velox to-aura transition-transform duration-500 ease-out"
          style={{ bottom: 0, transform: `scaleY(${base})` }}
        />
      </div>

      <div
        className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-galaxy/60 p-6 text-center transition-all duration-500"
        style={{
          opacity: 0.25 + base * 0.75,
          transform: `translateY(${(1 - base) * 14}px)`,
          boxShadow: `0 0 ${18 + base * 38}px rgba(83,74,183,0.28)`,
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <ShieldCheck className="size-5 text-ice" strokeWidth={1.4} />
          <div className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
            Validación legal, médica y compliance
          </div>
        </div>
        <div className="mt-4 text-lg font-semibold tracking-tight text-foreground">
          Todo validado antes de llegar al paciente o al equipo
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Cada respuesta y sugerencia pasa por controles de seguridad y cumplimiento antes de publicarse.
        </p>
      </div>
    </div>
  );
}
