import { MapPin, Rocket, Bitcoin, Github, Languages, Moon, Sun } from "lucide-react";
import StatusStat from "./StatusStat";
import MoonGlyph from "./MoonGlyph";
import WeatherIcon from "./WeatherIcon";
import ToggleButton from "./ToggleButton";
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
          <span className="status-item status-hide-xs" title="Santiago, Chile">
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
            title="Santiago · current temperature"
          />
          <span className="status-divider status-hide-xs" />

          <StatusStat
            c={c}
            iconEl={<MoonGlyph idx={moon.idx} illum={moon.illum} color={c.ink} bg={c.paper} />}
            label="MOON"
            value={`${moon.illum}%`}
            valueHideClass="status-hide-sm"
            title={`${lang === "es" ? moon.name_es : moon.name_en} · ${moon.illum}% ${t.moonIlluminated}`}
          />
          <span className="status-divider status-hide-sm" />

          <StatusStat
            c={c}
            hideClass="status-hide-sm"
            iconEl={<Rocket size={11} />}
            label="ORBIT"
            value={humans != null ? t.humans(humans) : t.loading}
            title={`${humans ?? "—"} humans in orbit right now`}
          />
          <span className="status-divider status-hide-sm" />

          <StatusStat
            c={c}
            hideClass="status-hide-sm"
            iconEl={<Bitcoin size={11} />}
            label="BTC"
            value={btc ? `$${(btc / 1000).toFixed(1)}k` : t.loading}
            title="Bitcoin price (USD)"
          />
          <span className="status-divider status-hide-sm" />

          <StatusStat
            c={c}
            hideClass="status-hide-sm"
            iconEl={<Github size={11} />}
            label="PUSH"
            value={gh.lastPush ? timeAgo(gh.lastPush) : t.loading}
            title={gh.lastRepo ? `Last push to ${gh.lastRepo}` : "GitHub activity"}
          />
          <span className="status-divider" />

          <ToggleButton c={c} onClick={onToggleLang} title="Switch language">
            <Languages size={12} />
            <span>{lang.toUpperCase()}</span>
          </ToggleButton>

          <ToggleButton c={c} onClick={onToggleMode} title="Toggle dimming">
            {mode === "light" ? <Moon size={12} /> : <Sun size={12} />}
          </ToggleButton>
        </div>
      </div>
    </div>
  );
}
