"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Which buildings have NSF grants?",
  "Who works on USDA research?",
  "What is the biggest grant on campus?",
  "Tell me about the STEM Academy",
  "Who is David Fernandez?",
];

const TYPING_DOTS = ["·", "··", "···"];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingFrame, setTypingFrame] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Typing animation
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setTypingFrame((f) => (f + 1) % 3), 400);
    return () => clearInterval(t);
  }, [loading]);

  // Add greeting when first opened
  useEffect(() => {
    if (open && !hasGreeted) {
      setHasGreeted(true);
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I'm **UAPB Atlas**, your campus research guide. I can help you explore buildings, grants, researchers, and departments. What would you like to know?",
        },
      ]);
    }
    if (open) inputRef.current?.focus();
  }, [open, hasGreeted]);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage = text.trim();
      if (!userMessage || loading) return;

      const newMessages: Message[] = [
        ...messages,
        { role: "user", content: userMessage },
      ];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.error ?? "Sorry, something went wrong.",
            },
          ]);
          return;
        }

        let content = data.reply ?? "Sorry, something went wrong.";
        if (data.warning) {
          content += `\n\n_${data.warning}_`;
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Network error. Please check your connection and try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  function renderContent(text: string) {
    // Very light markdown: **bold**, _italic_, and newlines
    return text
      .split("\n")
      .map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
        return (
          <span key={i}>
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={j} className="font-semibold text-[#EEB310]">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("_") && part.endsWith("_")) {
                return (
                  <em key={j} className="text-white/40 not-italic text-[11px]">
                    {part.slice(1, -1)}
                  </em>
                );
              }
              return <span key={j}>{part}</span>;
            })}
            {i < text.split("\n").length - 1 && <br />}
          </span>
        );
      });
  }

  return (
    <>
      {/* Floating trigger bubble */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open UAPB Atlas AI assistant"
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-gray-800 rotate-180"
            : "bg-[#EEB310] hover:bg-[#d9a00e] hover:scale-110"
        }`}
      >
        {open ? (
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        )}
      </button>

      {/* Unread pulse */}
      {!open && messages.length === 0 && (
        <span className="fixed bottom-[4.75rem] right-5 z-50 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow animate-pulse" />
      )}

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-h-[560px] flex flex-col bg-gray-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-black/50 border-b border-white/10 shrink-0">
          <div className="h-8 w-8 rounded-full bg-[#EEB310] flex items-center justify-center shrink-0">
            <svg className="h-4 w-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">UAPB Atlas</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[10px] text-white/50">AI Research Assistant</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setMessages([]); setHasGreeted(false); }}
              title="Clear chat"
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="h-6 w-6 rounded-full bg-[#EEB310]/20 border border-[#EEB310]/30 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                  <svg className="h-3 w-3 text-[#EEB310]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#EEB310] text-gray-900 font-medium rounded-br-sm"
                    : "bg-white/8 text-white/85 rounded-bl-sm border border-white/5"
                }`}
              >
                {renderContent(msg.content)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="h-6 w-6 rounded-full bg-[#EEB310]/20 border border-[#EEB310]/30 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <svg className="h-3 w-3 text-[#EEB310]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                </svg>
              </div>
              <div className="bg-white/8 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <span className="text-[#EEB310] text-lg tracking-widest font-bold">
                  {TYPING_DOTS[typingFrame]}
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts (shown when only greeting) */}
        {messages.length <= 1 && !loading && (
          <div className="px-3 pb-1 flex gap-1.5 flex-wrap">
            {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => sendMessage(p)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-white/8 border border-white/10 text-white/60 hover:text-[#EEB310] hover:border-[#EEB310]/40 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-[#EEB310]/50 transition-colors"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about buildings, grants, researchers…"
              className="flex-1 bg-transparent text-[13px] text-white placeholder-white/30 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-7 w-7 rounded-lg bg-[#EEB310] flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-[#d9a00e] transition-colors"
            >
              <svg className="h-3.5 w-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
          <p className="mt-1.5 text-center text-[9px] text-white/20">
            Powered by GPT-4o mini · UAPB Research Office
          </p>
        </div>
      </div>
    </>
  );
}
