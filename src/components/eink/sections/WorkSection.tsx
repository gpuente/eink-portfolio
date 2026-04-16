import { EXPERIENCE } from "../data/experience";
import type { Palette } from "../data/palettes";
import type { Copy, Lang } from "../data/copy";

type Props = { c: Palette; t: Copy; lang: Lang };

export default function WorkSection({ c, t, lang }: Props) {
  return (
    <div>
      <h2
        style={{
          fontSize: "clamp(32px, 5vw, 48px)",
          margin: "0 0 32px",
          fontWeight: 500,
          color: c.ink,
          letterSpacing: "-.015em",
        }}
      >
        {t.workTitle}
      </h2>

      <div>
        {EXPERIENCE.map((e, i) => (
          <div
            key={`${e.org}-${e.when}`}
            style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr auto",
              alignItems: "baseline",
              gap: 16,
              padding: "22px 0",
              borderTop: i === 0 ? `1px solid ${c.inkFaint}` : "none",
              borderBottom: `1px solid ${c.inkFaint}`,
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 11, color: c.inkFaint, letterSpacing: ".2em" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div style={{ fontSize: 20, color: c.ink, fontWeight: 500 }}>
                {lang === "es" ? e.role_es : e.role_en}
              </div>
              <div style={{ fontSize: 15, color: c.inkSoft, marginTop: 2 }}>
                {e.org} · {lang === "es" ? e.place_es : e.place_en}
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: c.inkSoft,
                  marginTop: 12,
                  lineHeight: 1.6,
                  maxWidth: 560,
                }}
              >
                {lang === "es" ? e.detail_es : e.detail_en}
              </div>
            </div>
            <span
              className="mono"
              style={{ fontSize: 11, color: c.inkSoft, letterSpacing: ".1em" }}
            >
              {e.when}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
