export type MoonPhase = {
  illum: number;
  idx: number;
  name_en: string;
  name_es: string;
};

export function useMoonPhase(): MoonPhase {
  const now = new Date();
  const synodic = 29.530588853;
  const known = new Date("2000-01-06T18:14:00Z").getTime();
  const days = (now.getTime() - known) / (1000 * 60 * 60 * 24);
  const age = ((days % synodic) + synodic) % synodic;
  const illum = (1 - Math.cos((age / synodic) * 2 * Math.PI)) / 2;
  const idx = Math.floor((age / synodic) * 8 + 0.5) % 8;

  const names_en = ["New", "Waxing", "1st Q", "Waxing", "Full", "Waning", "Last Q", "Waning"];
  const names_es = [
    "Nueva",
    "Creciente",
    "Cuarto C.",
    "Creciente",
    "Llena",
    "Menguante",
    "Cuarto M.",
    "Menguante",
  ];

  return {
    illum: Math.round(illum * 100),
    idx,
    name_en: names_en[idx]!,
    name_es: names_es[idx]!,
  };
}
