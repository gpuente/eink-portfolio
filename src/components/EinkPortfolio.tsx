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

import GlobalStyles from "./eink/ui/GlobalStyles";
import SurfaceLayers from "./eink/ui/SurfaceLayers";
import StatusBar from "./eink/ui/StatusBar";
import Dock from "./eink/ui/Dock";
import Divider from "./eink/ui/Divider";

import HomeSection from "./eink/sections/HomeSection";
import AboutSection from "./eink/sections/AboutSection";
import ProjectsSection from "./eink/sections/ProjectsSection";
import TalksSection from "./eink/sections/TalksSection";
import WorkSection from "./eink/sections/WorkSection";
import ContactSection from "./eink/sections/ContactSection";

export default function EinkPortfolio() {
  const [mode, setMode] = useState<Mode>("light");
  const [lang, setLang] = useState<Lang>("en");
  const [now, setNow] = useState<Date>(new Date());

  const refs: SectionRefs = {
    home: useRef<HTMLElement | null>(null),
    about: useRef<HTMLElement | null>(null),
    projects: useRef<HTMLElement | null>(null),
    talks: useRef<HTMLElement | null>(null),
    work: useRef<HTMLElement | null>(null),
    contact: useRef<HTMLElement | null>(null),
  };
  const scrollLock = useRef<boolean>(false);
  const [active, setActive] = useScrollSpy(refs, scrollLock);

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

        <Divider c={c} label={t.sectionProjects} />
        <section ref={refs.projects} data-section="projects">
          <ProjectsSection c={c} t={t} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionTalks} />
        <section ref={refs.talks} data-section="talks">
          <TalksSection c={c} t={t} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionWork} />
        <section ref={refs.work} data-section="work">
          <WorkSection c={c} t={t} lang={lang} />
        </section>

        <Divider c={c} label={t.sectionContact} />
        <section ref={refs.contact} data-section="contact">
          <ContactSection c={c} t={t} />
        </section>

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
      </main>

      <Dock c={c} t={t} active={active} onGo={scrollTo} mode={mode} />
    </div>
  );
}
