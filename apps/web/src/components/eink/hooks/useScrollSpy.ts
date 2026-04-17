import { useEffect, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { SectionId } from "../data/sections";

export type SectionRefs = Record<SectionId, RefObject<HTMLElement | null>>;

/**
 * Picks whichever section's top is closest to (and past) a target line a bit
 * below the fixed status bar. Bounding-rect math instead of IntersectionObserver:
 * IO tends to miss short sections when the user scrolls fast between neighbors.
 */
export function useScrollSpy(
  refs: SectionRefs,
  scrollLock: RefObject<boolean>,
  initial: SectionId = "home",
  topOffset = 120,
): [SectionId, Dispatch<SetStateAction<SectionId>>] {
  const [active, setActive] = useState<SectionId>(initial);

  useEffect(() => {
    const onScroll = () => {
      if (scrollLock.current) return;

      // Edge case: at the bottom of the page, the last section's top may still
      // be below `topOffset` (because the section is too short to scroll up
      // that far), leaving the spy stuck on the previous section. Force-select
      // the last id when we hit the bottom.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        const ids = Object.keys(refs) as SectionId[];
        const last = ids[ids.length - 1];
        if (last) {
          setActive(last);
          return;
        }
      }

      let current: SectionId = initial;
      let bestDist = Infinity;
      for (const [id, ref] of Object.entries(refs) as Array<[SectionId, RefObject<HTMLElement | null>]>) {
        if (!ref.current) continue;
        const rect = ref.current.getBoundingClientRect();
        const dist = Math.abs(rect.top - topOffset);
        if (rect.top - topOffset <= 0 && dist < bestDist) {
          bestDist = dist;
          current = id;
        }
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [active, setActive];
}
