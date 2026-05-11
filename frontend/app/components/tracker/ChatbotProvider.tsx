"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ChatMessage } from "../../tracker/_types";

interface ChatSession {
  messages: ChatMessage[];
  isLoading: boolean;
}

interface ChatbotContextValue {
  isOpen: boolean;
  activeSlug: string | null;
  sessions: Record<string, ChatSession>;
  openFor: (slug: string) => void;
  close: () => void;
  sendMessage: (slug: string, question: string) => Promise<void>;
  focusCitation: (chunkId: string) => void;
  onFocusCitation: (handler: (chunkId: string) => void) => () => void;
}

const ChatbotContext = createContext<ChatbotContextValue | null>(null);

const CHATBOT_API =
  process.env.NEXT_PUBLIC_CHATBOT_API_URL ?? "http://localhost:8001";

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const citationHandlers = useRef<Set<(chunkId: string) => void>>(new Set());

  const openFor = useCallback((slug: string) => {
    setActiveSlug(slug);
    setIsOpen(true);
    setSessions((prev) =>
      prev[slug] ? prev : { ...prev, [slug]: { messages: [], isLoading: false } }
    );
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(async (slug: string, question: string) => {
    setSessions((prev) => ({
      ...prev,
      [slug]: {
        messages: [
          ...(prev[slug]?.messages ?? []),
          { role: "user", content: question },
        ],
        isLoading: true,
      },
    }));

    try {
      const history = sessions[slug]?.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })) ?? [];

      const res = await fetch(`${CHATBOT_API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_slug: slug, question, history }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json() as { answer: string; sources: string[] };

      setSessions((prev) => ({
        ...prev,
        [slug]: {
          messages: [
            ...(prev[slug]?.messages ?? []),
            { role: "assistant", content: data.answer, sources: data.sources },
          ],
          isLoading: false,
        },
      }));
    } catch {
      setSessions((prev) => ({
        ...prev,
        [slug]: {
          messages: [
            ...(prev[slug]?.messages ?? []),
            {
              role: "assistant",
              content: "Sorry, I could not reach the transcript service. Please try again.",
              sources: [],
            },
          ],
          isLoading: false,
        },
      }));
    }
  }, [sessions]);

  const focusCitation = useCallback((chunkId: string) => {
    citationHandlers.current.forEach((handler) => handler(chunkId));
  }, []);

  const onFocusCitation = useCallback(
    (handler: (chunkId: string) => void) => {
      citationHandlers.current.add(handler);
      return () => citationHandlers.current.delete(handler);
    },
    []
  );

  return (
    <ChatbotContext.Provider
      value={{ isOpen, activeSlug, sessions, openFor, close, sendMessage, focusCitation, onFocusCitation }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot(): ChatbotContextValue {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error("useChatbot must be used inside ChatbotProvider");
  return ctx;
}
