import { useEffect, useState } from "react";
import type { Mode } from "../eink/data/palettes";

/**
 * Reactive read of the current theme mode on `/cv`. The authoritative
 * source is `html[data-mode]` (set by Layout's pre-paint script from
 * localStorage, and updated by CvThemeToggle when the user flips the
 * switch). Both CvLangToggle and CvThemeToggle subscribe via this hook
 * so their palettes stay in sync.
 *
 * Uses MutationObserver instead of a custom event bus so the two React
 * islands don't need to know about each other — whichever one writes
 * the attribute, the others pick it up on the next observer tick.
 */
export function useMode(): Mode {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof document === "undefined") return "light";
    const attr = document.documentElement.getAttribute("data-mode");
    return attr === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      const attr = document.documentElement.getAttribute("data-mode");
      setMode(attr === "dark" ? "dark" : "light");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode"],
    });
    return () => observer.disconnect();
  }, []);

  return mode;
}
