import type { Mode } from "../data/palettes";

type Props = { mode: Mode };

/**
 * Three fixed overlay layers that make the whole viewport feel like a physical
 * e-ink panel: paper grain, edge vignette, and inset shadow. All are
 * pointer-events: none so they never block interaction.
 */
export default function SurfaceLayers({ mode }: Props) {
  return (
    <>
      <div className={`grain ${mode === "dark" ? "grain-dark" : ""}`} />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 99,
          background:
            mode === "light"
              ? "radial-gradient(ellipse at center, transparent 50%, rgba(80,65,40,.08) 85%, rgba(80,65,40,.14) 100%)"
              : "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.25) 85%, rgba(0,0,0,.4) 100%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 98,
          boxShadow:
            mode === "light"
              ? "inset 0 3px 10px rgba(60,50,30,.12), inset 0 -2px 6px rgba(255,255,255,.25)"
              : "inset 0 3px 10px rgba(0,0,0,.5), inset 0 -2px 6px rgba(255,255,255,.03)",
        }}
      />
    </>
  );
}
