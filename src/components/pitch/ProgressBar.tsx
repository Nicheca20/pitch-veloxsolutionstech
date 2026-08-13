export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-x-0 top-0 z-30 h-[3px] bg-white/5 print:hidden">
      <div
        className="h-full bg-velox-gradient transition-[width] duration-100 ease-out"
        style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
      />
    </div>
  );
}
