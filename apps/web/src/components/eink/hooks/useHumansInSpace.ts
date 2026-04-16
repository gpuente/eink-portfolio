import { useEffect, useState } from "react";

export function useHumansInSpace(): number | null {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    fetch(
      "https://corsproxy.io/?url=" +
        encodeURIComponent("http://api.open-notify.org/astros.json"),
    )
      .then((r) => r.json())
      .then((d: { number?: number }) => setN(d.number ?? 7))
      .catch(() => setN(7));
  }, []);

  return n;
}
