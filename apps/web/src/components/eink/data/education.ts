export type EducationEntry = {
  field_en: string;
  field_es: string;
  institution: string;
  when: string;
  note_en?: string;
  note_es?: string;
};

export const EDUCATION: EducationEntry[] = [
  {
    field_en: "Software Engineering · Systems Development",
    field_es: "Ingeniería en Informática · mención Desarrollo de Sistemas",
    institution: "Instituto Profesional AIEP",
    when: "2012 — 2015",
    note_en: "Awarded best student of the program at sede BUS, 2016.",
    note_es: "Premiado como mejor estudiante del programa, sede BUS 2016.",
  },
  {
    field_en: "Accounting · Technical degree",
    field_es: "Técnico en Contabilidad · nivel medio",
    institution: "Instituto Superior de Comercio Nº 2",
    when: "2006 — 2009",
  },
];
