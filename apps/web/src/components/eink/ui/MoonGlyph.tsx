type Props = {
  idx: number;
  illum: number;
  color: string;
  bg: string;
};

/**
 * Tiny SVG moon rendered at the current phase. Avoids emoji fonts, which
 * render inconsistently across platforms. Approach: draw the fully-lit disk,
 * then carve out the shadow with an offset background-colored circle.
 * Waxing phases push the shadow left; waning phases push it right.
 */
export default function MoonGlyph({ idx, illum, color, bg }: Props) {
  const r = 6;
  const size = 14;
  const cx = size / 2;
  const cy = size / 2;
  const lit = illum / 100;
  const waxing = idx < 4;
  const offset = 2 * r * lit;
  const shadowCx = waxing ? cx - offset : cx + offset;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={shadowCx} cy={cy} r={r} fill={bg} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={0.7} opacity={0.4} />
    </svg>
  );
}
