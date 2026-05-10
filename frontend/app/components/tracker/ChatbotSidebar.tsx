"use client";

import { useRef, useState, useEffect } from "react";
import { useChatbot } from "./ChatbotProvider";
import type { ChatMessage } from "../../tracker/_types";

export function ChatbotSidebar({ slug }: { slug: string }) {
  const { sessions, sendMessage, close, focusCitation } = useChatbot();
  const session = sessions[slug] ?? { messages: [], isLoading: false };
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  const submit = () => {
    const q = input.trim();
    if (!q || session.isLoading) return;
    setInput("");
    void sendMessage(slug, q);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.2rem 0.9rem",
          borderBottom: "1px solid rgba(180,207,232,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.6rem",
              color: "#e8962a",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "0.2rem",
            }}
          >
            Session assistant
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "rgba(180,207,232,0.6)",
              lineHeight: 1.3,
            }}
          >
            Ask anything about this session&apos;s transcript.
          </p>
        </div>
        <button
          onClick={close}
          aria-label="Close chatbot"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(180,207,232,0.35)",
            padding: "0.3rem",
            lineHeight: 1,
            fontSize: "1.1rem",
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 1.2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {session.messages.length === 0 && (
          <div style={{ marginTop: "1rem" }}>
            <p
              style={{
                fontSize: "0.78rem",
                color: "rgba(180,207,232,0.3)",
                lineHeight: 1.6,
                marginBottom: "1rem",
              }}
            >
              Answers come only from the Hansard transcript for this session.
            </p>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => void sendMessage(slug, q)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "rgba(180,207,232,0.04)",
                  border: "1px solid rgba(180,207,232,0.08)",
                  borderRadius: "8px",
                  padding: "0.6rem 0.8rem",
                  marginBottom: "0.4rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  color: "rgba(180,207,232,0.5)",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {session.messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} onCitationClick={focusCitation} />
        ))}

        {session.isLoading && (
          <div style={{ alignSelf: "flex-start" }}>
            <ThinkingDots />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "0.8rem 1rem",
          borderTop: "1px solid rgba(180,207,232,0.07)",
          display: "flex",
          gap: "0.5rem",
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about this session…"
          rows={2}
          style={{
            flex: 1,
            background: "rgba(180,207,232,0.04)",
            border: "1px solid rgba(180,207,232,0.1)",
            borderRadius: "8px",
            padding: "0.6rem 0.8rem",
            color: "#b4cfe8",
            fontSize: "0.8rem",
            resize: "none",
            outline: "none",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={submit}
          disabled={!input.trim() || session.isLoading}
          aria-label="Send"
          style={{
            background: input.trim() ? "#e8962a" : "rgba(232,150,42,0.15)",
            border: "none",
            borderRadius: "8px",
            padding: "0 0.8rem",
            cursor: input.trim() ? "pointer" : "not-allowed",
            color: input.trim() ? "#080e1a" : "rgba(232,150,42,0.4)",
            fontWeight: 700,
            fontSize: "0.9rem",
            transition: "background 0.15s, color 0.15s",
            flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  onCitationClick,
}: {
  msg: ChatMessage;
  onCitationClick: (chunkId: string) => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "90%",
      }}
    >
      <div
        style={{
          background: isUser ? "rgba(232,150,42,0.12)" : "rgba(180,207,232,0.06)",
          border: `1px solid ${isUser ? "rgba(232,150,42,0.2)" : "rgba(180,207,232,0.1)"}`,
          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          padding: "0.65rem 0.85rem",
          fontSize: "0.8rem",
          color: isUser ? "#e8962a" : "rgba(215,228,242,0.85)",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content}
      </div>
      {msg.sources && msg.sources.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.3rem",
            marginTop: "0.4rem",
          }}
        >
          {msg.sources.map((src) => (
            <button
              key={src}
              onClick={() => onCitationClick(src)}
              title={`Jump to chunk ${src}`}
              style={{
                background: "none",
                border: "1px solid rgba(96,165,250,0.2)",
                borderRadius: "4px",
                padding: "0.1rem 0.4rem",
                cursor: "pointer",
                fontSize: "0.6rem",
                color: "rgba(96,165,250,0.6)",
                fontFamily: "monospace",
                transition: "border-color 0.15s",
              }}
            >
              {src.split("_").pop()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        padding: "0.65rem 0.85rem",
        background: "rgba(180,207,232,0.06)",
        border: "1px solid rgba(180,207,232,0.1)",
        borderRadius: "12px 12px 12px 2px",
      }}
      aria-label="Thinking"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "rgba(180,207,232,0.4)",
            display: "inline-block",
            animation: "chatDot 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes chatDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  "What were the main topics discussed?",
  "Were any votes taken? What was the result?",
  "What did the minister say about this issue?",
];
