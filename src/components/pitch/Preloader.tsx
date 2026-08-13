export function Preloader({ progress, done }: { progress: number; done: boolean }) {
  return (
    <div
      aria-hidden={done}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--galaxy)] transition-opacity duration-700 print:hidden ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="bg-velox-gradient bg-clip-text text-2xl font-bold tracking-tight text-transparent">
        VELOX SOLUTIONS
      </div>
      <div className="mt-6 h-[2px] w-56 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-velox-gradient transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-[0.35em] text-foreground/40">
        Cargando escena · {Math.round(progress)}%
      </div>
    </div>
  );
}
