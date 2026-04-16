import { Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning } from "lucide-react";

type Props = {
  code: number | null | undefined;
  size?: number;
};

/** Open-Meteo WMO weather codes → a corresponding lucide icon. */
export default function WeatherIcon({ code, size = 11 }: Props) {
  if (code == null) return <Cloud size={size} opacity={0.4} />;
  if (code === 0) return <Sun size={size} />;
  if (code <= 3) return <Cloud size={size} />;
  if (code <= 48) return <CloudFog size={size} />;
  if (code <= 67) return <CloudRain size={size} />;
  if (code <= 77) return <CloudSnow size={size} />;
  if (code <= 82) return <CloudRain size={size} />;
  if (code <= 99) return <CloudLightning size={size} />;
  return <Cloud size={size} />;
}
