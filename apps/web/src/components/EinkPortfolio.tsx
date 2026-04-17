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

export default function EinkPortfolio() {
  const [mode, setMode] = useState<Mode>("light");
  const [lang, setLang] = useState<Lang>("en");
  const [now, setNow] = useState<Date>(new Date());
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  // Gates the localStorage write effect so the default "light" doesn't
  // clobber the saved value on first mount before the read effect runs.
  const [hydrated, setHydrated] = useState<boolean>(false);

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

  // Read the persisted theme once on mount; gated by typeof checks because
  // the component is rendered server-side at build time via client:load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === "light" || saved === "dark") setMode(saved);
    } catch {
      // localStorage can throw in private-mode Safari / sandboxed iframes — ignore.
    }
    setHydrated(true);
  }, []);

  // Persist the theme whenever the user toggles it (after hydration).
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Same rationale as above — swallow quota/permission errors.
    }
  }, [hydrated, mode]);

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
