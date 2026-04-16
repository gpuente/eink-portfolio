import { SECTIONS } from "../data/sections";
import type { SectionId } from "../data/sections";
import type { Palette, Mode } from "../data/palettes";
import type { Copy } from "../data/copy";

type Props = {
  c: Palette;
  t: Copy;
  active: SectionId;
  onGo: (id: SectionId) => void;
  mode: Mode;
};

export default function Dock({ c, t, active, onGo, mode }: Props) {
  const sections = SECTIONS(t);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "8px 10px",
        background: c.paperBright,
        border: `1px solid ${c.inkFaint}`,
        borderRadius: 999,
        boxShadow:
          mode === "light"
            ? "0 10px 30px -10px rgba(60,50,30,.35), 0 4px 10px -4px rgba(60,50,30,.2), inset 0 1px 0 rgba(255,255,255,.4)"
            : "0 10px 30px -10px rgba(0,0,0,.7), 0 4px 10px -4px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)",
      }}
    >
      {sections.map((s) => {
        const Icon = s.icon;
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onGo(s.id)}
            className="dock-btn"
            title={s.label}
            style={{
              background: isActive ? c.paper : "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: isActive ? c.ink : c.inkSoft,
              boxShadow: isActive
                ? mode === "light"
                  ? "inset 0 1px 2px rgba(60,50,30,.15), inset 0 -1px 0 rgba(255,255,255,.3)"
                  : "inset 0 1px 2px rgba(0,0,0,.4)"
                : "none",
              fontFamily: "inherit",
            }}
          >
            <Icon size={15} strokeWidth={isActive ? 2 : 1.6} />
            <span
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                opacity: isActive ? 1 : 0,
                maxWidth: isActive ? 90 : 0,
                overflow: "hidden",
                transition: "opacity 260ms ease, max-width 260ms ease",
              }}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
