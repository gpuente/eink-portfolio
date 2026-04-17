import { useEffect, useRef, useState } from "react";

/**
 * Returns a 0..1 `revealProgress` that ramps up as the user scrolls into the
 * last `revealHeight` pixels of the document.
 *
 *   progress = 0 → normal view (fullscreen content)
 *   progress = 1 → at the very bottom (device fully revealed)
 *
 * Requires a spacer of at least `revealHeight` after the real content so
 * there's scroll room for the animation to play out. Scroll listener is
 * RAF-throttled to avoid double state updates per frame.
 */
export function useDeviceReveal(revealHeight: number): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const compute = () => {
      rafRef.current = null;
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      const distFromEnd = maxScroll - window.scrollY;
      const raw =
        distFromEnd < revealHeight ? 1 - distFromEnd / revealHeight : 0;
      const clamped = raw < 0 ? 0 : raw > 1 ? 1 : raw;
      setProgress((prev) => (Math.abs(prev - clamped) < 0.001 ? prev : clamped));
    };

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [revealHeight]);

  return progress;
}
