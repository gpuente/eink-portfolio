export default function timeAgo(date: Date | null | undefined): string {
  if (!date) return "";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  const steps: ReadonlyArray<readonly [string, number]> = [
    ["s", 60],
    ["m", 60],
    ["h", 24],
    ["d", 30],
    ["mo", 12],
    ["y", Infinity],
  ];
  let value = sec;
  let unit = "s";
  for (const [u, cap] of steps) {
    if (value < cap) {
      unit = u;
      break;
    }
    value = Math.floor(value / cap);
  }
  return `${value}${unit}`;
}
