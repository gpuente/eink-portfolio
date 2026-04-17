import { useEffect, useState } from "react";
import { Languages } from "lucide-react";

import ToggleButton from "../eink/ui/ToggleButton";
import { PALETTES } from "../eink/data/palettes";
import { useMode } from "./useMode";

/**
 * Language toggle for the standalone `/cv` route. Reuses the same
 * `ToggleButton` the portfolio's StatusBar renders for its EN/ES
 * switch, so the visuals match pixel-for-pixel — including the dark
 * palette (the two toggles would otherwise drift when the user flipped
 * the theme).
 *
 * State / persistence contract (shared with the main portfolio):
 *   - Reads `localStorage["eink-lang"]` at mount (via `html[data-lang]`
 *     which the Layout pre-paint script sets before first paint).
 *   - Writes the same key on every toggle.
 *   - Flips `<html data-lang>` so CvPage's CSS shows the matching
 *     `[data-cv-lang]` block.
 *
 * Rendered as `client:only="react"` so we don't SSR a button whose
 * label depends on localStorage.
 */

const LANG_STORAGE_KEY = "eink-lang";

type Lang = "en" | "es";

function readInitialLang(): Lang {
  if (typeof document === "undefined") return "en";
  const attr = document.documentElement.getAttribute("data-lang");
  if (attr === "es") return "es";
  if (attr === "en") return "en";
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "es" || saved === "en") return saved;
  } catch {
    // private-mode Safari / sandboxed iframe — fall through.
  }
  return "en";
}

export default function CvLangToggle() {
  const [lang, setLang] = useState<Lang>(readInitialLang);
  // Subscribe to the current theme so the button's border / ink colours
  // match the active palette — otherwise the toggle stays light-styled
  // even when CvThemeToggle flips the page to dark.
  const mode = useMode();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Same rationale as above — swallow quota/permission errors.
    }
  }, [lang]);

  return (
    <ToggleButton
      c={PALETTES[mode]}
      onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}
      title={lang === "es" ? "Cambiar idioma" : "Switch language"}
    >
      <Languages size={12} />
      <span>{lang.toUpperCase()}</span>
    </ToggleButton>
  );
}
