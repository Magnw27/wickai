"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Bot, Check, Copy, Menu, Paperclip, Plus, Search, Sparkles, Square, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type StoredChat = { id: string; title: string; updatedAt: number; messages: UIMessage[] };

const STORAGE_KEY = "wickai:chats:v1";
const fallbackModels = [
  { id: "openai/gpt-4o-mini", label: "WickAI Fast" },
  { id: "openai/gpt-4o", label: "WickAI Pro" },
];
const starterPrompts = [
  "Explain a complex topic simply",
  "Help me build a Next.js feature",
  "Turn my rough idea into a plan",
  "Review this code for improvements",
];

function messageText(message: UIMessage) {
  return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
}

export function WickAIChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [model, setModel] = useState(fallbackModels[1].id);
  const [models, setModels] = useState(fallbackModels);
  const [chatId, setChatId] = useState(() => `chat_${Date.now()}`);
  const [history, setHistory] = useState<StoredChat[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, setMessages, sendMessage, status, stop, error, regenerate } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredChat[];
      if (!Array.isArray(stored) || !stored.length) return;
      const sorted = stored.sort((a, b) => b.updatedAt - a.updatedAt);
      setHistory(sorted);
      setChatId(sorted[0].id);
      setMessages(sorted[0].messages);
    } catch {}
  }, [setMessages]);

  useEffect(() => {
    fetch("/api/models")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { models?: { id: string; label: string }[] }) => {
        if (!data.models?.length) return;
        setModels(data.models);
        setModel((current) => data.models?.some((item) => item.id === current) ? current : data.models![0].id);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const firstUser = messages.find((message) => message.role === "user");
    const title = firstUser ? messageText(firstUser).trim().slice(0, 46) || "New conversation" : "New conversation";
    const next: StoredChat = { id: chatId, title, updatedAt: Date.now(), messages };
    setHistory((current) => {
      const merged = [next, ...current.filter((item) => item.id !== chatId)].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
      return merged;
    });
  }, [messages, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const startNewChat = () => {
    stop();
    setChatId(`chat_${Date.now()}`);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
  };

  const openChat = (chat: StoredChat) => {
    stop();
    setChatId(chat.id);
    setMessages(chat.messages);
    setSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    const next = history.filter((chat) => chat.id !== id);
    setHistory(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    if (id === chatId) startNewChat();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text }, { body: { model } });
    setInput("");
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1300);
    } catch {}
  };

  return (
    <main className="wick-shell flex min-h-dvh text-zinc-100">
      <div className="wick-noise" aria-hidden="true" />

      <aside className={`glass fixed inset-y-0 left-0 z-40 w-[292px] p-3.5 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-white/[.075] ring-1 ring-white/10"><Sparkles size={16} /></div>
              <div><div className="font-semibold tracking-tight">WickAI</div><div className="text-[11px] text-zinc-500">AI workspace</div></div>
            </div>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/5 px-2 py-1 text-[10px] font-medium text-emerald-300/80">ONLINE</span>
          </div>

          <button onClick={startNewChat} className="mb-3 flex items-center gap-2 rounded-xl bg-white px-3.5 py-3 text-sm font-semibold text-black shadow-lg transition hover:-translate-y-0.5 hover:bg-zinc-100"><Plus size={16} /> New chat</button>
          <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-600"><Search size={12} /> Recent chats</div>
          <div className="wick-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {history.length === 0 ? <div className="rounded-xl border border-dashed border-white/[.07] p-4 text-xs leading-5 text-zinc-600">Your recent conversations will appear here.</div> : history.map((chat) => (
              <div key={chat.id} className="group flex items-center gap-1">
                <button onClick={() => openChat(chat)} className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-white/[.05] ${chat.id === chatId ? "bg-white/[.055] text-zinc-200" : "text-zinc-500"}`}>
                  <span className="block truncate">{chat.title}</span><span className="mt-0.5 block text-[10px] text-zinc-700">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                </button>
                <button title="Delete conversation" onClick={() => deleteChat(chat.id)} className="mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-zinc-700 opacity-0 transition hover:bg-red-400/10 hover:text-red-300 group-hover:opacity-100" aria-label={`Delete ${chat.title}`}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-white/[.06] bg-black/10 p-3 text-xs text-zinc-600"><div className="font-medium text-zinc-500">Provider</div><div className="mt-1 truncate">OpenAI-compatible endpoint</div></div>
        </div>
      </aside>

      {sidebarOpen && <button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" />}

      <section className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-white/[.055] bg-black/15 px-3 backdrop-blur-2xl sm:px-5 lg:px-7">
          <button onClick={() => setSidebarOpen(true)} className="grid size-10 place-items-center rounded-xl text-zinc-400 transition hover:bg-white/[.06] hover:text-white lg:hidden" aria-label="Open sidebar"><Menu size={18} /></button>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden rounded-xl border border-white/[.06] bg-white/[.025] px-3 py-2 text-[11px] text-zinc-600 sm:block">OpenAI-compatible</div>
            <label className="flex items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.035] px-2.5 py-2 text-xs text-zinc-300">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,.75)]" />
              <select value={model} onChange={(event) => setModel(event.target.value)} className="max-w-[145px] bg-transparent outline-none" aria-label="Select model">
                {models.map((item) => <option key={item.id} value={item.id} className="bg-zinc-950">{item.label}</option>)}
              </select>
            </label>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-5 pt-7 sm:px-6 lg:px-8">
          <div className="wick-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="wick-rise flex min-h-[calc(100dvh-190px)] flex-col items-center justify-center px-2 pb-20 text-center">
                <div className="mb-5 grid size-[72px] place-items-center rounded-[22px] border border-white/[.08] bg-white/[.035] shadow-[0_18px_70px_rgba(0,0,0,.4)]"><Bot size={30} strokeWidth={1.8} /></div>
                <p className="text-sm text-zinc-500">Your focused AI workspace</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Ask WickAI.</h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">Build, research, plan, debug, and think with a fast OpenAI-compatible AI interface.</p>
                <div className="mt-9 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                  {starterPrompts.map((prompt, index) => <button key={prompt} onClick={() => setInput(prompt)} className="wick-rise rounded-2xl border border-white/[.07] bg-white/[.025] p-4 text-left text-sm text-zinc-400 transition duration-300 hover:-translate-y-1 hover:border-white/[.13] hover:bg-white/[.05] hover:text-zinc-200" style={{ animationDelay: `${index * 60}ms` }}>{prompt}</button>)}
                </div>
              </div>
            ) : (
              <div className="space-y-8 py-3 sm:py-5">
                {messages.map((message, messageIndex) => {
                  const text = messageText(message);
                  const isLast = messageIndex === messages.length - 1;
                  return (
                    <article key={message.id} className="wick-rise group">
                      <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        {message.role !== "user" && <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl border border-white/[.07] bg-white/[.035] text-zinc-300"><Bot size={15} /></div>}
                        <div className="min-w-0 max-w-[92%] sm:max-w-[82%]">
                          <div className={`rounded-[22px] px-4 py-3.5 text-[15px] leading-7 ${message.role === "user" ? "bg-white text-zinc-950 shadow-lg shadow-black/10" : "border border-white/[.055] bg-white/[.025] text-zinc-200"}`}>
                            {message.parts.map((part, index) => part.type === "text" ? <div key={`${message.id}-${index}`} className="whitespace-pre-wrap break-words">{part.text}</div> : null)}
                            {isLast && message.role === "assistant" && status === "streaming" && <span className="wick-cursor" />}
                          </div>
                          {message.role === "assistant" && text && <div className="mt-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                            <button title="Copy" onClick={() => copyMessage(message.id, text)} className="grid size-8 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[.05] hover:text-zinc-300" aria-label="Copy response">{copied === message.id ? <Check size={14} /> : <Copy size={14} />}</button>
                            {isLast && !busy && <button title="Regenerate" onClick={() => regenerate()} className="rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-600 transition hover:bg-white/[.05] hover:text-zinc-300">Regenerate</button>}
                          </div>}
                        </div>
                        {message.role === "user" && <div className="mt-1 hidden size-8 shrink-0 place-items-center rounded-xl border border-white/[.07] bg-white/[.035] text-zinc-500 sm:grid"><UserRound size={15} /></div>}
                      </div>
                    </article>
                  );
                })}
                {status === "submitted" && <div className="wick-pop flex items-center gap-3 pl-11 text-sm text-zinc-600"><span className="flex gap-1"><i className="size-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-.2s]" /><i className="size-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-.1s]" /><i className="size-1.5 animate-bounce rounded-full bg-zinc-500" /></span>WickAI is thinking…</div>}
                {error && <div className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-red-300/10 bg-red-400/[.045] p-3.5 text-sm text-red-200/75"><span>Something went wrong while contacting the AI provider.</span><button onClick={() => regenerate()} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-red-100 transition hover:bg-white/10">Retry</button></div>}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form onSubmit={submit} className="sticky bottom-0 z-10 mt-5 pt-2">
            <div className="glass-strong rounded-[26px] p-2 shadow-[0_20px_70px_rgba(0,0,0,.35)] transition focus-within:border-white/[.14]">
              <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(event as unknown as React.FormEvent); } }} rows={2} placeholder="Ask WickAI anything…" className="max-h-44 min-h-[58px] w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-600" disabled={busy} aria-label="Message WickAI" />
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-1"><button type="button" title="Attachments coming soon" className="grid size-9 place-items-center rounded-xl text-zinc-600 transition hover:bg-white/[.05] hover:text-zinc-300"><Paperclip size={16} /></button><span className="hidden text-[11px] text-zinc-700 sm:inline">Enter to send · Shift+Enter for newline</span></div>
                <button type={busy ? "button" : "submit"} onClick={busy ? stop : undefined} disabled={!busy && !input.trim()} className="grid size-10 place-items-center rounded-xl bg-white text-zinc-950 shadow-lg transition hover:scale-[1.035] hover:bg-zinc-100 disabled:scale-100 disabled:opacity-25" aria-label={busy ? "Stop generation" : "Send message"}>{busy ? <Square size={15} fill="currentColor" /> : <ArrowUp size={18} />}</button>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-zinc-700">WickAI may make mistakes. Check important information.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
