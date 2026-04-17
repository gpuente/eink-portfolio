/**
 * CV content source of truth for both language routes (/cv and /cv/es).
 * Mirrors the facts in `borrador_cv.md` (at the monorepo root).
 */

export type CvLang = "en" | "es";

type ExperienceEntry = {
  org: string;
  role: string;
  when: string;
  place: string;
  /** Plain strings; no HTML is rendered for experience bullets. */
  bullets: string[];
};

type SkillRow = {
  label: string;
  value: string;
};

type EducationEntry = {
  school: string;
  subtitle: string;
  timespan: string;
  degree: string;
  /**
   * May contain a single leading `<strong>…</strong>` for the "Continuing"
   * prefix. Rendered with Astro's `set:html` directive.
   */
  continuing: string;
  /** Accessible label for the strong prefix, used when `set:html` is skipped. */
  continuingLabel: string;
  continuingBody: string;
};

export type CvCopy = {
  headline: string;
  contactLocation: string;
  contactLangs: string;

  h_summary: string;
  summary: string;

  h_skills: string;
  skills: SkillRow[];

  h_exp: string;
  experience: ExperienceEntry[];

  priorBgLabel: string;
  priorBgBody: string;

  h_edu: string;
  education: EducationEntry;

  backLabel: string;
  downloadLabel: string;
  /** Absolute URL of the PDF served from /public. */
  pdfHref: string;
  /** Human-readable filename the browser should suggest on save. */
  pdfDownload: string;
};

export const CV_COPY: Record<CvLang, CvCopy> = {
  en: {
    headline: "Senior Software Engineer · AI Systems · Full-Stack · Web3",
    contactLocation: "Santiago, Chile",
    contactLangs: "Spanish (native) · English (professional)",

    h_summary: "Summary",
    summary:
      "Senior full-stack engineer with 10+ years shipping production systems to user bases in the tens of millions (Evernote, Groupon LATAM). End-to-end ownership from React / TypeScript frontends to Node.js / Go service layers, including AI-powered features (LLMs, RAG, tool-calling agents) and wallet-based identity infrastructure (EVM, DID, signature flows) powering DAO tooling. Shipped Evernote's first AI feature (AI Note Cleanup); core contributor on MakerDAO's Powerhouse platform (~2,100 commits over 2.5 years); led frontend architecture for Plug Wallet, a multi-chain crypto wallet (BTC, ETH, SOL, ICP). Day-to-day, I drive repo-wide refactors with Claude Code + MCP tooling — a workflow I bring to the teams I ship with.",

    h_skills: "Skills",
    skills: [
      {
        label: "AI Systems",
        value:
          "LLM integrations (OpenAI), RAG, embeddings & vector search (Astra DB), tool-calling agents, prompt design, production cost guardrails, Vercel AI SDK",
      },
      {
        label: "Agent-driven dev",
        value:
          "Claude Code + MCP tooling to automate repo-wide refactors and scaffold features across large monorepos",
      },
      {
        label: "Web3",
        value:
          "Ethereum / EVM, wallet-based identity (DID:pkh, SIWE), transaction signing, JWT-from-wallet auth, Internet Computer, IPFS, Filecoin, smart-contract tooling",
      },
      { label: "Languages", value: "TypeScript, JavaScript, Go, Python, C#, PHP" },
      { label: "Backend", value: "Node.js, Express, gRPC, GraphQL, REST, microservices" },
      {
        label: "Frontend",
        value:
          "React, React Native, Redux, RxJS, Electron, Vite, Webpack, Storybook, TailwindCSS",
      },
      {
        label: "Data & Infra",
        value:
          "PostgreSQL, MySQL, MongoDB, Redis, vector DBs · Docker, Kubernetes, CI/CD, Fly.io, AWS",
      },
      {
        label: "Practices",
        value: "TDD, unit / integration / E2E testing, design review, mentoring",
      },
    ],

    h_exp: "Professional Experience",
    experience: [
      {
        org: "MakerDAO SES",
        role: "Senior Software Engineer",
        when: "Oct 2023 – Present",
        place: "Remote",
        bullets: [
          "Core contributor on Powerhouse, a DAO operations platform for governance, document management, and budgeting — ~2,100 commits across a multi-app monorepo.",
          "Ship and maintain Renown, Powerhouse's wallet-based identity + credential SDK (DID:pkh parsing, EVM signature verification, JWT bearer sessions) — the auth layer powering every Powerhouse app.",
          "Lead the design system used across 3+ production apps (Connect, Academy, Vetra) — React components, Tailwind tokens, Storybook, Vitest coverage.",
          "Designed Connect's dynamic plugin system — zero-config install of document models from an HTTP registry, with offline bundle preview and a package-manager UI.",
          "Drove platform migrations — Vite 8 + Vitest 4.1 + Tailwind 4.2, Express v5, pnpm workspace consolidation.",
          "Built Reactor MCP — an MCP server that lets coding agents (Claude Code, Cursor) scaffold document models end-to-end: state, operations, reducers, editors, drives.",
        ],
      },
      {
        org: "Evernote",
        role: "Senior Software Engineer",
        when: "Jun 2021 – Jul 2023",
        place: "Remote",
        bullets: [
          "Shipped Evernote's first AI feature — AI Note Cleanup — to its user base. Owned server-side OpenAI orchestration and in-editor UX. Launched mid-2023 as a 20% public beta before company-wide GA.",
          "Owned end-to-end delivery across Node.js / gRPC microservices and the Electron desktop (Win/macOS/Linux), iOS, Android, and Web clients — feature parity across 6 platforms.",
          "Delivered and maintained Tasks, a core productivity module used daily by millions across every Evernote client.",
          "Mentored 6–8 engineers across 2 internship cohorts (summers 2022 and 2023) — scoping, design review, pair-programming.",
        ],
      },
      {
        org: "Fleek",
        role: "Frontend Software Engineer",
        when: "Jan 2019 – Jun 2021",
        place: "Remote",
        bullets: [
          "Led frontend architecture for Plug Wallet, a browser-extension crypto wallet. Originally shipped for the Internet Computer; has since grown into a multi-chain wallet (BTC, ETH, SOL, ICP, Odin) with cross-chain swaps and in-wallet staking.",
          "Designed and shipped Space Desktop, a Dropbox-style cross-platform client for IPFS / Filecoin-backed storage — real-time sync, offline support, encrypted per-user containers across Win/macOS/Linux.",
          "Built developer tooling (web-based IDE, CI/deploy pipelines) for writing, testing, and deploying smart contracts on Ethereum and the Internet Computer.",
        ],
      },
      {
        org: "ComparaOnline",
        role: "Frontend Software Engineer",
        when: "Feb 2018 – Jan 2019",
        place: "Santiago, Chile",
        bullets: [
          "Delivered features for an insurance and financial-product marketplace serving Chile, Colombia, Brazil, and Argentina — React / Redux / RxJS frontend in a micro-frontend architecture, with GraphQL and Node.js microservices.",
        ],
      },
      {
        org: "Groupon",
        role: "Software Engineer",
        when: "Jun 2017 – Feb 2018",
        place: "Santiago, Chile",
        bullets: [
          "Founding engineer on the rebuild of Groupon's LATAM e-commerce platform from scratch, serving ~5 core markets (Brazil, Chile, Argentina, Mexico, Colombia) with tens of millions of pre-existing users.",
          "Owned multiple Node.js microservices and their consuming React frontends; drove migration of legacy services into the new architecture.",
        ],
      },
      {
        org: "Borealis",
        role: "Software Engineer",
        when: "Aug 2016 – May 2017",
        place: "Santiago, Chile",
        bullets: [
          "Delivered services, web and mobile apps for enterprise clients in a software-factory team — Node.js, Laravel (PHP), Angular, Ionic, MySQL, PostgreSQL.",
        ],
      },
    ],
    priorBgLabel: "Prior background",
    priorBgBody:
      "6+ years in finance & accounting before pivoting to engineering — Accounting Analyst at Becton, Dickinson and Co. (2011–2016) and Fixed-Assets Analyst at Capgemini (2009–2011), Santiago, Chile. SAP ERP, treasury operations, and financial close processes. An analytical foundation that still informs how I approach engineering problems today.",

    h_edu: "Education",
    education: {
      school: "Instituto Profesional AIEP",
      subtitle: "Computer Science",
      timespan: "2012 – 2015",
      degree:
        "Ingeniería de Ejecución en Informática, mención Desarrollo de Sistemas · Best Student — Sede BUS 2016.",
      continuing:
        "<strong>Continuing (2021–2026):</strong> self-directed study in AI / LLM engineering — tool-calling agents, RAG, Vercel AI SDK, production guardrails. Prior: Electron (FullStack), Go (Udemy), React Native (Udemy).",
      continuingLabel: "Continuing (2021–2026):",
      continuingBody:
        "self-directed study in AI / LLM engineering — tool-calling agents, RAG, Vercel AI SDK, production guardrails. Prior: Electron (FullStack), Go (Udemy), React Native (Udemy).",
    },

    backLabel: "Portfolio",
    downloadLabel: "Download PDF",
    pdfHref: "/guillermo-puente-cv-en.pdf",
    pdfDownload: "Guillermo Puente - CV EN.pdf",
  },

  es: {
    headline: "Senior Software Engineer · AI Systems · Full-Stack · Web3",
    contactLocation: "Santiago, Chile",
    contactLangs: "Español (nativo) · Inglés (profesional)",

    h_summary: "Resumen",
    summary:
      "Ingeniero full-stack senior con más de 10 años enviando sistemas a bases de usuarios de decenas de millones (Evernote, Groupon LATAM). Ownership end-to-end desde frontends React / TypeScript hasta capas de servicios Node.js / Go, incluyendo features con IA (LLMs, RAG, tool-calling agents) e infraestructura de identidad basada en wallet (EVM, DID, firmas) que sostiene tooling para DAOs. Envié la primera feature con IA de Evernote (AI Note Cleanup); core contributor en la plataforma Powerhouse de MakerDAO (~2.100 commits en 2,5 años); lideré la arquitectura frontend de Plug Wallet, una wallet crypto multi-chain (BTC, ETH, SOL, ICP). A diario uso Claude Code + MCP para refactors a lo largo del repo — un workflow que llevo a los equipos con los que trabajo.",

    h_skills: "Habilidades",
    skills: [
      {
        label: "AI Systems",
        value:
          "integraciones LLM (OpenAI), RAG, embeddings y búsqueda vectorial (Astra DB), tool-calling agents, diseño de prompts, guardrails de costo en producción, Vercel AI SDK",
      },
      {
        label: "Agent-driven dev",
        value:
          "Claude Code + MCP tooling para automatizar refactors a lo largo del repo y hacer scaffolding de features en monorepos grandes",
      },
      {
        label: "Web3",
        value:
          "Ethereum / EVM, identidad basada en wallet (DID:pkh, SIWE), firma de transacciones, auth JWT desde wallets, Internet Computer, IPFS, Filecoin, tooling de smart contracts",
      },
      { label: "Lenguajes", value: "TypeScript, JavaScript, Go, Python, C#, PHP" },
      { label: "Backend", value: "Node.js, Express, gRPC, GraphQL, REST, microservicios" },
      {
        label: "Frontend",
        value:
          "React, React Native, Redux, RxJS, Electron, Vite, Webpack, Storybook, TailwindCSS",
      },
      {
        label: "Datos e infra",
        value:
          "PostgreSQL, MySQL, MongoDB, Redis, vector DBs · Docker, Kubernetes, CI/CD, Fly.io, AWS",
      },
      {
        label: "Prácticas",
        value: "TDD, testing unitario / de integración / E2E, design review, mentoría",
      },
    ],

    h_exp: "Experiencia Profesional",
    experience: [
      {
        org: "MakerDAO SES",
        role: "Senior Software Engineer",
        when: "Oct 2023 – actual",
        place: "Remoto",
        bullets: [
          "Core contributor en Powerhouse, una plataforma de operaciones para DAOs que cubre gobernanza, gestión documental y presupuestos — ~2.100 commits en un monorepo multi-app.",
          "Envío y mantengo Renown, el SDK de identidad y credenciales basado en wallet de Powerhouse (parsing DID:pkh, verificación de firmas EVM, sesiones JWT bearer) — la capa de auth que sostiene cada app de Powerhouse.",
          "Lidero el design system usado en 3+ apps en producción (Connect, Academy, Vetra) — componentes React, tokens Tailwind, Storybook, cobertura Vitest.",
          "Diseñé el sistema de plugins dinámico de Connect — instalación zero-config de document models desde un registry HTTP, con preview de bundles offline y UI de package-manager.",
          "Lideré migraciones de plataforma — Vite 8 + Vitest 4.1 + Tailwind 4.2, upgrade a Express v5, consolidación de pnpm workspaces.",
          "Construí Reactor MCP — un servidor MCP que permite a los coding agents (Claude Code, Cursor) hacer scaffolding de document models de punta a punta: estado, operaciones, reducers, editors, drives.",
        ],
      },
      {
        org: "Evernote",
        role: "Senior Software Engineer",
        when: "Jun 2021 – Jul 2023",
        place: "Remoto",
        bullets: [
          "Envié la primera feature con IA de Evernote — AI Note Cleanup — a su base de usuarios. Dueño de la orquestación server-side con OpenAI y del UX dentro del editor. Lanzada a mitad de 2023 como public beta al 20% antes del GA a toda la compañía.",
          "A cargo de la entrega end-to-end en microservicios Node.js / gRPC y en los clientes Electron desktop (Win/macOS/Linux), iOS, Android y Web — paridad de features en 6 plataformas.",
          "Envié y mantuve Tasks, un módulo de productividad central usado a diario por millones en cada cliente de Evernote.",
          "Mentor de 6–8 ingenieros en 2 cohortes de internship (veranos 2022 y 2023) — scoping, design review, pair-programming.",
        ],
      },
      {
        org: "Fleek",
        role: "Frontend Software Engineer",
        when: "Jan 2019 – Jun 2021",
        place: "Remoto",
        bullets: [
          "Lideré la arquitectura frontend de Plug Wallet, una extensión de navegador crypto. Originalmente para Internet Computer; hoy es una wallet multi-chain (BTC, ETH, SOL, ICP, Odin) con cross-chain swaps e in-wallet staking.",
          "Diseñé y envié Space Desktop, un cliente cross-platform tipo Dropbox para almacenamiento en IPFS / Filecoin — sync en tiempo real, soporte offline, contenedores cifrados por usuario en Win/macOS/Linux.",
          "Construí tooling para desarrolladores (IDE web, pipelines de CI/deploy) para escribir, testear y desplegar smart contracts en Ethereum y en Internet Computer.",
        ],
      },
      {
        org: "ComparaOnline",
        role: "Frontend Software Engineer",
        when: "Feb 2018 – Jan 2019",
        place: "Santiago, Chile",
        bullets: [
          "Envié features para un marketplace de seguros y productos financieros en Chile, Colombia, Brasil y Argentina — frontend React / Redux / RxJS en una arquitectura de micro-frontends, con GraphQL y microservicios Node.js.",
        ],
      },
      {
        org: "Groupon",
        role: "Software Engineer",
        when: "Jun 2017 – Feb 2018",
        place: "Santiago, Chile",
        bullets: [
          "Ingeniero fundador en el rebuild desde cero de la plataforma de e-commerce de Groupon para LATAM — ~5 mercados principales (Brasil, Chile, Argentina, México, Colombia) con decenas de millones de usuarios preexistentes.",
          "A cargo de varios microservicios Node.js y de sus frontends React consumidores; lideré la migración de servicios legacy a la nueva arquitectura.",
        ],
      },
      {
        org: "Borealis",
        role: "Software Engineer",
        when: "Aug 2016 – May 2017",
        place: "Santiago, Chile",
        bullets: [
          "Envié servicios, web apps y apps mobile para clientes enterprise en un equipo de software factory — Node.js, Laravel (PHP), Angular, Ionic, MySQL, PostgreSQL.",
        ],
      },
    ],
    priorBgLabel: "Trayectoria previa",
    priorBgBody:
      "6+ años en finanzas y contabilidad antes de pivotar a ingeniería — Analista Contable en Becton, Dickinson and Co. (2011–2016) y Analista de Activos Fijos en Capgemini (2009–2011), Santiago, Chile. SAP ERP, operaciones de tesorería y procesos de cierre financiero. Una base analítica que todavía moldea cómo abordo problemas de ingeniería hoy.",

    h_edu: "Educación",
    education: {
      school: "Instituto Profesional AIEP",
      subtitle: "Informática",
      timespan: "2012 – 2015",
      degree:
        "Ingeniería de Ejecución en Informática, mención Desarrollo de Sistemas · Mejor Alumno — Sede BUS 2016.",
      continuing:
        "<strong>Formación continua (2021–2026):</strong> estudio autodirigido en AI / LLM engineering — tool-calling agents, RAG, Vercel AI SDK, guardrails de producción. Antes: Electron (FullStack), Go (Udemy), React Native (Udemy).",
      continuingLabel: "Formación continua (2021–2026):",
      continuingBody:
        "estudio autodirigido en AI / LLM engineering — tool-calling agents, RAG, Vercel AI SDK, guardrails de producción. Antes: Electron (FullStack), Go (Udemy), React Native (Udemy).",
    },

    backLabel: "Portfolio",
    downloadLabel: "Descargar PDF",
    pdfHref: "/guillermo-puente-cv-es.pdf",
    pdfDownload: "Guillermo Puente - CV ES.pdf",
  },
};
