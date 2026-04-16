# CLAUDE.md — E-Ink Portfolio · Guillermo Puente

Technical reference for continuing development. Read this before touching any code.

The subject of the portfolio is **Guillermo Puente Sandoval** — senior full-stack engineer based in Santiago, Chile, with 10+ years of experience (Evernote, Fleek, ComparaOnline, Groupon, Borealis). Source data for copy, work history, and projects lives in `data/portfolio.json`. The component derives its content from that file (hand-curated and rewritten for tone — not a straight copy-paste).

---

## Concept

This is a **single-page developer portfolio** that simulates the look and feel of a **physical e-ink display** (like a Kindle or BOOX). The entire browser viewport IS the e-ink surface — there is no device frame or bezel wrapping it.

The key illusion is not "grayscale website" — it's **a screen you could touch**. That comes from:
- Paper grain texture (CSS radial-gradient dots, not an image)
- Edge vignette (radial-gradient that darkens the perimeter)
- Inset shadow on the full viewport (box-shadow: inset) to simulate a recessed panel
- Low contrast, warm color palette (never #000 or #FFF)
- Calm, slow interactions (no bouncy/elastic animations)

**If you add a feature, ask: would this feel at home on a Kindle?**

### Voice / tone

The copy is **professional and technical, not playful**. Substantive statements; no twee poetry. Lean toward the voice of an engineer writing documentation that happens to be well-crafted — a calm, precise register that fits the e-ink aesthetic without drifting into whimsy.

- Good: "Senior full-stack engineer with 10+ years shipping products across web, mobile, and desktop."
- Avoid: "Building small, quiet software from the bottom of the world."

Technical terms (React, Go, gRPC, TypeScript, IPFS) stay in English in both locales. Italics are for emphasis only; no decorative italics.

---

## Architecture

**Astro 6 + React 19 island, TypeScript throughout.** The portfolio is a modular React tree mounted as a single client-side island from `src/pages/index.astro`. Astro's role is just: HTML shell, favicon, meta, and hydrating the island with `client:load`. No routing — it's one continuous scroll page.

**All source files are TypeScript.** Components are `.tsx`; hooks, data, and utilities are `.ts`. No `.js` or `.jsx` — type-check with `pnpm exec astro check` before committing.

### File map
```
astro.config.mjs               → @astrojs/react integration
src/layouts/Layout.astro       → <html>/<head>/<body>. Accepts `title` + `description` props
src/pages/index.astro          → renders <EinkPortfolio client:load />
src/pages/gallery.astro        → static visual gallery of projects (B&W → colour on hover)
src/assets/portfolio/          → optimized images + MP4s (originals copied/converted from data/assets/portfolio/)
src/components/
  EinkPortfolio.tsx            → root component. Owns mode/lang/refs/time state; composes everything below
  eink/
    data/
      palettes.ts              → exports Mode, Palette, PALETTES (light/dark color tokens)
      copy.ts                  → exports Lang, Copy, COPY.en / COPY.es (all user-facing strings)
      projects.ts              → exports Project, PROJECTS (personal/OSS projects, bilingual notes)
      talks.ts                 → exports Talk, TALKS (conference talks, bilingual)
      experience.ts            → exports Experience, EXPERIENCE (work history, most recent first)
      sections.ts              → exports SectionId, Section, SECTIONS(t) (dock entries with icons)
      contact.ts               → exports ContactLink, contactLinks(t)
    hooks/
      useWeather.ts            → Open-Meteo (Santiago temp + WMO code). Exports WeatherData
      useHumansInSpace.ts      → open-notify.org via corsproxy.io, falls back to 7
      useBitcoin.ts            → CoinGecko price (USD)
      useGitHub.ts             → public_repos + latest PushEvent for gpuente. Exports GitHubData
      useMoonPhase.ts          → client-side astronomy. Exports MoonPhase
      useScrollSpy.ts          → bounding-rect scroll spy. Exports SectionRefs
    ui/
      GlobalStyles.tsx         → the <style> block (grain, mono, dock-btn, hover, media queries)
      SurfaceLayers.tsx        → grain + vignette + inset-shadow overlays
      StatusBar.tsx            → fixed top bar (composes StatusStat/MoonGlyph/WeatherIcon + toggles)
      StatusStat.tsx           → one labeled metric (icon + LABEL + value)
      MoonGlyph.tsx            → SVG moon phase
      WeatherIcon.tsx          → WMO code → lucide icon
      Dock.tsx                 → fixed bottom pill navigation
      Divider.tsx              → section break (§ label between two rules)
    sections/
      HomeSection.tsx          → hero, CTAs, status grid, GitHub activity strip
      AboutSection.tsx         → bio paragraphs + "Currently" card
      ProjectsSection.tsx      → project list with live/repo links
      TalksSection.tsx         → conference talks list (title, event, year, description, video link)
      WorkSection.tsx          → experience timeline with role details per job
      ContactSection.tsx       → contact rows
    util/
      timeAgo.ts               → relative-time helper for the GitHub push timestamp

data/portfolio.json            → SOURCE DATA for copy/projects/experience. Hand-curated into eink/data/*
data/assets/                   → screenshots/gifs of past projects (not yet wired into the UI)
public/                        → favicon.ico, favicon.svg
```

### Type conventions

- **Palette / Mode:** exported from `data/palettes.ts`. Every UI component accepts `c: Palette` and, when relevant, `mode: Mode`.
- **Copy / Lang:** exported from `data/copy.ts`. Components that render strings accept `t: Copy` and, when bilingual content from data arrays is needed, `lang: Lang`.
- **SectionId:** the dock/scroll-spy use the union `"home" | "about" | "projects" | "work" | "contact"`. Keep this in sync if you add or rename a section.
- **Refs:** `SectionRefs = Record<SectionId, RefObject<HTMLElement | null>>`.
- **Hook return shapes** (`WeatherData`, `GitHubData`, `MoonPhase`) are co-located with their hook files — import the type from the same module.

The component is hydrated with `client:load` (not `client:idle` or `client:visible`) because the status bar, theme toggle, and scroll spy all need to be interactive immediately on first paint. Because `client:load` still SSR-renders the component at build time, all sections (including projects/work/contact text) are present in the static HTML — good for SEO.

### `/gallery` page

A second route (`src/pages/gallery.astro`) shows the same projects visually. **Pure static Astro** — no React, no JS shipped. Each card uses CSS `filter: grayscale(100%)` by default and `grayscale(0)` on hover with a 700ms ease transition (matches the e-ink "calm" pacing).

- Static images come through `astro:assets` and are processed by Sharp into responsive `webp` at multiple widths
- Animated content lives as `<video autoplay loop muted playsinline>` on MP4 files (originally GIFs converted with ffmpeg → ~85% size reduction)
- The home → gallery link sits at the foot of the Projects section (`projectsGalleryLink` string in `COPY`)

If you add a project to `data/projects.ts`, also add a row to `mediaMap` in `gallery.astro` so it appears in the gallery. Projects without a media entry are silently skipped.

### How to evolve content

- **Strings:** add to both `COPY.en` and `COPY.es` in `src/components/eink/data/copy.ts`. Also update the `Copy` type if you add a new field — TS will then force every missing string to surface at check-time. Never hardcode.
- **Projects:** append to `src/components/eink/data/projects.ts`. Each `Project` has `title`, `kind_en`, `kind_es`, `year`, `note_en`, `note_es`, `href: string | null`, `repo: string | null`, and optional `archived?: boolean` (use `/web/TIMESTAMPif_/ORIGINAL_URL` for archive.org links to hide the Wayback toolbar).
- **Talks:** append to `src/components/eink/data/talks.ts`. Each `Talk` has `title_en`, `title_es`, `event_en`, `event_es`, `year`, `note_en`, `note_es`, `href` (the video URL), and optional `relatedProject` (cross-references a `Project.title`).
- **Experience:** append to `src/components/eink/data/experience.ts`. Fields: `role_en`, `role_es`, `org`, `when`, `place_en`, `place_es`, `detail_en`, `detail_es`.
- **Contact:** edit `src/components/eink/data/contact.ts`.
- **Source of truth:** `data/portfolio.json` has the raw résumé data. When rewriting, pull facts from there but rephrase for the e-ink voice described above.

### Section order
```
Home → About → Projects → Talks → Work → Contact
```

The order matters because the floating dock and the scroll spy both depend on it. If you reorder sections, update in **four places**:
1. The `SectionId` union in `src/components/eink/data/sections.ts`
2. `SECTIONS(t)` array in the same file (drives the dock)
3. `<section>` elements in the `<main>` JSX of `src/components/EinkPortfolio.tsx`
4. `§ 01 / § 02 / § 03 / § 04 / § 05` labels in both `COPY.en` and `COPY.es` in `src/components/eink/data/copy.ts`

### Key components
| Component | Path | Role |
|---|---|---|
| `EinkPortfolio` | `src/components/EinkPortfolio.tsx` | Root. Owns mode/lang/active/time state, refs, scroll-to. Composes everything below. |
| `GlobalStyles` | `eink/ui/GlobalStyles.tsx` | The dynamic `<style>` block (reads `c.paper`) |
| `SurfaceLayers` | `eink/ui/SurfaceLayers.tsx` | The three fixed overlay layers (grain, vignette, inset shadow) |
| `StatusBar` | `eink/ui/StatusBar.tsx` | Fixed top bar. Live data + toggles |
| `StatusStat` | `eink/ui/StatusStat.tsx` | Single labeled metric (icon + LABEL + value) |
| `Dock` | `eink/ui/Dock.tsx` | Fixed bottom pill. Navigation + scroll-to |
| `Divider` | `eink/ui/Divider.tsx` | Section break between content blocks |
| `MoonGlyph` | `eink/ui/MoonGlyph.tsx` | SVG moon phase visualization |
| `WeatherIcon` | `eink/ui/WeatherIcon.tsx` | WMO weather code → lucide icon |
| `HomeSection` | `eink/sections/HomeSection.tsx` | Hero + CTAs + status grid + GitHub activity strip |
| `AboutSection` | `eink/sections/AboutSection.tsx` | Bio + "Currently" card |
| `ProjectsSection` | `eink/sections/ProjectsSection.tsx` | Project list (live/repo links) |
| `TalksSection` | `eink/sections/TalksSection.tsx` | Conference talks with video links |
| `WorkSection` | `eink/sections/WorkSection.tsx` | Experience timeline with role details |
| `ContactSection` | `eink/sections/ContactSection.tsx` | Contact rows |

---

## Color System

All colors come from `PALETTES.light` and `PALETTES.dark`. Every component receives `c` as a prop and uses these tokens. **Never hardcode a color.**

```
LIGHT MODE
paper:       #e8e4db   ← main background (warm off-white)
paperBright: #f1ede4   ← cards, inset panels, dock background
ink:         #2b2a27   ← primary text (dark gray, NOT black)
inkSoft:     #6b6860   ← secondary text, descriptions
inkFaint:    #a8a49a   ← borders, dividers, tertiary text, labels

DARK MODE
paper:       #3a3a36   ← main background (warm dark gray, NOT black)
paperBright: #44443f   ← cards, elevated surfaces
ink:         #dcd8cd   ← primary text (soft cream, NOT white)
inkSoft:     #9a968c   ← secondary text
inkFaint:    #6b675f   ← borders, dividers
```

### Rules
- **Never use pure black (#000) or pure white (#FFF)** — the e-ink illusion depends on low contrast
- Dark mode is "dimmed e-ink", not OLED. The background is warm dark gray, not black
- Borders are always `1px solid ${c.inkFaint}` or `1px dashed ${c.inkFaint}`
- The `transition: "background 600ms ease, color 600ms ease"` on the root ensures smooth mode switches

---

## Typography

### Fonts
- **Display / body**: `Newsreader` (Google Fonts, variable weight 400–600, italic)
- **Mono / UI meta**: `JetBrains Mono` (Google Fonts, weight 400–500)

Loaded via `@import` in the `<style>` block. Fallback stacks:
- Serif: `"Iowan Old Style", Georgia, serif`
- Mono: `ui-monospace, monospace`

### Usage pattern
- **Headings**: Newsreader, weight 500, `clamp(32px, 5vw, 48px)` for responsive scaling, `letterSpacing: "-.015em"`
- **Hero title**: `clamp(44px, 8vw, 84px)`
- **Body**: Newsreader 17px, `lineHeight: 1.75`
- **UI labels / status bar**: JetBrains Mono via `.mono` class, 10–12px, `letterSpacing: ".2em"`, `textTransform: "uppercase"`
- **Section markers**: `§ 01 · Projects` pattern, mono font, 10px

### Rules
- Italics are used for emphasis, project titles on hover, and the hero tagline — not for decoration
- Don't use bold (fontWeight > 500) — e-ink doesn't do bold well
- Letter-spacing on mono text should be `.1em` to `.3em` depending on size

---

## E-Ink Surface Layers

The viewport has **three fixed overlay layers** (all `pointer-events: none`) that create the physical screen illusion:

### Layer 1: Paper grain (z-index: 100)
```css
.grain {
  background-image:
    radial-gradient(rgba(0,0,0,.05) 1px, transparent 1px),
    radial-gradient(rgba(0,0,0,.035) 1px, transparent 1px);
  background-size: 3px 3px, 7px 7px;
  mix-blend-mode: multiply;   /* light mode */
  /* dark mode: mix-blend-mode: screen; opacity: .35; */
}
```
Two layers of tiny dots at different frequencies create a matte paper texture. No image files needed.

### Layer 2: Vignette (z-index: 99)
```css
radial-gradient(ellipse at center, transparent 50%, rgba(80,65,40,.08) 85%, rgba(80,65,40,.14) 100%)
```
Darkens edges to simulate a physical screen that catches less light at the perimeter.

### Layer 3: Inset shadow (z-index: 98)
```css
box-shadow: inset 0 3px 10px rgba(60,50,30,.12),
            inset 0 -2px 6px rgba(255,255,255,.25);
```
Makes the entire viewport look recessed, like an e-ink panel set into a device body.

**Do not remove these layers.** They are the core of the visual identity.

---

## Navigation

### Scroll spy
Uses `getBoundingClientRect()` on each section ref, fired on `window.scroll`. Picks the section whose top is closest to 120px from viewport top (below the status bar) and has already scrolled past.

**Scroll lock**: When the user clicks a dock button, `scrollLock` ref is set to `true` for 900ms. During this time the spy is frozen and the active section is set manually. This prevents flickering through intermediate sections during smooth-scroll animation.

If you add a section, add its ref to the `refs` object and a matching `<section ref={refs.xxx} data-section="xxx">` in the JSX.

### Dock
Fixed pill at the bottom center. Each button shows an icon; the active button expands to show the label. The active state gets an `inset` box-shadow to look like a pressed e-ink button.

CSS class `scroll-margin-top: 80px` on all `<section>` elements ensures content doesn't hide behind the fixed status bar when scrolling.

---

## Live Data (Status Bar)

All data is fetched once on mount. No polling. Each hook has graceful fallbacks.

| Metric | Hook | API | Auth | CORS | Fallback |
|---|---|---|---|---|---|
| Weather (Santiago) | `useWeather` | `api.open-meteo.com` | None | ✅ | `{ temp: null, code: null }` → shows `…` |
| Humans in space | `useHumansInSpace` | `api.open-notify.org` via `corsproxy.io` | None | Proxy | `7` (rarely changes) |
| Bitcoin price | `useBitcoin` | `api.coingecko.com` | None | ✅ | `null` → shows `…` |
| GitHub profile + events | `useGitHub` | `api.github.com` | None | ✅ | `null` fields, UI hides gracefully |
| Moon phase | `useMoonPhase` | None (client-side math) | N/A | N/A | Always works |

### StatusStat component
Every metric in the bar uses `<StatusStat>` which renders: **icon + tiny label + value**. The label (e.g. `SCL`, `MOON`, `ORBIT`, `BTC`, `PUSH`) is always visible so the number is never ambiguous.

### Moon glyph
`MoonGlyph` is a custom SVG (14×14) that draws two overlapping circles: the lit disk in `c.ink` and a shadow circle in `c.paper` that shifts left/right based on waxing/waning. The outline ring (0.7px, 40% opacity) ensures the near-new-moon phase is still visible.

### Weather icons
`WeatherIcon` maps Open-Meteo's WMO weather codes to lucide-react icons (`Sun`, `Cloud`, `CloudRain`, `CloudSnow`, `CloudFog`, `CloudLightning`). No emojis — they render inconsistently across platforms.

### Responsive hiding
Status bar items have CSS classes that hide them at breakpoints:
- `status-hide-sm`: hidden below 720px (hides moon value, orbit, BTC, GitHub push)
- `status-hide-xs`: hidden below 520px (hides weather, location)

The dock and both toggles (lang + theme) are always visible.

---

## i18n

The `COPY` object at the top of the file holds all user-facing strings in `en` and `es`. The current language is stored in `lang` state and toggled via the `EN/ES` button in the status bar.

### Rules
- ALL user-facing text must come from `COPY[lang]` (the `t` prop). Never hardcode a string.
- Content data arrays (`PROJECTS`, `EXPERIENCE`) have bilingual fields: `note_en`/`note_es`, `role_en`/`role_es`. Section components select the right one via `lang`.
- Date formatting uses `toLocaleDateString(lang === "es" ? "es-CL" : "en-US", ...)` for locale-aware output.
- When adding a new string, add it to **both** `COPY.en` and `COPY.es`.

---

## Animations

### Philosophy
Animations should feel like **e-ink refresh behavior** — deliberate, stepped, slightly laggy. Not modern glass-UI smooth.

### Current animations
| Name | Used for | Duration | Notes |
|---|---|---|---|
| `eink-fade-in` | Section entry on scroll | 520ms ease-out | 4px translateY + opacity. Applied via `.eink-enter` class |

### Hover effects
- `.underline-hover::after`: a `1px` line that expands from left to right on hover (400ms ease). Used on project titles and contact links.
- `.dock-btn`: active state expands to show label text via `max-width` transition (260ms).
- `nav-row` class (if used): slight letter-spacing expansion on hover.

### Rules
- No bouncy/spring animations
- No scale transforms (doesn't feel e-ink)
- Transition durations should be 240–600ms, never < 150ms
- Use `steps()` timing for anything meant to simulate e-ink refresh
- No opacity hover below 0.5 — e-ink doesn't dim that aggressively

---

## Layout

### Content column
`maxWidth: 720px`, centered with `margin: 0 auto`, padded `32px` horizontally, `120px` top (for fixed status bar), `160px` bottom (for fixed dock).

### Status bar
Fixed top, full width. Inner content maxes at `1200px`. Height ~44px. Uses `1px dashed` bottom border.

### Dock
Fixed bottom center, `border-radius: 999px` pill. Gap `4px` between buttons. Shadow creates a floating "physical button bar" feel.

### Section dividers
`Divider` component: a centered label between two `1px` horizontal lines. Margin `96px` top, `44px` bottom — generous space to separate sections.

### Cards / panels
Background `c.paperBright`, border `1px solid ${c.inkFaint}`, `borderRadius: 12px`, padding `20px 24px`. Used for "Currently" card, status grid cells, GitHub activity strip.

### Status grid (Home)
Uses `gap: 1` on the grid parent with `background: c.inkFaint` — the 1px gap becomes the grid lines. Each cell has `background: c.paperBright`. `borderRadius: 12px` + `overflow: hidden` on the parent.

---

## Adding New Sections

1. Create `src/components/eink/sections/YourSection.tsx`, following the existing pattern: type a `Props` object with `c: Palette` and `t: Copy`; for bilingual data-driven sections also accept `lang: Lang`.
2. In `src/components/eink/data/sections.ts`: extend the `SectionId` union with your new id and add the section entry to `SECTIONS(t)` (drives the dock).
3. In `src/components/EinkPortfolio.tsx`: add a ref (`your: useRef<HTMLElement | null>(null)`), import the section, and add `<Divider c={c} label={t.sectionYour} />` + `<section ref={refs.your} data-section="your">` in the `<main>` JSX at the correct position.
4. In `src/components/eink/data/copy.ts`: add all strings (including `nav.your` and `sectionYour`) to the `Copy` type and to both `COPY.en` and `COPY.es`.
5. Update the `§` numbering in existing section labels if inserting between existing sections.
6. Run `pnpm exec astro check` — the `SectionId` union will flag every place you still need to update.

---

## Adding New Status Bar Metrics

1. Create `src/components/eink/hooks/useYourData.ts` following the pattern: `useState<T | null>(null)` → `useEffect` fetch → `.catch(() => fallback)`. Export both the hook and its return type.
2. In `src/components/EinkPortfolio.tsx`: call the hook and pass the value down to `<StatusBar />`.
3. In `src/components/eink/ui/StatusBar.tsx`: add the new prop to the `Props` type and render a `<StatusStat>` with icon (lucide component), label (3–5 char uppercase), value, title (tooltip).
4. Add `status-hide-sm` or `status-hide-xs` class if the metric should collapse on narrow viewports.
5. Add a `<span className="status-divider ...">` before the new stat to match the visual rhythm.

---

## Don'ts

- **Don't use emojis** for icons in the status bar — they render inconsistently. Use lucide-react or custom SVGs.
- **Don't use pure black or white** anywhere.
- **Don't use glassmorphism, neon glows, gradients on text, or blur effects.**
- **Don't use bold (fontWeight > 500).**
- **Don't make animations bouncy or springy.**
- **Don't touch `localStorage` during render.** The component is `client:load`, so the first render runs on the server too — gate any `window`/`localStorage` reads inside `useEffect` to avoid hydration mismatches.
- **Don't remove the grain/vignette/inset layers.** They are the identity.
- **Don't route** — this is a single-page scroll, not a multi-page app.

---

## Dependencies

- `astro` 6 + `@astrojs/react` 5 (the host framework; renders the React island on /, the static gallery page on /gallery)
- `react` / `react-dom` 19 with `@types/react` / `@types/react-dom` (hooks: useState, useEffect, useRef)
- `sharp` (used by `astro:assets` to optimize gallery images → webp at multiple widths)
- `typescript` + `@astrojs/check` (dev deps) — run `pnpm exec astro check` for a full typecheck across `.astro` + `.ts` + `.tsx`
- `lucide-react` **pinned to 0.474.0** — later versions dropped the `Github` brand icon (also emits a `ts(6385)` deprecation hint on use; expected and documented). If you bump this, you must replace `<Github />` in the status bar with an alternative (e.g. inline SVG or `GitBranch`)
- Icons used: Home, Briefcase, User, Mail, FolderGit2, Mic, Sun, Moon, ArrowUpRight, MapPin, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Rocket, Bitcoin, Languages, Github, CircleDot
- Google Fonts: Newsreader (serif), JetBrains Mono (monospace) — loaded via `@import` inside the component's `<style>` block

No Tailwind. No CSS frameworks. Styles are inline React styles + one `<style>` block (rendered inside the component) for animations, grain texture, and responsive media queries.

### Scripts
```
pnpm dev              → astro dev (local server, HMR)
pnpm build            → astro build (static output to dist/)
pnpm preview          → astro preview (serve dist/)
pnpm exec astro check → full TypeScript + Astro type check
```

---

## Git conventions

- **Never include a `Co-Authored-By: Claude ...` trailer (or any AI co-author footer) in commit messages.** Plain subject + body only.

Package manager is **pnpm**. Node version pinned to `>=22.12.0` in package.json.
