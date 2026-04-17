import type { ReactNode } from "react";
import type { Palette } from "../data/palettes";

type Props = {
  c: Palette;
  iconEl: ReactNode;
  label: string;
  value: ReactNode;
  /** Rich custom tooltip (rendered on hover via the `.has-tooltip` CSS rule). */
  tooltip?: string;
  hideClass?: string;
  valueHideClass?: string;
};

/**
 * A single labeled metric in the top status bar.
 * Renders: icon + tiny uppercase label + value. The label always stays
 * visible so the number is never ambiguous. When a `tooltip` is provided,
 * a styled tooltip appears on hover (via the global `.has-tooltip` rule).
 */
export default function StatusStat({
  c,
  iconEl,
  label,
  value,
  tooltip,
  hideClass = "",
  valueHideClass = "",
}: Props) {
  const classes = ["status-item", tooltip ? "has-tooltip" : "", hideClass]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={classes}
      data-tooltip={tooltip}
      aria-label={tooltip}
      style={{ display: "flex", alignItems: "center", gap: 5 }}
    >
      {iconEl}
      <span style={{ color: c.inkFaint, letterSpacing: ".18em", fontSize: 9 }}>{label}</span>
      <span className={valueHideClass} style={{ color: c.ink }}>
        {value}
      </span>
    </span>
  );
}
