import type { Palette, Mode } from "../data/palettes";

type Props = {
  progress: number; // 0..1
  c: Palette;
  mode: Mode;
  time: string;
  date: string;
  endLabel: string;
};

/**
 * Fullscreen overlay that makes the e-ink content look like it's the screen
 * of a physical e-reader sitting on a desk. The component is driven entirely
 * by the `progress` prop (0..1) from `useDeviceReveal`. Scroll passes through
 * (pointer-events: none).
 *
 * Trick: the overlay is always fully opaque while rendered (not a fade-in).
 * This is deliberate — the illusion is "we were always looking at the device
 * screen fullscreen, and now it zooms out". A fade-in would show the real
 * content ghosting through, breaking that illusion.
 *
 * Visual formula:
 *   eased       = 1 - (1 - progress)^3       // ease-out cubic
 *   scale       = 1 - eased * shrink          // 1.00 → 0.78 / 0.88 (mobile)
 *   bezelScale  = eased                       // bezel insets grow in from 0
 *   opacity     = 1                           // no fade
 *
 * At progress=0 the overlay is NOT rendered (real portfolio visible).
 * At progress>0 the overlay replaces the view with the desk + device, which
 * starts viewport-sized (scale 1, no bezel) and shrinks to show the device.
 */
export default function DeviceReveal({
  progress,
  c,
  mode,
  time,
  date,
  endLabel,
}: Props) {
  if (progress <= 0) return null;

  // On narrow viewports the device should feel more like a tablet — less
  // shrink so it stays visually prominent and the tiny screen stays readable.
  const isNarrow = typeof window !== "undefined" && window.innerWidth < 720;
  const shrinkAmount = isNarrow ? 0.12 : 0.22;

  const eased = 1 - Math.pow(1 - progress, 3);
  const scale = 1 - eased * shrinkAmount;

  // Bezel insets grow from 0 (screen fills device) → full offsets (hardware exposed).
  // Narrower insets on mobile so the screen stays proportionally larger.
  const topInset = isNarrow ? 18 : 24;
  const sideInset = isNarrow ? 10 : 14;
  const bottomInset = isNarrow ? 32 : 40;

  const bezelTop = eased * topInset;
  const bezelLeft = eased * sideInset;
  const bezelRight = eased * sideInset;
  const bezelBottom = eased * bottomInset;

  // Rounding follows the reveal — starts square (device matches viewport), ends rounded.
  const deviceRadius = eased * 28;
  const bezelRadius = eased * 16;
  const screenRadius = eased * 13;

  const tintHi = mode === "dark" ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.4)";
  const tintLo = mode === "dark" ? "rgba(0,0,0,.4)" : "rgba(0,0,0,.15)";
  const hardware = mode === "dark" ? "rgba(0,0,0,.55)" : "rgba(40,35,25,.4)";
  const hardwareHi = mode === "dark" ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.3)";

  // Base device dimensions — larger on mobile (94vw) so the device has more
  // presence and the content inside stays readable. Desktop keeps the classic
  // 3:4 e-reader proportion fitted within ~90% of the smaller viewport axis.
  const deviceWidth = isNarrow
    ? "min(94vw, calc(94vh * 0.72))"
    : "min(90vw, calc(90vh * 0.75))";
  const deviceHeight = isNarrow
    ? "min(94vh, calc(94vw * 1.38))"
    : "min(90vh, calc(90vw * 1.33))";

  return (
    <div
      className="device-reveal"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: c.desk,
      }}
    >
      {/* Device shell */}
      <div
        style={{
          position: "relative",
          width: deviceWidth,
          height: deviceHeight,
          borderRadius: deviceRadius,
          background: c.deviceBody,
          boxShadow: c.deviceShadow,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {/* Paper-dot texture on the body (subtle) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: deviceRadius,
            backgroundImage: "radial-gradient(rgba(0,0,0,.04) 1px, transparent 1px)",
            backgroundSize: "4px 4px",
            mixBlendMode: "multiply",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        />

        {/* Top chamfer — 1px highlight line across the top edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "5%",
            right: "5%",
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, ${tintHi} 50%, transparent 100%)`,
          }}
        />

        {/* Light sensor (top left) */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 36,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, ${hardwareHi}, ${hardware})`,
            boxShadow: "inset 0 0 2px rgba(0,0,0,.4)",
          }}
        />

        {/* Speaker grille (7 dots, top center) */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 3,
          }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 2,
                height: 2,
                borderRadius: 1,
                background: hardware,
                boxShadow: `0 0 0 0.5px ${tintLo}`,
              }}
            />
          ))}
        </div>

        {/* Power button (top right) */}
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 36,
            width: 28,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${hardware} 0%, ${tintLo} 100%)`,
            boxShadow: `inset 0 0.5px 0 ${hardwareHi}, 0 1px 0 ${tintLo}`,
          }}
        />

        {/* Screen bezel (recessed) */}
        <div
          style={{
            position: "absolute",
            top: bezelTop,
            left: bezelLeft,
            right: bezelRight,
            bottom: bezelBottom,
            borderRadius: bezelRadius,
            background: c.bezel,
            boxShadow: `inset 0 2px 4px ${c.bezelDeep}, inset 0 0 0 1px ${c.bezelHi}`,
            padding: 3,
            boxSizing: "border-box",
          }}
        >
          {/* Screen */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: screenRadius,
              background: c.paper,
              boxShadow: c.screenShadow,
              overflow: "hidden",
              color: c.ink,
              fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif',
            }}
          >
            {/* Paper grain (same dot pattern as the main page) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `radial-gradient(rgba(0,0,0,.05) 1px, transparent 1px), radial-gradient(rgba(0,0,0,.035) 1px, transparent 1px)`,
                backgroundSize: "3px 3px, 7px 7px",
                backgroundPosition: "0 0, 1px 2px",
                mixBlendMode: mode === "dark" ? "screen" : "multiply",
                opacity: mode === "dark" ? 0.35 : 0.55,
                pointerEvents: "none",
              }}
            />

            {/* Static status bar — sized generously so it reads at any
                device scale; matches the real StatusBar visual language. */}
            <div
              className="mono"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                padding: "14px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "clamp(12px, 1.8vmin, 16px)",
                letterSpacing: ".06em",
                color: c.inkSoft,
                borderBottom: `1px dashed ${c.inkFaint}`,
                gap: 10,
              }}
            >
              <span style={{ color: c.ink, fontWeight: 500 }}>
                {time}
                <span style={{ color: c.inkFaint, margin: "0 6px" }}>·</span>
                {date}
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: c.ink,
                  }}
                />
                <span style={{ color: c.ink }}>End</span>
              </span>
            </div>

            {/* Centered end-of-transmission card — this is what the reader
                actually sees when the page zooms out. Text sized with
                clamp() so it stays readable across viewport sizes. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(16px, 3vmin, 28px)",
                padding: "0 clamp(20px, 5vmin, 48px)",
                textAlign: "center",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: "clamp(14px, 2.2vmin, 20px)",
                  letterSpacing: ".3em",
                  textTransform: "uppercase",
                  color: c.inkFaint,
                }}
              >
                {endLabel}
              </div>
              <div
                style={{
                  width: "clamp(50px, 8vmin, 80px)",
                  height: 1,
                  background: c.inkFaint,
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  fontSize: "clamp(22px, 4vmin, 34px)",
                  fontStyle: "italic",
                  color: c.ink,
                  fontWeight: 400,
                  letterSpacing: "-.005em",
                  lineHeight: 1.2,
                }}
              >
                Thanks for reading.
              </div>
              <div
                style={{
                  fontSize: "clamp(12px, 1.8vmin, 16px)",
                  color: c.inkSoft,
                  marginTop: "clamp(4px, 1vmin, 8px)",
                  maxWidth: "32ch",
                  lineHeight: 1.55,
                }}
              >
                Scroll back up anytime — or ask the assistant a question.
              </div>
            </div>
          </div>
        </div>

        {/* Home button (bottom center — capacitive pill) */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            width: 36,
            height: 6,
            borderRadius: 3,
            background: `linear-gradient(180deg, ${tintLo}, ${hardware})`,
            boxShadow: `inset 0 0.5px 0 ${hardwareHi}, 0 1px 2px ${tintLo}`,
          }}
        />

        {/* Brand label — faint mono uppercase */}
        <div
          className="mono"
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            fontSize: 7,
            letterSpacing: ".28em",
            textTransform: "uppercase",
            color: hardware,
            opacity: 0.55,
          }}
        >
          memo
        </div>

        {/* USB-C port (bottom edge notch) */}
        <div
          style={{
            position: "absolute",
            bottom: -1,
            left: "50%",
            transform: "translateX(-50%)",
            width: 18,
            height: 2,
            borderRadius: 1,
            background: tintLo,
            opacity: 0.7,
          }}
        />

        {/* Page-turn buttons (right edge) */}
        <div
          style={{
            position: "absolute",
            right: -1,
            top: "40%",
            width: 3,
            height: 30,
            borderRadius: "1px 2px 2px 1px",
            background: `linear-gradient(90deg, ${tintLo}, ${hardware})`,
            boxShadow: `inset 0 0.5px 0 ${hardwareHi}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -1,
            top: "55%",
            width: 3,
            height: 30,
            borderRadius: "1px 2px 2px 1px",
            background: `linear-gradient(90deg, ${tintLo}, ${hardware})`,
            boxShadow: `inset 0 0.5px 0 ${hardwareHi}`,
          }}
        />

        {/* Desk contact shadow under the device */}
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: "10%",
            right: "10%",
            height: 40,
            borderRadius: "50%",
            background: "rgba(0,0,0,.15)",
            filter: "blur(20px)",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
