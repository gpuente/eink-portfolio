import { useEffect, useState } from "react";

/**
 * Returns `true` while Calendly's popup widget is mounted in the DOM.
 *
 * Why: on mobile, Calendly locks background scroll by setting
 * `position: fixed` on <body>. That collapses `documentElement.scrollHeight`
 * to the viewport, which in turn drives `useDeviceReveal` to
 * `progress = 1` — making the scroll-end "device" overlay appear over
 * the Calendly modal. Gating the reveal on this flag prevents the
 * device animation from firing while Calendly is on top.
 *
 * Detection: a MutationObserver on <body>'s subtree watches for
 * Calendly's `.calendly-overlay` root. Calendly appends/removes it
 * directly on open/close, so the observer catches both transitions.
 */
export function useIsCalendlyOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const check = () => {
      setOpen((prev) => {
        const next = !!document.querySelector(".calendly-overlay");
        return next === prev ? prev : next;
      });
    };

    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    check(); // initial state in case the overlay is already there

    return () => observer.disconnect();
  }, []);

  return open;
}
