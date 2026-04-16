export type Certification = {
  title: string;
  issuer: string;
  year: string;
  href: string | null;
};

export const CERTIFICATIONS: Certification[] = [
  {
    title: "Electron Framework — FullStack certification",
    issuer: "FullStack",
    year: "2023",
    href: null,
  },
  {
    title: "React Native — The Practical Guide",
    issuer: "Udemy",
    year: "2021",
    href: "https://www.udemy.com/certificate/UC-ed89d2d2-2042-4e0b-9ba4-f8d2d5d0ca01/",
  },
  {
    title: "Go: The Complete Developer's Guide",
    issuer: "Udemy",
    year: "2021",
    href: "https://www.udemy.com/certificate/UC-1f53cf55-5d2f-4fce-b09e-fc7555309976/",
  },
  {
    title: "Understanding TypeScript",
    issuer: "Udemy",
    year: "2018",
    href: "https://www.udemy.com/certificate/UC-L0CQ1OR8/",
  },
  {
    title: "Modern React with Redux",
    issuer: "Udemy",
    year: "2018",
    href: "https://www.udemy.com/certificate/UC-MVDGGWJX/",
  },
  {
    title: "Server Side Rendering with React and Redux",
    issuer: "Udemy",
    year: "2018",
    href: "https://www.udemy.com/certificate/UC-T9W3DKLW/",
  },
  {
    title: "Webpack 2: The Complete Developer's Guide",
    issuer: "Udemy",
    year: "2017",
    href: "https://www.udemy.com/certificate/UC-KNGV26V3/",
  },
  {
    title: "MTA C#",
    issuer: "Certiport",
    year: "2015",
    href: null,
  },
];
