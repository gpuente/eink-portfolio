import { ArrowUpRight } from "lucide-react";
import { EDUCATION } from "../data/education";
import { CERTIFICATIONS } from "../data/certifications";
import type { Palette } from "../data/palettes";
import type { Copy, Lang } from "../data/copy";

type Props = { c: Palette; t: Copy; lang: Lang };

export default function BackgroundSection({ c, t, lang }: Props) {
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
        {t.backgroundTitle}
      </h2>

      {/* Education */}
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: ".25em",
          color: c.inkSoft,
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {t.educationLabel}
      </div>

      <div style={{ marginBottom: 48 }}>
        {EDUCATION.map((e, i) => {
          const field = lang === "es" ? e.field_es : e.field_en;
          const note = lang === "es" ? e.note_es : e.note_en;
          return (
            <div
              key={`${e.institution}-${e.when}`}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                columnGap: 20,
                rowGap: 6,
                padding: "20px 0",
                borderTop: i === 0 ? `1px solid ${c.inkFaint}` : "none",
                borderBottom: `1px solid ${c.inkFaint}`,
              }}
            >
              <div style={{ fontSize: 18, color: c.ink, fontWeight: 500, letterSpacing: "-.005em" }}>
                {field}
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: c.inkSoft,
                  letterSpacing: ".1em",
                  alignSelf: "center",
                }}
              >
                {e.when}
              </span>
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: c.inkSoft,
                  letterSpacing: ".15em",
                  textTransform: "uppercase",
                  gridColumn: "1 / -1",
                }}
              >
                {e.institution}
              </div>
              {note && (
                <div
                  style={{
                    fontSize: 14,
                    color: c.inkSoft,
                    lineHeight: 1.55,
                    gridColumn: "1 / -1",
                    maxWidth: 600,
                  }}
                >
                  {note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Certifications */}
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: ".25em",
          color: c.inkSoft,
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {t.certificationsLabel}
      </div>

      <div>
        {CERTIFICATIONS.map((cert, i) => {
          const titleStyle = {
            fontSize: 15,
            color: c.ink,
            textDecoration: "none",
          } as const;
          return (
            <div
              key={cert.title}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr auto",
                columnGap: 16,
                alignItems: "baseline",
                padding: "14px 0",
                borderTop: i === 0 ? `1px solid ${c.inkFaint}` : "none",
                borderBottom: `1px solid ${c.inkFaint}`,
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 11, color: c.inkFaint, letterSpacing: ".15em" }}
              >
                {cert.year}
              </span>
              {cert.href ? (
                <a
                  href={cert.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-hover"
                  style={titleStyle}
                >
                  {cert.title}{" "}
                  <ArrowUpRight
                    size={13}
                    style={{ verticalAlign: "middle", color: c.inkFaint }}
                  />
                </a>
              ) : (
                <span style={titleStyle}>{cert.title}</span>
              )}
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: c.inkSoft,
                  letterSpacing: ".15em",
                  textTransform: "uppercase",
                }}
              >
                {cert.issuer}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
