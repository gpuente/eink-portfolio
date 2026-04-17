import { MessageCircle, X } from "lucide-react";
import type { Palette, Mode } from "../data/palettes";

type Props = {
  c: Palette;
  mode: Mode;
  open: boolean;
  title: string;
  onToggle: () => void;
};

/**
 * Floating circular button anchored at the bottom-right of the viewport.
 * On mobile it sits on the same row as the bottom dock (right of the screen);
 * on desktop it floats free against the right edge. Toggles the chat panel.
 */
export default function ChatBubble({ c, mode, open, title, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      title={title}
      aria-label={title}
      aria-expanded={open}
      style={{
        flexShrink: 0,
        width: 48,
        height: 48,
        borderRadius: 999,
        border: `1px solid ${c.inkFaint}`,
        background: c.ink,
        color: c.paper,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        fontFamily: "inherit",
        boxShadow:
          mode === "light"
            ? "0 10px 30px -10px rgba(60,50,30,.45), 0 4px 10px -4px rgba(60,50,30,.25), inset 0 1px 0 rgba(255,255,255,.18)"
            : "0 10px 30px -10px rgba(0,0,0,.7), 0 4px 10px -4px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)",
        transition: "transform 240ms ease, box-shadow 240ms ease",
      }}
      className="chat-bubble"
    >
      {open ? <X size={20} /> : <MessageCircle size={20} />}
    </button>
  );
}
