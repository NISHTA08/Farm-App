"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import VoiceInput from "@/components/VoiceInput";
import { MessageSquare, Send, Sparkles, User, Loader2, Cloud, Zap, PlusSquare, History, X, Languages } from "lucide-react";

const CHAT_PROVIDER_KEY = "khethai-chat-provider";
const VOICE_LANG_KEY = "khethai-voice-lang";
const HISTORY_GROQ_KEY = "khethai-chat-history-groq";
const HISTORY_AWS_KEY = "khethai-chat-history-aws";
const SAVED_GROQ_KEY = "khethai-chat-saved-groq";
const SAVED_AWS_KEY = "khethai-chat-saved-aws";

const VOICE_LANGUAGES: { value: string; label: string }[] = [
  { value: "", label: "Any (browser)" },
  { value: "en-IN", label: "English" },
  { value: "hi-IN", label: "Hindi" },
  { value: "te-IN", label: "Telugu" },
  { value: "ta-IN", label: "Tamil" },
  { value: "kn-IN", label: "Kannada" },
  { value: "ml-IN", label: "Malayalam" },
  { value: "mr-IN", label: "Marathi" },
  { value: "bn-IN", label: "Bengali" },
];
const MAX_HISTORY = 100;
const MAX_SAVED = 50;

type ChatProvider = "aws" | "groq";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

interface SavedThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

function loadHistory(key: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function loadSavedThreads(provider: ChatProvider): SavedThread[] {
  try {
    const key = provider === "groq" ? SAVED_GROQ_KEY : SAVED_AWS_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_SAVED) : [];
  } catch {
    return [];
  }
}

function saveHistory(provider: ChatProvider, messages: ChatMessage[]) {
  try {
    const key = provider === "groq" ? HISTORY_GROQ_KEY : HISTORY_AWS_KEY;
    localStorage.setItem(key, JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {}
}

function saveSavedThreads(provider: ChatProvider, threads: SavedThread[]) {
  try {
    const key = provider === "groq" ? SAVED_GROQ_KEY : SAVED_AWS_KEY;
    localStorage.setItem(key, JSON.stringify(threads.slice(-MAX_SAVED)));
  } catch {}
}

function threadTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (first) {
    const t = first.text.trim();
    return t.length > 40 ? t.slice(0, 40) + "…" : t;
  }
  return "Chat";
}

const suggestions = [
  "My tomato leaves have brown spots. What disease is this?",
  "When should I sow wheat in Madhya Pradesh?",
  "Tell me about PM-KISAN scheme eligibility",
  "How to increase rice yield naturally?",
  "What is the best organic fertilizer for vegetables?",
  "Current market price trends for soybean",
];

export default function ChatPage() {
  const [messagesByProvider, setMessagesByProvider] = useState<Record<ChatProvider, ChatMessage[]>>(() => ({
    groq: loadHistory(HISTORY_GROQ_KEY),
    aws: loadHistory(HISTORY_AWS_KEY),
  }));
  const [savedThreadsByProvider, setSavedThreadsByProvider] = useState<Record<ChatProvider, SavedThread[]>>(() => ({
    groq: loadSavedThreads("groq"),
    aws: loadSavedThreads("aws"),
  }));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<ChatProvider>("groq");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [voiceLang, setVoiceLang] = useState("");
  const [voiceLangOpen, setVoiceLangOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = messagesByProvider[provider];
  const savedThreads = savedThreadsByProvider[provider];
  const voiceLangLabel = VOICE_LANGUAGES.find((o) => o.value === voiceLang)?.label ?? "Any (browser)";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_PROVIDER_KEY);
      if (saved === "aws" || saved === "groq") setProvider(saved);
      const v = localStorage.getItem(VOICE_LANG_KEY);
      if (v !== null) setVoiceLang(v);
    } catch {}
  }, []);

  const setVoiceLangAndSave = useCallback((lang: string) => {
    setVoiceLang(lang);
    setVoiceLangOpen(false);
    try {
      localStorage.setItem(VOICE_LANG_KEY, lang);
    } catch {}
  }, []);

  const setProviderAndSave = useCallback((p: ChatProvider) => {
    setProvider(p);
    try {
      localStorage.setItem(CHAT_PROVIDER_KEY, p);
    } catch {}
  }, []);

  const startNewChat = useCallback(() => {
    const current = messagesByProvider[provider];
    if (current.length > 0) {
      const thread: SavedThread = {
        id: `t-${Date.now()}`,
        title: threadTitle(current),
        messages: [...current],
        createdAt: Date.now(),
      };
      setSavedThreadsByProvider((prev) => {
        const next = [...prev[provider], thread];
        saveSavedThreads(provider, next);
        return { ...prev, [provider]: next };
      });
    }
    setMessagesByProvider((prev) => ({ ...prev, [provider]: [] }));
    saveHistory(provider, []);
    setHistoryOpen(false);
  }, [messagesByProvider, provider]);

  const loadThread = useCallback(
    (thread: SavedThread) => {
      setMessagesByProvider((prev) => ({ ...prev, [provider]: thread.messages }));
      saveHistory(provider, thread.messages);
      setHistoryOpen(false);
    },
    [provider]
  );

  const openHistory = useCallback(() => {
    setSavedThreadsByProvider((prev) => ({
      ...prev,
      [provider]: loadSavedThreads(provider),
    }));
    setHistoryOpen(true);
  }, [provider]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: Date.now(),
    };

    const currentList = messagesByProvider[provider];
    const updatedWithUser = [...currentList, userMsg];
    setMessagesByProvider((prev) => ({ ...prev, [provider]: updatedWithUser }));
    saveHistory(provider, updatedWithUser);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedWithUser.map((m) => ({ role: m.role, text: m.text })),
          provider,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.reply || "Sorry, I could not process that. Please try again.",
        timestamp: Date.now(),
      };

      setMessagesByProvider((prev) => {
        const nextList = [...prev[provider], assistantMsg];
        saveHistory(provider, nextList);
        return { ...prev, [provider]: nextList };
      });
    } catch {
      const errMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: "assistant",
        text: "Connection error. Please check your internet and try again.",
        timestamp: Date.now(),
      };
      setMessagesByProvider((prev) => {
        const nextList = [...prev[provider], errMsg];
        saveHistory(provider, nextList);
        return { ...prev, [provider]: nextList };
      });
    } finally {
      setLoading(false);
    }
  }, [messagesByProvider, loading, provider]);

  const handleVoiceResult = useCallback((transcript: string) => {
    setInput(transcript);
    sendMessage(transcript);
  }, [sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-kh-text">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- /gm, '• ')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen bg-kh-bg flex flex-col">
      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-4 border-b border-kh-border">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles size={18} className="text-black" />
            </div>
            <div>
              <h1 className="font-display text-display-sm text-kh-text">AI Assistant</h1>
              <p className="text-body-xs text-kh-text-dim">Ask anything about farming</p>
            </div>
          </div>
          {/* Provider toggle */}
          <div className="flex rounded-xl bg-white/[0.04] p-1 border border-kh-border mb-3">
            <button
              type="button"
              onClick={() => setProviderAndSave("groq")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-body-xs font-medium transition-all ${provider === "groq" ? "gradient-accent text-black" : "text-kh-text-dim hover:text-kh-text-muted"}`}
            >
              <Zap size={14} />
              Groq (free)
            </button>
            <button
              type="button"
              onClick={() => setProviderAndSave("aws")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-body-xs font-medium transition-all ${provider === "aws" ? "gradient-accent text-black" : "text-kh-text-dim hover:text-kh-text-muted"}`}
            >
              <Cloud size={14} />
              AWS Bedrock
            </button>
          </div>
          {/* New chat & History */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startNewChat}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] border border-kh-border text-body-xs font-medium text-kh-text-muted hover:text-kh-text hover:bg-white/[0.06] transition-all"
            >
              <PlusSquare size={14} />
              New chat
            </button>
            <button
              type="button"
              onClick={openHistory}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] border border-kh-border text-body-xs font-medium text-kh-text-muted hover:text-kh-text hover:bg-white/[0.06] transition-all"
            >
              <History size={14} />
              History
            </button>
          </div>
        </div>
      </header>

      {/* History drawer */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-kh-bg/95 backdrop-blur-sm">
          <div className="max-w-lg mx-auto w-full flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-kh-border">
              <h2 className="font-display text-display-sm text-kh-text">
                {provider === "groq" ? "Groq" : "AWS"} chat history
              </h2>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="p-2 rounded-lg text-kh-text-dim hover:text-kh-text hover:bg-white/5"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {messages.length > 0 && (
                <div className="mb-4">
                  <p className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-2">Current chat</p>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(false)}
                    className="w-full text-left p-4 rounded-xl bg-kh-accent/10 border border-kh-accent/20 text-body-sm text-kh-text"
                  >
                    <span className="font-medium">{threadTitle(messages)}</span>
                    <span className="block text-body-xs text-kh-text-dim mt-0.5">
                      {messages.length} message{messages.length !== 1 ? "s" : ""} · In progress
                    </span>
                  </button>
                </div>
              )}
              <p className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-2">Past chats</p>
              {savedThreads.length === 0 ? (
                <p className="text-body-sm text-kh-text-dim py-4">No past chats. Start a conversation and tap &quot;New chat&quot; to save it here.</p>
              ) : (
                savedThreads
                  .slice()
                  .reverse()
                  .map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => loadThread(thread)}
                      className="w-full text-left p-4 rounded-xl bg-kh-card border border-kh-border hover:border-kh-border-strong text-body-sm text-kh-text transition-all"
                    >
                      <span className="font-medium block truncate">{thread.title}</span>
                      <span className="text-body-xs text-kh-text-dim">
                        {thread.messages.length} message{thread.messages.length !== 1 ? "s" : ""} ·{" "}
                        {new Date(thread.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-36">
        <div className="max-w-lg mx-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="animate-fade-in pt-8">
              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <MessageSquare size={24} className="text-kh-accent" />
                </div>
                <h2 className="font-display text-display-md text-kh-text mb-2">
                  How can I help?
                </h2>
                <p className="text-body-sm text-kh-text-dim max-w-[280px] mx-auto">
                  Ask about crop diseases, treatments, weather, schemes, or market advice
                </p>
              </div>

              <p className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-3 px-1">
                Suggested Questions
              </p>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left p-3.5 rounded-xl bg-white/[0.03] border border-kh-border
                      text-body-sm text-kh-text-muted hover:text-kh-text hover:bg-white/[0.06]
                      hover:border-kh-border-strong transition-all touch-manipulation animate-slide-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={12} className="text-black" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-kh-accent text-black rounded-tr-md"
                        : "glow-card bg-kh-card rounded-tl-md"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-body-sm">{msg.text}</p>
                    ) : (
                      <div
                        className="text-body-sm text-kh-text-secondary leading-relaxed [&_strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                      />
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={12} className="text-kh-text-muted" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                    <Sparkles size={12} className="text-black" />
                  </div>
                  <div className="glow-card bg-kh-card rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-body-sm text-kh-text-dim">
                      <Loader2 size={14} className="animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-[60px] left-0 right-0 z-40 glass-strong border-t border-kh-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative shrink-0 flex items-center gap-0.5">
              <VoiceInput lang={voiceLang} onResult={handleVoiceResult} />
              <button
                type="button"
                onClick={() => setVoiceLangOpen((o) => !o)}
                className="p-1.5 rounded-lg text-kh-text-dim hover:text-kh-text hover:bg-white/5 transition-colors"
                title={`Voice: ${voiceLangLabel}. Tap to change.`}
                aria-label="Voice language"
              >
                <Languages size={16} />
              </button>
            </div>
            {voiceLangOpen && (
              <>
                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setVoiceLangOpen(false)} />
                <div className="absolute bottom-full left-0 mb-1 py-2 rounded-xl bg-kh-card border border-kh-border shadow-xl z-50 max-h-52 overflow-y-auto min-w-[160px]">
                  <p className="px-3 py-1.5 text-body-xs text-kh-text-dim uppercase tracking-wider">Voice language</p>
                  {VOICE_LANGUAGES.map((opt) => (
                    <button
                      key={opt.value || "any"}
                      type="button"
                      onClick={() => setVoiceLangAndSave(opt.value)}
                      className={`w-full text-left px-3 py-2 text-body-sm ${voiceLang === opt.value ? "text-kh-accent font-medium bg-kh-accent/10" : "text-kh-text-muted hover:text-kh-text"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about crops, diseases, schemes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full px-4 py-3 bg-kh-surface border border-kh-border rounded-xl
                  text-body-sm text-kh-text placeholder-kh-text-dim
                  focus:outline-none focus:border-kh-accent/50 focus:ring-1 focus:ring-kh-accent/30
                  disabled:opacity-40 transition-all"
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl gradient-accent text-black disabled:opacity-30
                shadow-lg shadow-emerald-500/20 transition-all touch-manipulation active:scale-95
                disabled:shadow-none"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
