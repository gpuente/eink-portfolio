import { MapPin, Rocket, Bitcoin, Github, Languages } from "lucide-react";
import StatusStat from "./StatusStat";
import MoonGlyph from "./MoonGlyph";
import WeatherIcon from "./WeatherIcon";
import ToggleButton from "./ToggleButton";
import ThemeSwitch from "./ThemeSwitch";
import timeAgo from "../util/timeAgo";
import type { Palette, Mode } from "../data/palettes";
import type { Copy, Lang } from "../data/copy";
import type { WeatherData } from "../hooks/useWeather";
import type { GitHubData } from "../hooks/useGitHub";
import type { MoonPhase } from "../hooks/useMoonPhase";

type Props = {
  c: Palette;
  t: Copy;
  time: string;
  date: string;
  mode: Mode;
  lang: Lang;
  weather: WeatherData | null;
  humans: number | null;
  btc: number | null;
  gh: GitHubData;
  moon: MoonPhase;
  onToggleMode: () => void;
  onToggleLang: () => void;
};

/** Open-Meteo WMO codes → human-readable condition (en/es). */
function weatherCondition(code: number | null | undefined, lang: Lang): string {
  if (code == null) return "—";
  if (code === 0) return lang === "es" ? "Despejado" : "Clear";
  if (code <= 3) return lang === "es" ? "Nublado" : "Cloudy";
  if (code <= 48) return lang === "es" ? "Niebla" : "Foggy";
  if (code <= 67) return lang === "es" ? "Lluvia" : "Rainy";
  if (code <= 77) return lang === "es" ? "Nieve" : "Snowy";
  if (code <= 82) return lang === "es" ? "Chubascos" : "Showers";
  if (code <= 99) return lang === "es" ? "Tormenta" : "Storm";
  return "—";
}

export default function StatusBar({
  c,
  t,
  time,
  date,
  mode,
  lang,
  weather,
  humans,
  btc,
  gh,
  moon,
  onToggleMode,
  onToggleLang,
}: Props) {
  const isEs = lang === "es";

  // ── Build rich tooltip strings (shown on hover via .has-tooltip CSS) ──
  const weatherTooltip =
    weather?.temp != null
      ? `Santiago, CL · ${weather.temp}°C · ${weatherCondition(weather.code, lang)}`
      : isEs
      ? "Santiago, CL · clima no disponible"
      : "Santiago, CL · weather unavailable";

  const moonName = isEs ? moon.name_es : moon.name_en;
  const moonTooltip = `${moonName} · ${moon.illum}% ${t.moonIlluminated}`;

  const orbitTooltip =
    humans != null
      ? isEs
        ? `${humans} personas actualmente en órbita · open-notify.org`
        : `${humans} people currently in orbit · open-notify.org`
      : isEs
      ? "Datos de órbita no disponibles"
      : "Orbit data unavailable";

  const btcTooltip = btc
    ? `$${btc.toLocaleString(isEs ? "es-CL" : "en-US")} USD · CoinGecko`
    : isEs
    ? "Precio de Bitcoin no disponible"
    : "Bitcoin price unavailable";

  const pushTooltip = gh.lastPush
    ? isEs
      ? `Último push hace ${timeAgo(gh.lastPush)} en ${gh.lastRepo ?? "—"}`
      : `Last push ${timeAgo(gh.lastPush)} ago to ${gh.lastRepo ?? "—"}`
    : isEs
    ? "Sin actividad reciente en GitHub"
    : "No recent GitHub activity";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: c.paper,
        borderBottom: `1px dashed ${c.inkFaint}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          color: c.inkSoft,
          maxWidth: 1200,
          margin: "0 auto",
          gap: 12,
          minHeight: 44,
        }}
      >
        {/* LEFT — local time, date, location */}
        <div
          className="mono"
          style={{
            fontSize: 12,
            letterSpacing: ".06em",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "nowrap",
          }}
        >
          <span style={{ color: c.ink, fontSize: 14, fontWeight: 500 }}>
            {time.split(":")[0]}
            <span className="clock-sep">:</span>
            {time.split(":")[1]}
          </span>
          <span className="status-divider" />
          <span style={{ opacity: 0.9 }}>{date}</span>
          <span className="status-divider status-hide-xs" />
          <span className="status-item status-hide-xs" title="Santiago de Chile · UTC−3">
            <MapPin size={11} />
            <span>Santiago</span>
          </span>
        </div>

        {/* RIGHT — live data + toggles */}
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: ".04em",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "nowrap",
          }}
        >
          <StatusStat
            c={c}
            hideClass="status-hide-xs"
            iconEl={<WeatherIcon code={weather?.code} />}
            label="SCL"
            value={weather?.temp != null ? `${weather.temp}°` : t.loading}
            tooltip={weatherTooltip}
          />
          <span className="status-divider status-hide-xs" />

          <StatusStat
            c={c}
            iconEl={<MoonGlyph idx={moon.idx} illum={moon.illum} color={c.ink} bg={c.paper} />}
            label="MOON"
            value={`${moon.illum}%`}
            valueHideClass="status-hide-sm"
            tooltip={moonTooltip}
          />
          <span className="status-divider status-hide-sm" />

          <StatusStat
            c={c}
            hideClass="status-hide-sm"
            iconEl={<Rocket size={11} />}
            label="ORBIT"
            value={humans != null ? t.humans(humans) : t.loading}
            tooltip={orbitTooltip}
          />
          <span className="status-divider status-hide-sm" />

          <StatusStat
            c={c}
            hideClass="status-hide-sm"
            iconEl={<Bitcoin size={11} />}
            label="BTC"
            value={btc ? `$${(btc / 1000).toFixed(1)}k` : t.loading}
            tooltip={btcTooltip}
          />
          <span className="status-divider status-hide-sm" />

          <StatusStat
            c={c}
            hideClass="status-hide-sm"
            iconEl={<Github size={11} />}
            label="PUSH"
            value={gh.lastPush ? timeAgo(gh.lastPush) : t.loading}
            tooltip={pushTooltip}
          />
          <span className="status-divider" />

          <ToggleButton c={c} onClick={onToggleLang} title="Switch language">
            <Languages size={12} />
            <span>{lang.toUpperCase()}</span>
          </ToggleButton>

          <ThemeSwitch
            c={c}
            mode={mode}
            title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onToggle={onToggleMode}
          />
        </div>
      </div>
    </div>
  );
}
