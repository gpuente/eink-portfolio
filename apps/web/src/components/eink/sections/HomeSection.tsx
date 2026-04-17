import { ArrowUpRight, CircleDot, Download, FileText } from "lucide-react";
import timeAgo from "../util/timeAgo";
import type { Palette } from "../data/palettes";
import type { Copy, Lang } from "../data/copy";
import type { SectionId } from "../data/sections";
import type { GitHubData } from "../hooks/useGitHub";

type Props = {
  c: Palette;
  t: Copy;
  onJump: (id: SectionId) => void;
  gh: GitHubData;
  lang: Lang;
};

export default function HomeSection({ c, t, onJump, gh, lang }: Props) {
  // Direct-download links for the two CV PDFs. Served from /public,
  // filename overridden so users get a readable name on save.
  const cvPdfHref =
    lang === "es"
      ? "/guillermo-puente-cv-es.pdf"
      : "/guillermo-puente-cv-en.pdf";
  const cvPdfDownload =
    lang === "es" ? "Guillermo Puente - CV ES.pdf" : "Guillermo Puente - CV EN.pdf";

  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: ".3em",
          color: c.inkSoft,
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        · {t.kicker}
      </div>

      <h1
        style={{
          fontSize: "clamp(44px, 8vw, 84px)",
          lineHeight: 0.98,
          margin: 0,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: c.ink,
        }}
      >
        {t.heroA}
        <em style={{ fontWeight: 400 }}>{t.heroEm}</em>
        {t.heroB}
      </h1>

      <div
        style={{
          color: c.inkSoft,
          fontSize: 19,
          marginTop: 28,
          maxWidth: 600,
          lineHeight: 1.55,
        }}
      >
        {t.tagline}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
        {/* CV — primary CTA. Recruiters scan for this first, so it wins
            the solid style and the leftmost slot. Real anchor (not a
            button) so it's a direct, shareable link to /cv and
            middle-click / right-click work as expected. */}
        <a
          href="/cv"
          style={{
            background: c.ink,
            color: c.paper,
            border: "none",
            padding: "12px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            letterSpacing: ".02em",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "inherit",
            textDecoration: "none",
          }}
        >
          <FileText size={15} />
          {t.ctaCV}
        </a>
        {/* Direct PDF download — outlined, sits right after "View CV"
            so the download path is one click from first view. The
            `download` attribute forces the browser to save (vs open
            inline) and sets a human-readable filename. */}
        <a
          href={cvPdfHref}
          download={cvPdfDownload}
          style={{
            background: "transparent",
            color: c.ink,
            border: `1px solid ${c.inkFaint}`,
            padding: "12px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            letterSpacing: ".02em",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "inherit",
            textDecoration: "none",
          }}
        >
          <Download size={15} />
          {t.ctaCVDownload}
        </a>
        <button
          onClick={() => onJump("contact")}
          style={{
            background: "transparent",
            color: c.ink,
            border: `1px solid ${c.inkFaint}`,
            padding: "12px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            letterSpacing: ".02em",
            fontFamily: "inherit",
          }}
        >
          {t.ctaContact}
        </button>
        <button
          onClick={() => onJump("projects")}
          style={{
            background: "transparent",
            color: c.ink,
            border: `1px solid ${c.inkFaint}`,
            padding: "12px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            letterSpacing: ".02em",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "inherit",
          }}
        >
          {t.ctaProjects} <ArrowUpRight size={15} />
        </button>
      </div>

      {/* Status grid — four cells backed by the 1px grid-gap trick */}
      <div
        style={{
          marginTop: 56,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 1,
          background: c.inkFaint,
          border: `1px solid ${c.inkFaint}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {[
          { k: t.meta.status, v: t.metaValues.status },
          { k: t.reposLabel, v: gh.repos != null ? t.reposValue(gh.repos) : t.loading },
          { k: t.meta.based, v: t.metaValues.based },
          { k: t.meta.tz, v: t.metaValues.tz },
        ].map((item) => (
          <div key={item.k} style={{ background: c.paperBright, padding: "16px 18px" }}>
            <div
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: ".2em",
                color: c.inkSoft,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {item.k}
            </div>
            <div style={{ fontSize: 15, color: c.ink }}>{item.v}</div>
          </div>
        ))}
      </div>

      {/* Recent activity strip — live from GitHub events */}
      {gh.lastPush && (
        <div
          style={{
            marginTop: 20,
            padding: "14px 18px",
            background: c.paperBright,
            border: `1px solid ${c.inkFaint}`,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <CircleDot size={11} style={{ color: c.inkSoft }} />
          <span
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: ".22em",
              color: c.inkSoft,
              textTransform: "uppercase",
            }}
          >
            {t.activityLabel}
          </span>
          <span style={{ fontSize: 14, color: c.ink }}>
            {t.pushedTo}
            <em>{gh.lastRepo}</em>
            <span style={{ color: c.inkSoft }}>
              {" · "}
              {timeAgo(gh.lastPush)}
              {t.agoSuffix}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
