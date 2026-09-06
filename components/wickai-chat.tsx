"use client";

import { useAISDKRuntime } from "@assistant-ui/ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
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
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useRef, useState } from "react";
import { TextShimmer } from "@/components/text-shimmer";

type StoredChat = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

type WickModel = { id: string; label: string };
type Account = {
  username: string;
  passwordHash: string;
  createdAt: number;
  usageDay: string;
  messageCount: number;
  memory: string;
};

type AuthMode = "login" | "register";

const STORAGE_PREFIX = "wickai:v2";
const SESSION_KEY = `${STORAGE_PREFIX}:session`;
const ACCOUNTS_KEY = `${STORAGE_PREFIX}:accounts`;
const LIMIT_PER_DAY = 30;
const SECTION_SEPARATOR = "---WICK-SECTION---";
const fallbackModels: WickModel[] = [
  { id: "wick-fast", label: "Wick Fast" },
  { id: "wick-1.5", label: "Wick 1.5" },
  { id: "wick-ultra2.3", label: "Wick Ultra 2.3" },
  { id: "wick-chat", label: "Wick Chat" },
];

const starterPrompts = [
  "Jelaskan apa itu AI secara sederhana",
  "Bantu saya membangun fitur Next.js",
  "Ubah ide saya menjadi rencana yang jelas",
  "Review kode saya dan cari cara memperbaikinya",
];

function chatKey(username: string) {
  return `${STORAGE_PREFIX}:chats:${username}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function textOf(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function sectionsOf(text: string) {
  return text
    .split(SECTION_SEPARATOR)
    .map((section) => section.trim())
    .filter(Boolean);
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function WickAIChat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [composer, setComposer] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [model, setModel] = useState(fallbackModels[0].id);
  const [models, setModels] = useState(fallbackModels);
  const [chatId, setChatId] = useState(() => `chat_${Date.now()}`);
  const [history, setHistory] = useState<StoredChat[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [memoryDraft, setMemoryDraft] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [darkAccent, setDarkAccent] = useState("violet");
  const bottomRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const chat = useChat({ transport });
  const runtime = useAISDKRuntime(chat);
  const { messages, setMessages, sendMessage, status, stop, error, regenerate } = chat;
  const busy = status === "submitted" || status === "streaming";
  const usage = account
    ? Math.min(account.messageCount, LIMIT_PER_DAY)
    : 0;
  const remaining = Math.max(LIMIT_PER_DAY - usage, 0);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return history;
    return history.filter((item) => item.title.toLowerCase().includes(query));
  }, [history, search]);

  useEffect(() => {
    try {
      const currentUser = localStorage.getItem(SESSION_KEY);
      const rawAccounts = localStorage.getItem(ACCOUNTS_KEY);
      if (currentUser && rawAccounts) {
        const accounts = JSON.parse(rawAccounts) as Record<string, Account>;
        const current = accounts[currentUser];
        if (current) {
          const normalized =
            current.usageDay === todayKey()
              ? current
              : { ...current, usageDay: todayKey(), messageCount: 0 };
          setAccount(normalized);
          setMemoryDraft(normalized.memory);
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [currentUser]: normalized }));
        }
      }
    } catch {
      // Ignore malformed local account data.
    }
  }, []);

  useEffect(() => {
    if (!account) {
      setHistory([]);
      setMessages([]);
      return;
    }
    try {
      const raw = localStorage.getItem(chatKey(account.username));
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredChat[];
      if (!Array.isArray(stored)) return;
      const sorted = stored.sort((a, b) => b.updatedAt - a.updatedAt);
      setHistory(sorted);
      if (sorted[0]) {
        setChatId(sorted[0].id);
        setMessages(sorted[0].messages);
      }
    } catch {
      // Ignore malformed chat history.
    }
  }, [account, setMessages]);

  useEffect(() => {
    fetch("/api/models")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { models?: WickModel[] }) => {
        if (!data.models?.length) return;
        setModels(data.models);
        setModel((current) =>
          data.models!.some((item) => item.id === current) ? current : data.models![0].id,
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!account || !messages.length) return;
    const firstUser = messages.find((message) => message.role === "user");
    const title = firstUser
      ? textOf(firstUser).trim().replace(/\s+/g, " ").slice(0, 54) || "New conversation"
      : "New conversation";
    const next: StoredChat = { id: chatId, title, updatedAt: Date.now(), messages };
    setHistory((current) => {
      const merged = [next, ...current.filter((item) => item.id !== chatId)]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 50);
      try {
        localStorage.setItem(chatKey(account.username), JSON.stringify(merged));
      } catch {
        // Ignore storage limits.
      }
      return merged;
    });
  }, [messages, chatId, account]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onScroll = () => {
      const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setShowScrollButton(distance > 320);
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const startNewChat = () => {
    stop();
    setChatId(`chat_${Date.now()}`);
    setMessages([]);
    setComposer("");
    setSettingsOpen(false);
    setMemoryOpen(false);
    textareaRef.current?.focus();
    setSidebarOpen(false);
  };

  const openChat = (chatItem: StoredChat) => {
    stop();
    setChatId(chatItem.id);
    setMessages(chatItem.messages);
    setComposer("");
    setSidebarOpen(false);
  };

  const clearHistory = () => {
    if (!account) return;
    setHistory([]);
    try {
      localStorage.removeItem(chatKey(account.username));
    } catch {
      // Ignore storage errors.
    }
    startNewChat();
  };

  const logout = () => {
    stop();
    localStorage.removeItem(SESSION_KEY);
    setAccount(null);
    setAuthMode(null);
    setHistory([]);
    setMessages([]);
    setChatId(`chat_${Date.now()}`);
  };

  const saveAccount = (next: Account) => {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const accounts = raw ? (JSON.parse(raw) as Record<string, Account>) : {};
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [next.username]: next }));
    localStorage.setItem(SESSION_KEY, next.username);
    setAccount(next);
    setMemoryDraft(next.memory);
    setAuthMode(null);
    setUsernameInput("");
    setPasswordInput("");
    setAuthError("");
  };

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    const username = usernameInput.trim().toLowerCase();
    const password = passwordInput;
    setAuthError("");
    if (username.length < 3 || username.length > 24) {
      setAuthError("Username harus 3–24 karakter.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password minimal 6 karakter.");
      return;
    }
    const hash = await hashPassword(password);
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const accounts = raw ? (JSON.parse(raw) as Record<string, Account>) : {};
    if (authMode === "register") {
      if (accounts[username]) {
        setAuthError("Akun sudah terdaftar.");
        return;
      }
      saveAccount({
        username,
        passwordHash: hash,
        createdAt: Date.now(),
        usageDay: todayKey(),
        messageCount: 0,
        memory: "",
      });
      startNewChat();
      return;
    }
    const found = accounts[username];
    if (!found || found.passwordHash !== hash) {
      setAuthError("Username atau password salah.");
      return;
    }
    const next = found.usageDay === todayKey()
      ? found
      : { ...found, usageDay: todayKey(), messageCount: 0 };
    saveAccount(next);
    startNewChat();
  };

  const persistMemory = () => {
    if (!account) return;
    const next = { ...account, memory: memoryDraft.slice(0, 2400) };
    saveAccount(next);
    setMemoryOpen(false);
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      // Ignore clipboard permissions.
    }
  };

  const submit = (text = composer) => {
    const value = text.trim();
    if (!value || busy) return;
    if (!account) {
      setAuthMode("login");
      return;
    }
    if (remaining <= 0) return;
    setComposer("");
    const next = {
      ...account,
      usageDay: todayKey(),
      messageCount: account.usageDay === todayKey() ? account.messageCount + 1 : 1,
    };
    saveAccount(next);
    sendMessage({ text: value }, { body: { model, memory: next.memory, username: next.username } }).catch(() => undefined);
  };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <main className={`wick-app ${darkAccent === "blue" ? "wick-accent-blue" : "wick-accent-violet"}`}>
        <div className="wick-aurora" aria-hidden="true" />
        <div className="wick-grid" aria-hidden="true" />

        <aside
          className={`wick-sidebar ${sidebarCollapsed ? "is-collapsed" : ""} ${sidebarOpen ? "is-mobile-open" : ""}`}
          aria-label="Conversation sidebar"
        >
          <div className="wick-brand">
            <img src="https://api.dicebear.com/9.x/shapes/png?seed=wickai&backgroundColor=0b0b12" alt="WickAI" />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="wick-brand-name">WickAI</div>
                <div className="wick-brand-sub">AI workspace</div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button className="wick-icon-button ml-auto md-only" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="wick-sidebar-actions">
            <button className="wick-new-chat" onClick={startNewChat}>
              <Plus size={17} />
              {!sidebarCollapsed && <span>New chat</span>}
            </button>
            <button className="wick-icon-button sidebar-collapse-button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label="Toggle sidebar">
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <label className="wick-search">
                <Search size={15} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" />
                <kbd>/</kbd>
              </label>

              <div className="wick-side-section-label">Recent</div>
              <div className="wick-history wick-scrollbar">
                {filteredHistory.length ? (
                  filteredHistory.map((item) => (
                    <button key={item.id} className={`wick-thread-row ${item.id === chatId ? "is-active" : ""}`} onClick={() => openChat(item)}>
                      <History size={15} />
                      <span className="truncate">{item.title}</span>
                      <span className="wick-thread-more"><MoreHorizontal size={15} /></span>
                    </button>
                  ))
                ) : (
                  <div className="wick-empty-side">
                    <Archive size={18} />
                    <span>Your conversations will appear here.</span>
                  </div>
                )}
              </div>

              <div className="wick-sidebar-spacer" />

              <div className="wick-usage-card">
                <div className="wick-usage-icon"><ShieldCheck size={15} /></div>
                <div className="min-w-0 flex-1">
                  <div className="wick-usage-top"><span>Daily usage</span><strong>{remaining}</strong></div>
                  <div className="wick-progress"><span style={{ width: `${Math.min((usage / LIMIT_PER_DAY) * 100, 100)}%` }} /></div>
                  <p>{account ? `${usage}/${LIMIT_PER_DAY} messages used today` : "Login to track your usage"}</p>
                </div>
              </div>

              <div className="wick-account-card">
                <div className="wick-avatar"><img src={`https://api.dicebear.com/9.x/initials/png?seed=${account?.username || "Guest"}&backgroundColor=11111a&fontSize=42`} alt="Account" /></div>
                {!account ? (
                  <button className="wick-account-main" onClick={() => setAuthMode("login")}>
                    <span>Sign in</span>
                    <small>Save chats & memory</small>
                  </button>
                ) : (
                  <div className="wick-account-main">
                    <span>{account.username}</span>
                    <small>WickAI member</small>
                  </div>
                )}
                <button className="wick-icon-button" onClick={() => setSettingsOpen((value) => !value)} aria-label="Settings"><Settings2 size={16} /></button>
              </div>

              {settingsOpen && (
                <div className="wick-sidebar-popover">
                  <button onClick={() => setMemoryOpen(true)}><Database size={15} /> Memory</button>
                  <button onClick={() => setDarkAccent((value) => value === "violet" ? "blue" : "violet")}><Sparkles size={15} /> Accent: {darkAccent}</button>
                  {account && <button onClick={clearHistory}><Trash2 size={15} /> Clear history</button>}
                  {account && <button onClick={logout}><LogOut size={15} /> Log out</button>}
                </div>
              )}
            </>
          )}
        </aside>

        {sidebarOpen && <button className="wick-mobile-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />}

        <section className={`wick-main ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <header className="wick-topbar">
            <div className="wick-topbar-left">
              <button className="wick-icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Menu size={17} /></button>
              <div className="wick-model-picker">
                <div className="wick-model-mark"><Sparkles size={14} /></div>
                <div className="wick-model-copy">
                  <span>WickAI</span>
                  <strong>{models.find((item) => item.id === model)?.label ?? model}</strong>
                </div>
                <ChevronDown size={14} />
                <select value={model} onChange={(event) => setModel(event.target.value)} aria-label="Select model">
                  {models.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </div>
            </div>

            <div className="wick-topbar-right">
              {account && <button className="wick-pill" onClick={() => setMemoryOpen(true)}><Database size={13} /> Memory</button>}
              {!account && <button className="wick-pill" onClick={() => setAuthMode("login")}><LogIn size={13} /> Sign in</button>}
              <button className="wick-icon-button" onClick={startNewChat} aria-label="New chat"><Plus size={16} /></button>
            </div>
          </header>

          <div ref={viewportRef} className="wick-thread-viewport wick-scrollbar">
            {!messages.length ? (
              <div className="wick-welcome">
                <div className="wick-welcome-avatar">
                  <img src="https://api.dicebear.com/9.x/shapes/png?seed=wickai-core&backgroundColor=11111a" alt="WickAI" />
                  <span className="wick-live-dot" />
                </div>
                <div className="wick-eyebrow">Personal AI workspace</div>
                <h1>What are we building today?</h1>
                <p>WickAI turns questions, ideas, and code into focused conversations with fast streaming responses.</p>

                <div className="wick-suggestion-grid">
                  {starterPrompts.map((prompt, index) => (
                    <button key={prompt} className="wick-suggestion" style={{ animationDelay: `${index * 70}ms` }} onClick={() => submit(prompt)}>
                      <span>{prompt}</span>
                      <ArrowUp size={15} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="wick-messages">
                {messages.map((message, messageIndex) => {
                  const rawText = textOf(message);
                  const sections = sectionsOf(rawText);
                  const isUser = message.role === "user";
                  return (
                    <article key={message.id} className={`wick-message ${isUser ? "is-user" : "is-assistant"}`}>
                      <div className="wick-message-avatar">
                        <img src={isUser
                          ? `https://api.dicebear.com/9.x/initials/png?seed=${account?.username || "You"}&backgroundColor=11111a&fontSize=42`
                          : "https://api.dicebear.com/9.x/shapes/png?seed=wickai-assistant&backgroundColor=11111a"} alt={isUser ? "You" : "WickAI"} />
                      </div>
                      <div className="wick-message-body">
                        <div className="wick-message-meta"><span>{isUser ? (account?.username || "You") : "WickAI"}</span><small>{messageIndex + 1}</small></div>
                        <div className="wick-section-stack">
                          {sections.map((section, sectionIndex) => (
                            <div key={`${message.id}-${sectionIndex}`} className={`wick-bubble ${isUser ? "wick-user-bubble" : "wick-ai-bubble"}`}>
                              {isUser ? (
                                <div className="whitespace-pre-wrap break-words">{section}</div>
                              ) : (
                                <div className="wick-markdown">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
                                      pre: ({ children }) => <pre className="wick-code-block">{children}</pre>,
                                      code: ({ className, children, ...props }) => (
                                        <code className={className || "wick-inline-code"} {...props}>{children}</code>
                                      ),
                                      table: ({ children }) => <div className="wick-table-wrap"><table>{children}</table></div>,
                                      blockquote: ({ children }) => <blockquote className="wick-quote">{children}</blockquote>,
                                    }}
                                  >{section}</ReactMarkdown>
                                </div>
                              )}
                            </div>
                          ))}
                          {!isUser && busy && messageIndex === messages.length - 1 ? <span className="wick-stream-cursor" aria-hidden="true" /> : null}
                        </div>
                        {!isUser && !busy && rawText && (
                          <div className="wick-action-row">
                            <button onClick={() => copyMessage(message.id, rawText)}>{copied === message.id ? <Check size={14} /> : <Copy size={14} />} {copied === message.id ? "Copied" : "Copy"}</button>
                            {messageIndex === messages.length - 1 && <button onClick={() => regenerate()}><ArrowDown size={14} /> Regenerate</button>}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}

                {status === "submitted" && (
                  <div className="wick-thinking">
                    <div className="wick-thinking-mark"><img src="https://api.dicebear.com/9.x/shapes/png?seed=wickai-thinking&backgroundColor=11111a" alt="" /></div>
                    <TextShimmer className="wick-wave-text" duration={1.7} spread={2.8} baseColor="rgba(161,161,170,.3)" shimmerColor="rgba(244,244,245,.98)">WickAI is thinking…</TextShimmer>
                  </div>
                )}

                {error && (
                  <div className="wick-error">{error.message || "WickAI gagal memproses permintaan."}</div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {showScrollButton && <button className="wick-scroll-bottom" onClick={scrollToBottom} aria-label="Scroll to bottom"><ArrowDown size={16} /></button>}

          <div className="wick-composer-wrap">
            <form className="wick-composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
              <div className="wick-composer-topline">
                <span className="wick-composer-status"><span className="wick-status-dot" /> {busy ? "Streaming response" : account ? "Ready" : "Guest mode"}</span>
                <span className="wick-composer-hint">Enter to send · Shift + Enter for new line</span>
              </div>
              <div className="wick-composer-row">
                <textarea
                  ref={textareaRef}
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder="Message WickAI..."
                  rows={1}
                  disabled={busy}
                  className="wick-textarea"
                  aria-label="Message WickAI"
                />
                {busy ? (
                  <button type="button" className="wick-send-stop" onClick={() => stop()} aria-label="Stop generating"><Square size={15} fill="currentColor" /></button>
                ) : (
                  <button type="submit" className="wick-send" disabled={!composer.trim() || remaining <= 0} aria-label="Send message"><ArrowUp size={17} /></button>
                )}
              </div>
            </form>
            <div className="wick-disclaimer">WickAI may make mistakes. Verify important information.</div>
          </div>
        </section>

        {memoryOpen && (
          <div className="wick-modal-layer" role="dialog" aria-modal="true" aria-label="WickAI memory">
            <div className="wick-modal">
              <div className="wick-modal-head"><div><h2>Memory</h2><p>Things WickAI should remember for this account.</p></div><button className="wick-icon-button" onClick={() => setMemoryOpen(false)}><X size={16} /></button></div>
              <textarea className="wick-memory-editor" value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} maxLength={2400} placeholder="Contoh: Saya lebih suka jawaban singkat, saya sedang belajar Next.js..." />
              <div className="wick-modal-foot"><span>{memoryDraft.length}/2400</span><button className="wick-modal-primary" onClick={persistMemory}>Save memory</button></div>
            </div>
          </div>
        )}

        {authMode && (
          <div className="wick-modal-layer" role="dialog" aria-modal="true" aria-label="WickAI authentication">
            <form className="wick-modal wick-auth-modal" onSubmit={submitAuth}>
              <div className="wick-auth-brand"><img src="https://api.dicebear.com/9.x/shapes/png?seed=wickai-auth&backgroundColor=11111a" alt="WickAI" /></div>
              <div className="wick-modal-head centered"><div><h2>{authMode === "login" ? "Welcome back" : "Create your WickAI account"}</h2><p>{authMode === "login" ? "Sign in to restore chats, memory, and usage." : "Your account stays local for now while we build the full backend auth layer."}</p></div><button type="button" className="wick-icon-button" onClick={() => setAuthMode(null)}><X size={16} /></button></div>
              <label className="wick-field"><span>Username</span><input value={usernameInput} onChange={(event) => setUsernameInput(event.target.value)} autoComplete="username" /></label>
              <label className="wick-field"><span>Password</span><input value={passwordInput} onChange={(event) => setPasswordInput(event.target.value)} type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>
              {authError && <div className="wick-auth-error">{authError}</div>}
              <button className="wick-modal-primary auth-submit" type="submit">{authMode === "login" ? "Sign in" : "Create account"}</button>
              <button type="button" className="wick-modal-switch" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>
                {authMode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
              </button>
            </form>
          </div>
        )}

        {mobileInfoOpen && (
          <button className="wick-info-sheet" onClick={() => setMobileInfoOpen(false)} aria-label="Close info"><FileText size={16} /> WickAI workspace status</button>
        )}
      </main>
    </AssistantRuntimeProvider>
  );
}
