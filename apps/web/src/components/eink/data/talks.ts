export type Talk = {
  title_en: string;
  title_es: string;
  event_en: string;
  event_es: string;
  year: string;
  note_en: string;
  note_es: string;
  href: string;
  /** Short label that links this talk to an existing Project.title, for cross-reference. */
  relatedProject?: string;
};

export const TALKS: Talk[] = [
  {
    title_en: "Getting Started with Space Daemon",
    title_es: "Getting Started with Space Daemon",
    event_en: "Talk · ETHGlobal",
    event_es: "Charla · ETHGlobal",
    year: "2020",
    note_en:
      "Walkthrough of Space Daemon — the gRPC backend that powers Space Desktop — covering the architecture, IPFS and Textile integration, and how developers can build decentralized-storage apps on top of it.",
    note_es:
      "Recorrido por Space Daemon — el backend gRPC que potencia Space Desktop — cubriendo la arquitectura, la integración con IPFS y Textile, y cómo los desarrolladores pueden construir aplicaciones de almacenamiento descentralizado sobre él.",
    href: "https://www.youtube.com/watch?v=f5LRSpGGuQE",
    relatedProject: "Space Desktop",
  },
];
