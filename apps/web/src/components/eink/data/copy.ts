export type Lang = "en" | "es";

export type Copy = {
  kicker: string;

  heroA: string;
  heroEm: string;
  heroB: string;
  tagline: string;

  ctaProjects: string;
  ctaContact: string;
  ctaCV: string;
  ctaCVDownload: string;

  meta: { status: string; stack: string; based: string; tz: string };
  metaValues: { status: string; stack: string; based: string; tz: string };

  sectionAbout: string;
  sectionProjects: string;
  sectionTalks: string;
  sectionWork: string;
  sectionBackground: string;
  sectionContact: string;

  projectsTitle: string;
  projectsSub: string;
  projectsGalleryLink: string;

  talksTitle: string;
  talksSub: string;

  backgroundTitle: string;
  educationLabel: string;
  certificationsLabel: string;

  aboutTitle: string;
  aboutP1: string;
  aboutP2: string;
  aboutP3: string;

  currently: string;
  currentlyValue: string;

  workTitle: string;

  contactTitle: string;
  contactSub: string;
  scheduleCta: string;
  scheduleHint: string;

  end: string;

  nav: {
    home: string;
    projects: string;
    about: string;
    talks: string;
    work: string;
    background: string;
    contact: string;
  };

  labels: { email: string; github: string; linkedin: string; twitter: string; location: string };
  locationVal: string;

  reposLabel: string;
  reposValue: (n: number) => string;
  humans: (n: number) => string;
  pushedAgo: (s: string) => string;
  activityLabel: string;
  pushedTo: string;
  agoSuffix: string;
  moonIlluminated: string;
  archivedLabel: string;

  loading: string;
  offline: string;

  chat: {
    bubbleTitle: string;
    panelTitle: string;
    panelSubtitle: string;
    placeholder: string;
    sendLabel: string;
    closeLabel: string;
    clearLabel: string;
    helpLabel: string;
    helpTitle: string;
    helpItems: string[];
    emptyHint: string;
    starterChips: [string, string, string];
    thinking: string;
    error: string;
    poweredBy: string;
  };
};

export const COPY: Record<Lang, Copy> = {
  en: {
    kicker: "Guillermo Puente · Santiago, CL",

    heroA: "Engineering at the ",
    heroEm: "intersection of AI, product, and Web3",
    heroB: ".",
    tagline:
      "Senior full-stack engineer with 10+ years shipping products at MakerDAO SES, Evernote, Fleek, Groupon, and ComparaOnline — focused on AI integration (LLMs, RAG, agents) and on an agent-driven workflow that accelerates delivery without trading off review and craft.",

    ctaProjects: "See projects",
    ctaContact: "Get in touch",
    ctaCV: "View CV",
    ctaCVDownload: "Download PDF",

    meta: { status: "Status", stack: "Stack", based: "Based in", tz: "Timezone" },
    metaValues: {
      status: "Senior · AI focus",
      stack: "TS · React · LLMs · Node",
      based: "Santiago, Chile",
      tz: "UTC−3",
    },

    sectionAbout: "§ 01 · About",
    sectionWork: "§ 02 · Work",
    sectionProjects: "§ 03 · Projects",
    sectionTalks: "§ 04 · Talks",
    sectionBackground: "§ 05 · Background",
    sectionContact: "§ 06 · Contact",

    projectsTitle: "Selected projects.",
    projectsSub:
      "Products shipped at companies, open-source libraries, and personal work — roughly reverse-chronological.",
    projectsGalleryLink: "See the visual gallery",

    talksTitle: "Talks.",
    talksSub:
      "Conference talks and public recordings about things I've shipped.",

    backgroundTitle: "Background.",
    educationLabel: "Education",
    certificationsLabel: "Certifications",

    aboutTitle: "About.",
    aboutP1:
      "I'm a senior full-stack engineer based in Santiago, Chile. Over the past decade I've built web platforms, developer tooling, and distributed systems for products used by millions — at MakerDAO SES, Evernote, Fleek, Groupon, and ComparaOnline.",
    aboutP2:
      "Recent work spans AI-powered features (LLMs, RAG, tool-calling agents) shipped to production and wallet-based identity infrastructure (EVM, DID, signature flows) powering DAO tooling. I shipped Evernote's first AI-powered feature — AI Note Cleanup — and now own core architectural pillars of Powerhouse, MakerDAO SES's DAO operations platform, where I also shipped features on Renown, its wallet-based identity + credential SDK.",
    aboutP3:
      "I work at the intersection of AI, product engineering, and Web3. Before software, I trained as an accountant — a background that still shapes how I engineer: numbers should reconcile, invariants should hold, and the details are rarely negotiable.",

    currently: "Currently",
    currentlyValue:
      "Senior Software Engineer at MakerDAO SES, owning core architectural pillars of Powerhouse — a DAO operations platform — across ~2,100 commits. Day-to-day spans design-system ownership, wallet-based identity work on Renown, and heavy use of Claude Code to move fast across the monorepo.",

    workTitle: "Work history.",

    contactTitle: "Get in touch.",
    contactSub:
      "For project inquiries, collaborations, or longer conversations, email is the best channel. I read carefully and reply thoughtfully.",
    scheduleCta: "Schedule a 30-min call",
    scheduleHint: "Check availability and book in Calendly",

    end: "— end of transmission —",

    nav: {
      home: "Home",
      projects: "Projects",
      about: "About",
      talks: "Talks",
      work: "Work",
      background: "Background",
      contact: "Contact",
    },

    labels: {
      email: "Email",
      github: "GitHub",
      linkedin: "LinkedIn",
      twitter: "Twitter / X",
      location: "Location",
    },
    locationVal: "Santiago · Chile (UTC−3)",

    reposLabel: "repos",
    reposValue: (n) => `${n} public`,
    humans: (n) => `${n} in orbit`,
    pushedAgo: (s) => `pushed ${s}`,
    activityLabel: "latest activity",
    pushedTo: "pushed to ",
    agoSuffix: " ago",
    moonIlluminated: "illuminated",
    archivedLabel: "archived",

    loading: "…",
    offline: "offline",

    chat: {
      bubbleTitle: "Ask about Guillermo",
      panelTitle: "Ask about Guillermo",
      panelSubtitle: "AI assistant grounded in his profile, projects, and CV.",
      placeholder: "Ask anything…",
      sendLabel: "Send message",
      closeLabel: "Close chat",
      clearLabel: "Clear chat",
      helpLabel: "What can I ask?",
      helpTitle: "You can ask about:",
      helpItems: [
        "Background, experience, and projects",
        "AI work — LLMs, RAG, and agents",
        "Availability for a meeting, and booking a slot",
        "Live GitHub activity and top repos",
      ],
      emptyHint: "Ask me anything about Guillermo's work, availability, or GitHub activity.",
      starterChips: [
        "What AI work has he done?",
        "When is he free for a 30-min call?",
        "What has he shipped on GitHub lately?",
      ],
      thinking: "Thinking…",
      error: "Something went wrong. Try again in a moment.",
      poweredBy: "Powered by retrieval over his portfolio.",
    },
  },

  es: {
    kicker: "Guillermo Puente · Santiago, CL",

    heroA: "Ingeniería en la ",
    heroEm: "intersección entre IA, producto y Web3",
    heroB: ".",
    tagline:
      "Ingeniero full-stack senior con más de 10 años enviando productos en MakerDAO SES, Evernote, Fleek, Groupon y ComparaOnline — enfocado en integración de IA (LLMs, RAG, agents) y en un flujo de desarrollo basado en agentes que acelera la entrega sin resignar revisión y calidad.",

    ctaProjects: "Ver proyectos",
    ctaContact: "Hablemos",
    ctaCV: "Ver CV",
    ctaCVDownload: "Descargar PDF",

    meta: { status: "Estado", stack: "Stack", based: "Ubicación", tz: "Zona horaria" },
    metaValues: {
      status: "Senior · foco en IA",
      stack: "TS · React · LLMs · Node",
      based: "Santiago, Chile",
      tz: "UTC−3",
    },

    sectionAbout: "§ 01 · Sobre mí",
    sectionWork: "§ 02 · Trabajo",
    sectionProjects: "§ 03 · Proyectos",
    sectionTalks: "§ 04 · Charlas",
    sectionBackground: "§ 05 · Formación",
    sectionContact: "§ 06 · Contacto",

    projectsTitle: "Proyectos seleccionados.",
    projectsSub:
      "Productos enviados en empresas, librerías open-source y trabajo personal — en orden aproximadamente inverso a la fecha.",
    projectsGalleryLink: "Ver la galería visual",

    talksTitle: "Charlas.",
    talksSub:
      "Charlas en conferencias y registros públicos sobre cosas que he enviado.",

    backgroundTitle: "Formación.",
    educationLabel: "Educación",
    certificationsLabel: "Certificaciones",

    aboutTitle: "Sobre mí.",
    aboutP1:
      "Soy ingeniero full-stack senior, basado en Santiago, Chile. Durante más de una década he construido plataformas web, herramientas para desarrolladores y sistemas distribuidos para productos usados por millones — en MakerDAO SES, Evernote, Fleek, Groupon y ComparaOnline.",
    aboutP2:
      "Mi trabajo reciente combina features con IA (LLMs, RAG, agents tool-calling) enviadas a producción e infraestructura de identidad basada en wallet (EVM, DID, firmas) que sostiene tooling para DAOs. Envié AI Note Cleanup, la primera feature con IA de Evernote, y ahora trabajo sobre los pilares arquitectónicos de Powerhouse — la plataforma de operaciones para DAOs de MakerDAO SES —, donde también envié features sobre Renown, su SDK de identidad y credenciales basado en wallet.",
    aboutP3:
      "Trabajo en la intersección entre IA, ingeniería de producto y Web3. Antes del software me formé como contador — un background que todavía moldea cómo hago ingeniería: los números deben cuadrar, los invariantes deben sostenerse y los detalles rara vez son negociables.",

    currently: "Ahora mismo",
    currentlyValue:
      "Senior Software Engineer en MakerDAO SES, a cargo de pilares arquitectónicos de Powerhouse — plataforma de operaciones para DAOs — con ~2.100 commits. El día a día combina design system, trabajo sobre Renown (identidad basada en wallet) y uso intensivo de Claude Code para moverme rápido sobre el monorepo.",

    workTitle: "Historia laboral.",

    contactTitle: "Escríbeme.",
    contactSub:
      "Para consultas de proyectos, colaboraciones o conversaciones más largas, el email es el canal principal. Leo con cuidado y respondo con calma.",
    scheduleCta: "Agendar llamada de 30 min",
    scheduleHint: "Revisa mi disponibilidad y agenda en Calendly",

    end: "— fin de la transmisión —",

    nav: {
      home: "Inicio",
      projects: "Proyectos",
      about: "Sobre mí",
      talks: "Charlas",
      work: "Trabajo",
      background: "Formación",
      contact: "Contacto",
    },

    labels: {
      email: "Email",
      github: "GitHub",
      linkedin: "LinkedIn",
      twitter: "Twitter / X",
      location: "Ubicación",
    },
    locationVal: "Santiago · Chile (UTC−3)",

    reposLabel: "repos",
    reposValue: (n) => `${n} públicos`,
    humans: (n) => `${n} en órbita`,
    pushedAgo: (s) => `push hace ${s}`,
    activityLabel: "última actividad",
    pushedTo: "push a ",
    agoSuffix: " atrás",
    moonIlluminated: "iluminada",
    archivedLabel: "archivado",

    loading: "…",
    offline: "sin conexión",

    chat: {
      bubbleTitle: "Pregúntale sobre Guillermo",
      panelTitle: "Pregúntale sobre Guillermo",
      panelSubtitle: "Asistente de IA con contexto de su perfil, proyectos y CV.",
      placeholder: "Preguntá lo que quieras…",
      sendLabel: "Enviar mensaje",
      closeLabel: "Cerrar chat",
      clearLabel: "Limpiar chat",
      helpLabel: "¿Qué puedo preguntar?",
      helpTitle: "Podés preguntar por:",
      helpItems: [
        "Trayectoria, experiencia y proyectos",
        "Trabajo en IA — LLMs, RAG y agents",
        "Disponibilidad para una reunión, y agendar un slot",
        "Actividad reciente en GitHub y repos top",
      ],
      emptyHint: "Preguntame sobre el trabajo, la disponibilidad o la actividad en GitHub de Guillermo.",
      starterChips: [
        "¿Qué trabajo en IA ha hecho?",
        "¿Cuándo tiene un hueco de 30 minutos?",
        "¿Qué ha enviado en GitHub últimamente?",
      ],
      thinking: "Pensando…",
      error: "Algo salió mal. Probá de nuevo en un momento.",
      poweredBy: "Impulsado por retrieval sobre su portafolio.",
    },
  },
};
