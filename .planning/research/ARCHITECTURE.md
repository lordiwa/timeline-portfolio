# Architecture Research

> ⚠ **SUPERSEDED 2026-05-12** — Pivote a **scroll vertical**. Toda referencia a "horizontal scroll engine", "horizontal pinned track", "horizontal scroll IS the navigation" debe leerse como **vertical**. La arquitectura general (Vue 3 + 7 sections en DOM + IntersectionObserver + composable `useScrollState` + Phaser island en ch6) **se mantiene**; lo que cambia es el eje (x → y), la sticky-anchors layout (avatar top-left + timeline bottom reemplaza dots HUD), y la orientación móvil (ambas soportadas, no overlay). Fuente canonica: `PROJECT.md` + `REQUIREMENTS.md`.

**Domain:** Scroll-driven multi-theme storytelling portfolio — Vue 3 + Phaser 3 (post-pivote: scroll vertical)
**Researched:** 2026-05-12
**Confidence:** HIGH (Vue/CSS patterns) | MEDIUM (Phaser-Vue boundary specifics) — horizontal-era research, vertical reframe vigente

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        index.html / #app                             │
├─────────────────────────────────────────────────────────────────────┤
│  App.vue                                                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  <OrientationGuard>  (portrait → overlay)                    │   │
│  │  <LangToggle>        (fixed, always visible)                 │   │
│  │  <ScrollShell>       (overflow-x: scroll, snap-type: x)      │   │
│  │  │                                                           │   │
│  │  │  <Chapter id="ch0" data-chapter="0">  [CSS only]         │   │
│  │  │  <Chapter id="ch1" data-chapter="1">  [CSS only]         │   │
│  │  │  <Chapter id="ch2" data-chapter="2">  [pixel art]        │   │
│  │  │  <Chapter id="ch3" data-chapter="3">  [pixel art] ★      │   │
│  │  │  <Chapter id="ch4" data-chapter="4">  [pixel art]        │   │
│  │  │  <Chapter id="ch5" data-chapter="5">  [pixel art]        │   │
│  │  │  <PhaserChapter id="ch6">             [Phaser scene]     │   │
│  │  └───────────────────────────────────────────────────────────┘   │
│  └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  Composables layer                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │  useScroll()    │  │  useI18n()      │  │  useChapter()    │    │
│  │  snap + active  │  │  locale ref     │  │  chapter config  │    │
│  │  chapter index  │  │  t() function   │  │  data per chap.  │    │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│  Static data layer                                                   │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │  chapters.js     │  │  locales/      │  │  public/assets/    │  │
│  │  (config array)  │  │  es.json       │  │  pixel art files   │  │
│  │                  │  │  en.json       │  │                    │  │
│  └──────────────────┘  └────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

★ = default landing chapter (ch3)
```

---

## Decision: Chapter Abstraction

**Recommendation: Single-page, no Vue Router.**

Each chapter is a full-viewport `<section>` rendered inside a single scrollable shell. No routes.

**Why not routes:**
- Vue Router navigation resets scroll position and triggers mount/unmount cycles — unwanted when the scroll IS the experience.
- URL hashes (`#ch3`) can be used for direct linking without needing a router.
- The snap scroll engine needs to own horizontal position; a router competing for navigation control creates conflicts.
- Seven chapters fit comfortably in one DOM tree; there is no performance argument for routing.

**Alternative considered — Vue Router with scroll-behavior:**
Vue Router's `scrollBehavior` can target hash anchors but it forces all state through the URL, complicates the Phaser chapter mount logic, and provides no benefit for a single-domain SPA with no auth or deep-linked sub-pages.

**Chapter abstraction:** A `chapters.js` config file provides a typed array that each `<Chapter>` component reads via index. Adding a chapter = adding one entry to the array + one component file. No routing table to update.

---

## Decision: Theme Isolation

**Recommendation: CSS custom properties scoped via `data-chapter` attribute + Vue `<style scoped>` for per-component structural CSS.**

Each chapter section carries `data-chapter="N"` on its root element. A global theme file maps `[data-chapter="N"]` selectors to CSS custom property overrides:

```css
/* src/styles/chapter-themes.css — imported once in main.js */

:root {
  --bg:        #0b0b16;
  --fg:        #e7e7f0;
  --accent:    #4ecca3;
  --font-body: ui-monospace, monospace;
  /* ... */
}

[data-chapter="0"] {
  --bg: #000800;
  --fg: #33ff33;
  --accent: #00ff00;
  --font-body: 'Courier New', monospace;
}

[data-chapter="1"] {
  --bg: #000066;
  --fg: #ffff00;
  --accent: #ff00ff;
  --font-body: 'Comic Sans MS', cursive;
}
/* ... chapters 2–6 ... */
```

Every chapter component uses `var(--bg)`, `var(--accent)` etc. in its scoped CSS. Because `data-chapter` scopes the override to that DOM subtree, themes never bleed across chapters even when two are visible simultaneously during a snap transition.

**Why not CSS Modules:** CSS Modules hash class names and are great for component isolation but do not provide the runtime-overridable cascade needed for theme switching without JavaScript touching every property. Custom properties are the correct primitive for this.

**Why not Shadow DOM:** Overkill. Shadow DOM complicates composables, event propagation, and Vue's scoped slot model. Not warranted for seven static sections.

**Vue `<style scoped>`** handles structural CSS per component (layout, spacing, pixel art positioning). Theme tokens come from the global cascade. These two layers do not interfere.

---

## Decision: Content Model

**Recommendation: Two flat JSON locale files + a `chapters.js` config. No Markdown.**

```
src/
├── data/
│   ├── chapters.js          ← chapter metadata (theme id, avatar, era, project ids)
│   └── projects.js          ← project entries with locale keys
└── locales/
    ├── es.json              ← all Spanish copy keyed by namespace
    └── en.json              ← all English copy keyed by namespace
```

**`chapters.js` shape:**
```js
export const CHAPTERS = [
  {
    id: 0,
    era: '1995',
    age: '~10',
    avatarSrc: '/assets/avatars/ch0-avatar.png',
    projectIds: [],          // no projects for ch0
    themeClass: 'theme-terminal',
  },
  // ... ch1–ch6
]
```

**Locale JSON structure (namespaced, flat within namespace):**
```json
{
  "nav": { "toggle_lang": "EN" },
  "ch0": {
    "heading": "Bienvenido al sistema.",
    "subheading": "Inicializando...",
    "bio": "Era 1995. El primer PC. BASIC en un cuaderno."
  },
  "ch3": {
    "heading": "Web 2.0 y diseño que brillaba.",
    "project_label": "Proyectos de esa era"
  }
}
```

**Why not Markdown per chapter per locale:** 14 Markdown files (7 chapters × 2 locales) means 14 import paths to wire, a Markdown parser in the bundle, and no structured access to individual fields like headings. JSON gives structured access and stays tree-shakeable. The copy per chapter is short (heading, subheading, bio blurb, 2–3 project entries) — Markdown adds weight with no benefit here.

**Why not inline copy in components:** Inline copy makes bilingual support a template maze of `v-if="locale === 'es'"`. JSON lookup with a `t('ch0.heading')` composable is clean and auditable.

---

## Decision: Asset Organization

**Recommended folder structure under `public/assets/`:**

```
public/
└── assets/
    ├── avatars/
    │   ├── ch0-avatar.png      ← bust, chapter 0 (CSS-era, low-fi)
    │   ├── ch1-avatar.png
    │   ├── ch2-avatar.png
    │   ├── ch3-avatar.png
    │   ├── ch4-avatar.png
    │   ├── ch5-avatar.png
    │   └── ch6-avatar.png
    ├── backgrounds/
    │   ├── ch2-bg.png
    │   ├── ch3-bg.png
    │   ├── ch4-bg-layer0.png   ← parallax layers named by depth
    │   ├── ch4-bg-layer1.png
    │   ├── ch4-bg-layer2.png
    │   ├── ch5-bg-layer0.png
    │   ├── ch5-bg-layer1.png
    │   ├── ch6-bg-layer0.png
    │   ├── ch6-bg-layer1.png
    │   └── ch6-bg-layer2.png
    ├── sprites/
    │   ├── ch4-ship.png
    │   ├── ch5-ship.png
    │   ├── ch6-ship.png
    │   ├── ch6-planet-01.png   ← each planet = one project
    │   ├── ch6-planet-02.png
    │   └── ch6-planet-03.png
    ├── fonts/
    │   └── pixel-font.png      ← if using pixel bitmap font
    └── ui/
        ├── ch2-button-frame.png
        └── ch3-badge-frame.png
```

**Naming convention: `ch{N}-{descriptor}[-{variant}].png`**

- Prefix by chapter so artist-creator and artist-editor know exactly which chapter is missing an asset.
- No locale suffix — assets are language-neutral. Only copy in JSON files is localised.
- `public/` (not `src/assets/`) because Phaser loads these by URL at runtime, not via Vite's module system. Vue chapters use `<img src="/assets/...">` with absolute paths — works in both dev and prod.

---

## Decision: i18n Implementation

**Recommendation: Custom `useLocale` composable with `provide/inject`. No external library.**

Two languages, static content, no pluralization, no date formatting. `vue-i18n` at 63 kB gzipped is unjustified overhead.

```js
// src/composables/useLocale.js
import { ref, provide, inject, computed } from 'vue'

const LOCALE_KEY = Symbol('locale')

export function provideLocale() {
  const locale = ref('en')
  const toggle = () => { locale.value = locale.value === 'en' ? 'es' : 'en' }

  // Load both bundles at startup — they are small
  const messages = {
    en: () => import('../locales/en.json'),
    es: () => import('../locales/es.json'),
  }

  const loaded = ref({ en: null, es: null })

  // Pre-load both
  Promise.all([
    messages.en().then(m => { loaded.value.en = m.default }),
    messages.es().then(m => { loaded.value.es = m.default }),
  ])

  const t = (key) => {
    const bundle = loaded.value[locale.value]
    if (!bundle) return key
    return key.split('.').reduce((obj, k) => obj?.[k], bundle) ?? key
  }

  provide(LOCALE_KEY, { locale, toggle, t })
  return { locale, toggle, t }
}

export function useLocale() {
  return inject(LOCALE_KEY)
}
```

Called once in `App.vue` with `provideLocale()`. Every chapter component calls `useLocale()`. Language change is instant (both bundles already loaded — total JSON weight is well under 20 KB).

**Phaser receives locale updates** via a shared reactive ref passed to the Phaser scene through the EventBus (see Phaser boundary section).

---

## Decision: Scroll/Snap Controller

**Recommendation: CSS `scroll-snap-type: x mandatory` on the shell + a `useScrollState` composable tracking active chapter via `IntersectionObserver`.**

No library needed. CSS handles the physics of snapping; JavaScript only observes which section is in view.

```css
/* ScrollShell component */
.scroll-shell {
  display: flex;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  height: 100dvh;
  width: 100vw;
}

.chapter-section {
  flex: 0 0 100vw;
  height: 100dvh;
  scroll-snap-align: start;
}
```

```js
// src/composables/useScrollState.js
import { ref, readonly } from 'vue'

const activeChapter = ref(3)  // default landing = ch3

export function useScrollState() {
  function initObserver(sectionEls) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            activeChapter.value = Number(entry.target.dataset.chapter)
          }
        }
      },
      { threshold: 0.5 }
    )
    sectionEls.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }

  function scrollTo(chapterIndex) {
    const el = document.getElementById(`ch${chapterIndex}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }

  return { activeChapter: readonly(activeChapter), initObserver, scrollTo }
}
```

`activeChapter` is module-level singleton (not Pinia). This project has no server-side rendering and no need for Pinia's devtools integration for a single integer. A Pinia store is overkill here and adds a dependency. If state complexity grows (e.g., per-chapter progress animations), promote to Pinia then.

**URL hash sync:** On `activeChapter` change, set `history.replaceState(null, '', '#ch' + activeChapter.value)`. On initial load, read the hash and scroll to it before mounting.

**Alternative: Pinia store for activeChapter.** Choose Pinia if the Phaser chapter needs to subscribe to chapter changes reactively without an EventBus, or if other composables start reading `activeChapter` frequently. The module-level ref pattern is simpler to start with and trivially refactorable.

---

## Decision: Phaser-Vue Boundary

**Recommendation: `<PhaserChapter>` is an isolated Vue component that creates and destroys its Phaser `Game` instance on `onMounted`/`onBeforeUnmount`. Communication via a shared EventBus ref.**

This is the most complex boundary in the project. Three concerns must be addressed:

1. **Mount/unmount lifecycle** — Phaser must start exactly once when ch6 enters the viewport and be fully destroyed when it leaves.
2. **Language changes** — When the user toggles EN/ES while inside ch6, the Phaser scene must update its UI sprites/text.
3. **Memory leaks** — Phaser is known to leak canvas pool entries and GL textures if `game.destroy()` is not called correctly.

### Component structure

```vue
<!-- src/chapters/PhaserChapter.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useLocale } from '../composables/useLocale'
import { useScrollState } from '../composables/useScrollState'

const { activeChapter } = useScrollState()
const { locale } = useLocale()

const containerRef = ref(null)
let game = null

async function mountPhaser() {
  // Lazy import — Phaser is only bundled/parsed when needed
  const { default: Phaser } = await import('phaser')
  const { SpaceScene } = await import('../phaser/SpaceScene.js')

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: containerRef.value,
    width: 480,
    height: 270,
    zoom: 3,
    scene: [SpaceScene],
    pixelArt: true,
    backgroundColor: '#0b0b16',
  })
}

function destroyPhaser() {
  if (!game) return
  // removeCanvas=true removes DOM element; noReturn=false keeps Phaser re-instantiable
  game.destroy(true, false)
  game = null
}

// Mount/unmount driven by activeChapter watcher, not component lifecycle
// (The component itself stays mounted so the section remains in the DOM for snap)
watch(activeChapter, (val) => {
  if (val === 6 && !game) mountPhaser()
  if (val !== 6 && game) destroyPhaser()
}, { immediate: true })

// Locale bridge: emit to Phaser via EventBus
watch(locale, (lang) => {
  game?.events.emit('locale-changed', lang)
})

// Guarantee cleanup if component truly unmounts
onBeforeUnmount(destroyPhaser)
</script>

<template>
  <section id="ch6" data-chapter="6" class="chapter-section phaser-chapter">
    <div ref="containerRef" class="phaser-container" />
  </section>
</template>
```

**Key decisions explained:**

- **`game.destroy(true, false)`** — `removeCanvas: true` removes the `<canvas>` from DOM; `noReturn: false` keeps Phaser re-instantiable if the user scrolls back to ch6. Never use `noReturn: true` in a SPA context.
- **Lazy dynamic `import()`** — Phaser is ~1 MB. Dynamic import means it is not in the initial bundle. The browser parses Phaser only when `activeChapter` first becomes `6`.
- **Component stays mounted** — `<PhaserChapter>` never unmounts from the Vue tree (it would disrupt scroll snap). Only the Phaser `Game` instance is created/destroyed.
- **EventBus for locale** — `game.events` is Phaser's own global EventEmitter. Emitting on it is lighter than a shared Pinia store and avoids making Phaser code depend on Vue reactivity.

### Phaser-to-Vue communication (if needed)

For ch6 planet-project cards (clicking a planet → show project detail in Vue overlay):

```js
// Inside SpaceScene.js
this.events.on('planet-clicked', (projectId) => {
  this.game.events.emit('vue:show-project', projectId)
})
```

```js
// In PhaserChapter.vue, after mountPhaser():
game.events.on('vue:show-project', (id) => {
  emit('show-project', id)  // bubbles up to App.vue
})
```

This keeps the Phaser scene unaware of Vue component hierarchy while allowing clean upward communication.

---

## Component Boundaries

| Component | File | Owns | Does Not Own |
|-----------|------|------|--------------|
| `App.vue` | `src/App.vue` | Root shell, `provideLocale()`, `provideScrollState()`, orientation guard, lang toggle | Chapter content, Phaser |
| `ScrollShell.vue` | `src/components/ScrollShell.vue` | `overflow-x` scroll container, snap CSS, `initObserver()` call | Active chapter logic (reads from composable) |
| `Chapter.vue` | `src/chapters/Chapter.vue` | Generic chapter section wrapper, applies `data-chapter`, renders avatar + copy + projects | Theme colors (from CSS cascade), Phaser |
| `PhaserChapter.vue` | `src/chapters/PhaserChapter.vue` | Phaser Game lifecycle, canvas container, locale bridge | Vue chapter layout (handled by parent Chapter) |
| `LangToggle.vue` | `src/components/LangToggle.vue` | Toggle button UI, calls `toggle()` from `useLocale()` | Locale state (owned by composable) |
| `OrientationGuard.vue` | `src/components/OrientationGuard.vue` | Portrait-mode overlay | Nothing else |
| `useScrollState.js` | `src/composables/useScrollState.js` | `activeChapter` ref, IntersectionObserver, `scrollTo()` | Locale, content data |
| `useLocale.js` | `src/composables/useLocale.js` | `locale` ref, `toggle()`, `t()` translation function | Scroll state, Phaser |
| `chapters.js` | `src/data/chapters.js` | Chapter config array (id, era, avatar, theme, project ids) | Runtime state |

---

## Data Flow

```
User scrolls horizontally
        ↓
IntersectionObserver (in useScrollState)
        ↓
activeChapter.value = N   ←────────────────────────────┐
        ↓                                               │
  Chapter.vue reads activeChapter                       │
  (applies visual emphasis to active chapter)           │
        ↓                                               │
  PhaserChapter watches activeChapter                   │
  → N===6: mountPhaser()                                │
  → N!==6: destroyPhaser()                              │
                                                        │
User clicks LangToggle                                  │
        ↓                                               │
locale.value flips ('en' ↔ 'es')                        │
        ↓                                               │
  All Chapter.vue components re-render via t()          │
  PhaserChapter watcher emits 'locale-changed' to game  │
        ↓                                               │
SpaceScene listens 'locale-changed' → updates UI text   │
        ↓                                               │
Planet clicked in SpaceScene                            │
        ↓                                               │
game.events.emit('vue:show-project', id)                │
        ↓                                               │
PhaserChapter emits 'show-project' to App.vue           │
        ↓                                               │
App.vue shows project detail overlay                    │
        ↓                                               │
User scrolls back ──────────────────────────────────────┘
```

---

## Recommended Project Structure

```
src/
├── main.js                       ← createApp, mount
├── App.vue                       ← root: provideLocale, provideScrollState, layout
├── styles/
│   ├── reset.css                 ← minimal reset (margins, box-sizing)
│   ├── chapter-themes.css        ← [data-chapter="N"] custom property overrides
│   └── pixel-art.css             ← image-rendering rules (already in index.html, move here)
├── data/
│   ├── chapters.js               ← chapter config array
│   └── projects.js               ← project entries
├── locales/
│   ├── en.json
│   └── es.json
├── composables/
│   ├── useScrollState.js         ← activeChapter, initObserver, scrollTo
│   └── useLocale.js              ← locale, toggle, t()
├── components/
│   ├── ScrollShell.vue           ← horizontal scroll container + snap CSS
│   ├── LangToggle.vue            ← ES/EN button
│   └── OrientationGuard.vue      ← portrait overlay
├── chapters/
│   ├── Chapter.vue               ← generic chapter wrapper (used by ch0–ch5)
│   ├── ChapterTerminal.vue       ← ch0 — specialized terminal effect
│   ├── ChapterHTML90s.vue        ← ch1 — specialized marquee/table aesthetic
│   ├── PhaserChapter.vue         ← ch6 — Phaser lifecycle
│   └── sections/
│       ├── AvatarBust.vue        ← avatar image with per-chapter src
│       ├── EraHeading.vue        ← era title + year badge
│       ├── BioCopy.vue           ← bio blurb (reads from t())
│       └── ProjectGrid.vue       ← era projects
└── phaser/
    ├── SpaceScene.js             ← main Phaser Scene class
    ├── entities/
    │   ├── Ship.js               ← ship sprite + parallax movement
    │   └── Planet.js             ← planet sprite + click handler
    └── EventBus.js               ← optional: dedicated emitter if game.events is insufficient
```

**Structure rationale:**

- **`chapters/` separate from `components/`:** Chapters are page-level "views"; generic UI pieces are components. The distinction makes it clear what scales with chapter count vs what is shared.
- **`phaser/` is self-contained:** Nothing outside `PhaserChapter.vue` imports from `phaser/`. If Phaser is ever replaced, only one boundary file changes.
- **`data/` is pure config:** No Vue imports. The artist-creator agent can look at `chapters.js` to know exactly which assets are needed.
- **`styles/chapter-themes.css` is the single theme truth:** One file to edit when a chapter's palette changes. No hunting through component files.

---

## Architectural Patterns

### Pattern 1: Scroll-as-Navigation (no Router)

**What:** The horizontal scroll position IS the navigation. URL hash reflects position but does not drive it. There is no `<router-view>`.

**When to use:** Experiential single-page sites where the journey IS the product. Routes add overhead with no benefit.

**Trade-offs:** Deep links require hash parsing on load. No browser Back button chapter navigation (horizontal scroll is already "back"). Both are acceptable for this use case.

### Pattern 2: CSS Custom Properties Cascade for Themes

**What:** A single `[data-chapter="N"]` selector block overrides all theme tokens for that section's subtree. Components use `var(--token)` and are theme-agnostic.

**When to use:** When themes are visually radical (terminal green vs. comic sans vs. space UI) and share the same component structure.

**Trade-offs:** Tokens must be declared consistently across all themes or fallback to root defaults. Discipline required. No TypeScript safety on token names — a typo silently falls back to root. Consider a token comment header listing all canonical token names.

### Pattern 3: Phaser-as-Island

**What:** Phaser is an isolated island in the Vue tree. It is created/destroyed by a single wrapper component. All communication crosses a narrow event bridge. Vue does not reach into Phaser internals; Phaser does not import Vue.

**When to use:** Any time a non-Vue rendering engine (Phaser, Three.js, PixiJS) is embedded in a Vue app.

**Trade-offs:** The event bridge requires discipline. If bridge events grow complex, introduce a typed EventBus module (`phaser/EventBus.js`) with documented event names as string constants.

---

## Anti-Patterns

### Anti-Pattern 1: Vue Router for Chapter Navigation

**What people do:** Wire each chapter as a named route, use `<router-view>` for the scroll container.

**Why it's wrong:** Router mounts/unmounts chapters on navigation. Chapter CSS, mounted Phaser scenes, and running animations are destroyed and recreated on every chapter visit. The scroll position is controlled by the router's `scrollBehavior`, which conflicts with CSS `scroll-snap`. The result is jank and complexity.

**Do this instead:** Single page, all chapters in DOM, CSS snap controls position.

### Anti-Pattern 2: Leaving Phaser Running While Scrolled Away

**What people do:** Mount Phaser when the component mounts, never destroy it, rely on `visibility: hidden`.

**Why it's wrong:** Phaser's render loop runs at 60 fps regardless of visibility. The canvas pool accumulates unbounded references. On mobile, battery and GPU memory drain is significant.

**Do this instead:** `watch(activeChapter)` → destroy when leaving ch6, create when entering ch6. Use `game.destroy(true, false)`.

### Anti-Pattern 3: Storing Copy Inline in Chapter Templates

**What people do:** Hardcode bilingual strings with `v-if="locale === 'es'"` in templates.

**Why it's wrong:** Every string appears twice in the template. Adding a third language requires template surgery across seven files. Copy review/editing means opening Vue files.

**Do this instead:** All copy in `locales/en.json` and `locales/es.json`. Components call `t('ch3.heading')`.

### Anti-Pattern 4: Serving Pixel Art via Vite Module Imports

**What people do:** `import bgImage from '../assets/ch4-bg.png'` in Vue components.

**Why it's wrong:** Vite processes imported images through its asset pipeline (hashing filenames). Phaser loads assets by URL string at runtime — it cannot use hashed module imports. This means maintaining two asset systems.

**Do this instead:** All pixel art in `public/assets/`. Phaser and Vue both reference absolute paths like `/assets/backgrounds/ch4-bg.png`. Vite copies `public/` to `dist/` as-is.

---

## Integration Points

### External Boundaries

| Boundary | Integration Pattern | Notes |
|----------|---------------------|-------|
| Vue → Phaser | `game.events.emit(eventName, payload)` | Phaser's own EventEmitter; no Vue reactivity needed on Phaser side |
| Phaser → Vue | `game.events.on(eventName)` → component `emit()` | Keep Phaser-side event names in a constants file |
| Locale JSON → Components | Dynamic `import()` in `useLocale.js`, pre-loaded both bundles at startup | Both bundles small; pre-load avoids locale-toggle flash |
| pixelforge-mcp assets → Vue/Phaser | File drop into `public/assets/`, paths referenced by convention | No Vite processing; path convention documented in `chapters.js` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `ScrollShell` ↔ `useScrollState` | Composable provides `initObserver()`; component calls it `onMounted` | Single observer, single source of truth for `activeChapter` |
| `App.vue` ↔ `Chapter` | Props: `chapterIndex`, `isActive`; reads locale via `useLocale()` | No direct parent→child data injection; composable provides shared state |
| `PhaserChapter` ↔ `SpaceScene` | Phaser `scene.events` + `game.events` | SpaceScene.js must not import anything from `src/` outside `phaser/` |

---

## Build Order (Suggested Phase Sequence)

The architecture's dependency graph dictates a clear build order:

1. **Scroll infrastructure** — `ScrollShell.vue`, `useScrollState.js`, `OrientationGuard.vue`, 7 empty placeholder sections. Validate snap physics and default-to-ch3 landing before any content exists.

2. **Theme system** — `chapter-themes.css` with all 7 `[data-chapter]` blocks (even if using placeholder colors). Validate that no theme leaks into adjacent chapters during snap transitions.

3. **i18n infrastructure** — `useLocale.js`, both JSON files with skeleton keys, `LangToggle.vue`. Validate toggle works before filling copy.

4. **Chapter 3 end-to-end** (first real chapter) — `Chapter.vue` generic wrapper, `AvatarBust.vue`, `BioCopy.vue`, `ProjectGrid.vue`, real content in JSON, real avatar asset. This is the default landing; it must be polished.

5. **Chapters 0–2 and 4–5** — Fill in remaining five Vue chapters. Chapters 0–1 are CSS-only (fastest). Chapters 2, 4–5 need pixel art assets; these can be built in parallel by artist agents.

6. **Phaser chapter 6** — `PhaserChapter.vue`, `SpaceScene.js`, `Ship.js`, `Planet.js`. Build last because it is the most complex, has the highest asset dependency, and every other piece of the site is already working when this lands.

7. **Polish** — Parallax tuning, transition animations between chapters, mobile scroll tweaks, accessibility aria-labels, Firebase deploy.

**Dependency rule:** Steps 1–3 are serial (each provides infrastructure the next needs). Steps 4–5 can proceed in parallel once step 3 is done. Step 6 is independent of steps 4–5 and can start when steps 1–3 are done.

---

## Sources

- Phaser 3 Game.destroy() API: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/game/ (HIGH confidence)
- Vue 3 SFC CSS Features (scoped, modules, v-bind): https://vuejs.org/api/sfc-css-features.html (HIGH confidence)
- Vue 3 Async Components: https://vuejs.org/guide/components/async (HIGH confidence)
- Vue 3 Composables: https://vuejs.org/guide/reusability/composables (HIGH confidence)
- CSS Scroll Snap MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_snap (HIGH confidence)
- vue-phaser3 integration pattern: https://github.com/Sun0fABeach/vue-phaser3 (MEDIUM — repo reviewed, communication pattern confirmed)
- VueUse useIntersectionObserver: https://vueuse.org/core/useintersectionobserver/ (HIGH confidence)
- Scroll-driven portfolio architecture lessons: https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/ (MEDIUM — Three.js project, pattern extrapolated to Vue/Phaser context)
- i18n lightweight alternatives: https://github.com/leanera/vue-i18n (MEDIUM)
- CSS Custom Properties for theming: https://css-tricks.com/css-custom-properties-theming/ (HIGH confidence)

---

*Architecture research for: mato-new-portfolio — scroll-driven multi-theme portfolio with Phaser island*
*Researched: 2026-05-12*
