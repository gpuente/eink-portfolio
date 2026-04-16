import type { Palette } from "../data/palettes";

type Props = { c: Palette };

export default function GlobalStyles({ c }: Props) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap');
      html, body, #root { margin: 0; padding: 0; background: ${c.paper}; }

      @keyframes eink-fade-in {
        0%   { opacity: 0; transform: translateY(4px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .eink-enter { animation: eink-fade-in 520ms ease-out both; }

      /* Status-bar clock separator: blinks once per second, snap on/off to
         read as a real clock (not a smooth fade). */
      @keyframes clock-blink {
        0%, 49%   { opacity: 1; }
        50%, 100% { opacity: 0.25; }
      }
      .clock-sep { animation: clock-blink 1s infinite; }

      /* Primary CTA used by the "See visual gallery" link in Projects.
         Calm hover (no scale, no springy movement) but enough motion on the
         arrow to invite the click. */
      .gallery-cta {
        transition: transform 240ms ease, box-shadow 240ms ease;
      }
      .gallery-cta:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 18px -10px rgba(60, 50, 30, .4);
      }
      .gallery-cta .cta-arrow {
        transition: transform 240ms ease;
      }
      .gallery-cta:hover .cta-arrow {
        transform: translate(2px, -2px);
      }

      .grain {
        position: fixed; inset: 0; pointer-events: none; z-index: 100;
        background-image:
          radial-gradient(rgba(0,0,0,.05) 1px, transparent 1px),
          radial-gradient(rgba(0,0,0,.035) 1px, transparent 1px);
        background-size: 3px 3px, 7px 7px;
        background-position: 0 0, 1px 2px;
        mix-blend-mode: multiply;
        opacity: .55;
      }
      .grain-dark { mix-blend-mode: screen; opacity: .35; }

      .mono { font-family: "JetBrains Mono", ui-monospace, monospace; }

      .dock-btn { transition: all 260ms ease; }
      .status-item { display: flex; align-items: center; gap: 5px; }
      .status-divider { width: 1px; height: 11px; background: currentColor; opacity: .25; }

      /* Ensure the button itself captures clicks across its entire padded area.
         Without this, SVG icons from lucide-react can absorb pointer events
         on their stroke paths, leaving the center of small buttons un-clickable. */
      button * { pointer-events: none; }

      .underline-hover { position: relative; }
      .underline-hover::after {
        content: ""; position: absolute; left: 0; right: 100%; bottom: -2px;
        height: 1px; background: currentColor; transition: right 400ms ease;
      }
      .underline-hover:hover::after { right: 0; }

      section { scroll-margin-top: 80px; }

      @media (max-width: 720px) {
        .status-hide-sm { display: none !important; }
      }
      @media (max-width: 520px) {
        .status-hide-xs { display: none !important; }
      }
    `}</style>
  );
}
