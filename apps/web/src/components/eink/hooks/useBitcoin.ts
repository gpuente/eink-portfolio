import { useEffect, useState } from "react";

export function useBitcoin(): number | null {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
      .then((r) => r.json())
      .then((d: { bitcoin?: { usd?: number } }) => setPrice(d.bitcoin?.usd ?? null))
      .catch(() => setPrice(null));
  }, []);

  return price;
}
