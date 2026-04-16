import type { Palette } from "../data/palettes";
import type { Copy } from "../data/copy";

type Props = { c: Palette; t: Copy };

export default function AboutSection({ c, t }: Props) {
  return (
    <div>
      <h2
        style={{
          fontSize: "clamp(32px, 5vw, 48px)",
          margin: "0 0 28px",
          fontWeight: 500,
          color: c.ink,
          letterSpacing: "-.015em",
        }}
      >
        {t.aboutTitle}
      </h2>

      <div style={{ color: c.ink, fontSize: 17, lineHeight: 1.75, maxWidth: 600 }}>
        <p style={{ margin: "0 0 18px" }}>{t.aboutP1}</p>
        <p style={{ margin: "0 0 18px", color: c.inkSoft }}>{t.aboutP2}</p>
        <p style={{ margin: 0, color: c.inkSoft }}>{t.aboutP3}</p>
      </div>

      <div
        style={{
          marginTop: 36,
          padding: "20px 24px",
          background: c.paperBright,
          border: `1px solid ${c.inkFaint}`,
          borderRadius: 12,
          maxWidth: 600,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: ".25em",
            color: c.inkSoft,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          {t.currently}
        </div>
        <div style={{ fontSize: 16, color: c.ink, lineHeight: 1.6 }}>{t.currentlyValue}</div>
      </div>
    </div>
  );
}
