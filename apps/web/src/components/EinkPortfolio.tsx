import { useEffect, useRef, useState } from "react";

import { PALETTES } from "./eink/data/palettes";
import type { Mode } from "./eink/data/palettes";
import { COPY } from "./eink/data/copy";
import type { Lang } from "./eink/data/copy";
import type { SectionId } from "./eink/data/sections";

import { useWeather } from "./eink/hooks/useWeather";
import { useHumansInSpace } from "./eink/hooks/useHumansInSpace";
import { useBitcoin } from "./eink/hooks/useBitcoin";
import { useGitHub } from "./eink/hooks/useGitHub";
import { useMoonPhase } from "./eink/hooks/useMoonPhase";
import { useScrollSpy } from "./eink/hooks/useScrollSpy";
import type { SectionRefs } from "./eink/hooks/useScrollSpy";
import { useDeviceReveal } from "./eink/hooks/useDeviceReveal";

import GlobalStyles from "./eink/ui/GlobalStyles";
import SurfaceLayers from "./eink/ui/SurfaceLayers";
import StatusBar from "./eink/ui/StatusBar";
import Dock from "./eink/ui/Dock";
import Divider from "./eink/ui/Divider";
import ChatBubble from "./eink/ui/ChatBubble";
import ChatPanel from "./eink/ui/ChatPanel";

import HomeSection from "./eink/sections/HomeSection";
import AboutSection from "./eink/sections/AboutSection";
import ProjectsSection from "./eink/sections/ProjectsSection";
import TalksSection from "./eink/sections/TalksSection";
import WorkSection from "./eink/sections/WorkSection";
import BackgroundSection from "./eink/sections/BackgroundSection";
import ContactSection from "./eink/sections/ContactSection";
import DeviceReveal from "./eink/ui/DeviceReveal";

/** Extra scroll space at the bottom of the document. The device reveal
 *  animation runs across these final pixels (progress 0 → 1). */
const REVEAL_HEIGHT = 500;

const MODE_STORAGE_KEY = "eink-mode";
const LANG_STORAGE_KEY = "eink-lang";

/**
 * Layout.astro stashes the saved language/theme on `window.__einkLang`
 * and `window.__einkMode` via an inline pre-paint script (see its
 * `<head>`), so our useState initializers below can read them on the
 * first client render — no flicker from a useEffect re-render.
 *
 * During Astro SSR `window` is undefined; we fall back to the defaults,
 * which is what the generated HTML will ship with. React 18 recovers
 * gracefully from the resulting client/SSR mismatch — the optional
 * boot overlay (Option B) hides the transition when the visual flash
 * is unwanted.
 */
declare global {
  interface Window {
    __einkLang?: Lang;
    __einkMode?: Mode;
  }
}

/**
 * Read order:
 *   1. `<html data-mode|data-lang>` — authoritative after SPA nav. The
 *      Layout's pre-paint script (with `data-astro-rerun`) refreshes
 *      these attributes on every SPA swap from localStorage, so the
 *      first branch is reliable in both full-load and back-nav flows.
 *   2. `localStorage` — fallback if something stripped the attribute
 *      before we read.
 *   3. Hard-coded default.
 *
 * Note: we deliberately skip `window.__einkX` here. It's a snapshot
 * from the INITIAL full page load, so after the user toggles
 * lang/theme on the CV page and navigates back, the window var is
 * stale and would overwrite the correct localStorage value on mount.
 */
function readInitialMode(): Mode {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-mode");
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  try {
    const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // private-mode Safari / sandboxed iframe — fall through.
  }
  return "light";
}

function readInitialLang(): Lang {
  if (typeof document === "undefined") return "en";
  const attr = document.documentElement.getAttribute("data-lang");
  if (attr === "es") return "es";
  if (attr === "en") return "en";
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "es") return saved;
  } catch {
    // Same rationale as above.
  }
  return "en";
}

export default function EinkPortfolio() {
  const [mode, setMode] = useState<Mode>(readInitialMode);
  const [lang, setLang] = useState<Lang>(readInitialLang);
  const [now, setNow] = useState<Date>(new Date());
  const [chatOpen, setChatOpen] = useState<boolean>(false);

  const refs: SectionRefs = {
    home: useRef<HTMLElement | null>(null),
    about: useRef<HTMLElement | null>(null),
    projects: useRef<HTMLElement | null>(null),
    talks: useRef<HTMLElement | null>(null),
    work: useRef<HTMLElement | null>(null),
    background: useRef<HTMLElement | null>(null),
    contact: useRef<HTMLElement | null>(null),
  };
  const scrollLock = useRef<boolean>(false);
  const [active, setActive] = useScrollSpy(refs, scrollLock);
  const rawRevealProgress = useDeviceReveal(REVEAL_HEIGHT);
  // Don't run the reveal while the chat panel is open — the panel is z:65
  // and would sit under the z:9000 device overlay, which looks broken.
  const revealProgress = chatOpen ? 0 : rawRevealProgress;

  const c = PALETTES[mode];
  const t = COPY[lang];

  const weather = useWeather();
  const humans = useHumansInSpace();
  const btc = useBitcoin();
  const gh = useGitHub();
  const moon = useMoonPhase();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Persist theme + mirror onto `<html data-mode>` so the CV page's CSS
  // (which keys on the attribute) matches instantly when the user SPA-navigates
  // there. First-mount writes the same value the pre-paint script already
  // set, so the write is idempotent and safe to fire unconditionally.
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.setAttribute("data-mode", mode);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage can throw in private-mode Safari / sandboxed iframes — ignore.
    }
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.setAttribute("data-lang", lang);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Same rationale as above.
    }
  }, [lang]);

  // Signal to the boot overlay (when enabled) that React has hydrated
  // with the correct state so it can fade out. Runs once on mount after
  // the first paint — any lingering SSR content has already been
  // reconciled by React by the time this effect fires.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("eink-ready");
  }, []);

  /**
   * Keep the browser chrome colour in sync with the in-app mode toggle.
   * Layout.astro ships two <meta name="theme-color"> tags scoped to
   * prefers-color-scheme for the pre-hydration paint; once React is live, the
   * user's in-app choice wins, so we collapse to a single active tag with no
   * media attribute pointing at the current paper colour.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const tags = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    tags.forEach((tag, i) => {
      if (i === 0) {
        tag.removeAttribute("media");
        tag.setAttribute("content", c.paper);
      } else {
        tag.remove();
      }
    });
  }, [c.paper]);

  /**
   * Mobile only: when the chat panel is open it takes over the viewport, so we
   * lock background page scroll. Cleared on close (or unmount) so the lock
   * never leaks. Desktop is exempt — the small floating panel doesn't cover
   * the page so scrolling behind it is fine.
   */
  useEffect(() => {
    if (typeof document === "undefined" || !chatOpen) return;
    const isMobile = window.matchMedia("(max-width: 719px)").matches;
    if (!isMobile) return;
    document.body.classList.add("chat-locked-mobile");
    return () => {
      document.body.classList.remove("chat-locked-mobile");
    };
  }, [chatOpen]);

  const scrollTo = (id: SectionId) => {
    scrollLock.current = true;
    setActive(id);
    refs[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      scrollLock.current = false;
    }, 900);
  };

  const time = now.toLocaleTimeString(lang === "es" ? "es-CL" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = now.toLocaleDateString(lang === "es" ? "es-CL" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
      <GlobalStyles c={c} />
      <SurfaceLayers mode={mode} />

      <StatusBar
        c={c}
        t={t}
        time={time}
        date={date}
        mode={mode}
        lang={lang}
        weather={weather}
        humans={humans}
        btc={btc}
        gh={gh}
        moon={moon}
        onToggleMode={() => setMode((m) => (m === "light" ? "dark" : "light"))}
        onToggleLang={() => setLang((l) => (l === "en" ? "es" : "en"))}
      />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "120px 32px 160px" }}>
        <section ref={refs.home} data-section="home">
          <HomeSection c={c} t={t} onJump={scrollTo} gh={gh} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionAbout} />
        <section ref={refs.about} data-section="about">
          <AboutSection c={c} t={t} />
        </section>

        <Divider c={c} label={t.sectionWork} />
        <section ref={refs.work} data-section="work">
          <WorkSection c={c} t={t} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionProjects} />
        <section ref={refs.projects} data-section="projects">
          <ProjectsSection c={c} t={t} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionTalks} />
        <section ref={refs.talks} data-section="talks">
          <TalksSection c={c} t={t} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionBackground} />
        <section ref={refs.background} data-section="background">
          <BackgroundSection c={c} t={t} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionContact} />
        {/* Contact gets `minHeight: 100vh` so that when the user jumps to it
            from the dock (scrollIntoView → Contact top at viewport top), the
            viewport bottom stays inside Contact instead of reaching into the
            reveal spacer below — otherwise the device animation would start
            the moment you click the Contact dock button. */}
        <section
          ref={refs.contact}
          data-section="contact"
          style={{ minHeight: "100vh" }}
        >
          <ContactSection c={c} t={t} />
          <div
            className="mono"
            style={{
              marginTop: 80,
              fontSize: 10,
              color: c.inkFaint,
              letterSpacing: ".3em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {t.end}
          </div>
        </section>
      </main>

      {/* Spacer: the last `REVEAL_HEIGHT` pixels of the document are used to
          drive the device-reveal animation. Empty, aria-hidden. */}
      <div aria-hidden="true" style={{ height: REVEAL_HEIGHT }} />

      <ChatPanel
        c={c}
        mode={mode}
        t={t.chat}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {/*
        Bottom bar: dock + chat bubble.
        - Mobile: a single horizontal flex row centered at bottom (so dock + bubble feel like one bar with a gap).
        - Desktop: dock stays centered alone, bubble breaks out to the far-right.
        Layout switches via media queries in GlobalStyles → `.bottom-bar`.
        Fades out during the device reveal so the "zoom into a Kindle" effect
        isn't interrupted by a floating nav pill.
      */}
      <div
        className="bottom-bar"
        style={{
          opacity: 1 - revealProgress,
          transition: revealProgress === 0 || revealProgress === 1 ? "opacity 240ms ease" : undefined,
        }}
      >
        <Dock c={c} t={t} active={active} onGo={scrollTo} mode={mode} />
        <ChatBubble
          c={c}
          mode={mode}
          open={chatOpen}
          title={t.chat.bubbleTitle}
          onToggle={() => setChatOpen((v) => !v)}
        />
      </div>

      <DeviceReveal
        progress={revealProgress}
        c={c}
        mode={mode}
        time={time}
        date={date}
        endLabel={t.end}
      />
    </div>
  );
}
