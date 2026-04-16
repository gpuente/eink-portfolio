export type Mode = "light" | "dark";

export type Palette = {
  paper: string;
  paperBright: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
};

export const PALETTES: Record<Mode, Palette> = {
  light: {
    paper: "#e8e4db",
    paperBright: "#f1ede4",
    ink: "#2b2a27",
    inkSoft: "#6b6860",
    inkFaint: "#a8a49a",
  },
  dark: {
    paper: "#3a3a36",
    paperBright: "#44443f",
    ink: "#dcd8cd",
    inkSoft: "#9a968c",
    inkFaint: "#6b675f",
  },
};
