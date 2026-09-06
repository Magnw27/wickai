"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { ArrowUp, Bot, Menu, Paperclip, Plus, Sparkles, Square, UserRound } from "lucide-react";

const starterPrompts = [
  "Explain a complex topic simply",
  "Help me build a Next.js feature",
  "Turn my rough idea into a plan",
  "Review this code for improvements",
];

export function WickAIChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [model, setModel] = useState("WickAI Pro");
  const { messages, input, handleInputChange, handleSubmit, status, stop, setInput } = useChat({
    body: { model: process.env.NEXT_PUBLIC_WICKAI_MODEL ?? "" },
  });

  const busy = status === "submitted" || status === "streaming";

  return (
    <main className="wick-shell flex min-h-dvh text-zinc-100">
      <aside className={`glass fixed inset-y-0 left-0 z-40 w-[290px] p-4 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="mb-5 flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10"><Sparkles size={17} /></div>
              <div>
                <div className="font-semibold tracking-tight">WickAI</div>
                <div className="text-[11px] text-zinc-500">AI workspace</div>
              </div>
            </div>
          </div>
          <button onClick={() => setInput("")} className="mb-4 flex items-center gap-2 rounded-xl bg-white/[.06] px-3.5 py-3 text-sm font-medium ring-1 ring-white/[.06] transition hover:bg-white/[.1]"><Plus size={16} /> New chat</button>
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-600">Recent</div>
          <div className="space-y-1 text-sm">
            {["Untitled conversation", "Designing WickAI", "Next.js architecture"].map((item, i) => <button key={item} className={`w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-white/[.05] ${i === 0 ? "bg-white/[.055] text-zinc-200" : "text-zinc-500"}`}>{item}</button>)}
          </div>
          <div className="mt-auto border-t border-white/[.07] pt-4 text-xs text-zinc-500">Local-first • OpenAI-compatible</div>
        </div>
      </aside>

      {sidebarOpen && <button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden" />}

      <section className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[.06] bg-black/10 px-4 py-3 backdrop-blur-xl lg:px-7">
          <button onClick={() => setSidebarOpen(true)} className="grid size-10 place-items-center rounded-xl text-zinc-400 hover:bg-white/[.06] lg:hidden"><Menu size={18} /></button>
          <div className="ml-auto flex items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.035] px-3 py-2 text-xs text-zinc-300">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,.65)]" />
            <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-transparent outline-none">
              <option className="bg-zinc-950">WickAI Pro</option>
              <option className="bg-zinc-950">WickAI Fast</option>
            </select>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-4 pt-10 sm:px-6 lg:px-8">
          <div className="flex-1 space-y-7">
            {messages.length === 0 ? (
              <div className="wick-rise flex min-h-[55vh] flex-col items-center justify-center text-center">
                <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-white/[.08] bg-white/[.04] shadow-2xl shadow-violet-500/10"><Bot size={28} /></div>
                <p className="mb-2 text-sm text-zinc-500">Welcome to</p>
                <h1 className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">WickAI</h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500">A focused AI workspace for ideas, code, research, and everyday tasks.</p>
                <div className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                  {starterPrompts.map((prompt) => <button key={prompt} onClick={() => setInput(prompt)} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4 text-left text-sm text-zinc-400 transition hover:-translate-y-0.5 hover:bg-white/[.05] hover:text-zinc-200">{prompt}</button>)}
                </div>
              </div>
            ) : messages.map((message) => (
              <div key={message.id} className={`wick-rise flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[88%] gap-3 sm:max-w-[78%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl border border-white/[.07] bg-white/[.04]">{message.role === "user" ? <UserRound size={15} /> : <Bot size={15} />}</div>
                  <div className={`rounded-2xl px-4 py-3 text-[15px] leading-7 ${message.role === "user" ? "bg-white text-black" : "bg-white/[.035] text-zinc-200 ring-1 ring-white/[.06]"}`}>
                    {message.parts?.map((part, index) => part.type === "text" ? <p key={index} className="whitespace-pre-wrap">{part.text}</p> : null)}
                  </div>
                </div>
              </div>
            ))}
            {status === "submitted" && <div className="flex items-center gap-3 text-sm text-zinc-500"><span className="size-2 animate-pulse rounded-full bg-violet-400" />WickAI is thinking…</div>}
          </div>

          <form onSubmit={handleSubmit} className="sticky bottom-4 mt-8">
            <div className="glass rounded-3xl p-2 shadow-2xl shadow-black/20">
              <textarea value={input} onChange={handleInputChange} disabled={busy} rows={2} placeholder="Ask WickAI anything…" className="w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-60" />
              <div className="flex items-center justify-between px-1 pb-1">
                <button type="button" className="grid size-9 place-items-center rounded-xl text-zinc-500 hover:bg-white/[.06] hover:text-zinc-200"><Paperclip size={17} /></button>
                <button type={busy ? "button" : "submit"} onClick={busy ? stop : undefined} disabled={!busy && !input.trim()} className="grid size-10 place-items-center rounded-xl bg-white text-black transition hover:scale-[1.03] disabled:opacity-30">{busy ? <Square size={15} fill="currentColor" /> : <ArrowUp size={18} />}</button>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-zinc-700">WickAI can make mistakes. Verify important information.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
