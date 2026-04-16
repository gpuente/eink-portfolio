import type { Palette } from "../data/palettes";

type Props = { c: Palette; label: string };

export default function Divider({ c, label }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        margin: "96px 0 44px",
      }}
    >
      <div style={{ flex: 1, height: 1, background: c.inkFaint, opacity: 0.6 }} />
      <div
        className="mono"
        style={{
          fontSize: 10,
          color: c.inkSoft,
          letterSpacing: ".3em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, height: 1, background: c.inkFaint, opacity: 0.6 }} />
    </div>
  );
}
