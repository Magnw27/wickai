export default function Loading() {
  return (
    <main className="wick-shell grid min-h-dvh place-items-center text-zinc-100">
      <div className="flex items-center gap-3 text-sm text-zinc-500" role="status" aria-live="polite">
        <span className="size-2 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,.7)] animate-pulse" />
        <span>Loading WickAI…</span>
      </div>
    </main>
  );
}
