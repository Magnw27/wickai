"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("WickAI route error:", error);
  }, [error]);

  return (
    <main className="wick-shell grid min-h-dvh place-items-center px-5 text-zinc-100">
      <section className="glass w-full max-w-md rounded-3xl p-6 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-red-300/10 bg-red-400/5 text-red-200">!</div>
        <h1 className="text-lg font-semibold tracking-tight">WickAI hit an unexpected error.</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">Try rendering the workspace again. Your local chat history is kept in this browser.</p>
        <button onClick={() => reset()} className="mt-5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100">Try again</button>
      </section>
    </main>
  );
}
