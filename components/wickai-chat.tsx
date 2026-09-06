"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Database,
  FileText,
  History,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useRef, useState } from "react";
import { TextShimmer } from "@/components/text-shimmer";

type StoredChat = { id: string; title: string; updatedAt: number; messages: UIMessage[] };
type WickModel = { id: string; label: string };
type Account = { username: string; passwordHash: string; createdAt: number; usageDay: string; messageCount: number; memory: string };
type AuthMode = "login" | "register";

const STORAGE = "wickai:v3";
const SESSION_KEY = `${STORAGE}:session`;
const ACCOUNTS_KEY = `${STORAGE}:accounts`;
const LIMIT = 30;
const SECTION_SEPARATOR = "---WICK-SECTION---";
const fallbackModels: WickModel[] = [
  { id: "wick-fast", label: "Wick Fast" },
  { id: "wick-1.5", label: "Wick 1.5" },
  { id: "wick-ultra2.3", label: "Wick Ultra 2.3" },
  { id: "wick-chat", label: "Wick Chat" },
];
const prompts = [
  { title: "Build", text: "Ubah ide saya menjadi rencana yang jelas." },
  { title: "Code", text: "Bantu saya membangun fitur Next.js." },
  { title: "Research", text: "Bandingkan beberapa pilihan untuk saya." },
  { title: "Create", text: "Buat konsep atau draft yang siap dikembangkan." },
];

function chatKey(username: string) { return `${STORAGE}:chats:${username}`; }
function todayKey() { return new Date().toISOString().slice(0, 10); }
function textOf(message: UIMessage) { return message.parts.filter((part) => part.type === "text").map((part) => part.text).join(""); }
function sectionsOf(text: string) { return text.split(SECTION_SEPARATOR).map((part) => part.trim()).filter(Boolean); }
async function hashPassword(password: string) { const data = new TextEncoder().encode(password); const digest = await crypto.subtle.digest("SHA-256", data); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }

function Markdown({ content }: { content: string }) {
  return <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      pre: ({ children }) => <pre className="wk-code">{children}</pre>,
      code: ({ className, children, ...props }) => <code className={className ? "wk-code-inline" : "wk-code-inline"} {...props}>{children}</code>,
      table: ({ children }) => <div className="wk-table"><table>{children}</table></div>,
      blockquote: ({ children }) => <blockquote className="wk-quote">{children}</blockquote>,
      a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
    }}
  >{content}</ReactMarkdown>;
}

export function WickAIChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [composer, setComposer] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [model, setModel] = useState("wick-fast");
  const [models, setModels] = useState(fallbackModels);
  const [chatId, setChatId] = useState(() => `chat_${Date.now()}`);
  const [history, setHistory] = useState<StoredChat[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [memoryDraft, setMemoryDraft] = useState("");
  const [panel, setPanel] = useState<"none" | "settings" | "memory">("none");
  const [search, setSearch] = useState("");
  const [showScroll, setShowScroll] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const chat = useChat({ transport });
  const { messages, setMessages, sendMessage, status, stop, error, regenerate } = chat;
  const busy = status === "submitted" || status === "streaming";
  const usage = account ? Math.min(account.messageCount, LIMIT) : 0;
  const remaining = Math.max(LIMIT - usage, 0);
  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? history.filter((item) => item.title.toLowerCase().includes(q)) : history;
  }, [history, search]);

  useEffect(() => {
    try {
      const username = localStorage.getItem(SESSION_KEY);
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (!username || !raw) return;
      const accounts = JSON.parse(raw) as Record<string, Account>;
      const current = accounts[username];
      if (!current) return;
      const normalized = current.usageDay === todayKey() ? current : { ...current, usageDay: todayKey(), messageCount: 0 };
      setAccount(normalized);
      setMemoryDraft(normalized.memory);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [username]: normalized }));
    } catch {}
  }, []);

  useEffect(() => {
    if (!account) { setHistory([]); setMessages([]); return; }
    try {
      const raw = localStorage.getItem(chatKey(account.username));
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredChat[];
      if (!Array.isArray(stored)) return;
      const sorted = stored.sort((a, b) => b.updatedAt - a.updatedAt);
      setHistory(sorted);
      if (sorted[0]) { setChatId(sorted[0].id); setMessages(sorted[0].messages); }
    } catch {}
  }, [account, setMessages]);

  useEffect(() => {
    fetch("/api/models").then((r) => r.ok ? r.json() : Promise.reject()).then((data: { models?: WickModel[] }) => {
      if (!data.models?.length) return;
      setModels(data.models);
      setModel((current) => data.models!.some((item) => item.id === current) ? current : data.models![0].id);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!account || !messages.length) return;
    const firstUser = messages.find((message) => message.role === "user");
    const title = firstUser ? textOf(firstUser).trim().replace(/\s+/g, " ").slice(0, 54) || "New conversation" : "New conversation";
    const next: StoredChat = { id: chatId, title, updatedAt: Date.now(), messages };
    setHistory((current) => {
      const merged = [next, ...current.filter((item) => item.id !== chatId)].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 50);
      try { localStorage.setItem(chatKey(account.username), JSON.stringify(merged)); } catch {}
      return merged;
    });
  }, [messages, chatId, account]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onScroll = () => setShowScroll(viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight > 300);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, status]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => { if (media.matches) setSidebarOpen(false); };
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen && window.matchMedia("(max-width: 900px)").matches ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const startNewChat = () => { stop(); setChatId(`chat_${Date.now()}`); setMessages([]); setComposer(""); setPanel("none"); setSidebarOpen(false); textareaRef.current?.focus(); };
  const openChat = (item: StoredChat) => { stop(); setChatId(item.id); setMessages(item.messages); setComposer(""); setSidebarOpen(false); };
  const clearHistory = () => { if (!account) return; setHistory([]); localStorage.removeItem(chatKey(account.username)); startNewChat(); };
  const saveAccount = (next: Account) => {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const accounts = raw ? (JSON.parse(raw) as Record<string, Account>) : {};
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [next.username]: next }));
    localStorage.setItem(SESSION_KEY, next.username);
    setAccount(next); setMemoryDraft(next.memory); setAuthMode(null); setUsernameInput(""); setPasswordInput(""); setAuthError("");
  };
  const logout = () => { stop(); localStorage.removeItem(SESSION_KEY); setAccount(null); setHistory([]); setMessages([]); setChatId(`chat_${Date.now()}`); setPanel("none"); };
  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    const username = usernameInput.trim().toLowerCase();
    const password = passwordInput;
    setAuthError("");
    if (username.length < 3 || username.length > 24) { setAuthError("Username harus 3–24 karakter."); return; }
    if (password.length < 6) { setAuthError("Password minimal 6 karakter."); return; }
    const hash = await hashPassword(password);
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const accounts = raw ? (JSON.parse(raw) as Record<string, Account>) : {};
    if (authMode === "register") {
      if (accounts[username]) { setAuthError("Akun sudah terdaftar."); return; }
      saveAccount({ username, passwordHash: hash, createdAt: Date.now(), usageDay: todayKey(), messageCount: 0, memory: "" });
      startNewChat(); return;
    }
    const found = accounts[username];
    if (!found || found.passwordHash !== hash) { setAuthError("Username atau password salah."); return; }
    saveAccount(found.usageDay === todayKey() ? found : { ...found, usageDay: todayKey(), messageCount: 0 });
    startNewChat();
  };
  const persistMemory = () => {
    if (!account) return;
    saveAccount({ ...account, memory: memoryDraft.slice(0, 2400) });
    setPanel("none");
  };
  const copyMessage = async (id: string, content: string) => { try { await navigator.clipboard.writeText(content); setCopied(id); window.setTimeout(() => setCopied(null), 1400); } catch {} };
  const submit = (value = composer) => {
    const text = value.trim();
    if (!text || busy) return;
    if (!account) { setAuthMode("login"); return; }
    if (remaining <= 0) return;
    setComposer("");
    const next = { ...account, usageDay: todayKey(), messageCount: account.usageDay === todayKey() ? account.messageCount + 1 : 1 };
    saveAccount(next);
    sendMessage({ text }, { body: { model, memory: next.memory, username: next.username } }).catch(() => undefined);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } };

  return (
    <main className="wk-shell">
      <aside className={`wk-rail ${sidebarCollapsed ? "is-mini" : ""} ${sidebarOpen ? "is-open" : ""}`}>
        <div className="wk-rail-head">
          <button className="wk-brand" onClick={startNewChat} aria-label="WickAI home"><span className="wk-brand-mark"><Sparkles size={15} /></span>{!sidebarCollapsed && <span><strong>WickAI</strong><small>AI workspace</small></span>}</button>
          <button className="wk-icon" onClick={() => sidebarCollapsed ? setSidebarCollapsed(false) : setSidebarOpen(false)} aria-label={sidebarCollapsed ? "Expand navigation" : "Close navigation"}><X size={16} /></button>
        </div>
        <button className="wk-new" onClick={startNewChat}><Plus size={17} />{!sidebarCollapsed && <span>New conversation</span>}</button>
        {!sidebarCollapsed && <>
          <label className="wk-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" /><kbd>⌘ K</kbd></label>
          <div className="wk-label">Recent</div>
          <div className="wk-history">{filteredHistory.length ? filteredHistory.map((item) => <button key={item.id} className={`wk-thread ${item.id === chatId ? "active" : ""}`} onClick={() => openChat(item)}><History size={15} /><span>{item.title}</span><MoreHorizontal size={15} /></button>) : <div className="wk-empty"><Archive size={18} /><span>No conversations yet</span></div>}</div>
          <div className="wk-rail-fill" />
          <div className="wk-usage"><div className="wk-usage-icon"><ShieldCheck size={14} /></div><div><div className="wk-usage-row"><span>Daily messages</span><b>{remaining}</b></div><div className="wk-progress"><i style={{ width: `${Math.min((usage / LIMIT) * 100, 100)}%` }} /></div><small>{account ? `${usage}/${LIMIT} used today` : "Sign in to track usage"}</small></div></div>
          <div className="wk-account"><div className="wk-avatar">{(account?.username || "G").slice(0, 1).toUpperCase()}</div><button onClick={() => setPanel(panel === "settings" ? "none" : "settings")}><strong>{account?.username || "Guest"}</strong><small>{account ? "Member" : "Local session"}</small></button><button className="wk-icon" onClick={() => setPanel(panel === "settings" ? "none" : "settings")} aria-label="Settings"><Settings2 size={15} /></button></div>
          {panel === "settings" && <div className="wk-menu"><button onClick={() => setPanel("memory")}><Database size={14} />Memory</button><button onClick={() => setSidebarCollapsed((v) => !v)}><PanelLeft size={14} />Collapse sidebar</button>{account && <button onClick={clearHistory}><Trash2 size={14} />Clear history</button>}{account ? <button onClick={logout}><LogOut size={14} />Log out</button> : <button onClick={() => setAuthMode("login")}><LogIn size={14} />Sign in</button>}</div>}
        </>}
      </aside>
      {sidebarOpen && <button className="wk-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <section className="wk-stage">
        <header className="wk-header">
          <div className="wk-header-left"><button className="wk-icon wk-mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={17} /></button><div className="wk-model"><span className="wk-model-dot" /><span><small>MODEL</small><b>{models.find((item) => item.id === model)?.label ?? model}</b></span><ChevronDown size={14} /><select value={model} onChange={(event) => setModel(event.target.value)} aria-label="Select model">{models.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div></div>
          <div className="wk-header-actions"><button className="wk-header-link" onClick={() => setPanel("memory")}><Database size={15} />Memory</button><button className="wk-icon" onClick={startNewChat} aria-label="New conversation"><Plus size={17} /></button></div>
        </header>

        <div ref={viewportRef} className="wk-viewport">
          {messages.length === 0 ? <section className="wk-home">
            <div className="wk-home-mark"><Sparkles size={22} /></div>
            <div className="wk-kicker">WICKAI</div>
            <h1>What can we build today?</h1>
            <p>A clean workspace for thinking, coding, researching, and creating.</p>
            <div className="wk-prompts">{prompts.map((prompt, index) => <button key={prompt.title} style={{ animationDelay: `${index * 55}ms` }} onClick={() => submit(prompt.text)}><span><b>{prompt.title}</b><small>{prompt.text}</small></span><ArrowUp size={15} /></button>)}</div>
          </section> : <section className="wk-thread-list">
            {messages.map((message, index) => {
              const text = textOf(message);
              const sections = sectionsOf(text);
              const assistant = message.role === "assistant";
              return <article key={message.id} className={`wk-message ${assistant ? "assistant" : "user"}`}>
                <div className={`wk-message-avatar ${assistant ? "ai" : "me"}`}>{assistant ? <Sparkles size={14} /> : (account?.username || "G").slice(0, 1).toUpperCase()}</div>
                <div className="wk-message-main">
                  <div className="wk-message-head"><strong>{assistant ? "WickAI" : account?.username || "You"}</strong><span>{assistant ? "Assistant" : "You"}</span></div>
                  <div className="wk-message-content">{assistant ? sections.map((section, sectionIndex) => <div key={`${message.id}-${sectionIndex}`}><Markdown content={section} /></div>) : <div className="wk-user-text">{text}</div>}{assistant && index === messages.length - 1 && busy && <span className="wk-cursor" />}</div>
                  {assistant && <div className="wk-actions"><button onClick={() => copyMessage(message.id, text)}>{copied === message.id ? <Check size={13} /> : <Copy size={13} />}{copied === message.id ? "Copied" : "Copy"}</button>{index === messages.length - 1 && <button onClick={() => regenerate()}><ArrowUp size={13} />Regenerate</button>}</div>}
                </div>
              </article>;
            })}
            {busy && messages[messages.length - 1]?.role === "user" && <div className="wk-thinking"><span className="wk-thinking-dot" /><TextShimmer className="wk-shimmer" duration={2.4}>WickAI is thinking…</TextShimmer></div>}
            {error && <div className="wk-error">{error.message || "Something went wrong. Please try again."}</div>}
            <div ref={bottomRef} />
          </section>}
          {showScroll && <button className="wk-scroll" onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })} aria-label="Scroll to bottom"><ArrowDown size={16} /></button>}
        </div>

        <div className={`wk-composer-wrap ${composerFocused ? "focused" : ""}`}>
          <form className="wk-composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <textarea ref={textareaRef} value={composer} onChange={(event) => { setComposer(event.target.value); event.currentTarget.style.height = "auto"; event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 180)}px`; }} onKeyDown={onKeyDown} onFocus={() => setComposerFocused(true)} onBlur={() => setComposerFocused(false)} placeholder="Message WickAI…" rows={1} aria-label="Message WickAI" />
            <div className="wk-composer-foot"><span>{account ? `${remaining} messages left today` : "Sign in to save conversations"}</span><button className="wk-send" type={busy ? "button" : "submit"} onClick={busy ? stop : undefined} disabled={!busy && !composer.trim()} aria-label={busy ? "Stop generation" : "Send message"}>{busy ? <Square size={14} fill="currentColor" /> : <ArrowUp size={17} />}</button></div>
          </form>
          <p className="wk-disclaimer">WickAI may make mistakes. Verify important information.</p>
        </div>
      </section>

      {(authMode || panel === "memory") && <div className="wk-modal-layer" onMouseDown={() => authMode ? setAuthMode(null) : setPanel("none")}>
        {authMode ? <form className="wk-modal" onSubmit={submitAuth} onMouseDown={(event) => event.stopPropagation()}><div className="wk-modal-icon"><Sparkles size={18} /></div><h2>{authMode === "login" ? "Welcome back" : "Create your WickAI account"}</h2><p>{authMode === "login" ? "Sign in to keep your conversations and memory together." : "Your session stays local to this browser."}</p><label>Username<input value={usernameInput} onChange={(event) => setUsernameInput(event.target.value)} autoComplete="username" autoFocus /></label><label>Password<input value={passwordInput} onChange={(event) => setPasswordInput(event.target.value)} type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>{authError && <div className="wk-auth-error">{authError}</div>}<button className="wk-primary" type="submit">{authMode === "login" ? "Sign in" : "Create account"}</button><button className="wk-switch" type="button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></form> : <div className="wk-modal wk-memory" onMouseDown={(event) => event.stopPropagation()}><div className="wk-modal-top"><div><div className="wk-modal-icon"><Database size={17} /></div><h2>Memory</h2></div><button className="wk-icon" onClick={() => setPanel("none")} aria-label="Close"><X size={16} /></button></div><p>Optional notes WickAI can use as conversation context.</p><textarea value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} maxLength={2400} placeholder="Example: I prefer TypeScript and concise explanations." /><div className="wk-memory-foot"><span>{memoryDraft.length}/2400</span><button className="wk-primary" onClick={persistMemory}>Save memory</button></div></div>}
      </div>}
    </main>
  );
}
