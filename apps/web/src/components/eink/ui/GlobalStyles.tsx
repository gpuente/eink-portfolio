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
         on their stroke paths, leaving the center of small buttons un-clickable.
         The cursor: inherit rule keeps the button pointer cursor visible even
         when the user is hovering directly over the icon (otherwise the cursor
         falls through to whatever the icon default cursor is). */
      button * { pointer-events: none; cursor: inherit; }

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

      /* Bottom bar — wraps the dock + chat bubble.
         - Mobile (< 720px): flex row centered, gap between dock and bubble.
         - Desktop (>= 720px): full-width container; dock self-centers,
           bubble pinned to far right. pointer-events let the empty space pass through. */
      .bottom-bar {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        /* z below the chat panel (65) so the panel input isn't covered when fullscreen on mobile */
        z-index: 60;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: calc(100vw - 16px);
      }
      @media (min-width: 720px) {
        .bottom-bar {
          left: 0;
          right: 0;
          max-width: none;
          transform: none;
          display: block;
          pointer-events: none;
        }
        .bottom-bar > * { pointer-events: auto; position: absolute; bottom: 0; }
        .bottom-bar .eink-dock { left: 50%; transform: translateX(-50%); }
        .bottom-bar .chat-bubble { right: 16px; }
      }

      /* Mobile: drop the dock label entirely. display:none (vs max-width: 0)
         also kills the flex gap between the icon and the label, so the dock
         width stays compact enough for the bubble to fit beside it. */
      @media (max-width: 719px) {
        .dock-label { display: none !important; }

        /* When the chat panel is fullscreen-open on mobile, freeze background scroll
           so only the message list inside the chat scrolls. Cleared when chat closes. */
        body.chat-locked-mobile {
          overflow: hidden !important;
          touch-action: none;
          overscroll-behavior: none;
        }
      }

      /* Status-bar tooltip. Trigger element gets class .has-tooltip + a
         data-tooltip attribute. Right-anchored so the tooltip flows leftward
         (fits the right side of the status bar where the live-data items live). */
      .has-tooltip { position: relative; }
      .has-tooltip::after {
        content: attr(data-tooltip);
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        background: ${c.paperBright};
        color: ${c.ink};
        border: 1px solid ${c.inkFaint};
        border-radius: 6px;
        padding: 6px 10px;
        font-family: "JetBrains Mono", ui-monospace, monospace;
        font-size: 10px;
        letter-spacing: .04em;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 180ms ease 120ms, transform 180ms ease 120ms;
        transform: translateY(-2px);
        z-index: 90;
        box-shadow: 0 8px 18px -10px rgba(60,50,30,.4);
      }
      .has-tooltip:hover::after,
      .has-tooltip:focus-visible::after {
        opacity: 1;
        transform: translateY(0);
      }

      /* Chat bubble — subtle hover lift, calm motion (e-ink-friendly) */
      .chat-bubble:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 34px -16px rgba(60,50,30,.55), 0 6px 14px -6px rgba(60,50,30,.32) !important;
      }

      /* Chat thinking indicator — three dots fading in/out */
      @keyframes chat-pulse {
        0%, 100% { opacity: 0.4; }
        50%      { opacity: 1; }
      }
      .chat-thinking { animation: chat-pulse 1.2s ease-in-out infinite; }

      /* Markdown rendering inside assistant bubbles. Keep the styling calm
         and close to the surrounding body text — no shouting headings, no
         bright blue links. Links inherit text colour and add an underline. */
      .chat-md > :first-child { margin-top: 0; }
      .chat-md > :last-child  { margin-bottom: 0; }
      .chat-md p { margin: 0 0 8px; }
      .chat-md a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-thickness: 1px;
      }
      .chat-md a:hover { text-decoration-thickness: 2px; }
      .chat-md strong { font-weight: 500; }
      .chat-md em { font-style: italic; }
      .chat-md ul, .chat-md ol { margin: 4px 0 8px; padding-left: 20px; }
      .chat-md li { margin: 2px 0; }
      .chat-md li > p { margin: 0; }
      .chat-md h1, .chat-md h2, .chat-md h3, .chat-md h4 {
        font-size: 1em;
        font-weight: 500;
        margin: 10px 0 4px;
        letter-spacing: -.005em;
      }
      .chat-md code {
        font-family: "JetBrains Mono", ui-monospace, monospace;
        font-size: .92em;
        padding: 1px 5px;
        background: rgba(0,0,0,.06);
        border-radius: 4px;
      }
      .chat-md pre {
        margin: 8px 0;
        padding: 10px 12px;
        background: rgba(0,0,0,.06);
        border-radius: 6px;
        overflow-x: auto;
        font-size: 12px;
        line-height: 1.5;
      }
      .chat-md pre code {
        background: none;
        padding: 0;
        font-size: inherit;
      }
      .chat-md blockquote {
        margin: 6px 0;
        padding-left: 10px;
        border-left: 2px solid rgba(0,0,0,.2);
        color: inherit;
        opacity: .85;
      }
      .chat-md hr {
        border: none;
        border-top: 1px dashed rgba(0,0,0,.2);
        margin: 10px 0;
      }

      /* Chip hover (only on devices that support hover, so mobile taps stay flat) */
      @media (hover: hover) {
        .chat-chip:hover { background: ${c.paper} !important; }
      }

      /* Panel layout: full-screen on mobile, floating window on desktop.
         Animated open/close via opacity + translate (no spring/scale). */
      .chat-panel {
        opacity: 0;
        pointer-events: none;
        transition: opacity 200ms ease, transform 200ms ease;
      }
      .chat-panel-open {
        opacity: 1;
        pointer-events: auto;
      }

      /* Mobile: fullscreen takeover */
      @media (max-width: 719px) {
        .chat-panel {
          inset: 0;
          border-radius: 0;
          transform: translateY(8px);
        }
        .chat-panel-open { transform: translateY(0); }
      }

      /* Desktop: small floating window anchored above the bubble (right edge). */
      @media (min-width: 720px) {
        .chat-panel {
          right: 16px;
          bottom: 84px;
          width: min(380px, calc(100vw - 32px));
          height: min(560px, calc(100vh - 120px));
          border-radius: 16px;
          transform: translateY(8px);
        }
        .chat-panel-open { transform: translateY(0); }
      }
    `}</style>
  );
}
