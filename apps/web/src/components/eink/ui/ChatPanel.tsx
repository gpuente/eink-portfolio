import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  AlertCircle,
  Check,
  ChevronRight,
  HelpCircle,
  Loader2,
  Send,
  Trash2,
  X,
} from "lucide-react";
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

/**
 * OpenAI's gpt-oss-* models emit retrieval-source citation markers in the
 * shape `【<index>†<type>†<source>】` (e.g. `【0†text†cv.md】`). Clients like
 * ChatGPT render these as interactive footnotes; our plain markdown
 * renderer shows them literally, which looks like garbage. Strip them
 * before handing text to <Markdown>. The pattern is anchored on the
 * full-width brackets so it never collides with normal prose.
 */
const CITATION_MARKER_RE = /【[^】]*†[^】]*】/g;

/** Concatenate text parts of a UIMessage; ignore tool-call / tool-result parts. */
function messageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .replace(CITATION_MARKER_RE, "");
}

/** Normalized shape for the tool-call timeline. Collapses AI-SDK v5 state
 *  transitions (input-streaming → input-available → output-available / error)
 *  down to three runtime states the UI cares about. */
type ToolCall = {
  id: string;
  toolName: string;
  state: "running" | "done" | "error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

/** Pull tool-call parts out of a UIMessage in stable order. The AI SDK v5 UI
 *  Message protocol encodes tool calls as parts with `type = "tool-${name}"`
 *  (static tools registered on the server) or `type = "dynamic-tool"` (runtime
 *  MCP tools — not used here but handled defensively). Parts carry a `state`
 *  field: `input-streaming`, `input-available`, `output-available`, or
 *  `output-error`. We collate by `toolCallId` so repeated state updates on
 *  the same call collapse into a single row. */
function extractToolCalls(m: UIMessage): ToolCall[] {
  const byId = new Map<string, ToolCall>();
  // `UIMessage.parts` is a union of ~10 part types; the tool-* ones aren't
  // publicly exported. Cast to a permissive shape and read defensively.
  for (const raw of m.parts as Array<Record<string, unknown>>) {
    const type = typeof raw.type === "string" ? raw.type : "";
    let toolName: string | undefined;
    if (type === "dynamic-tool") {
      toolName = typeof raw.toolName === "string" ? raw.toolName : undefined;
    } else if (type.startsWith("tool-")) {
      toolName = type.slice("tool-".length);
    }
    if (!toolName) continue;

    const id =
      typeof raw.toolCallId === "string" && raw.toolCallId
        ? raw.toolCallId
        : `${toolName}-${byId.size}`;

    let state: ToolCall["state"] = "running";
    if (raw.state === "output-available") state = "done";
    else if (raw.state === "output-error") state = "error";

    byId.set(id, {
      id,
      toolName,
      state,
      input: raw.input,
      output: raw.output,
      errorText: typeof raw.errorText === "string" ? raw.errorText : undefined,
    });
  }
  return Array.from(byId.values());
}

/** Single row in the tool-call timeline. Icon changes with state (spinner →
 *  check → alert), label is human-friendly from i18n, and clicking the row
 *  expands a small mono block with the raw input + output JSON — nice easter
 *  egg for recruiters poking at the panel. */
function ToolCallRow({
  call,
  c,
  t,
}: {
  call: ToolCall;
  c: Palette;
  t: Copy["chat"];
}) {
  const [open, setOpen] = useState(false);
  // Pick the i18n block for this tool name; fall back to the generic "unknown"
  // copy if the server ever exposes a tool the client doesn't know about.
  const labels =
    call.toolName === "searchProfile"
      ? t.tools.searchProfile
      : call.toolName === "checkAvailability"
        ? t.tools.checkAvailability
        : call.toolName === "bookSlot"
          ? t.tools.bookSlot
          : call.toolName === "getGithubActivity"
            ? t.tools.getGithubActivity
            : t.tools.unknown;

  const primary =
    call.state === "error"
      ? `${labels.done} · ${t.tools.errorLabel}`
      : call.state === "running"
        ? labels.running
        : labels.done;

  const Icon =
    call.state === "running"
      ? Loader2
      : call.state === "error"
        ? AlertCircle
        : Check;

  const hasDetails =
    call.input !== undefined ||
    call.output !== undefined ||
    call.errorText !== undefined;

  const fmt = (v: unknown) => {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        onClick={() => hasDetails && setOpen((o) => !o)}
        disabled={!hasDetails}
        aria-expanded={open}
        aria-label={open ? t.tools.collapseLabel : t.tools.expandLabel}
        className="mono"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          color: c.inkSoft,
          padding: "2px 2px",
          fontSize: 10,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          cursor: hasDetails ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        <Icon
          size={12}
          className={call.state === "running" ? "tool-spin" : undefined}
          style={{
            color:
              call.state === "error"
                ? c.inkSoft
                : call.state === "done"
                  ? c.ink
                  : c.inkSoft,
            flexShrink: 0,
          }}
        />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {primary}
        </span>
        {hasDetails && (
          <ChevronRight
            size={10}
            style={{
              opacity: 0.6,
              transition: "transform 200ms ease",
              transform: open ? "rotate(90deg)" : "none",
              flexShrink: 0,
            }}
          />
        )}
      </button>
      {open && hasDetails && (
        <pre
          className="mono"
          style={{
            margin: 0,
            padding: "8px 10px",
            background: c.paperBright,
            border: `1px solid ${c.inkFaint}`,
            borderRadius: 6,
            fontSize: 10.5,
            lineHeight: 1.5,
            color: c.inkSoft,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: 220,
            overflow: "auto",
          }}
        >
          {call.input !== undefined && (
            <>
              <strong style={{ fontWeight: 500, color: c.ink }}>{t.tools.inputLabel}:</strong>
              {"\n"}
              {fmt(call.input)}
              {"\n\n"}
            </>
          )}
          {call.output !== undefined && (
            <>
              <strong style={{ fontWeight: 500, color: c.ink }}>{t.tools.outputLabel}:</strong>
              {"\n"}
              {fmt(call.output)}
            </>
          )}
          {call.errorText && (
            <>
              <strong style={{ fontWeight: 500, color: c.ink }}>{t.tools.errorLabel}:</strong>
              {"\n"}
              {call.errorText}
            </>
          )}
        </pre>
      )}
    </div>
  );
}

export default function ChatPanel({ c, mode, t, open, onClose }: Props) {
  const [input, setInput] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
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

  // Close the help popover when the user clicks anywhere outside of it.
  const helpRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!helpOpen) return;
    const onDocPointer = (e: MouseEvent | TouchEvent) => {
      if (!helpRef.current?.contains(e.target as Node)) setHelpOpen(false);
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
    };
  }, [helpOpen]);

  // Also close the help popover when the whole chat panel is closed.
  useEffect(() => {
    if (!open) setHelpOpen(false);
  }, [open]);

  const clearChat = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // sessionStorage unavailable — fine.
      }
    }
    inputRef.current?.focus();
  };

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
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* Help — "?" icon with a click/hover popover describing what the
              agent can do. The popover anchors to this button, so the wrapper
              is position: relative. */}
          <div ref={helpRef} style={{ position: "relative" }}>
            <button
              onClick={() => setHelpOpen((v) => !v)}
              onMouseEnter={() => setHelpOpen(true)}
              title={t.helpLabel}
              aria-label={t.helpLabel}
              aria-expanded={helpOpen}
              style={{
                background: helpOpen ? c.paperBright : "transparent",
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
              <HelpCircle size={14} />
            </button>
            {helpOpen && (
              <div
                role="dialog"
                aria-label={t.helpLabel}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 260,
                  maxWidth: "calc(100vw - 32px)",
                  background: c.paperBright,
                  color: c.ink,
                  border: `1px solid ${c.inkFaint}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  boxShadow:
                    mode === "light"
                      ? "0 14px 34px -16px rgba(60,50,30,.55), 0 6px 14px -6px rgba(60,50,30,.32)"
                      : "0 14px 34px -16px rgba(0,0,0,.7), 0 6px 14px -6px rgba(0,0,0,.5)",
                  zIndex: 5,
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: ".22em",
                    color: c.inkSoft,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {t.helpTitle}
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {t.helpItems.map((item) => (
                    <li
                      key={item}
                      style={{ paddingLeft: 14, position: "relative" }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "0.55em",
                          width: 4,
                          height: 4,
                          borderRadius: 999,
                          background: c.inkSoft,
                        }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {hasMessages && (
            <button
              onClick={clearChat}
              disabled={isBusy}
              title={t.clearLabel}
              aria-label={t.clearLabel}
              style={{
                background: "transparent",
                border: `1px solid ${c.inkFaint}`,
                color: c.inkSoft,
                padding: "5px 7px",
                borderRadius: 6,
                cursor: isBusy ? "default" : "pointer",
                opacity: isBusy ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 32,
                minHeight: 32,
              }}
            >
              <Trash2 size={14} />
            </button>
          )}

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

        {/* Locate the last user message so we know where to anchor the
            initial "Thinking…" pulse. Thinking is ONLY shown in the gap
            between submitting and the first assistant output — once any
            tool-call or text-delta arrives for the next assistant message,
            Thinking is replaced by that live progress. */}
        {(() => {
          let lastUserIdx = -1;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "user") {
              lastUserIdx = i;
              break;
            }
          }
          // Does the assistant message immediately after the last user prompt
          // already have something renderable (a text part or a tool-call
          // part)? If yes, the agent has started producing output and we hide
          // the Thinking pulse; its job was to cover the empty gap.
          const nextAssistant =
            lastUserIdx >= 0 ? messages[lastUserIdx + 1] : undefined;
          const hasAssistantContent =
            nextAssistant != null &&
            nextAssistant.role === "assistant" &&
            (messageText(nextAssistant).length > 0 ||
              extractToolCalls(nextAssistant).length > 0);
          return messages.map((m, i) => {
            const isUser = m.role === "user";
            // Assistant messages can carry tool-call parts alongside (or
            // before) their text — render the tool timeline above the text
            // bubble so recruiters see the full sequence of steps the agent
            // took.
            const toolCalls = isUser ? [] : extractToolCalls(m);
            const text = messageText(m);
            const hasBlock = isUser || !!text || toolCalls.length > 0;
            const showThinkingAfter =
              isBusy && i === lastUserIdx && !hasAssistantContent;
            return (
              <Fragment key={m.id}>
                {hasBlock && (
                  <div
                    style={{
                      alignSelf: isUser ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {toolCalls.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          padding: "2px 0 4px",
                        }}
                      >
                        {toolCalls.map((call) => (
                          <ToolCallRow key={call.id} call={call} c={c} t={t} />
                        ))}
                      </div>
                    )}
                    {text && (
                      <div
                        className={isUser ? undefined : "chat-md"}
                        style={{
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
                    )}
                  </div>
                )}
                {showThinkingAfter && (
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
              </Fragment>
            );
          });
        })()}

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
          className="chat-input"
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
