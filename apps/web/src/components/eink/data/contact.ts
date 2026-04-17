import type { Copy } from "./copy";

/**
 * `kind` identifies the channel so ContactSection can pick the right
 * icon without pulling React components into the data layer. The union
 * stays closed — adding a new value requires updating the ICONS map.
 */
export type ContactKind =
  | "email"
  | "github"
  | "linkedin"
  | "twitter"
  | "location";

export type ContactLink = {
  kind: ContactKind;
  label: string;
  value: string;
  href: string | null;
};

export const contactLinks = (t: Copy): ContactLink[] => [
  {
    kind: "email",
    label: t.labels.email,
    value: "guillermo.ps09@gmail.com",
    href: "mailto:guillermo.ps09@gmail.com",
  },
  {
    kind: "github",
    label: t.labels.github,
    value: "github.com/gpuente",
    href: "https://github.com/gpuente",
  },
  {
    kind: "linkedin",
    label: t.labels.linkedin,
    value: "linkedin.com/in/guillermo-puente",
    href: "https://www.linkedin.com/in/guillermo-puente-66125b54/",
  },
  {
    kind: "twitter",
    label: t.labels.twitter,
    value: "@memo_asd",
    href: "https://twitter.com/memo_asd",
  },
  {
    kind: "location",
    label: t.labels.location,
    value: t.locationVal,
    href: null,
  },
];
