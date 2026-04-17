import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send, X } from "lucide-react";
import Markdown from "react-markdown";
import type { Palette, Mode } from "../data/palettes";
import type { Copy } from "../data/copy";

type Props = {
  c: Palette;
  mode: Mode;
  t: Copy["chat"];
  open: boolean;
  onClose: () => void;
};

const STORAGE_KEY = "eink-chat-messages";
const RAG_URL =
  (import.meta.env.PUBLIC_RAG_SERVER_URL as string | undefined) ?? "http://localhost:3001";

function loadStoredMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

/** Concatenate text parts of a UIMessage; ignore tool-call / tool-result parts. */
function messageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export default function ChatPanel({ c, mode, t, open, onClose }: Props) {
  const [input, setInput] = useState("");
  const initialMessages = useMemo(loadStoredMessages, []);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: `${RAG_URL}/chat` }),
    [],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    messages: initialMessages,
    transport,
  });

  // Persist to sessionStorage on every message change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // quota exceeded or unavailable — silently skip
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages / streaming chunks
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status, open]);

  // Focus input when panel opens
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Auto-grow textarea
  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isBusy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  return (
    <div
      className={`chat-panel ${open ? "chat-panel-open" : ""}`}
      style={{
        position: "fixed",
        zIndex: 65,
        background: c.paper,
        color: c.ink,
        border: `1px solid ${c.inkFaint}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif',
        boxShadow:
          mode === "light"
            ? "0 24px 60px -20px rgba(60,50,30,.45), 0 8px 20px -8px rgba(60,50,30,.25)"
            : "0 24px 60px -20px rgba(0,0,0,.7), 0 8px 20px -8px rgba(0,0,0,.5)",
      }}
      aria-hidden={!open}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          borderBottom: `1px dashed ${c.inkFaint}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: c.ink, letterSpacing: "-.005em" }}>
            {t.panelTitle}
          </div>
          <div
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: ".22em",
              color: c.inkSoft,
              textTransform: "uppercase",
            }}
          >
            {t.panelSubtitle}
          </div>
        </div>
        <button
          onClick={onClose}
          title={t.closeLabel}
          aria-label={t.closeLabel}
          style={{
            background: "transparent",
            border: `1px solid ${c.inkFaint}`,
            color: c.inkSoft,
            padding: "5px 7px",
            borderRadius: 6,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 32,
            minHeight: 32,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {!hasMessages && (
          <div
            style={{
              color: c.inkSoft,
              fontSize: 14,
              lineHeight: 1.55,
              padding: "12px 0",
            }}
          >
            {t.emptyHint}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {t.starterChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => send(chip)}
                  disabled={isBusy}
                  style={{
                    textAlign: "left",
                    background: c.paperBright,
                    border: `1px solid ${c.inkFaint}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    color: c.ink,
                    cursor: isBusy ? "default" : "pointer",
                    fontFamily: "inherit",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                  className="chat-chip"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const text = messageText(m);
          if (!text) return null;
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={isUser ? undefined : "chat-md"}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: isUser ? c.ink : c.paperBright,
                color: isUser ? c.paper : c.ink,
                border: isUser ? "none" : `1px solid ${c.inkFaint}`,
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 14,
                lineHeight: 1.55,
                whiteSpace: isUser ? "pre-wrap" : "normal",
                wordBreak: "break-word",
              }}
            >
              {isUser ? (
                text
              ) : (
                <Markdown
                  components={{
                    // Open every link in a new tab; noreferrer for safety.
                    a: ({ href, children, ...rest }) => (
                      <a href={href} target="_blank" rel="noreferrer" {...rest}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {text}
                </Markdown>
              )}
            </div>
          );
        })}

        {isBusy && (
          <div
            className="mono"
            style={{
              alignSelf: "flex-start",
              fontSize: 11,
              color: c.inkSoft,
              letterSpacing: ".15em",
              textTransform: "uppercase",
              padding: "4px 4px",
            }}
          >
            <span className="chat-thinking">{t.thinking}</span>
          </div>
        )}

        {status === "error" && error && (
          <div
            style={{
              alignSelf: "flex-start",
              fontSize: 13,
              color: c.inkSoft,
              fontStyle: "italic",
              padding: "8px 12px",
              border: `1px dashed ${c.inkFaint}`,
              borderRadius: 8,
            }}
          >
            {t.error}
          </div>
        )}
      </div>

      {/* Input — flex row, items end-aligned so the button stays at the bottom
          when the textarea grows. Both have a matching outer height (44px) so
          the button looks vertically centred against a single-line textarea. */}
      <div
        style={{
          padding: "12px 12px 14px",
          borderTop: `1px dashed ${c.inkFaint}`,
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={t.placeholder}
          rows={1}
          disabled={isBusy}
          style={{
            flex: 1,
            resize: "none",
            background: c.paperBright,
            border: `1px solid ${c.inkFaint}`,
            borderRadius: 10,
            color: c.ink,
            fontFamily: "inherit",
            fontSize: 14,
            lineHeight: 1.5,
            padding: "10px 12px",
            outline: "none",
            maxHeight: 120,
            minHeight: 44,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={isBusy || !input.trim()}
          title={t.sendLabel}
          aria-label={t.sendLabel}
          style={{
            background: input.trim() && !isBusy ? c.ink : c.inkFaint,
            color: c.paper,
            border: "none",
            borderRadius: 10,
            cursor: input.trim() && !isBusy ? "pointer" : "default",
            padding: 0,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 200ms ease",
            flexShrink: 0,
          }}
        >
          <Send size={16} style={{ transform: "translate(-1px, 1px)" }} />
        </button>
      </div>
    </div>
  );
}
