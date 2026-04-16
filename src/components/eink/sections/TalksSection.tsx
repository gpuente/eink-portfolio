import { ArrowUpRight } from "lucide-react";
import { TALKS } from "../data/talks";
import type { Palette } from "../data/palettes";
import type { Copy, Lang } from "../data/copy";

type Props = { c: Palette; t: Copy; lang: Lang };

export default function TalksSection({ c, t, lang }: Props) {
  return (
    <div>
      <h2
        style={{
          fontSize: "clamp(32px, 5vw, 48px)",
          margin: "0 0 12px",
          fontWeight: 500,
          color: c.ink,
          letterSpacing: "-.015em",
        }}
      >
        {t.talksTitle}
      </h2>
      <p
        style={{
          color: c.inkSoft,
          fontSize: 17,
          margin: "0 0 40px",
          lineHeight: 1.55,
          maxWidth: 600,
        }}
      >
        {t.talksSub}
      </p>

      <div>
        {TALKS.map((tk, i) => {
          const title = lang === "es" ? tk.title_es : tk.title_en;
          const event = lang === "es" ? tk.event_es : tk.event_en;
          const note = lang === "es" ? tk.note_es : tk.note_en;

          return (
            <div
              key={tk.href}
              style={{
                padding: "24px 2px",
                borderTop: i === 0 ? `1px solid ${c.inkFaint}` : "none",
                borderBottom: `1px solid ${c.inkFaint}`,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                columnGap: 20,
                rowGap: 6,
              }}
            >
              <a
                href={tk.href}
                target="_blank"
                rel="noreferrer"
                className="underline-hover"
                style={{
                  fontSize: 26,
                  color: c.ink,
                  fontWeight: 500,
                  letterSpacing: "-.01em",
                  textDecoration: "none",
                }}
              >
                {title}{" "}
                <ArrowUpRight
                  size={16}
                  style={{ verticalAlign: "middle", color: c.inkFaint }}
                />
              </a>

              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: c.inkFaint,
                  letterSpacing: ".2em",
                  alignSelf: "center",
                }}
              >
                {tk.year}
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
                {event}
                {tk.relatedProject && (
                  <span style={{ color: c.inkFaint }}> · on {tk.relatedProject}</span>
                )}
              </div>

              <div
                style={{
                  fontSize: 15,
                  color: c.inkSoft,
                  lineHeight: 1.6,
                  gridColumn: "1 / -1",
                  maxWidth: 600,
                }}
              >
                {note}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
