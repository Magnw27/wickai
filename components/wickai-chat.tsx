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
  const [model, setModel] = useState(fallbackModels[0].id);
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
    setInput("");
    setSidebarOpen(false);
  };
