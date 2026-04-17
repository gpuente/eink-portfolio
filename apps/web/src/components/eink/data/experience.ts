export type Experience = {
  role_en: string;
  role_es: string;
  org: string;
  when_en: string;
  when_es: string;
  place_en: string;
  place_es: string;
  detail_en: string;
  detail_es: string;
};

export const EXPERIENCE: Experience[] = [
  {
    role_en: "Senior Software Engineer",
    role_es: "Senior Software Engineer",
    org: "MakerDAO SES",
    when_en: "2023 — Present",
    when_es: "2023 — actual",
    place_en: "Remote · Global",
    place_es: "Remoto · Global",
    detail_en:
      "Owning core architectural pillars of Powerhouse — a DAO operations platform covering governance, document management, and budgeting — across ~2,100 commits. Shipped features on Renown (wallet-based identity + credential SDK: DID:pkh, EVM signatures, JWT bearer sessions) and led the design system used across Connect, Academy, and Vetra. The platform also ships Reactor MCP, an MCP server agents connect to for scaffolding document models, editors, drives, and documents end-to-end. Stack: React, TypeScript, Electron, GraphQL, Node.js, Express, Redux, TailwindCSS, Vite, Storybook, Vitest.",
    detail_es:
      "A cargo de pilares arquitectónicos de Powerhouse — plataforma de operaciones para DAOs que cubre gobernanza, gestión documental y presupuestos — con ~2.100 commits. Envié features sobre Renown (SDK de identidad y credenciales basado en wallet: DID:pkh, firmas EVM, sesiones JWT bearer) y lideré el design system usado en Connect, Academy y Vetra. La plataforma también incluye Reactor MCP, un servidor MCP al que los agentes se conectan para scaffolding de document models, editors, drives y documentos de punta a punta. Stack: React, TypeScript, Electron, GraphQL, Node.js, Express, Redux, TailwindCSS, Vite, Storybook, Vitest.",
  },
  {
    role_en: "Senior Software Engineer",
    role_es: "Senior Software Engineer",
    org: "Evernote",
    when_en: "2021 — 2023",
    when_es: "2021 — 2023",
    place_en: "Remote · Global",
    place_es: "Remoto · Global",
    detail_en:
      "Shipped Evernote's first AI feature — AI Note Cleanup — owning both the server-side OpenAI orchestration and the in-editor UX (launched mid-2023 as a 20% public beta before company-wide GA). Owned end-to-end delivery across Node.js / gRPC microservices on the client-service contact layer and the Electron desktop (Windows / macOS / Linux), iOS, Android, and Web clients that consume them — feature parity across 6 platforms. Delivered and maintained Tasks, a core productivity module used daily by millions. Mentored 6–8 engineers across 2 internship cohorts. Stack: React, Redux, TypeScript, Node.js, GraphQL, gRPC, OpenAI, Electron, Docker, Kubernetes.",
    detail_es:
      "Envié la primera feature con IA de Evernote — AI Note Cleanup — dueño tanto de la orquestación server-side con OpenAI como del UX dentro del editor (lanzada a mitad de 2023 como public beta al 20% antes del GA a toda la compañía). A cargo de la entrega end-to-end de microservicios Node.js / gRPC en la capa de contacto cliente-servicio y de los clientes Electron desktop (Windows / macOS / Linux), iOS, Android y Web que los consumen — paridad de features en 6 plataformas. Envié y mantuve Tasks, un módulo central de productividad usado a diario por millones. Mentor de 6–8 ingenieros en 2 cohortes de internship. Stack: React, Redux, TypeScript, Node.js, GraphQL, gRPC, OpenAI, Electron, Docker, Kubernetes.",
  },
  {
    role_en: "Frontend Engineer",
    role_es: "Ingeniero Frontend",
    org: "Fleek",
    when_en: "2019 — 2021",
    when_es: "2019 — 2021",
    place_en: "Remote · CA",
    place_es: "Remoto · CA",
    detail_en:
      "Led frontend architecture for Plug Wallet, a browser-extension crypto wallet — originally Internet Computer only (ICP, Cycles, NFTs), since grown into a multi-chain wallet supporting BTC, ETH, SOL, ICP, and Odin with cross-chain swaps and in-wallet staking. Designed and shipped Space Desktop, a Dropbox-style cross-platform client for IPFS / Filecoin-backed storage. Built developer tooling (web-based IDE, CI / deploy pipelines) for writing, testing, and deploying smart contracts on Ethereum and the Internet Computer. Stack: React, Redux, TypeScript, Node.js, gRPC, Go, web3 / ethers, Electron, Docker.",
    detail_es:
      "Lideré la arquitectura frontend de Plug Wallet, una extensión de navegador crypto — originalmente solo Internet Computer (ICP, Cycles, NFTs), hoy wallet multi-chain que soporta BTC, ETH, SOL, ICP y Odin con cross-chain swaps e in-wallet staking. Diseñé y envié Space Desktop, un cliente cross-platform tipo Dropbox para almacenamiento sobre IPFS / Filecoin. Construí tooling para desarrolladores (IDE web, pipelines de CI / deploy) para escribir, testear y desplegar smart contracts en Ethereum y en Internet Computer. Stack: React, Redux, TypeScript, Node.js, gRPC, Go, web3 / ethers, Electron, Docker.",
  },
  {
    role_en: "Frontend Engineer",
    role_es: "Ingeniero Frontend",
    org: "ComparaOnline",
    when_en: "2018 — 2019",
    when_es: "2018 — 2019",
    place_en: "Santiago · CL",
    place_es: "Santiago · CL",
    detail_en:
      "Frontend development for an insurance and financial-product marketplace. Contributed to the React / Redux / RxJS frontend, micro-frontend architecture, and GraphQL + microservice integration. Stack: React, Redux, RxJS, Node, GraphQL, Redis, MongoDB, TypeScript, Webpack.",
    detail_es:
      "Desarrollo frontend para un marketplace de seguros y productos financieros. Trabajé en el frontend con React, Redux y RxJS, en la arquitectura de micro-frontends y en la integración con GraphQL y microservicios. Stack: React, Redux, RxJS, Node, GraphQL, Redis, MongoDB, TypeScript, Webpack.",
  },
  {
    role_en: "Software Engineer",
    role_es: "Ingeniero de Software",
    org: "Groupon",
    when_en: "2017 — 2018",
    when_es: "2017 — 2018",
    place_en: "Santiago · CL",
    place_es: "Santiago · CL",
    detail_en:
      "Founding engineer on the rebuild of Groupon's LATAM e-commerce platform from scratch — ~5 core markets (Brazil, Chile, Argentina, Mexico, Colombia) serving tens of millions of users. Owned multiple Node.js microservices and their consuming React frontends; drove the migration of legacy services into the new microservice architecture. Stack: React, RxJS, Node.js, Redis, MongoDB, MySQL, REST, microservices.",
    detail_es:
      "Ingeniero fundador del equipo que reconstruyó la plataforma de e-commerce de Groupon para LATAM desde cero — ~5 mercados principales (Brasil, Chile, Argentina, México, Colombia) con decenas de millones de usuarios. A cargo de varios microservicios Node.js y sus frontends React consumidores; lideré la migración de servicios legacy a la nueva arquitectura de microservicios. Stack: React, RxJS, Node.js, Redis, MongoDB, MySQL, REST, microservicios.",
  },
  {
    role_en: "Software Engineer",
    role_es: "Ingeniero de Software",
    org: "Borealis",
    when_en: "2016 — 2017",
    when_es: "2016 — 2017",
    place_en: "Santiago · CL",
    place_es: "Santiago · CL",
    detail_en:
      "Software-factory engineer. Shipped a transaction-document exchange platform (Laravel / PHP + Angular) and an internal mobile tooling app (Ionic) for client incident management. Stack: Node.js, Laravel (PHP), Angular, Ionic, MySQL, PostgreSQL, REST.",
    detail_es:
      "Ingeniero en software factory. Envié una plataforma de intercambio de documentos transaccionales (Laravel / PHP + Angular) y una app mobile interna de tooling (Ionic) para gestión de incidentes de clientes. Stack: Node.js, Laravel (PHP), Angular, Ionic, MySQL, PostgreSQL, REST.",
  },
  {
    role_en: "Accountant Analyst",
    role_es: "Analista Contable",
    org: "Becton Dickinson · Capgemini",
    when_en: "2009 — 2016",
    when_es: "2009 — 2016",
    place_en: "Santiago · CL",
    place_es: "Santiago · CL",
    detail_en:
      "Accountant analyst. Treasury, travel-and-expense management, and fixed-asset bookkeeping. A background that still informs how I approach engineering.",
    detail_es:
      "Analista contable. Tesorería, gestión de gastos de viaje y contabilización de activos fijos. Un background que todavía moldea cómo abordo la ingeniería.",
  },
];
