"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE } from "../config";
import { Send, Loader2, Bot, Sparkles } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm EMOS, your organizational memory assistant. Ask me about your meetings, commitments, or tasks.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: authUser } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !authUser) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: authUser.id, question: userMessage.content }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { id: messages.length + 2, role: "assistant", content: data.answer || "I couldn't process that request." },
        ]);
      } else {
        const errorText = await response.text();
        setMessages((prev) => [
          ...prev,
          { id: messages.length + 2, role: "assistant", content: `Error: ${errorText}` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: messages.length + 2, role: "assistant", content: `Network error. Make sure your backend is running at ${API_BASE}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = ["What are my pending tasks?", "Show recent meetings", "Any overdue items?"];

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 120px)",
        minHeight: "500px",
      }}
    >
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 0",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              opacity: 0,
              animation: `fadeIn 0.3s ease ${idx === messages.length - 1 ? "0s" : "0s"} forwards`,
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: "var(--radius-lg)",
                fontSize: "14px",
                lineHeight: 1.6,
                ...(msg.role === "user"
                  ? {
                      background: "var(--color-secondary)",
                      color: "white",
                      borderBottomRightRadius: "4px",
                    }
                  : {
                      background: "var(--color-surface-elevated)",
                      color: "var(--color-text)",
                      borderBottomLeftRadius: "4px",
                      border: "1px solid var(--color-border)",
                    }),
              }}
            >
              {msg.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <Bot size={14} style={{ color: "var(--color-secondary)" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    EMOS
                  </span>
                </div>
              )}
              <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 16px",
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                borderBottomLeftRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Loader2 size={14} style={{ color: "var(--color-secondary)", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Thinking...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ display: "flex", gap: "8px", paddingBottom: "12px", flexWrap: "wrap" }}>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                border: "1px solid var(--color-border)",
                borderRadius: "9999px",
              }}
            >
              <Sparkles size={12} />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: "16px 0",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "8px",
            background: "var(--color-surface-elevated)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your meetings..."
            rows={1}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "transparent",
              border: "none",
              color: "var(--color-text)",
              fontSize: "14px",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{
              width: "36px",
              height: "36px",
              padding: 0,
              borderRadius: "var(--radius-md)",
              flexShrink: 0,
            }}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
