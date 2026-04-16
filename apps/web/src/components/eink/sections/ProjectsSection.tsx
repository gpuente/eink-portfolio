import { ArrowUpRight, Github, Image as ImageIcon } from "lucide-react";
import { PROJECTS } from "../data/projects";
import type { Palette } from "../data/palettes";
import type { Copy, Lang } from "../data/copy";

type Props = { c: Palette; t: Copy; lang: Lang };

export default function ProjectsSection({ c, t, lang }: Props) {
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
        {t.projectsTitle}
      </h2>
      <p
        style={{
          color: c.inkSoft,
          fontSize: 17,
          margin: "0 0 24px",
          lineHeight: 1.55,
          maxWidth: 600,
        }}
      >
        {t.projectsSub}
      </p>

      <a
        href="/gallery"
        className="gallery-cta"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 44,
          padding: "11px 18px",
          background: c.ink,
          color: c.paper,
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          letterSpacing: ".02em",
          textDecoration: "none",
          fontFamily: "inherit",
        }}
      >
        <ImageIcon size={16} />
        {t.projectsGalleryLink}
        <ArrowUpRight size={15} className="cta-arrow" />
      </a>

      <div>
        {PROJECTS.map((p, i) => {
          const primary = p.href || p.repo;
          const showRepoBadge = !!(p.href && p.repo);

          const titleStyle = {
            fontSize: 26,
            color: c.ink,
            fontWeight: 500,
            letterSpacing: "-.01em",
            textDecoration: "none",
            cursor: primary ? "pointer" : "default",
          } as const;

          return (
            <div
              key={p.title}
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {primary ? (
                  <a
                    href={primary}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-hover"
                    style={titleStyle}
                  >
                    {p.title}{" "}
                    <ArrowUpRight
                      size={16}
                      style={{ verticalAlign: "middle", color: c.inkFaint }}
                    />
                  </a>
                ) : (
                  <span className="underline-hover" style={titleStyle}>
                    {p.title}
                  </span>
                )}

                {showRepoBadge && p.repo && (
                  <a
                    href={p.repo}
                    target="_blank"
                    rel="noreferrer"
                    title="Repository"
                    style={{ color: c.inkFaint, display: "flex", alignItems: "center" }}
                  >
                    <Github size={14} />
                  </a>
                )}
              </div>

              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: c.inkFaint,
                  letterSpacing: ".2em",
                  alignSelf: "center",
                }}
              >
                {p.year}
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
                {lang === "es" ? p.kind_es : p.kind_en}
                {p.archived && (
                  <span style={{ color: c.inkFaint }}> · {t.archivedLabel}</span>
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
                {lang === "es" ? p.note_es : p.note_en}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
