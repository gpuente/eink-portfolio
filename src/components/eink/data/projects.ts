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
    title: "Evernote",
    kind_en: "Cross-platform client · Evernote",
    kind_es: "Cliente multiplataforma · Evernote",
    year: "2021 —",
    note_en:
      "Note-taking product across iOS, Android, desktop (Windows, macOS, Linux), and web. Shipping features and maintaining the client-service contact surface.",
    note_es:
      "Producto de toma de notas en iOS, Android, desktop (Windows, macOS, Linux) y web. Envío features y mantengo el área de contacto entre clientes y servicios.",
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
    kind_en: "Crypto · Internet Computer",
    kind_es: "Crypto · Internet Computer",
    year: "2021",
    note_en:
      "Browser-extension wallet for the Internet Computer. Hold, send, and swap ICP, Cycles, and NFTs. Built at Fleek.",
    note_es:
      "Wallet (extensión de navegador) para Internet Computer. Guarda, envía y cambia ICP, Cycles y NFTs. Construida en Fleek.",
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
      "Part of the team that rebuilt the Groupon e-commerce experience from scratch for Latin America. React, RxJS, Redis, MongoDB, MySQL, and a microservice architecture.",
    note_es:
      "Parte del equipo que reconstruyó la experiencia de e-commerce de Groupon desde cero para Latinoamérica. React, RxJS, Redis, MongoDB, MySQL y una arquitectura basada en microservicios.",
    href: "https://www.groupon.com/",
    repo: null,
  },
];
