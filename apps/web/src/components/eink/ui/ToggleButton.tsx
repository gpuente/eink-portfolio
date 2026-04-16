import type { ReactNode } from "react";
import type { Palette } from "../data/palettes";

type Props = {
  c: Palette;
  onClick: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Shared pill button used by the status-bar language and theme toggles.
 * `minWidth: 40` keeps both toggles visually balanced even when their
 * content differs (icon vs icon + text).
 */
export default function ToggleButton({ c, onClick, title, children }: Props) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "transparent",
        border: `1px solid ${c.inkFaint}`,
        color: c.inkSoft,
        padding: "5px 9px",
        borderRadius: 6,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        fontSize: 10,
        fontFamily: "inherit",
        letterSpacing: ".08em",
        lineHeight: 1,
        minWidth: 40,
      }}
    >
      {children}
    </button>
  );
}
