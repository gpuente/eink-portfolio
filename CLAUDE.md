# CLAUDE.md — E-Ink Portfolio · Memo Puente

Technical reference for continuing development. Read this before touching any code.

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

---

## Architecture

**Astro 6 + React 19 island.** The entire UI is a single React component (`src/components/EinkPortfolio.jsx`) mounted as a client-side island from `src/pages/index.astro`. Astro's role is just: HTML shell, favicon, meta, and hydrating the island with `client:load`. No routing — it's one continuous scroll page.

### File map
```
astro.config.mjs               → @astrojs/react integration
src/layouts/Layout.astro       → <html>/<head>/<body>. Sets title + resets margins globally
src/pages/index.astro          → renders <EinkPortfolio client:load />
src/components/EinkPortfolio.jsx → the whole portfolio (default export `App`)
data/portfolio.json            → legacy portfolio data from the previous site; not yet wired in
data/assets/                   → legacy assets (profile, blog, certificates, cv, portfolio)
public/                        → favicon.ico, favicon.svg
eink-portfolio.jsx             → reference source of truth at repo root. `src/components/EinkPortfolio.jsx` must stay in sync with it.
```

The component is hydrated with `client:load` (not `client:idle` or `client:visible`) because the status bar, theme toggle, and scroll spy all need to be interactive immediately on first paint.

### Section order
```
Home → About → Projects → Work → Contact
```

The order matters because the floating dock and the scroll spy both depend on it. If you reorder sections, update in **three places** inside `src/components/EinkPortfolio.jsx`:
1. `SECTIONS(t)` array (drives the dock)
2. `<section>` elements in the `<main>` JSX
3. `§ 01 / § 02 / § 03 / § 04` labels in both `COPY.en` and `COPY.es`

### Key components
| Component | Role |
|---|---|
| `App` | Root. Holds mode/lang/active state, scroll spy, refs |
| `StatusBar` | Fixed top bar. Live data + toggles |
| `StatusStat` | Single labeled metric in the status bar (icon + LABEL + value) |
| `Dock` | Fixed bottom pill. Navigation + scroll-to |
| `Divider` | Section break between content blocks |
| `HomeSection` | Hero + CTAs + status grid + GitHub activity strip |
| `AboutSection` | Bio + "Currently" card |
| `ProjectsSection` | Project list with bilingual descriptions |
| `WorkSection` | Experience timeline |
| `ContactSection` | Links + colophon |
| `MoonGlyph` | SVG moon phase visualization |
| `WeatherIcon` | Maps WMO weather codes to lucide icons |

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

1. Add the section id to `refs` object (keep the order: home → about → projects → work → contact → YOUR_NEW_SECTION)
2. Add a `<Divider>` + `<section ref={refs.xxx} data-section="xxx">` in the `<main>` JSX in the correct position
3. Add the section label to `SECTIONS(t)` array (drives the dock)
4. Add all strings to both `COPY.en` and `COPY.es`
5. Create the section component following the existing pattern: receives `c` (colors) and `t` (copy) as props
6. Update the `§` numbering if inserting between existing sections

---

## Adding New Status Bar Metrics

1. Create a `useYourData()` hook following the pattern: `useState(null)` → `useEffect` fetch → `.catch(() => fallback)`
2. Call the hook in `App`, pass the value down to `StatusBar`
3. Add a `<StatusStat>` in the status bar with: icon (lucide component), label (3–5 char uppercase), value, title (tooltip)
4. Add `status-hide-sm` or `status-hide-xs` class if it should collapse on narrow viewports
5. Add a `<span className="status-divider ...">` before it

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

- `astro` 6 + `@astrojs/react` 5 (the host framework; only job is to render the React island)
- `react` / `react-dom` 19 (hooks: useState, useEffect, useRef)
- `lucide-react` **pinned to 0.474.0** — later versions dropped the `Github` brand icon. If you bump this, you must replace `<Github />` in the status bar with an alternative (e.g. inline SVG or `GitBranch`)
- Icons used: Home, Briefcase, User, Mail, FolderGit2, Sun, Moon, ArrowUpRight, MapPin, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Rocket, Bitcoin, Languages, Github, CircleDot
- Google Fonts: Newsreader (serif), JetBrains Mono (monospace) — loaded via `@import` inside the component's `<style>` block

No Tailwind. No CSS frameworks. Styles are inline React styles + one `<style>` block (rendered inside the component) for animations, grain texture, and responsive media queries.

### Scripts
```
pnpm dev      → astro dev (local server, HMR)
pnpm build    → astro build (static output to dist/)
pnpm preview  → astro preview (serve dist/)
```

Package manager is **pnpm**. Node version pinned to `>=22.12.0` in package.json.
