import React, { useState, useEffect, useRef } from "react";
import {
  Home, Briefcase, User, Mail, FolderGit2,
  Sun, Moon, ArrowUpRight, MapPin, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Rocket,
  Bitcoin, Languages, Github, CircleDot,
} from "lucide-react";

// ————————————————————————————————————————————————
// E-Ink Portfolio · Memo Puente
// ————————————————————————————————————————————————

const PALETTES = {
  light: {
    paper: "#e8e4db", paperBright: "#f1ede4",
    ink: "#2b2a27", inkSoft: "#6b6860", inkFaint: "#a8a49a",
  },
  dark: {
    paper: "#3a3a36", paperBright: "#44443f",
    ink: "#dcd8cd", inkSoft: "#9a968c", inkFaint: "#6b675f",
  },
};

const COPY = {
  en: {
    kicker: "Memo Puente · Santiago, CL",
    heroA: "Building ",
    heroEm: "small, quiet",
    heroB: " software from the bottom of the world.",
    tagline: "Full-stack dev & independent contractor. I ship front-end, dev tooling, and release infrastructure by day — and run my own ventures the rest of the time.",
    ctaProjects: "See projects",
    ctaContact: "Get in touch",
    meta: { status: "Status", stack: "Stack", based: "Based in", tz: "Timezone" },
    metaValues: { status: "Available · May '26", stack: "TS · React · Node", based: "Santiago, Chile", tz: "UTC−3" },
    sectionAbout: "§ 01 · About",
    sectionProjects: "§ 02 · Projects",
    sectionWork: "§ 03 · Work",
    sectionContact: "§ 04 · Contact",
    projectsTitle: "Selected projects.",
    projectsSub: "Things I've shipped, prototyped, or am still tinkering with at night.",
    aboutTitle: "About.",
    aboutP1: "I live in Santiago, Chile, and I build software for a small association in Switzerland by day, and my own ventures the rest of the time.",
    aboutP2: "I enjoy the boring parts: bookkeeping in double-entry, release pipelines, reading docs, and that particular silence when a long-running script finally finishes.",
    aboutP3: "I care about craft over trend, and I like interfaces that feel like objects.",
    currently: "Currently",
    currentlyValue: "Shipping the Kaffi Shopify storefront and wiring up video infra for Mentora.",
    workTitle: "Work history.",
    contactTitle: "Get in touch.",
    contactSub: "Slow replies, thoughtful ones. I prefer email to most things.",
    end: "— end of transmission —",
    nav: { home: "Home", projects: "Projects", about: "About", work: "Work", contact: "Contact" },
    labels: { email: "Email", github: "GitHub", linkedin: "LinkedIn", location: "Location" },
    locationVal: "Santiago · Chile (UTC−3)",
    humans: (n) => `${n} in orbit`,
    pushedAgo: (s) => `pushed ${s}`,
    loading: "…",
    offline: "offline",
  },
  es: {
    kicker: "Memo Puente · Santiago, CL",
    heroA: "Construyendo ",
    heroEm: "software pequeño",
    heroB: " y silencioso desde el fin del mundo.",
    tagline: "Desarrollador full-stack y contratista independiente. De día escribo front-end, tooling y pipelines de release — el resto del tiempo lo dedico a mis propios proyectos.",
    ctaProjects: "Ver proyectos",
    ctaContact: "Hablemos",
    meta: { status: "Estado", stack: "Stack", based: "Ubicación", tz: "Zona horaria" },
    metaValues: { status: "Disponible · Mayo '26", stack: "TS · React · Node", based: "Santiago, Chile", tz: "UTC−3" },
    sectionAbout: "§ 01 · Sobre mí",
    sectionProjects: "§ 02 · Proyectos",
    sectionWork: "§ 03 · Trabajo",
    sectionContact: "§ 04 · Contacto",
    projectsTitle: "Proyectos seleccionados.",
    projectsSub: "Cosas que he enviado, prototipado, o que sigo afinando por las noches.",
    aboutTitle: "Sobre mí.",
    aboutP1: "Vivo en Santiago, Chile. De día construyo software para una pequeña asociación suiza, y el resto del tiempo lo dedico a mis propios proyectos.",
    aboutP2: "Disfruto las partes aburridas: contabilidad de partida doble, pipelines de release, leer docs, y ese silencio particular cuando un script largo por fin termina.",
    aboutP3: "Me importa el oficio más que la tendencia, y me gustan las interfaces que se sienten como objetos.",
    currently: "Ahora mismo",
    currentlyValue: "Terminando la tienda Shopify de Kaffi y montando la infra de video para Mentora.",
    workTitle: "Historia laboral.",
    contactTitle: "Escríbeme.",
    contactSub: "Respuestas lentas, pensadas. Prefiero el email a casi todo.",
    end: "— fin de la transmisión —",
    nav: { home: "Inicio", projects: "Proyectos", about: "Sobre mí", work: "Trabajo", contact: "Contacto" },
    labels: { email: "Email", github: "GitHub", linkedin: "LinkedIn", location: "Ubicación" },
    locationVal: "Santiago · Chile (UTC−3)",
    humans: (n) => `${n} en órbita`,
    pushedAgo: (s) => `push hace ${s}`,
    loading: "…",
    offline: "sin conexión",
  },
};

const SECTIONS = (t) => [
  { id: "home",     label: t.nav.home,     icon: Home },
  { id: "about",    label: t.nav.about,    icon: User },
  { id: "projects", label: t.nav.projects, icon: FolderGit2 },
  { id: "work",     label: t.nav.work,     icon: Briefcase },
  { id: "contact",  label: t.nav.contact,  icon: Mail },
];

const PROJECTS = [
  { title: "Kaffi",            kind: "E-commerce · Shopify",      year: "2026", note_en: "Portable coffee maker. Custom theme, AI product photography, Notion ops.",            note_es: "Cafetera portátil. Theme custom, fotografía de producto con IA, operaciones en Notion." },
  { title: "Mentora",          kind: "Marketplace · Node/CF",     year: "2026", note_en: "Chilean online psychology platform. Boleta automation, Cloudflare SFU video.",        note_es: "Plataforma chilena de psicología online. Automatización de boletas, video con Cloudflare SFU." },
  { title: "Bank MCP",         kind: "Infrastructure · MCP",      year: "2026", note_en: "Multi-tenant Playwright banking server. Auth0, AES-256-GCM, Fly.io.",                  note_es: "Servidor bancario multi-tenant con Playwright. Auth0, AES-256-GCM, Fly.io." },
  { title: "PocketCoder",      kind: "Mobile · Claude Code",      year: "2025", note_en: "Phone interface for Claude Code via WebSocket relay. Supabase + Polar.",              note_es: "Interfaz móvil para Claude Code vía WebSocket relay. Supabase + Polar." },
  { title: "LLM Fundamentals", kind: "Interactive guide",         year: "2025", note_en: "12 chapters on tokens, attention, training, agents, MCP — in React.",                 note_es: "12 capítulos sobre tokens, attention, training, agents, MCP — en React." },
];

const EXPERIENCE = [
  { role_en: "Contractor — FE & DevRel", role_es: "Contratista — FE & DevRel", org: "Powerhouse Genesis", when: "2024 —", place: "Remote · CH" },
  { role_en: "Founder",                  role_es: "Fundador",                   org: "Kaffi",              when: "2025 —", place: "Santiago · CL" },
  { role_en: "Founder",                  role_es: "Fundador",                   org: "Mentora",            when: "2025 —", place: "Santiago · CL" },
  { role_en: "Accountant Analyst",       role_es: "Analista contable",          org: "Consultancy",        when: "— 2023", place: "Santiago · CL" },
];

// ————————————————————————————————————————————————
// Hooks: live data
// ————————————————————————————————————————————————

function useWeather() {
  const [w, setW] = useState(null);
  useEffect(() => {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=-33.45&longitude=-70.66&current=temperature_2m,weather_code&timezone=America/Santiago";
    fetch(url)
      .then(r => r.json())
      .then(d => setW({
        temp: Math.round(d.current.temperature_2m),
        code: d.current.weather_code,
      }))
      .catch(() => setW({ temp: null, code: null }));
  }, []);
  return w;
}

function useHumansInSpace() {
  const [n, setN] = useState(null);
  useEffect(() => {
    // open-notify doesn't support CORS; use a proxy with a fallback
    fetch("https://corsproxy.io/?url=" + encodeURIComponent("http://api.open-notify.org/astros.json"))
      .then(r => r.json())
      .then(d => setN(d.number ?? 7))
      .catch(() => setN(7)); // rarely changes, 7 is a reasonable default
  }, []);
  return n;
}

function useBitcoin() {
  const [p, setP] = useState(null);
  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
      .then(r => r.json())
      .then(d => setP(d.bitcoin?.usd ?? null))
      .catch(() => setP(null));
  }, []);
  return p;
}

function useGitHub() {
  const [data, setData] = useState({ repos: null, followers: null, lastPush: null, lastRepo: null });
  useEffect(() => {
    fetch("https://api.github.com/users/gpuente")
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) setData(d => ({ ...d, repos: u.public_repos, followers: u.followers })); })
      .catch(() => {});
    fetch("https://api.github.com/users/gpuente/events/public?per_page=10")
      .then(r => r.ok ? r.json() : null)
      .then(events => {
        if (!events) return;
        const push = events.find(e => e.type === "PushEvent");
        if (push) {
          setData(d => ({
            ...d,
            lastPush: new Date(push.created_at),
            lastRepo: push.repo.name.split("/")[1],
          }));
        }
      })
      .catch(() => {});
  }, []);
  return data;
}

// client-side moon phase (no API, real astronomy)
function useMoonPhase() {
  const phase = (() => {
    const now = new Date();
    const synodic = 29.530588853;
    const known = new Date("2000-01-06T18:14:00Z").getTime();
    const days = (now.getTime() - known) / (1000 * 60 * 60 * 24);
    const age = ((days % synodic) + synodic) % synodic;
    const illum = (1 - Math.cos((age / synodic) * 2 * Math.PI)) / 2;
    const idx = Math.floor((age / synodic) * 8 + 0.5) % 8;
    const names_en = ["New","Waxing","1st Q","Waxing","Full","Waning","Last Q","Waning"];
    const names_es = ["Nueva","Creciente","Cuarto C.","Creciente","Llena","Menguante","Cuarto M.","Menguante"];
    return {
      illum: Math.round(illum * 100),
      idx,
      name_en: names_en[idx],
      name_es: names_es[idx],
    };
  })();
  return phase;
}

// tiny SVG moon that visually matches the phase — no emoji font lottery.
// Approach: draw the full lit disk, then overlay an offset background-colored
// circle to carve out the shadow. Offset direction = waxing/waning.
function MoonGlyph({ idx, illum, color, bg }) {
  const r = 6;
  const size = 14;
  const cx = size / 2, cy = size / 2;
  const lit = illum / 100;
  const waxing = idx < 4;

  // Offset for the shadow circle. At lit=1 (full), offset >= 2r (fully out of view).
  // At lit=0 (new), offset = 0 (fully covering). Linear mapping: offset = 2r * lit.
  const offset = 2 * r * lit;
  // Waxing = light on the right, shadow comes from the left → shadow circle shifts LEFT
  // Waning = light on the left, shadow comes from the right → shadow circle shifts RIGHT
  const shadowCx = waxing ? cx - offset : cx + offset;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={shadowCx} cy={cy} r={r} fill={bg} />
      {/* thin outline so new moon is still visible as a ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={0.7} opacity={0.4} />
    </svg>
  );
}

// Open-Meteo WMO weather codes → lucide icon
function WeatherIcon({ code }) {
  const size = 11;
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

function timeAgo(date, lang) {
  if (!date) return "";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  const map_en = [["s", 60], ["m", 60], ["h", 24], ["d", 30], ["mo", 12], ["y", Infinity]];
  const map_es = map_en; // same units work
  const m = lang === "es" ? map_es : map_en;
  let v = sec, u = "s";
  for (const [unit, cap] of m) {
    if (v < cap) { u = unit; break; }
    v = Math.floor(v / cap);
  }
  return `${v}${u}`;
}

// ————————————————————————————————————————————————

export default function App() {
  const [mode, setMode] = useState("light");
  const [lang, setLang] = useState("en");
  const [active, setActive] = useState("home");
  const [now, setNow] = useState(new Date());
  const refs = {
    home:     useRef(null),
    about:    useRef(null),
    projects: useRef(null),
    work:     useRef(null),
    contact:  useRef(null),
  };
  const scrollLock = useRef(false);

  const c = PALETTES[mode];
  const t = COPY[lang];

  const weather = useWeather();
  const humans  = useHumansInSpace();
  const btc     = useBitcoin();
  const gh      = useGitHub();
  const moon    = useMoonPhase();

  // clock (tick every second for a real feel, but throttle re-renders to 30s)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // scroll spy — picks the section closest to the top of the viewport.
  // Using bounding-rect math instead of IntersectionObserver because IO can
  // miss short sections when scrolling fast between two neighbors.
  useEffect(() => {
    const onScroll = () => {
      if (scrollLock.current) return;
      const topOffset = 120; // status bar + a little breathing room
      let current = "home";
      let bestDist = Infinity;
      for (const [id, ref] of Object.entries(refs)) {
        if (!ref.current) continue;
        const rect = ref.current.getBoundingClientRect();
        // distance from the "target line" near the top of the viewport
        const dist = Math.abs(rect.top - topOffset);
        // prefer sections whose top has already passed the target line
        if (rect.top - topOffset <= 0 && dist < bestDist) {
          bestDist = dist;
          current = id;
        }
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = (id) => {
    // Lock the spy briefly so it doesn't flicker through intermediate sections
    // during the smooth-scroll animation. Unlock once we arrive (or after a timeout).
    scrollLock.current = true;
    setActive(id);
    refs[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => { scrollLock.current = false; }, 900);
  };

  const time = now.toLocaleTimeString(lang === "es" ? "es-CL" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  const date = now.toLocaleDateString(lang === "es" ? "es-CL" : "en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: c.paper,
        color: c.ink,
        fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif',
        transition: "background 600ms ease, color 600ms ease",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap');
        html, body, #root { margin: 0; padding: 0; background: ${c.paper}; }

        @keyframes eink-fade-in {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .eink-enter { animation: eink-fade-in 520ms ease-out both; }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 100;
          background-image:
            radial-gradient(rgba(0,0,0,.05) 1px, transparent 1px),
            radial-gradient(rgba(0,0,0,.035) 1px, transparent 1px);
          background-size: 3px 3px, 7px 7px;
          background-position: 0 0, 1px 2px;
          mix-blend-mode: multiply;
          opacity: .55;
        }
        .grain-dark { mix-blend-mode: screen; opacity: .35; }

        .mono { font-family: "JetBrains Mono", ui-monospace, monospace; }

        .dock-btn { transition: all 260ms ease; }
        .status-item { display: flex; align-items: center; gap: 5px; }
        .status-divider { width: 1px; height: 11px; background: currentColor; opacity: .25; }

        .underline-hover { position: relative; }
        .underline-hover::after {
          content:""; position:absolute; left:0; right:100%; bottom:-2px;
          height:1px; background:currentColor; transition: right 400ms ease;
        }
        .underline-hover:hover::after { right:0; }

        section { scroll-margin-top: 80px; }

        /* hide overflow status items on narrow screens */
        @media (max-width: 720px) {
          .status-hide-sm { display: none !important; }
        }
        @media (max-width: 520px) {
          .status-hide-xs { display: none !important; }
        }
      `}</style>

      <div className={`grain ${mode === "dark" ? "grain-dark" : ""}`} />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99,
        background: mode === "light"
          ? "radial-gradient(ellipse at center, transparent 50%, rgba(80,65,40,.08) 85%, rgba(80,65,40,.14) 100%)"
          : "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.25) 85%, rgba(0,0,0,.4) 100%)",
      }} />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 98,
        boxShadow: mode === "light"
          ? "inset 0 3px 10px rgba(60,50,30,.12), inset 0 -2px 6px rgba(255,255,255,.25)"
          : "inset 0 3px 10px rgba(0,0,0,.5), inset 0 -2px 6px rgba(255,255,255,.03)",
      }} />

      <StatusBar
        c={c} t={t} time={time} date={date} mode={mode} lang={lang}
        weather={weather} humans={humans} btc={btc} gh={gh} moon={moon}
        onToggleMode={() => setMode(m => m === "light" ? "dark" : "light")}
        onToggleLang={() => setLang(l => l === "en" ? "es" : "en")}
      />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "120px 32px 160px" }}>
        <section ref={refs.home} data-section="home">
          <HomeSection c={c} t={t} onJump={scrollTo} gh={gh} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionAbout} />
        <section ref={refs.about} data-section="about">
          <AboutSection c={c} t={t} />
        </section>

        <Divider c={c} label={t.sectionProjects} />
        <section ref={refs.projects} data-section="projects">
          <ProjectsSection c={c} t={t} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionWork} />
        <section ref={refs.work} data-section="work">
          <WorkSection c={c} t={t} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionContact} />
        <section ref={refs.contact} data-section="contact">
          <ContactSection c={c} t={t} />
        </section>

        <div className="mono" style={{
          marginTop: 80, fontSize: 10, color: c.inkFaint,
          letterSpacing: ".3em", textTransform: "uppercase", textAlign: "center",
        }}>
          {t.end}
        </div>
      </main>

      <Dock c={c} t={t} active={active} onGo={scrollTo} mode={mode} />
    </div>
  );
}

// ————————————————————————————————————————————————
// StatusStat — a single labeled metric in the top bar.
// Always shows LABEL so the number is legible without context.
// ————————————————————————————————————————————————
function StatusStat({ c, iconEl, label, value, title, hideClass = "", valueHideClass = "" }) {
  return (
    <span
      className={`status-item ${hideClass}`}
      title={title}
      style={{ display: "flex", alignItems: "center", gap: 5 }}
    >
      {iconEl}
      <span style={{ color: c.inkFaint, letterSpacing: ".18em", fontSize: 9 }}>
        {label}
      </span>
      <span className={valueHideClass} style={{ color: c.ink }}>
        {value}
      </span>
    </span>
  );
}

// ————————————————————————————————————————————————
// Status bar (with live data)
// ————————————————————————————————————————————————
function StatusBar({ c, t, time, date, mode, lang, weather, humans, btc, gh, moon, onToggleMode, onToggleLang }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: c.paper,
      borderBottom: `1px dashed ${c.inkFaint}`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        color: c.inkSoft,
        maxWidth: 1200, margin: "0 auto",
        gap: 12, minHeight: 44,
      }}>
        {/* LEFT: time · date · location */}
        <div className="mono" style={{
          fontSize: 12, letterSpacing: ".06em",
          display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap",
        }}>
          <span style={{ color: c.ink, fontSize: 14, fontWeight: 500 }}>{time}</span>
          <span className="status-divider" />
          <span style={{ opacity: .9 }}>{date}</span>
          <span className="status-divider status-hide-xs" />
          <span className="status-item status-hide-xs" title="Santiago, Chile">
            <MapPin size={11} />
            <span>Santiago</span>
          </span>
        </div>

        {/* RIGHT: live data icons */}
        <div className="mono" style={{
          fontSize: 11, letterSpacing: ".04em",
          display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap",
        }}>
          {/* weather */}
          <StatusStat
            c={c}
            hideClass="status-hide-xs"
            iconEl={<WeatherIcon code={weather?.code} />}
            label="SCL"
            value={weather?.temp != null ? `${weather.temp}°` : t.loading}
            title="Santiago · current temperature"
          />

          <span className="status-divider status-hide-xs" />

          {/* moon phase */}
          <StatusStat
            c={c}
            iconEl={<MoonGlyph idx={moon.idx} illum={moon.illum} color={c.ink} bg={c.paper} />}
            label="MOON"
            value={`${moon.illum}%`}
            valueHideClass="status-hide-sm"
            title={`${lang === "es" ? moon.name_es : moon.name_en} · ${moon.illum}% ${lang === "es" ? "iluminada" : "illuminated"}`}
          />

          <span className="status-divider status-hide-sm" />

          {/* humans in space */}
          <StatusStat
            c={c}
            hideClass="status-hide-sm"
            iconEl={<Rocket size={11} />}
            label="ORBIT"
            value={humans != null ? `${humans} ${lang === "es" ? "ppl" : "ppl"}` : t.loading}
            title={`${humans ?? "—"} humans in orbit right now`}
          />

          <span className="status-divider status-hide-sm" />

          {/* bitcoin */}
          <StatusStat
            c={c}
            hideClass="status-hide-sm"
            iconEl={<Bitcoin size={11} />}
            label="BTC"
            value={btc ? `$${(btc / 1000).toFixed(1)}k` : t.loading}
            title="Bitcoin price (USD)"
          />

          <span className="status-divider status-hide-sm" />

          {/* github last push */}
          <StatusStat
            c={c}
            hideClass="status-hide-sm"
            iconEl={<Github size={11} />}
            label="PUSH"
            value={gh.lastPush ? timeAgo(gh.lastPush, lang) : t.loading}
            title={gh.lastRepo ? `Last push to ${gh.lastRepo}` : "GitHub activity"}
          />

          <span className="status-divider" />

          {/* lang toggle */}
          <button
            onClick={onToggleLang}
            title="Switch language"
            style={{
              background: "transparent", border: `1px solid ${c.inkFaint}`,
              color: c.inkSoft, padding: "3px 6px", borderRadius: 5, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, fontSize: 10,
              fontFamily: "inherit", letterSpacing: ".08em",
            }}
          >
            <Languages size={10} />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* theme toggle */}
          <button
            onClick={onToggleMode} title="Toggle dimming"
            style={{
              background: "transparent", border: `1px solid ${c.inkFaint}`,
              color: c.inkSoft, padding: "3px 6px", borderRadius: 5, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, fontSize: 10,
              fontFamily: "inherit",
            }}
          >
            {mode === "light" ? <Moon size={10} /> : <Sun size={10} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————
// Dock
// ————————————————————————————————————————————————
function Dock({ c, t, active, onGo, mode }) {
  const sections = SECTIONS(t);
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 60, display: "flex", alignItems: "center", gap: 4,
      padding: "8px 10px",
      background: c.paperBright,
      border: `1px solid ${c.inkFaint}`,
      borderRadius: 999,
      boxShadow: mode === "light"
        ? "0 10px 30px -10px rgba(60,50,30,.35), 0 4px 10px -4px rgba(60,50,30,.2), inset 0 1px 0 rgba(255,255,255,.4)"
        : "0 10px 30px -10px rgba(0,0,0,.7), 0 4px 10px -4px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)",
    }}>
      {sections.map((s) => {
        const Icon = s.icon;
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onGo(s.id)}
            className="dock-btn"
            title={s.label}
            style={{
              background: isActive ? c.paper : "transparent",
              border: "none", cursor: "pointer",
              padding: "8px 12px", borderRadius: 999,
              display: "flex", alignItems: "center", gap: 6,
              color: isActive ? c.ink : c.inkSoft,
              boxShadow: isActive
                ? (mode === "light"
                  ? "inset 0 1px 2px rgba(60,50,30,.15), inset 0 -1px 0 rgba(255,255,255,.3)"
                  : "inset 0 1px 2px rgba(0,0,0,.4)")
                : "none",
              fontFamily: "inherit",
            }}
          >
            <Icon size={15} strokeWidth={isActive ? 2 : 1.6} />
            <span className="mono" style={{
              fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase",
              opacity: isActive ? 1 : 0,
              maxWidth: isActive ? 90 : 0,
              overflow: "hidden",
              transition: "opacity 260ms ease, max-width 260ms ease",
            }}>
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ————————————————————————————————————————————————
// Divider
// ————————————————————————————————————————————————
function Divider({ c, label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      margin: "96px 0 44px",
    }}>
      <div style={{ flex: 1, height: 1, background: c.inkFaint, opacity: .6 }} />
      <div className="mono" style={{
        fontSize: 10, color: c.inkSoft, letterSpacing: ".3em", textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 1, background: c.inkFaint, opacity: .6 }} />
    </div>
  );
}

// ————————————————————————————————————————————————
// HOME
// ————————————————————————————————————————————————
function HomeSection({ c, t, onJump, gh, lang }) {
  return (
    <div>
      <div className="mono" style={{
        fontSize: 11, letterSpacing: ".3em", color: c.inkSoft,
        textTransform: "uppercase", marginBottom: 20,
      }}>
        · {t.kicker}
      </div>

      <h1 style={{
        fontSize: "clamp(44px, 8vw, 84px)",
        lineHeight: 0.98,
        margin: 0,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: c.ink,
      }}>
        {t.heroA}<em style={{ fontWeight: 400 }}>{t.heroEm}</em>{t.heroB}
      </h1>

      <div style={{ color: c.inkSoft, fontSize: 19, marginTop: 28, maxWidth: 560, lineHeight: 1.55 }}>
        {t.tagline}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
        <button
          onClick={() => onJump("projects")}
          style={{
            background: c.ink, color: c.paper,
            border: "none", padding: "12px 20px", borderRadius: 8,
            cursor: "pointer", fontSize: 14, letterSpacing: ".02em",
            display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
          }}
        >
          {t.ctaProjects} <ArrowUpRight size={15} />
        </button>
        <button
          onClick={() => onJump("contact")}
          style={{
            background: "transparent", color: c.ink,
            border: `1px solid ${c.inkFaint}`, padding: "12px 20px", borderRadius: 8,
            cursor: "pointer", fontSize: 14, letterSpacing: ".02em", fontFamily: "inherit",
          }}
        >
          {t.ctaContact}
        </button>
      </div>

      {/* status grid — now with live GitHub numbers */}
      <div style={{
        marginTop: 56,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 1,
        background: c.inkFaint,
        border: `1px solid ${c.inkFaint}`,
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {[
          { k: t.meta.status, v: t.metaValues.status },
          { k: "repos",       v: gh.repos != null ? `${gh.repos} public` : t.loading },
          { k: t.meta.based,  v: t.metaValues.based },
          { k: t.meta.tz,     v: t.metaValues.tz },
        ].map((item) => (
          <div key={item.k} style={{ background: c.paperBright, padding: "16px 18px" }}>
            <div className="mono" style={{
              fontSize: 10, letterSpacing: ".2em", color: c.inkSoft,
              textTransform: "uppercase", marginBottom: 6,
            }}>
              {item.k}
            </div>
            <div style={{ fontSize: 15, color: c.ink }}>{item.v}</div>
          </div>
        ))}
      </div>

      {/* Recent activity strip — live from GitHub */}
      {gh.lastPush && (
        <div style={{
          marginTop: 20, padding: "14px 18px",
          background: c.paperBright,
          border: `1px solid ${c.inkFaint}`,
          borderRadius: 10,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <CircleDot size={11} style={{ color: c.inkSoft }} />
          <span className="mono" style={{
            fontSize: 10, letterSpacing: ".22em", color: c.inkSoft,
            textTransform: "uppercase",
          }}>
            {lang === "es" ? "última actividad" : "latest activity"}
          </span>
          <span style={{ fontSize: 14, color: c.ink }}>
            {lang === "es" ? "push a " : "pushed to "}
            <em>{gh.lastRepo}</em>
            <span style={{ color: c.inkSoft }}> · {timeAgo(gh.lastPush, lang)} {lang === "es" ? "atrás" : "ago"}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ————————————————————————————————————————————————
function ProjectsSection({ c, t, lang }) {
  return (
    <div>
      <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "0 0 12px", fontWeight: 500, color: c.ink, letterSpacing: "-.015em" }}>
        {t.projectsTitle}
      </h2>
      <p style={{ color: c.inkSoft, fontSize: 17, margin: "0 0 40px", lineHeight: 1.55, maxWidth: 540 }}>
        {t.projectsSub}
      </p>

      <div>
        {PROJECTS.map((p, i) => (
          <div key={p.title} style={{
            padding: "24px 2px",
            borderTop: i === 0 ? `1px solid ${c.inkFaint}` : "none",
            borderBottom: `1px solid ${c.inkFaint}`,
            display: "grid", gridTemplateColumns: "1fr auto", columnGap: 20, rowGap: 6,
          }}>
            <span className="underline-hover" style={{
              fontSize: 26, color: c.ink, fontWeight: 500, cursor: "pointer", letterSpacing: "-.01em",
            }}>
              {p.title}
            </span>
            <span className="mono" style={{ fontSize: 11, color: c.inkFaint, letterSpacing: ".2em", alignSelf: "center" }}>
              {p.year}
            </span>
            <div className="mono" style={{
              fontSize: 10, color: c.inkSoft, letterSpacing: ".15em",
              textTransform: "uppercase", gridColumn: "1 / -1",
            }}>
              {p.kind}
            </div>
            <div style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.6, gridColumn: "1 / -1", maxWidth: 560 }}>
              {lang === "es" ? p.note_es : p.note_en}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————
function AboutSection({ c, t }) {
  return (
    <div>
      <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "0 0 28px", fontWeight: 500, color: c.ink, letterSpacing: "-.015em" }}>
        {t.aboutTitle}
      </h2>
      <div style={{ color: c.ink, fontSize: 17, lineHeight: 1.75, maxWidth: 580 }}>
        <p style={{ margin: "0 0 18px" }}>{t.aboutP1}</p>
        <p style={{ margin: "0 0 18px", color: c.inkSoft }}>{t.aboutP2}</p>
        <p style={{ margin: 0, color: c.inkSoft }}>{t.aboutP3}</p>
      </div>

      <div style={{
        marginTop: 36, padding: "20px 24px",
        background: c.paperBright, border: `1px solid ${c.inkFaint}`, borderRadius: 12,
        maxWidth: 580,
      }}>
        <div className="mono" style={{
          fontSize: 10, letterSpacing: ".25em", color: c.inkSoft,
          textTransform: "uppercase", marginBottom: 10,
        }}>
          {t.currently}
        </div>
        <div style={{ fontSize: 16, color: c.ink, lineHeight: 1.6 }}>
          {t.currentlyValue}
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————
function WorkSection({ c, t, lang }) {
  return (
    <div>
      <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "0 0 32px", fontWeight: 500, color: c.ink, letterSpacing: "-.015em" }}>
        {t.workTitle}
      </h2>
      <div>
        {EXPERIENCE.map((e, i) => (
          <div key={e.org} style={{
            display: "grid", gridTemplateColumns: "48px 1fr auto", alignItems: "baseline",
            gap: 16, padding: "22px 0",
            borderTop: i === 0 ? `1px solid ${c.inkFaint}` : "none",
            borderBottom: `1px solid ${c.inkFaint}`,
          }}>
            <span className="mono" style={{ fontSize: 11, color: c.inkFaint, letterSpacing: ".2em" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div style={{ fontSize: 20, color: c.ink, fontWeight: 500 }}>
                {lang === "es" ? e.role_es : e.role_en}
              </div>
              <div style={{ fontSize: 15, color: c.inkSoft, marginTop: 2 }}>
                {e.org} · {e.place}
              </div>
            </div>
            <span className="mono" style={{ fontSize: 11, color: c.inkSoft, letterSpacing: ".1em" }}>
              {e.when}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ————————————————————————————————————————————————
function ContactSection({ c, t }) {
  const links = [
    { label: t.labels.email,    value: "hola@memopuente.cl",          href: "mailto:hola@memopuente.cl" },
    { label: t.labels.github,   value: "github.com/gpuente",          href: "https://github.com/gpuente" },
    { label: t.labels.linkedin, value: "linkedin.com/in/memopuente",  href: "#" },
    { label: t.labels.location, value: t.locationVal,                 href: null },
  ];
  return (
    <div>
      <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "0 0 12px", fontWeight: 500, color: c.ink, letterSpacing: "-.015em" }}>
        {t.contactTitle}
      </h2>
      <p style={{ color: c.inkSoft, fontSize: 17, margin: "0 0 36px", lineHeight: 1.55, maxWidth: 540 }}>
        {t.contactSub}
      </p>

      <div style={{ maxWidth: 580 }}>
        {links.map((l, i) => (
          <div key={l.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "20px 0",
            borderTop: i === 0 ? `1px solid ${c.inkFaint}` : "none",
            borderBottom: `1px solid ${c.inkFaint}`,
          }}>
            <span className="mono" style={{
              fontSize: 11, color: c.inkSoft, letterSpacing: ".25em", textTransform: "uppercase",
            }}>
              {l.label}
            </span>
            {l.href ? (
              <a href={l.href} target="_blank" rel="noreferrer" className="underline-hover"
                 style={{ color: c.ink, fontSize: 17, textDecoration: "none" }}>
                {l.value}
              </a>
            ) : (
              <span style={{ color: c.ink, fontSize: 17 }}>{l.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
