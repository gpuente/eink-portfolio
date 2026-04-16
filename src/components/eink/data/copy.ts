export type Lang = "en" | "es";

export type Copy = {
  kicker: string;

  heroA: string;
  heroEm: string;
  heroB: string;
  tagline: string;

  ctaProjects: string;
  ctaContact: string;

  meta: { status: string; stack: string; based: string; tz: string };
  metaValues: { status: string; stack: string; based: string; tz: string };

  sectionAbout: string;
  sectionProjects: string;
  sectionTalks: string;
  sectionWork: string;
  sectionContact: string;

  projectsTitle: string;
  projectsSub: string;

  talksTitle: string;
  talksSub: string;

  aboutTitle: string;
  aboutP1: string;
  aboutP2: string;
  aboutP3: string;

  currently: string;
  currentlyValue: string;

  workTitle: string;

  contactTitle: string;
  contactSub: string;

  end: string;

  nav: { home: string; projects: string; about: string; talks: string; work: string; contact: string };

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
};

export const COPY: Record<Lang, Copy> = {
  en: {
    kicker: "Guillermo Puente · Santiago, CL",

    heroA: "Building ",
    heroEm: "production software",
    heroB: " for over a decade, from Santiago, Chile.",
    tagline:
      "Senior full-stack engineer with 10+ years shipping products across web, mobile, and desktop — at Evernote, Fleek, Groupon, and ComparaOnline.",

    ctaProjects: "See projects",
    ctaContact: "Get in touch",

    meta: { status: "Status", stack: "Stack", based: "Based in", tz: "Timezone" },
    metaValues: {
      status: "Senior · 10+ yrs",
      stack: "TS · React · Node · Go",
      based: "Santiago, Chile",
      tz: "UTC−3",
    },

    sectionAbout: "§ 01 · About",
    sectionProjects: "§ 02 · Projects",
    sectionTalks: "§ 03 · Talks",
    sectionWork: "§ 04 · Work",
    sectionContact: "§ 05 · Contact",

    projectsTitle: "Selected projects.",
    projectsSub:
      "Products shipped at companies, open-source libraries, and personal work — roughly reverse-chronological.",

    talksTitle: "Talks.",
    talksSub:
      "Conference talks and public recordings about things I've shipped.",

    aboutTitle: "About.",
    aboutP1:
      "I'm a senior full-stack engineer based in Santiago, Chile. For more than a decade I have designed, built, and maintained software for consumer products, marketplaces, blockchain wallets, and developer tooling.",
    aboutP2:
      "My focus is delivery: clients and services that reach production, survive migrations, and age well. I work across the stack in TypeScript, React, Node, Go, React Native, Electron, GraphQL, and gRPC.",
    aboutP3:
      "Before software, I trained and worked as an accountant. That background still shapes the way I engineer: numbers should reconcile, invariants should hold, and the details are rarely negotiable.",

    currently: "Currently",
    currentlyValue:
      "Senior Software Engineer at Evernote — building and maintaining features across the Mobile, Desktop, and Web clients, plus supporting backend services.",

    workTitle: "Work history.",

    contactTitle: "Get in touch.",
    contactSub:
      "For project inquiries, collaborations, or longer conversations, email is the best channel. I read carefully and reply thoughtfully.",

    end: "— end of transmission —",

    nav: { home: "Home", projects: "Projects", about: "About", talks: "Talks", work: "Work", contact: "Contact" },

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
  },

  es: {
    kicker: "Guillermo Puente · Santiago, CL",

    heroA: "Construyendo ",
    heroEm: "software de producción",
    heroB: " desde hace más de una década, en Santiago, Chile.",
    tagline:
      "Ingeniero full-stack senior con más de 10 años enviando productos web, mobile y desktop — en Evernote, Fleek, Groupon y ComparaOnline.",

    ctaProjects: "Ver proyectos",
    ctaContact: "Hablemos",

    meta: { status: "Estado", stack: "Stack", based: "Ubicación", tz: "Zona horaria" },
    metaValues: {
      status: "Senior · 10+ años",
      stack: "TS · React · Node · Go",
      based: "Santiago, Chile",
      tz: "UTC−3",
    },

    sectionAbout: "§ 01 · Sobre mí",
    sectionProjects: "§ 02 · Proyectos",
    sectionTalks: "§ 03 · Charlas",
    sectionWork: "§ 04 · Trabajo",
    sectionContact: "§ 05 · Contacto",

    projectsTitle: "Proyectos seleccionados.",
    projectsSub:
      "Productos enviados en empresas, librerías open-source y trabajo personal — en orden aproximadamente inverso a la fecha.",

    talksTitle: "Charlas.",
    talksSub:
      "Charlas en conferencias y registros públicos sobre cosas que he enviado.",

    aboutTitle: "Sobre mí.",
    aboutP1:
      "Soy ingeniero full-stack senior, basado en Santiago, Chile. Durante más de una década he diseñado, construido y mantenido software para productos de consumo, marketplaces, wallets blockchain y herramientas de desarrollo.",
    aboutP2:
      "Mi foco es la entrega: clientes y servicios que llegan a producción, sobreviven migraciones y envejecen bien. Trabajo en todo el stack con TypeScript, React, Node, Go, React Native, Electron, GraphQL y gRPC.",
    aboutP3:
      "Antes del software me formé y trabajé como contador. Ese background todavía moldea cómo hago ingeniería: los números deben cuadrar, los invariantes deben sostenerse y los detalles rara vez son negociables.",

    currently: "Ahora mismo",
    currentlyValue:
      "Senior Software Engineer en Evernote — construyendo y manteniendo features en los clientes Mobile, Desktop y Web, además de servicios de backend.",

    workTitle: "Historia laboral.",

    contactTitle: "Escríbeme.",
    contactSub:
      "Para consultas de proyectos, colaboraciones o conversaciones más largas, el email es el canal principal. Leo con cuidado y respondo con calma.",

    end: "— fin de la transmisión —",

    nav: { home: "Inicio", projects: "Proyectos", about: "Sobre mí", talks: "Charlas", work: "Trabajo", contact: "Contacto" },

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
  },
};
