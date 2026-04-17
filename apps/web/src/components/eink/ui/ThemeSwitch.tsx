import { Moon, Sun } from "lucide-react";
import type { Palette, Mode } from "../data/palettes";

type Props = {
  c: Palette;
  mode: Mode;
  title: string;
  onToggle: () => void;
};

/**
 * Sliding pill switch for the light/dark theme toggle. Knob carries the
 * current mode's icon (Sun in light, Moon in dark) and slides between the
 * two positions on click. Calmer, more "physical" than the previous icon
 * button — fits the e-ink aesthetic.
 */
export default function ThemeSwitch({ c, mode, title, onToggle }: Props) {
  const isDark = mode === "dark";
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      title={title}
      aria-label={title}
      style={{
        position: "relative",
        width: 40,
        height: 22,
        padding: 0,
        borderRadius: 999,
        border: `1px solid ${c.inkFaint}`,
        background: c.paperBright,
        cursor: "pointer",
        display: "block",
        transition: "background 240ms ease, border-color 240ms ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: isDark ? 20 : 2,
          width: 16,
          height: 16,
          borderRadius: 999,
          background: c.ink,
          color: c.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "left 260ms ease, background 240ms ease",
          boxShadow: "0 1px 2px rgba(0,0,0,.18)",
        }}
      >
        {isDark ? <Moon size={9} strokeWidth={2.2} /> : <Sun size={9} strokeWidth={2.2} />}
      </span>
    </button>
  );
}
