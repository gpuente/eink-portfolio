import { contactLinks } from "../data/contact";
import type { Palette } from "../data/palettes";
import type { Copy } from "../data/copy";

type Props = { c: Palette; t: Copy };

export default function ContactSection({ c, t }: Props) {
  const links = contactLinks(t);
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
        {t.contactTitle}
      </h2>
      <p
        style={{
          color: c.inkSoft,
          fontSize: 17,
          margin: "0 0 36px",
          lineHeight: 1.55,
          maxWidth: 600,
        }}
      >
        {t.contactSub}
      </p>

      <div style={{ maxWidth: 600 }}>
        {links.map((l, i) => (
          <div
            key={l.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              padding: "20px 0",
              borderTop: i === 0 ? `1px solid ${c.inkFaint}` : "none",
              borderBottom: `1px solid ${c.inkFaint}`,
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: c.inkSoft,
                letterSpacing: ".25em",
                textTransform: "uppercase",
              }}
            >
              {l.label}
            </span>
            {l.href ? (
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="underline-hover"
                style={{ color: c.ink, fontSize: 17, textDecoration: "none" }}
              >
                {l.value}
              </a>
            ) : (
              <span style={{ color: c.ink, fontSize: 17 }}>{l.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
