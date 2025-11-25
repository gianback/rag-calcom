export function Loading() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl  bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-lg shadow-slate-200/60">
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-sky-400" />
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:120ms]" />
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-300 [animation-delay:240ms]" />
        <span className="pl-1 text-xs uppercase tracking-[0.2em] text-slate-500"></span>
      </div>
    </div>
  );
}
