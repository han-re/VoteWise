"use client";

import { useEffect, useState } from "react";
import { useChatbot } from "./ChatbotProvider";
import { ChatbotSidebar } from "./ChatbotSidebar";

export function FloatingChatbot() {
  const { isOpen, activeSlug, close } = useChatbot();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);
  if (!mounted) return null;

  return (
    <>
      {/* Backdrop — only on mobile */}
      {isOpen && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 59,
            background: "rgba(0,0,0,0.4)",
          }}
          className="block md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "clamp(320px, 28vw, 420px)",
          zIndex: 60,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "rgba(8,14,26,0.97)",
          borderLeft: "1px solid rgba(180,207,232,0.1)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-16px 0 48px rgba(0,0,0,0.6)",
        }}
        aria-label="Session chatbot"
        aria-hidden={!isOpen}
      >
        {activeSlug && <ChatbotSidebar slug={activeSlug} />}
      </aside>
    </>
  );
}
