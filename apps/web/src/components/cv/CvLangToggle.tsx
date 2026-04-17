import { useEffect, useState } from "react";
import { Languages } from "lucide-react";

import ToggleButton from "../eink/ui/ToggleButton";
import type { Palette } from "../eink/data/palettes";

/**
 * Language toggle for the CV page. Reuses the same `ToggleButton` the
 * portfolio's StatusBar renders for its EN/ES switch, so the visual
 * matches pixel-for-pixel — with the CV's slightly warmer paper + higher
 * contrast ink applied via a CV-local palette.
 *
 * State / persistence contract (shared with the main portfolio):
 *   - Reads `localStorage["eink-lang"]` at mount.
 *   - Writes the same key on every toggle.
 *   - Applies `<html data-lang="en|es">` so the CvPage CSS shows the
 *     matching `[data-cv-lang]` block.
 *   - Also mirrors the choice onto `<html lang>` for screen readers.
 *
 * The CvPage.astro template ships an inline pre-paint script that sets
 * `html[data-lang]` from localStorage before React boots — so the first
 * frame already renders the correct language. This component then takes
 * over on hydration and handles subsequent clicks.
 *
 * Rendered as `client:only="react"` so we don't SSR a button whose text
 * depends on localStorage (which only exists on the client). The
 * language block content is unaffected — both EN and ES blocks ship in
 * the static HTML regardless.
 */

const LANG_STORAGE_KEY = "eink-lang";

/**
 * CV-local palette. Only `ink`, `inkSoft`, and `inkFaint` are consumed
 * by `ToggleButton`; the rest of the Palette fields are filled with
 * empty strings to satisfy the type and are not rendered.
 */
const CV_PALETTE: Palette = {
  paper: "#ebe7de",
  paperBright: "#f3efe6",
  ink: "#1a1a1a",
  inkSoft: "#595651",
  inkFaint: "#9c9890",
  desk: "",
  deviceBody: "",
  bezel: "",
  bezelDeep: "",
  bezelHi: "",
  screenShadow: "",
  deviceShadow: "",
};

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
  // Initialise from the DOM attribute that the inline pre-paint script
  // already set, so the first client render shows the right label.
  const [lang, setLang] = useState<Lang>(readInitialLang);

  // Apply to the DOM + persist on every change (including the first,
  // which is harmless if it matches what the pre-paint script already
  // wrote).
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
      c={CV_PALETTE}
      onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}
      title={lang === "es" ? "Cambiar idioma" : "Switch language"}
    >
      <Languages size={12} />
      <span>{lang.toUpperCase()}</span>
    </ToggleButton>
  );
}
