"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Bot, Check, Copy, Database, LogIn, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings2, ShieldCheck, Sparkles, Square, Trash2, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TextShimmer } from "@/components/text-shimmer";

type StoredChat = { id: string; title: string; updatedAt: number; messages: UIMessage[] };
type WickModel = { id: string; label: string };
type LocalAccount = { username: string; passwordHash: string; createdAt: number; usageDay: string; messageCount: number; memory: string };
type AuthMode = "login" | "register";

const fallbackModels: WickModel[] = [
  { id: "wick-fast", label: "Wick Fast" },
  { id: "wick-1.5", label: "Wick 1.5" },
  { id: "wick-ultra2.3", label: "Wick Ultra 2.3" },
  { id: "wick-chat", label: "Wick Chat" },
];
const starterPrompts = [
  "Jelasin apa yang dimaksud AI?",
  "Bantu aku bikin fitur Next.js yang rapi",
  "Ubah ide kasarku jadi roadmap yang jelas",
  "Review kode ini dan cari bagian yang bisa dioptimalkan",
];
const MESSAGE_LIMIT = 25;
const SESSION_KEY = "wickai:session:v2";
const ACCOUNT_KEY = "wickai:account:v2";
const WICK_LOGO = "https://api.dicebear.com/9.x/icons/png?seed=wickai&backgroundColor=0b0b12";

function messageText(message: UIMessage) {
  return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
}
function sectionize(text: string) {
  return text.split(/\n\n---WICK-SECTION---\n\n/g).filter((section) => section.trim());
}
function chatStorageKey(username: string) {
  return `wickai:chats:${username.toLowerCase()}`;
}
async function hashSecret(secret: string) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(buffer)).map((item) => item.toString(16).padStart(2, "0")).join("");
}
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function WickAIChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [model, setModel] = useState(fallbackModels[0].id);
  const [models, setModels] = useState(fallbackModels);
  const [chatId, setChatId] = useState(() => `chat_${Date.now()}`);
  const [history, setHistory] = useState<StoredChat[]>([]);
  const [memory, setMemory] = useState("");
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authOpen, setAuthOpen] = useState(true);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, setMessages, sendMessage, status, stop, error, regenerate } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";
  const remaining = Math.max(0, MESSAGE_LIMIT - (account?.messageCount ?? 0));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACCOUNT_KEY) || localStorage.getItem(SESSION_KEY);
      if (saved) setAccount(JSON.parse(saved) as LocalAccount);
    } catch {
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    if (!account) return;
    try {
      const raw = localStorage.getItem(chatStorageKey(account.username));
      const stored = raw ? (JSON.parse(raw) as StoredChat[]) : [];
      const sorted = Array.isArray(stored) ? stored.sort((a, b) => b.updatedAt - a.updatedAt) : [];
      setHistory(sorted);
      setMemory(account.memory || "");
      if (sorted[0]) {
        setChatId(sorted[0].id);
        setMessages(sorted[0].messages);
      } else {
        setMessages([]);
      }
    } catch {
      setHistory([]);
      setMessages([]);
    }
    setAuthOpen(false);
  }, [account, setMessages]);

  useEffect(() => {
    fetch("/api/models")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { models?: WickModel[] }) => {
        if (!data.models?.length) return;
        setModels(data.models);
        setModel((current) => data.models!.some((item) => item.id === current) ? current : data.models![0].id);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!account || !messages.length) return;
    const firstUser = messages.find((message) => message.role === "user");
    const title = firstUser ? messageText(firstUser).trim().slice(0, 52) || "New conversation" : "New conversation";
    const next: StoredChat = { id: chatId, title, updatedAt: Date.now(), messages };
    setHistory((current) => {
      const merged = [next, ...current.filter((item) => item.id !== chatId)].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 50);
      try { localStorage.setItem(chatStorageKey(account.username), JSON.stringify(merged)); } catch {}
      return merged;
    });
  }, [account, messages, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  useEffect(() => {
    setAuthOpen(!account);
  }, [account]);

  const startNewChat = () => {
    stop();
    setChatId(`chat_${Date.now()}`);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const openChat = (chat: StoredChat) => {
    stop(); setChatId(chat.id); setMessages(chat.messages); setInput(""); setSidebarOpen(false);
  };

  const clearHistory = () => {
    if (!account) return;
    setHistory([]); setMessages([]);
    try { localStorage.removeItem(chatStorageKey(account.username)); } catch {}
    startNewChat();
  };

  const copyMessage = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(id); window.setTimeout(() => setCopied(null), 1400); } catch {}
  };

  const updateAccount = (next: LocalAccount) => {
    setAccount(next);
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault(); setAuthError("");
    const username = authUsername.trim();
    if (username.length < 3 || authPassword.length < 6) {
      setAuthError("Username minimal 3 karakter dan password minimal 6 karakter."); return;
    }
    setAuthBusy(true);
    try {
      const passwordHash = await hashSecret(authPassword);
      const savedRaw = localStorage.getItem(ACCOUNT_KEY);
      const saved = savedRaw ? (JSON.parse(savedRaw) as LocalAccount) : null;
      if (authMode === "register") {
        if (saved) { setAuthError("Browser ini sudah memiliki akun lokal."); return; }
        updateAccount({ username, passwordHash, createdAt: Date.now(), usageDay: todayKey(), messageCount: 0, memory: "" });
      } else {
        if (!saved || saved.username.toLowerCase() !== username.toLowerCase() || saved.passwordHash !== passwordHash) {
          setAuthError("Username atau password tidak cocok."); return;
        }
        updateAccount(saved.usageDay === todayKey() ? saved : { ...saved, usageDay: todayKey(), messageCount: 0 });
      }
      setAuthPassword(""); setAuthUsername(""); setAuthOpen(false);
    } catch {
      setAuthError("Akun lokal gagal diproses di browser ini.");
    } finally { setAuthBusy(false); }
  };

  const logout = () => {
    stop(); setAccount(null); setHistory([]); setMessages([]); setMemory(""); setAuthMode("login"); setAuthOpen(true);
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  };

  const saveMemory = (value: string) => {
    setMemory(value); if (account) updateAccount({ ...account, memory: value });
  };

  const submit = (text = input) => {
    const value = text.trim();
    if (!value || busy || !account) return;
    const normalizedAccount = account.usageDay === todayKey() ? account : { ...account, usageDay: todayKey(), messageCount: 0 };
    if (normalizedAccount.messageCount >= MESSAGE_LIMIT) { setSettingsOpen(true); return; }
    updateAccount({ ...normalizedAccount, messageCount: normalizedAccount.messageCount + 1 });
    setInput("");
    sendMessage({ text: value }, { body: { model, memory: memory.trim(), user: normalizedAccount.username } }).catch(() => undefined);
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); }
  };

  return (
    <main className="wick-shell min-h-dvh">
      <div className="wick-noise" aria-hidden="true" /><div className="wick-grid" aria-hidden="true" />
      <div className="wick-orb wick-orb-a" aria-hidden="true" /><div className="wick-orb wick-orb-b" aria-hidden="true" /><div className="wick-orb wick-orb-c" aria-hidden="true" />
      {sidebarOpen && <button type="button" className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar overlay" />}

      <aside className={`wick-sidebar glass-strong fixed inset-y-0 left-0 z-40 flex flex-col border-y-0 border-l-0 p-3 shadow-2xl transition-all duration-300 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarCollapsed ? "md:w-[82px]" : "md:w-[300px]"}`}>
        <div className="flex items-center gap-3 px-2 py-2">
          <img src={WICK_LOGO} alt="WickAI" className="size-10 rounded-xl ring-1 ring-white/10" />
          {!sidebarCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">WickAI</p><p className="truncate text-xs text-zinc-500">Private AI workspace</p></div>}
          <button type="button" className="hidden rounded-lg p-2 text-zinc-500 transition hover:bg-white/6 hover:text-zinc-200 md:block" onClick={() => setSidebarCollapsed((value) => !value)} aria-label="Toggle sidebar">{sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}</button>
          <button type="button" className="rounded-lg p-2 text-zinc-500 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X className="size-4" /></button>
        </div>
        <button type="button" onClick={startNewChat} className={`wick-button-primary mt-3 flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium ${sidebarCollapsed ? "md:px-2" : ""}`}><Plus className="size-4" />{!sidebarCollapsed && "New chat"}</button>

        {!sidebarCollapsed && <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMemoryOpen((value) => !value)} className="wick-mini-card"><Database className="size-4" /><span>Memory</span></button>
            <button type="button" onClick={() => setSettingsOpen((value) => !value)} className="wick-mini-card"><Settings2 className="size-4" /><span>Settings</span></button>
          </div>
          <div className="mt-3 rounded-2xl border border-white/8 bg-black/10 p-3"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs text-zinc-500"><ShieldCheck className="size-3.5" />Daily usage</div><span className="text-xs font-medium text-zinc-300">{remaining}/{MESSAGE_LIMIT}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/6"><div className="h-full rounded-full bg-violet-300/80 transition-all" style={{ width: `${(remaining / MESSAGE_LIMIT) * 100}%` }} /></div></div>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/8 bg-black/10 px-3 py-2 text-xs text-zinc-500"><Search className="size-3.5" />Conversation library</div>
        </>}

        <div className="wick-scrollbar mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {history.length ? history.map((chat) => <button type="button" key={chat.id} onClick={() => openChat(chat)} title={sidebarCollapsed ? chat.title : undefined} className={`wick-history-item w-full rounded-2xl px-3 py-2.5 text-left transition ${chat.id === chatId ? "active" : ""}`}><div className="flex items-center gap-2"><Sparkles className="size-3.5 shrink-0 text-violet-300/70" />{!sidebarCollapsed && <div className="min-w-0"><p className="truncate text-sm text-zinc-200">{chat.title}</p><p className="mt-0.5 text-[11px] text-zinc-600">{new Date(chat.updatedAt).toLocaleDateString()}</p></div>}</div></button>) : !sidebarCollapsed ? <div className="rounded-2xl border border-dashed border-white/8 p-4 text-xs leading-5 text-zinc-600">Your conversations, saved locally for this account, will appear here.</div> : null}
        </div>

        {!sidebarCollapsed && <div className="mt-3 border-t border-white/6 pt-3">
          {memoryOpen && <div className="wick-panel mb-2 rounded-2xl p-3"><div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300"><Database className="size-3.5 text-violet-300" />Memory</div><textarea value={memory} onChange={(event) => saveMemory(event.target.value)} placeholder="Contoh: Aku suka jawaban teknis yang ringkas..." className="min-h-24 w-full resize-none rounded-xl border border-white/8 bg-black/15 p-3 text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-600" /></div>}
          {settingsOpen && <div className="wick-panel mb-2 rounded-2xl p-3"><div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300"><Settings2 className="size-3.5 text-violet-300" />Workspace controls</div><p className="text-[11px] leading-5 text-zinc-500">Local account mode aktif. Limit harian, memory, dan history berlaku di browser ini.</p><button type="button" onClick={clearHistory} className="mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"><Trash2 className="size-3.5" />Clear conversations</button></div>}
          <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-black/10 p-2"><img src={`https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(account?.username ?? "W")}&backgroundColor=7c5cff`} alt="Account" className="size-8 rounded-xl" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-zinc-200">{account?.username}</p><p className="truncate text-[10px] text-zinc-600">Local account</p></div><button type="button" onClick={logout} className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/6 hover:text-zinc-200" aria-label="Logout"><LogOut className="size-3.5" /></button></div>
        </div>}
      </aside>

      <section className={`min-h-dvh transition-[padding] duration-300 ${sidebarCollapsed ? "md:pl-[82px]" : "md:pl-[300px]"}`}>
        <header className="wick-topbar sticky top-0 z-20 flex h-[72px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2"><button type="button" className="wick-icon-button md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Menu className="size-4" /></button><div className="glass flex items-center gap-2 rounded-2xl px-2 py-1.5"><img src={WICK_LOGO} alt="WickAI" className="size-7 rounded-lg" /><div className="hidden sm:block"><p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Model</p></div><select value={model} onChange={(event) => setModel(event.target.value)} className="max-w-[180px] bg-transparent px-1.5 py-1 text-sm font-medium text-zinc-100 outline-none" aria-label="Select model">{models.map((item) => <option key={item.id} value={item.id} className="bg-zinc-950">{item.label}</option>)}</select></div></div>
          <div className="hidden items-center gap-2 sm:flex"><div className="wick-status-chip"><span className="wick-status-dot" />Streaming online</div><button type="button" className="wick-icon-button" onClick={startNewChat} aria-label="New chat"><Plus className="size-4" /></button></div>
        </header>

        <div className="mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-5xl flex-col px-4 pb-5 sm:px-6">
          <div className="wick-scrollbar flex-1 overflow-y-auto py-8 sm:py-12">
            {!messages.length ? <div className="wick-hero wick-rise flex min-h-[64dvh] flex-col items-center justify-center text-center"><div className="wick-hero-logo"><img src={WICK_LOGO} alt="WickAI" className="size-full rounded-[22px]" /></div><div className="mt-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-200/60"><span>WickAI</span><span className="size-1 rounded-full bg-violet-300/50" /><span>AI Workspace</span></div><h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">Build thoughts into something real.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">Streaming responses, local memory, conversation history, and a focused interface designed around WickAI.</p><div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">{starterPrompts.map((prompt, index) => <button key={prompt} type="button" onClick={() => submit(prompt)} className="wick-prompt-card wick-rise group text-left" style={{ animationDelay: `${index * 70}ms` }}><span className="wick-prompt-number">0{index + 1}</span><span className="min-w-0 flex-1 text-sm leading-6 text-zinc-300">{prompt}</span><ArrowUp className="size-4 -rotate-45 text-zinc-700 transition group-hover:text-zinc-300" /></button>)}</div></div> : <div className="space-y-8">{messages.map((message) => { const text = messageText(message); const isUser = message.role === "user"; const sections = isUser ? [text] : sectionize(text); return <article key={message.id} className={`wick-message ${isUser ? "user-message" : "assistant-message"}`}><div className="wick-avatar-wrap">{isUser ? <img src={`https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(account?.username ?? "W")}&backgroundColor=7c5cff`} alt="You" className="wick-avatar" /> : <img src={WICK_LOGO} alt="WickAI" className="wick-avatar" />}</div><div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-2"><span className="text-xs font-medium text-zinc-300">{isUser ? account?.username : "WickAI"}</span>{!isUser && <span className="text-[10px] text-violet-300/45">{models.find((item) => item.id === model)?.label}</span>}</div><div className="space-y-2.5">{sections.map((section, sectionIndex) => <div key={`${message.id}-${sectionIndex}`} className={`${isUser ? "wick-user-bubble" : "wick-ai-bubble"} wick-section-enter`} style={{ animationDelay: `${sectionIndex * 80}ms` }}><div className="wick-markdown whitespace-pre-wrap break-words text-[15px] leading-7 text-zinc-200">{section}</div>{!isUser && busy && message.id === messages[messages.length - 1]?.id && sectionIndex === sections.length - 1 && section ? <span className="wick-cursor" aria-hidden="true" /> : null}</div>)}</div>{!isUser && !busy && text && <div className="mt-2 flex items-center gap-1"><button type="button" onClick={() => copyMessage(message.id, text)} className="wick-inline-button" aria-label="Copy response">{copied === message.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}</button>{message.id === messages[messages.length - 1]?.id && <button type="button" onClick={() => regenerate()} className="wick-inline-button px-2">Regenerate</button>}</div>}</div></article>; })}{status === "submitted" && <div className="wick-thinking ml-11 flex items-center gap-2"><TextShimmer className="text-sm font-medium text-zinc-500" duration={2.1} spread={2}>WickAI is thinking...</TextShimmer></div>}{error && <div className="wick-rise ml-11 rounded-2xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-200">{error.message || "Something went wrong while generating the response."}</div>}<div ref={bottomRef} /></div>}
          </div>

          <form className="wick-composer glass-strong sticky bottom-3 rounded-[28px] p-2.5" onSubmit={(event) => { event.preventDefault(); submit(); }}><div className="flex items-end gap-2"><div className="min-w-0 flex-1"><textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Message WickAI..." rows={1} disabled={!account || busy || remaining === 0} className="max-h-44 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600" aria-label="Message WickAI" /><div className="flex items-center justify-between px-3 pb-1 text-[10px] text-zinc-600"><span>Enter send · Shift + Enter newline</span><span>{remaining} requests left today</span></div></div>{busy ? <button type="button" onClick={() => stop()} className="wick-send-button stop" aria-label="Stop generating"><Square className="size-4 fill-current" /></button> : <button type="submit" disabled={!input.trim() || !account || remaining === 0} className="wick-send-button" aria-label="Send message"><ArrowUp className="size-4" /></button>}</div></form>
          <p className="pt-2 text-center text-[10px] text-zinc-700">WickAI can make mistakes. Verify important information.</p>
        </div>
      </section>

      {authOpen && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/65 p-4 backdrop-blur-xl"><div className="wick-auth glass-strong w-full max-w-md rounded-[30px] p-6 shadow-2xl"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><img src={WICK_LOGO} alt="WickAI" className="size-12 rounded-2xl" /><h2 className="mt-4 text-xl font-semibold text-white">{authMode === "login" ? "Welcome back" : "Create your WickAI account"}</h2><p className="mt-1 text-sm leading-6 text-zinc-500">Local account mode untuk mengatur history, memory, dan limit di browser ini.</p></div></div><div className="mt-5 grid grid-cols-2 rounded-2xl bg-black/15 p-1"><button type="button" onClick={() => setAuthMode("login")} className={`rounded-xl px-3 py-2 text-sm ${authMode === "login" ? "bg-white/8 text-white" : "text-zinc-600"}`}>Login</button><button type="button" onClick={() => setAuthMode("register")} className={`rounded-xl px-3 py-2 text-sm ${authMode === "register" ? "bg-white/8 text-white" : "text-zinc-600"}`}>Register</button></div><form className="mt-5 space-y-3" onSubmit={handleAuth}><input value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} placeholder="Username" className="wick-auth-input" autoComplete="username" /><input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Password" className="wick-auth-input" autoComplete={authMode === "login" ? "current-password" : "new-password"} />{authError && <p className="rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs leading-5 text-red-200">{authError}</p>}<button type="submit" disabled={authBusy} className="wick-button-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium">{authMode === "login" ? <LogIn className="size-4" /> : <Plus className="size-4" />}{authBusy ? "Processing..." : authMode === "login" ? "Continue" : "Create account"}</button></form></div></div>}
    </main>
  );
}
