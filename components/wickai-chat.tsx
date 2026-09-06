"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Bot, Check, Copy, Menu, Paperclip, Plus, Search, Sparkles, Square, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type StoredChat = { id: string; title: string; updatedAt: number; messages: UIMessage[] };

type WickModel = { id: string; label: string };

const STORAGE_KEY = "wickai:chats:v1";
const fallbackModels: WickModel[] = [
  { id: "wick-fast", label: "Wick Fast" },
  { id: "wick-1.5", label: "Wick 1.5" },
  { id: "wick-ultra2.3", label: "Wick Ultra 2.3" },
  { id: "wick-chat", label: "Wick Chat" },
];
const starterPrompts = [
  "Jelasin apa yang dimaksud ai?",
  "who's create WickAI?",
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
  const [model, setModel] = useState(fallbackModels[2].id);
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
      .then((data: { models?: WickModel[] }) => {
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
    setHistory((current) => {
      const next = current.filter((item) => item.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    if (id === chatId) startNewChat();
  };

  const submitMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    await sendMessage({ text: trimmed }, { body: { model } });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void submitMessage(input);
  };

  return (
    <div className="relative flex min-h-dvh overflow-hidden text-zinc-100">
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-white/8 bg-black/35 p-3 backdrop-blur-2xl transition-transform duration-300 md:static md:shrink-0`}>
        <div className="flex items-center justify-between px-2 py-2">
          <button type="button" onClick={startNewChat} className="wick-button flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium">
            <Plus className="size-4" /> New chat
          </button>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-white/6 hover:text-white md:hidden" aria-label="Close sidebar">
            <Menu className="size-5" />
          </button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto wick-scrollbar">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Recent</div>
          <div className="space-y-1">
            {history.length ? history.map((chat) => (
              <div key={chat.id} className={`group flex items-center gap-2 rounded-xl px-3 py-2 ${chat.id === chatId ? "bg-white/8" : "hover:bg-white/5"}`}>
                <button type="button" onClick={() => openChat(chat)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm text-zinc-200">{chat.title}</div>
                </button>
                <button type="button" onClick={() => deleteChat(chat.id)} className="rounded-lg p-1.5 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-white/8 hover:text-zinc-200" aria-label="Delete chat">
                  <Trash2 className="size-4" />
                </button>
              </div>
            )) : <div className="px-3 py-5 text-sm text-zinc-600">No conversations yet.</div>}
          </div>
        </div>
      </aside>

      {sidebarOpen && <button type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm md:hidden" />}

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/7 bg-black/16 px-3 py-3 backdrop-blur-xl md:px-5">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 text-zinc-400 hover:bg-white/7 hover:text-white md:hidden" aria-label="Open sidebar">
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-200"><Sparkles className="size-4" /></div>
              <div>
                <div className="text-sm font-semibold tracking-tight">WickAI</div>
                <div className="text-[11px] text-zinc-500">AI Workspace</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <select value={model} onChange={(event) => setModel(event.target.value)} className="appearance-none rounded-xl border border-white/8 bg-white/4 py-2 pl-8 pr-8 text-xs text-zinc-200 outline-none transition hover:bg-white/7 focus:border-violet-300/25">
                {models.map((item) => <option key={item.id} value={item.id} className="bg-zinc-950">{item.label}</option>)}
              </select>
            </div>
            <button type="button" onClick={startNewChat} className="wick-button rounded-xl p-2 text-zinc-300" aria-label="New chat"><Plus className="size-5" /></button>
          </div>
        </header>

        <section className="wick-scrollbar flex-1 overflow-y-auto px-3 pb-40 pt-6 md:px-8 md:pt-8">
          <div className="mx-auto w-full max-w-4xl">
            {messages.length === 0 ? (
              <div className="flex min-h-[62vh] flex-col items-center justify-center py-10 text-center">
                <div className="wick-rise grid size-16 place-items-center rounded-2xl border border-violet-300/10 bg-violet-400/8 shadow-2xl shadow-violet-950/20"><Bot className="size-7 text-violet-200" /></div>
                <h1 className="wick-rise mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">How can I help you today?</h1>
                <p className="wick-rise mt-3 max-w-lg text-sm leading-6 text-zinc-500">Ask anything, build something, or drop a problem here. WickAI will keep the conversation focused.</p>
                <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
                  {starterPrompts.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => void submitMessage(prompt)} className="wick-rise rounded-2xl border border-white/7 bg-white/3 p-4 text-left text-sm text-zinc-300 transition hover:-translate-y-0.5 hover:border-violet-300/15 hover:bg-white/5">{prompt}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-7 pb-6">
                {messages.map((message) => {
                  const text = messageText(message);
                  const isUser = message.role === "user";
                  return (
                    <article key={message.id} className={`wick-rise group flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl border border-violet-300/10 bg-violet-400/8"><Bot className="size-4 text-violet-200" /></div>}
                      <div className={`${isUser ? "max-w-[82%] rounded-2xl rounded-br-md bg-violet-400/12 px-4 py-3" : "max-w-[86%]"}`}>
                        <div className="whitespace-pre-wrap text-[14px] leading-7 text-zinc-200">{text}</div>
                        {!isUser && text && <div className="mt-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <button type="button" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(message.id); setTimeout(() => setCopied(null), 1200); }} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/7 hover:text-zinc-200" aria-label="Copy response">
                            {copied === message.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                          </button>
                          <button type="button" onClick={() => void regenerate()} className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-white/7 hover:text-zinc-200">Regenerate</button>
                        </div>}
                      </div>
                      {isUser && <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/6"><UserRound className="size-4 text-zinc-300" /></div>}
                    </article>
                  );
                })}
                {busy && <div className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-xl border border-violet-300/10 bg-violet-400/8"><Bot className="size-4 text-violet-200" /></div><div className="wick-pop text-sm text-zinc-500">WickAI is thinking…</div></div>}
                {error && <div className="rounded-2xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-sm text-red-300">Something went wrong. Please try again.</div>}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </section>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#07070a] via-[#07070a]/95 to-transparent px-3 pb-3 pt-16 md:px-6">
          <form onSubmit={handleSubmit} className="pointer-events-auto mx-auto flex w-full max-w-4xl items-end gap-2 rounded-2xl border border-white/8 bg-white/[0.035] p-2 shadow-2xl shadow-black/20 backdrop-blur-2xl">
            <button type="button" className="rounded-xl p-2.5 text-zinc-500 hover:bg-white/7 hover:text-zinc-200" aria-label="Attach file"><Paperclip className="size-5" /></button>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitMessage(input); } }} rows={1} placeholder="Message WickAI..." className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600" />
            <div className="flex items-center gap-1">
              <div className="sm:hidden"><select value={model} onChange={(event) => setModel(event.target.value)} aria-label="Select model" className="max-w-[110px] appearance-none rounded-xl border border-white/8 bg-white/4 px-2.5 py-2.5 text-[11px] text-zinc-300 outline-none"><option value="wick-fast">Fast</option><option value="wick-1.5">1.5</option><option value="wick-ultra2.3">Ultra 2.3</option><option value="wick-chat">Chat</option></select></div>
              {busy ? <button type="button" onClick={stop} className="grid size-11 place-items-center rounded-xl bg-white/8 text-zinc-200 hover:bg-white/12" aria-label="Stop generating"><Square className="size-4" /></button> : <button type="submit" disabled={!input.trim()} className="grid size-11 place-items-center rounded-xl bg-white text-black transition disabled:cursor-not-allowed disabled:opacity-30 hover:bg-zinc-200" aria-label="Send message"><ArrowUp className="size-5" /></button>}
            </div>
          </form>
          <div className="mx-auto mt-2 max-w-4xl text-center text-[10px] text-zinc-700">WickAI can make mistakes. Check important information.</div>
        </div>
      </main>
    </div>
  );
}
