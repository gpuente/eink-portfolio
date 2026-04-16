import type { ReactNode } from "react";
import type { Palette } from "../data/palettes";

type Props = {
  c: Palette;
  iconEl: ReactNode;
  label: string;
  value: ReactNode;
  title?: string;
  hideClass?: string;
  valueHideClass?: string;
};

/**
 * A single labeled metric in the top status bar.
 * Renders: icon + tiny uppercase label + value. The label always stays
 * visible so the number is never ambiguous.
 */
export default function StatusStat({
  c,
  iconEl,
  label,
  value,
  title,
  hideClass = "",
  valueHideClass = "",
}: Props) {
  return (
    <span
      className={`status-item ${hideClass}`}
      title={title}
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
