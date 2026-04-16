import type { Copy } from "./copy";

export type ContactLink = {
  label: string;
  value: string;
  href: string | null;
};

export const contactLinks = (t: Copy): ContactLink[] => [
  {
    label: t.labels.email,
    value: "guillermo.ps09@gmail.com",
    href: "mailto:guillermo.ps09@gmail.com",
  },
  {
    label: t.labels.github,
    value: "github.com/gpuente",
    href: "https://github.com/gpuente",
  },
  {
    label: t.labels.linkedin,
    value: "linkedin.com/in/guillermo-puente",
    href: "https://www.linkedin.com/in/guillermo-puente-66125b54/",
  },
  {
    label: t.labels.twitter,
    value: "@memo_asd",
    href: "https://twitter.com/memo_asd",
  },
  {
    label: t.labels.location,
    value: t.locationVal,
    href: null,
  },
];
