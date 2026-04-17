import { useState, type ComponentType, type SVGProps } from "react";
import { Mail, MapPin } from "lucide-react";
import { SiCalendly, SiGithub, SiX } from "@icons-pack/react-simple-icons";

import { contactLinks, type ContactKind } from "../data/contact";
import LinkedInIcon from "../ui/LinkedInIcon";
import type { Palette } from "../data/palettes";
import type { Copy } from "../data/copy";

/**
 * Calendly popup widget. Loaded lazily on the first click so users who
 * never open it don't pay the ~50KB script + CSS on first paint.
 * See: https://calendly.com/help/embed-options-overview
 */
const CALENDLY_URL = "https://calendly.com/gpuente-dev/30-min-meeting";
const CALENDLY_CSS = "https://assets.calendly.com/assets/external/widget.css";
const CALENDLY_JS = "https://assets.calendly.com/assets/external/widget.js";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: { url: string }) => void;
    };
  }
}

let calendlyLoadPromise: Promise<void> | null = null;

function loadCalendlyOnce(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Calendly) return Promise.resolve();
  if (calendlyLoadPromise) return calendlyLoadPromise;
  calendlyLoadPromise = new Promise<void>((resolve, reject) => {
    if (!document.querySelector("link[data-calendly]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CALENDLY_CSS;
      link.setAttribute("data-calendly", "");
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = CALENDLY_JS;
    script.async = true;
    script.setAttribute("data-calendly", "");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Calendly script failed to load"));
    document.body.appendChild(script);
  });
  return calendlyLoadPromise;
}

/**
 * Brand / channel icon for each contact row. Simple-icons provides the
 * real brand marks (Github, LinkedIn, X, Calendly); lucide covers the
 * generic channels (email, location). All components accept a common
 * `size` / `color` prop surface so the map can be strongly typed.
 */
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const CONTACT_ICONS: Record<ContactKind, IconComponent> = {
  email: Mail,
  github: SiGithub,
  linkedin: LinkedInIcon,
  twitter: SiX,
  location: MapPin,
};

type Props = { c: Palette; t: Copy };

export default function ContactSection({ c, t }: Props) {
  const links = contactLinks(t);
  // Tracks whether the user has opened Calendly at least once. After the
  // first click the attention-nudge animation is no longer useful — they
  // clearly saw the button — and continuing would register as harassment.
  const [hasOpenedCalendly, setHasOpenedCalendly] = useState(false);

  const openCalendly: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    setHasOpenedCalendly(true);
    try {
      await loadCalendlyOnce();
      window.Calendly?.initPopupWidget({ url: CALENDLY_URL });
    } catch {
      // Network / CSP failure — land on the Calendly page directly so
      // the user can still book. Named target so popup blockers don't
      // complain.
      window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
    }
  };

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
          margin: "0 0 28px",
          lineHeight: 1.55,
          maxWidth: 600,
        }}
      >
        {t.contactSub}
      </p>

      {/* Primary CTA: opens a Calendly popup for booking a 30-min call.
          Matches the home hero's solid "View CV" button so the two feel
          like paired primary actions across the site. Hint line beneath
          uses the mono meta treatment to read as "system note", not UI. */}
      <div style={{ maxWidth: 600, marginBottom: 36 }}>
        <button
          type="button"
          onClick={openCalendly}
          aria-label={t.scheduleCta}
          className={hasOpenedCalendly ? undefined : "schedule-cta"}
          style={{
            background: c.ink,
            color: c.paper,
            border: "none",
            padding: "12px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            letterSpacing: ".02em",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "inherit",
          }}
        >
          <SiCalendly size={15} />
          {t.scheduleCta}
        </button>
        <div
          className="mono"
          style={{
            marginTop: 10,
            fontSize: 10,
            letterSpacing: ".22em",
            color: c.inkSoft,
            textTransform: "uppercase",
          }}
        >
          {t.scheduleHint}
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        {links.map((l, i) => {
          const Icon = CONTACT_ICONS[l.kind];
          return (
            <div
              key={l.kind}
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon size={13} aria-hidden="true" />
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
          );
        })}
      </div>
    </div>
  );
}
