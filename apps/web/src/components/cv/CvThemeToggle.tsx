import { useEffect, useState } from "react";

import ThemeSwitch from "../eink/ui/ThemeSwitch";
import { PALETTES, type Mode } from "../eink/data/palettes";

/**
 * Theme toggle for the standalone `/cv` route. Reuses the same
 * `ThemeSwitch` pill the portfolio's StatusBar renders, so the visuals
 * match pixel-for-pixel — including the palette, which we pull straight
 * from the portfolio's `PALETTES` (not a CV-local copy).
 *
 * State / persistence contract (shared with the main portfolio):
 *   - Reads `localStorage["eink-mode"]` at mount (via `html[data-mode]`
 *     which the Layout pre-paint script sets before first paint).
 *   - Writes the same key on every toggle.
 *   - Flips `<html data-mode>` so CvPage's CSS custom-property
 *     overrides switch to the dark palette.
 *
 * Rendered as `client:only="react"` so we don't SSR a switch whose
 * knob position depends on localStorage.
 */

const MODE_STORAGE_KEY = "eink-mode";

function readInitialMode(): Mode {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-mode");
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  try {
    const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // private-mode Safari / sandboxed iframe — fall through.
  }
  return "light";
}

export default function CvThemeToggle() {
  const [mode, setMode] = useState<Mode>(readInitialMode);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-mode", mode);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Same rationale as above — swallow quota/permission errors.
    }
  }, [mode]);

  return (
    <ThemeSwitch
      c={PALETTES[mode]}
      mode={mode}
      title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
      onToggle={() => setMode((m) => (m === "light" ? "dark" : "light"))}
    />
  );
}
