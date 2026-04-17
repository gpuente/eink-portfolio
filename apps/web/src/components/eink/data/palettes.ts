export type Mode = "light" | "dark";

export type Palette = {
  // Core surface + ink (used everywhere in the main portfolio)
  paper: string;
  paperBright: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;

  // Device-reveal tokens — consumed by DeviceReveal.tsx only.
  // Kept in the palette so light/dark mode share the same swap mechanism.
  /** Desk background (full CSS gradient value). */
  desk: string;
  /** E-reader body (full CSS gradient value). */
  deviceBody: string;
  /** Flat bezel colour around the screen. */
  bezel: string;
  /** Deeper tone for the recessed bezel shadow. */
  bezelDeep: string;
  /** Highlight tone for the chamfered edge where bezel meets body. */
  bezelHi: string;
  /** Box-shadow applied to the screen inside the bezel (looks sunken). */
  screenShadow: string;
  /** Multi-layer box-shadow applied to the device body (ambient + contact + inset). */
  deviceShadow: string;
};

export const PALETTES: Record<Mode, Palette> = {
  light: {
    paper: "#e8e4db",
    paperBright: "#f1ede4",
    ink: "#2b2a27",
    inkSoft: "#6b6860",
    inkFaint: "#a8a49a",

    desk: "radial-gradient(circle at 30% 20%, #d8d3c6 0%, #b8b2a3 60%, #9a9485 100%)",
    deviceBody:
      "linear-gradient(170deg, #e0dbd0 0%, #ccc7bb 30%, #b8b1a2 70%, #a9a294 100%)",
    bezel: "#cfc9bc",
    bezelDeep: "#b8b1a2",
    bezelHi: "#e5e0d3",
    screenShadow:
      "inset 0 2px 6px rgba(0,0,0,.22), inset 0 -1px 2px rgba(0,0,0,.08)",
    deviceShadow: [
      "0 40px 80px -20px rgba(60,50,30,.45)",
      "0 20px 40px -15px rgba(60,50,30,.3)",
      "0 2px 4px rgba(60,50,30,.2)",
      "inset 0 1px 0 rgba(255,255,255,.35)",
      "inset 0 -1px 0 rgba(0,0,0,.12)",
    ].join(", "),
  },
  dark: {
    paper: "#3a3a36",
    paperBright: "#44443f",
    ink: "#dcd8cd",
    inkSoft: "#9a968c",
    inkFaint: "#6b675f",

    desk: "radial-gradient(circle at 30% 20%, #1a1a17 0%, #0f0e0c 60%, #050504 100%)",
    deviceBody:
      "linear-gradient(170deg, #35342e 0%, #2a2924 30%, #1f1e1a 70%, #161513 100%)",
    bezel: "#26251f",
    bezelDeep: "#18171a",
    bezelHi: "#2c2b26",
    screenShadow:
      "inset 0 2px 8px rgba(0,0,0,.6), inset 0 -1px 2px rgba(0,0,0,.35)",
    deviceShadow: [
      "0 40px 80px -20px rgba(0,0,0,.7)",
      "0 20px 40px -15px rgba(0,0,0,.55)",
      "0 2px 4px rgba(0,0,0,.45)",
      "inset 0 1px 0 rgba(255,255,255,.08)",
      "inset 0 -1px 0 rgba(0,0,0,.3)",
    ].join(", "),
  },
};
