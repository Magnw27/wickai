"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import {
  ArrowUp,
  Bot,
  Check,
  Copy,
  Menu,
  Plus,
  Search,
  Sparkles,
  Square,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type StoredChat = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

type WickModel = { id: string; label: string };

const STORAGE_KEY = "wickai:chats:v1";
const fallbackModels: WickModel[] = [
  { id: "wick-fast", label: "Wick Fast" },
  { id: "wick-1.5", label: "Wick 1.5" },
  { id: "wick-ultra2.3", label: "Wick Ultra 2.3" },
  { id: "wick-chat", label: "Wick Chat" },
];

const starterPrompts = [
  "Jelasin apa yang dimaksud AI?",
  "Who's create WickAI?",
  "Turn my rough idea into a plan",
  "Review this code for improvements",
];

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function WickAIChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [model, setModel] = useState(fallbackModels[0].id);
  const [models, setModels] = useState(fallbackModels);
  const [chatId, setChatId] = useState(() => `chat_${Date.now()}`);
  const [history, setHistory] = useState<StoredChat[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    error,
    regenerate,
  } = useChat({ transport });

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
    } catch {
      // Ignore malformed local history.
    }
  }, [setMessages]);

  useEffect(() => {
    fetch("/api/models")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { models?: WickModel[] }) => {
        if (!data.models?.length) return;
        setModels(data.models);
        setModel((current) =>
          data.models!.some((item) => item.id === current)
            ? current
            : data.models![0].id,
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!messages.length) return;

    const firstUser = messages.find((message) => message.role === "user");
    const title = firstUser
      ? messageText(firstUser).trim().slice(0, 46) || "New conversation"
      : "New conversation";

    const next: StoredChat = {
      id: chatId,
      title,
      updatedAt: Date.now(),
      messages,
    };

    setHistory((current) => {
      const merged = [
        next,
        ...current.filter((item) => item.id !== chatId),
      ]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 20);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Storage can be unavailable in restricted browser contexts.
      }

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
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const openChat = (chat: StoredChat) => {
    stop();
    setChatId(chat.id);
    setMessages(chat.messages);
    setInput("");
    setSidebarOpen(false);
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      // Clipboard access may be blocked by browser permissions.
    }
  };

  const submit = (text = input) => {
    const value = text.trim();
    if (!value || busy) return;

    setInput("");
    sendMessage({ text: value }, { body: { model } }).catch(() => undefined);
  };

  const handleComposerKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <main className="wick-shell min-h-dvh">
      <div className="wick-noise" aria-hidden="true" />

      <aside
        className={`glass-strong fixed inset-y-0 left-0 z-40 flex w-[290px] flex-col border-y-0 border-l-0 p-3 shadow-2xl transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid size-9 place-items-center rounded-xl bg-white/8 ring-1 ring-white/10">
            <Sparkles className="size-4 text-violet-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">WickAI</p>
            <p className="truncate text-xs text-zinc-500">AI Workspace</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/6 hover:text-zinc-200 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <Menu className="size-4" />
          </button>
        </div>

        <button
          type="button"
          className="wick-rise mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-white/10"
          onClick={startNewChat}
        >
          <Plus className="size-4" />
          New chat
        </button>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/8 bg-black/10 px-3 py-2 text-xs text-zinc-500">
          <Search className="size-3.5" />
          <span>Local conversations</span>
        </div>

        <div className="wick-scrollbar mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {history.length ? (
            history.map((chat) => (
              <button
                type="button"
                key={chat.id}
                onClick={() => openChat(chat)}
                className={`wick-rise w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-white/6 ${chat.id === chatId ? "bg-white/8 ring-1 ring-white/8" : ""}`}
              >
                <p className="truncate text-sm text-zinc-200">{chat.title}</p>
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/8 p-4 text-xs leading-5 text-zinc-600">
              Your recent conversations will appear here.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={clearHistory}
          disabled={!history.length}
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300 disabled:opacity-40"
        >
          <Trash2 className="size-3.5" />
          Clear history
        </button>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <section className="min-h-dvh md:pl-[290px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between px-4 md:px-6">
          <div className="glass flex items-center gap-2 rounded-2xl px-2 py-1.5">
            <button
              type="button"
              className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/6 hover:text-zinc-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="size-4" />
            </button>
            <div className="hidden pl-1 sm:block">
              <p className="text-xs text-zinc-500">Model</p>
            </div>
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="max-w-[190px] bg-transparent px-2 py-1.5 text-sm font-medium text-zinc-100 outline-none"
              aria-label="Select model"
            >
              {models.map((item) => (
                <option key={item.id} value={item.id} className="bg-zinc-950">
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={startNewChat}
            className="glass rounded-xl p-2.5 text-zinc-400 transition hover:bg-white/8 hover:text-zinc-100"
            aria-label="New chat"
          >
            <Plus className="size-4" />
          </button>
        </header>

        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col px-4 pb-5 sm:px-6">
          <div className="wick-scrollbar flex-1 overflow-y-auto py-8 sm:py-12">
            {!messages.length ? (
              <div className="wick-rise flex min-h-[58dvh] flex-col items-center justify-center text-center">
                <div className="grid size-14 place-items-center rounded-2xl bg-white/7 ring-1 ring-white/10 shadow-2xl shadow-violet-500/10">
                  <Bot className="size-6 text-violet-300" />
                </div>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
                  What can I help you build?
                </h1>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Ask anything, explore an idea, or drop in some code. WickAI keeps the workspace focused and fast.
                </p>

                <div className="mt-7 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => submit(prompt)}
                      className="wick-rise rounded-2xl border border-white/8 bg-white/3 p-4 text-left text-sm text-zinc-300 transition hover:-translate-y-0.5 hover:bg-white/6"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-7">
                {messages.map((message) => {
                  const text = messageText(message);
                  const isUser = message.role === "user";

                  return (
                    <article key={message.id} className="wick-rise flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        <div className="grid size-8 place-items-center rounded-lg bg-white/6 ring-1 ring-white/8">
                          {isUser ? (
                            <UserRound className="size-4 text-zinc-400" />
                          ) : (
                            <Bot className="size-4 text-violet-300" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 text-xs font-medium text-zinc-500">
                          {isUser ? "You" : "WickAI"}
                        </div>
                        <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-zinc-200">
                          {text}
                          {!isUser && busy && message.id === messages[messages.length - 1]?.id && text ? (
                            <span className="wick-cursor" aria-hidden="true" />
                          ) : null}
                        </div>

                        {!isUser && !busy && text ? (
                          <div className="mt-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => copyMessage(message.id, text)}
                              className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300"
                              aria-label="Copy response"
                            >
                              {copied === message.id ? (
                                <Check className="size-3.5" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                            {message.id === messages[messages.length - 1]?.id && (
                              <button
                                type="button"
                                onClick={() => regenerate()}
                                className="rounded-lg px-2 py-1.5 text-[11px] text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300"
                              >
                                Regenerate
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}

                {status === "submitted" && (
                  <div className="wick-pop flex items-center pl-11 text-sm text-zinc-500">
                    <span>Thinking</span>
                  </div>
                )}

                {error && (
                  <div className="wick-rise ml-11 rounded-2xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-sm text-red-200">
                    {error.message || "Something went wrong while generating the response."}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form
            className="glass-strong wick-rise sticky bottom-3 rounded-3xl p-2 shadow-2xl shadow-black/20"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Message WickAI..."
                rows={1}
                disabled={busy}
                className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                aria-label="Message WickAI"
              />

              {busy ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-zinc-200 transition hover:bg-white/15"
                  aria-label="Stop generating"
                >
                  <Square className="size-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-black transition hover:scale-[1.02] hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Send message"
                >
                  <ArrowUp className="size-4" />
                </button>
              )}
            </div>

            <div className="px-3 pb-1 pt-1 text-[11px] text-zinc-600">
              Enter to send · Shift + Enter for a new line
            </div>
          </form>

          <p className="px-2 pt-2 text-center text-[10px] text-zinc-700">
            WickAI can make mistakes. Verify important information.
          </p>
        </div>
      </section>
    </main>
  );
}
