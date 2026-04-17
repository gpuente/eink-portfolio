export type Project = {
  title: string;
  kind_en: string;
  kind_es: string;
  year: string;
  note_en: string;
  note_es: string;
  href: string | null;
  repo: string | null;
  /**
   * True when `href` points to a web.archive.org snapshot because the live product is gone.
   * Archive URLs use the `if_` flag (e.g. `/web/TIMESTAMPif_/ORIGINAL_URL`) to serve the
   * snapshot without the Wayback toolbar overlay.
   */
  archived?: boolean;
};

export const PROJECTS: Project[] = [
  {
    title: "Powerhouse",
    kind_en: "Decentralized operations toolkit · MakerDAO SES",
    kind_es: "Toolkit de operaciones descentralizadas · MakerDAO SES",
    year: "2023 —",
    note_en:
      "Operations toolkit for DAOs and open organizations. Five integrated modules: Renown (Ethereum-based identity and reputation), Connect (team collaboration), Fusion (document management), Switchboard (data integration and automation), and Academy. Built with React, TypeScript, Electron, GraphQL, Redux, and TailwindCSS. MakerDAO is the flagship case study. Also ships Reactor MCP — an MCP server coding agents (Claude Code, Cursor) connect to for scaffolding document models, editors, drives, and documents end-to-end.",
    note_es:
      "Toolkit de operaciones para DAOs y organizaciones abiertas. Cinco módulos integrados: Renown (identidad y reputación basadas en Ethereum), Connect (colaboración de equipo), Fusion (gestión documental), Switchboard (integración y automatización de datos) y Academy. Construido con React, TypeScript, Electron, GraphQL, Redux y TailwindCSS. MakerDAO es el caso de uso principal. Incluye además Reactor MCP — un servidor MCP al que los coding agents (Claude Code, Cursor) se conectan para scaffolding de document models, editors, drives y documentos de punta a punta.",
    href: "https://www.powerhouse.inc/",
    repo: null,
  },
  {
    title: "Evernote",
    kind_en: "Cross-platform client · Evernote",
    kind_es: "Cliente multiplataforma · Evernote",
    year: "2021 — 2023",
    note_en:
      "Note-taking product across iOS, Android, desktop (Windows, macOS, Linux), and web. Shipped AI Note Cleanup — Evernote's first AI-powered feature, launched mid-2023 as a 20% public beta before company-wide GA — owning the server-side OpenAI orchestration and the in-editor UX. Also delivered and maintained Tasks, used daily by millions.",
    note_es:
      "Producto de toma de notas en iOS, Android, desktop (Windows, macOS, Linux) y web. Envié AI Note Cleanup — la primera feature con IA del producto, lanzada a mitad de 2023 como public beta al 20% antes del GA a toda la compañía — a cargo de la orquestación server-side con OpenAI y del UX dentro del editor. También envié y mantuve Tasks, usada a diario por millones.",
    href: "https://evernote.com",
    repo: null,
  },
  {
    title: "AI Shirt Customizer",
    kind_en: "Demo · AI + 3D",
    kind_es: "Demo · IA + 3D",
    year: "2023",
    note_en:
      "In-browser 3D t-shirt customizer with AI-generated print designs. Built with ThreeJS, React, and a generative image API.",
    note_es:
      "Personalizador de poleras 3D en el navegador con diseños de estampado generados por IA. Construido con ThreeJS, React y una API de generación de imágenes.",
    href: "https://shirt.gpuente.me/",
    repo: "https://github.com/gpuente/custom-shirt",
  },
  {
    title: "RN Onboarding",
    kind_en: "Mobile · React Native",
    kind_es: "Mobile · React Native",
    year: "2023",
    note_en:
      "Reference React Native onboarding flow. Reanimated 3 for gesture-driven transitions, Lottie for choreographed intro animations.",
    note_es:
      "Flujo de onboarding de referencia en React Native. Reanimated 3 para transiciones basadas en gestos y Lottie para animaciones coreografiadas.",
    href: null,
    repo: "https://github.com/gpuente/onboarding-demo-rn",
  },
  {
    title: "Plug Wallet",
    kind_en: "Crypto · Multi-chain browser extension",
    kind_es: "Crypto · Extensión multi-chain",
    year: "2021 —",
    note_en:
      "Browser-extension crypto wallet. Originally shipped for the Internet Computer (ICP, Cycles, NFTs); has since grown into a multi-chain wallet supporting BTC, ETH, SOL, ICP, and Odin with cross-chain swaps and in-wallet staking. Led frontend architecture at Fleek; shipped to the Chrome Web Store.",
    note_es:
      "Extensión de navegador crypto. Originalmente solo Internet Computer (ICP, Cycles, NFTs); hoy wallet multi-chain que soporta BTC, ETH, SOL, ICP y Odin con cross-chain swaps e in-wallet staking. Lideré la arquitectura frontend en Fleek; publicada en la Chrome Web Store.",
    href: "https://chromewebstore.google.com/detail/plug/cfbfdhimifdmdehjmkdobpcjfefblkjm",
    repo: "https://github.com/Psychedelic/plug",
  },
  {
    title: "Space Desktop",
    kind_en: "Desktop · IPFS",
    kind_es: "Desktop · IPFS",
    year: "2021",
    note_en:
      "Desktop client for IPFS-backed file storage, with a Dropbox-like experience. Electron, React, gRPC, Go, and Textile.",
    note_es:
      "Cliente de escritorio para almacenamiento en IPFS, con una experiencia similar a Dropbox. Electron, React, gRPC, Go y Textile.",
    href: "https://web.archive.org/web/20241102081410if_/https://docs.fleek.co/space-desktop/overview/",
    repo: "https://github.com/FleekHQ/space-desktop",
    archived: true,
  },
  {
    title: "Fleek",
    kind_en: "Web3 platform · at Fleek",
    kind_es: "Plataforma Web3 · en Fleek",
    year: "2019 — 2021",
    note_en:
      "Platform for building websites and apps on the open web (IPFS, ENS, Internet Computer). Contributed to the web app, developer tooling, and supporting products like Plug Wallet and Space Desktop.",
    note_es:
      "Plataforma para construir sitios y apps en la open web (IPFS, ENS, Internet Computer). Trabajé en la aplicación web, tooling para desarrolladores y productos asociados como Plug Wallet y Space Desktop.",
    href: "https://web.archive.org/web/20250105132652if_/https://fleek.co/",
    repo: null,
    archived: true,
  },
  {
    title: "Manga CLI",
    kind_en: "CLI · Node",
    kind_es: "CLI · Node",
    year: "2020",
    note_en:
      "Command-line tool to download manga from inmanga.com, with interactive chapter selection and PDF export.",
    note_es:
      "Herramienta de línea de comandos para descargar manga desde inmanga.com, con selección interactiva de capítulos y exportación a PDF.",
    href: "https://github.com/gpuente/manga-tools/releases/tag/v1.0.2",
    repo: "https://github.com/gpuente/manga-tools",
  },
  {
    title: "ComparaOnline",
    kind_en: "Marketplace · at ComparaOnline",
    kind_es: "Marketplace · en ComparaOnline",
    year: "2018",
    note_en:
      "Insurance and financial-product marketplace. Worked on the React / Redux / RxJS frontend, micro-frontends, and GraphQL + microservice integration.",
    note_es:
      "Marketplace de seguros y productos financieros. Trabajé en el frontend con React, Redux y RxJS, además de micro-frontends e integración con GraphQL y microservicios.",
    href: "https://www.comparaonline.cl/",
    repo: null,
  },
  {
    title: "LQIP for React",
    kind_en: "Open-source · Images",
    kind_es: "Open-source · Imágenes",
    year: "2018",
    note_en:
      "React component implementing Low-Quality Image Placeholder progressive loading. Published as a reusable library.",
    note_es:
      "Componente React que implementa carga progresiva de imágenes con la técnica LQIP. Publicado como librería reutilizable.",
    href: "https://lqip-react.surge.sh/",
    repo: "https://github.com/gpuente/lqip-img-react",
  },
  {
    title: "Groupon LATAM",
    kind_en: "E-commerce · at Groupon",
    kind_es: "E-commerce · en Groupon",
    year: "2017",
    note_en:
      "Founding engineer on the rebuild of Groupon's LATAM e-commerce platform from scratch — ~5 core markets (Brazil, Chile, Argentina, Mexico, Colombia) serving tens of millions of users. Owned Node.js microservices and their React frontends. Stack: React, RxJS, Node.js, Redis, MongoDB, MySQL, REST, microservices.",
    note_es:
      "Ingeniero fundador del equipo que reconstruyó la plataforma de e-commerce de Groupon para LATAM desde cero — ~5 mercados principales (Brasil, Chile, Argentina, México, Colombia) con decenas de millones de usuarios. A cargo de microservicios Node.js y sus frontends React. Stack: React, RxJS, Node.js, Redis, MongoDB, MySQL, REST, microservicios.",
    href: "https://www.groupon.com/",
    repo: null,
  },
];
