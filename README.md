# Aydin's Portfolio

A modern, interactive single-page portfolio built with React 19 and Vite. Features an animated contour background, custom cursor, light/dark mode, in-browser content editor, and a level of polish inspired by Aceternity UI and Mahyar Jaberi's portfolio.

## Live Demo

> _Add your deployed URL here once live (Vercel / Netlify / etc.)_

## Highlights

- **Animated contour background** — simplex-noise marching-squares run in a Web Worker with OffscreenCanvas; pauses when the hero scrolls out of view to stay kind to CPU/GPU.
- **Custom cursor** — dot + lerped ring that scales on interactive elements (desktop only, respects `pointer: coarse`).
- **Section polish** — char-staggered hero name with gradient + text scramble, typewriter subtitles, magnetic buttons, availability pill, scroll hint.
- **Project cards** — full-width cards with thumbnail images, numbered index, year badge, category eyebrow pill, tech chips, and 3D tilt + glare hover (inspired by 21st.dev Magic UI).
- **Skills** — animated SVG proficiency rings.
- **Work experience** — vertical timeline with role, company, dates, and bullet highlights.
- **Contact** — floating-label inputs, copy-email toast, live timezone pill, character counter, social link cards with platform logos.
- **Light / dark mode toggle** — dark is the default; single button flips CSS variables and dims the background.
- **In-browser admin panel** — press `Ctrl / Cmd + Shift + E` to edit hero, about, skills, experience, projects, and contact content without touching code. Saves to `localStorage`, with JSON export/import for portability.
- **Accessibility** — focus-visible orange ring, `prefers-reduced-motion` guards on every animation, keyboard-navigable.
- **Analytics ready** — Plausible script tag pre-wired in `index.html` (replace `YOUR_DOMAIN` before deploy).

## Tech Stack

| Area | Tools |
|------|-------|
| Framework | React 19, Vite 7 |
| Animation | Framer Motion, custom rAF loops |
| Rendering | OffscreenCanvas + Web Worker (simplex noise, marching squares) |
| Styling | Plain CSS with CSS custom properties, `data-theme` for light mode |
| Fonts | Inter (body) + Space Grotesk (headings) |
| State | React hooks + `localStorage` (no Redux / Context lib) |
| Content | `src/data/defaults.js` + `useContent` hook (localStorage override) |

Zero UI libraries. Every component is hand-rolled.

## Getting Started

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
# → http://localhost:5173

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## Editing Your Content

Two paths depending on your preference:

**1. In-browser editor (recommended for quick tweaks)**

- Click the ✎ pencil button (bottom right) or press `Ctrl / Cmd + Shift + E`.
- Edit Hero, About, Skills, Experience, Projects, Contact, or any link in the Data tab.
- Every change auto-saves to your browser's `localStorage`.
- Use **Export JSON** to back up / move between devices.
- Use **Reset to Defaults** to clear local overrides.

**2. Edit `src/data/defaults.js`**

- Source of truth for the published version of the site.
- If your `localStorage` is empty, the site reads from here.
- Before deploying, export your local JSON and paste it into `defaults.js` so visitors see your latest content.

## Project Structure

```
src/
├── Portfolio.jsx          # Root layout, section ordering, keyboard shortcuts
├── Portfolio.css          # Design system, variables, section styles, light mode overrides
├── components/
│   ├── Hero.jsx           # Name scramble, typewriter, magnetic buttons, parallax
│   ├── About.jsx          # Portrait + paragraphs + CountUp stats
│   ├── Skills.jsx         # Proficiency-ring cards
│   ├── Experience.jsx     # Vertical timeline
│   ├── Projects.jsx       # Full-width cards with 3D tilt + glare
│   ├── Contact.jsx        # Form + copy-email + social link cards
│   ├── Nav.jsx            # Desktop bar + mobile hamburger (morphs to X)
│   ├── ContourBackground.jsx   # Worker-driven animated canvas
│   ├── CustomCursor.jsx   # Dot + ring with lerp
│   ├── SectionIndicator.jsx    # Fixed right-side numbered dots
│   ├── ScrollToTop.jsx
│   ├── ThemeToggle.jsx    # Sun / moon button
│   ├── AdminPanel.jsx     # In-browser editor
│   ├── Icons.jsx          # Inline SVG social icons
│   └── polish/            # Small motion primitives (SplitText, Toast, CountUp, etc.)
├── data/
│   └── defaults.js        # All portfolio content
├── hooks/
│   ├── useContent.js      # localStorage + defaults merge
│   ├── useScrollSpy.js
│   ├── useMagnetic.js
│   └── useReducedMotionSafe.js
├── motion/
│   └── variants.js        # Shared framer-motion variants
├── utils/
│   └── SimplexNoise.js    # Main-thread fallback for the contour canvas
└── workers/
    └── contourWorker.js   # OffscreenCanvas + noise + marching squares
```

## Deploying

Recommended: [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — both connect directly to GitHub and handle Vite projects zero-config.

Before deploying, set your real domain in `index.html` (Plausible script) and replace the placeholder social URLs in `src/data/defaults.js` (or via the admin panel → Export JSON → paste into `defaults.js`).

## License

MIT — see [LICENSE](./LICENSE).
