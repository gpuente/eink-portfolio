import { Home, Briefcase, User, Mail, FolderGit2, Mic, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Copy } from "./copy";

export type SectionId = "home" | "about" | "projects" | "talks" | "work" | "background" | "contact";

export type Section = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
};

export const SECTIONS = (t: Copy): Section[] => [
  { id: "home", label: t.nav.home, icon: Home },
  { id: "about", label: t.nav.about, icon: User },
  { id: "projects", label: t.nav.projects, icon: FolderGit2 },
  { id: "talks", label: t.nav.talks, icon: Mic },
  { id: "work", label: t.nav.work, icon: Briefcase },
  { id: "background", label: t.nav.background, icon: GraduationCap },
  { id: "contact", label: t.nav.contact, icon: Mail },
];
