# Stack Research

> ⚠ **SUPERSEDED 2026-05-12** — Pivote a **scroll vertical**. Recomendaciones específicas de horizontal pinning (GSAP ScrollTrigger horizontal pinned track, Lenis para inertia horizontal, Locomotive Scroll, Swiper.js) están **obsoletas**: vertical scroll nativo + CSS `scroll-snap-type: y mandatory` no necesita esa maquinaria. Sigue vigente: Vue 3 + Vite 5 + Phaser 3.86 + vue-i18n + IntersectionObserver tracking pattern; recomendaciones contra Vue Router, Pinia, Locomotive Scroll. Fuente canonica: `PROJECT.md` + `REQUIREMENTS.md`.

**Domain:** ~~Horizontal-snap~~ Vertical-snap portfolio with per-chapter CSS theme switching, sticky avatar + sticky timeline, Phaser embed, and i18n
**Researched:** 2026-05-12
**Confidence:** HIGH (horizontal-era research — stack recommendations reframed to vertical post-2026-05-12)

---

## Context: What the Scaffold Already Locks In

The following are closed decisions — do not re-evaluate these, only build on them:

| Locked | Version | Source |
|--------|---------|--------|
| Vue 3 (Composition API) | ^3.4.0 (package.json) | Closed decision |
| Vite | ^5.4.0 (package.json) | Closed decision |
| Phaser | ^3.86.0 (package.json) | Closed decision, Chapter 6 only |
| pixelforge-mcp | latest | Art generation, not a build dep |
| Firebase Hosting | — | Eventual deploy target, not a dev dep |

Everything below fits within these constraints.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **GSAP** | 3.15.0 | Horizontal scroll orchestration, chapter entry/exit animations, per-chapter `data-chapter` attribute switching | 100% free since April 2025 (Webflow acquisition, all plugins included). Best-in-class for pinned horizontal section scroll with `scrub` + `snap`. Documented Vue 3 integration via `onMounted`. Framework-agnostic, works perfectly alongside Phaser without conflicts. |
| **GSAP ScrollTrigger** | bundled with gsap 3.15 | Horizontal snap-by-section; triggers chapter attribute updates; controls parallax depth per chapter | The canonical tool for scroll-linked pinning. `pin: true` + `scrub: 1` + `snap: 1/(n-1)` produces the snap-by-section behavior needed. Now free — no license friction. |
| **vue-i18n** | 11.4.2 | ES/EN toggle with persistence | The de-facto standard for Vue 3 i18n. v11 dropped Legacy API, Composition API is the only mode. Toggle + `localStorage` persistence is a one-liner pattern. |
| **@vueuse/core** | 14.3.0 | Orientation detection composable (`useScreenOrientation`) | VueUse 14 requires Vue 3.5+; check scaffold's installed Vue version. `useScreenOrientation` wraps the Screen Orientation API reactively. Used specifically for the portrait-lock overlay — no standalone library needed for this single use case. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **lenis** | 1.3.23 | Optional smooth momentum feel on the horizontal scroll wrapper | Use only if the native GSAP-driven scroll feels too mechanical on touch devices. Lenis + GSAP is a documented combo; Lenis handles inertia, ScrollTrigger handles snap. NOTE: Lenis does NOT support CSS scroll-snap directly — use `lenis/snap` module or rely on GSAP snap entirely. Start without it; add if scroll feel is poor on trackpad/mobile. |
| **firebase-tools** | latest (CLI, not a dep) | Firebase Hosting deploy | Install globally: `npm i -g firebase-tools`. Not a project dep. Needed only at deploy time. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vite** | Build tool, HMR | Already in scaffold. `npm run dev` → `http://127.0.0.1:5173/`. No extra config needed for this stack. |
| **firebase-tools CLI** | Deploy to Firebase Hosting | Global install. Needs `firebase.json` with `"public": "dist"` and SPA rewrite rule. |

---

## Answers to Each Stack Question

### 1. Scroll/Snap Library — VERDICT: GSAP ScrollTrigger (with optional Lenis layer)

**Recommendation: GSAP ScrollTrigger 3.15 as the primary scroll engine.**

The three candidates compared:

| Option | Snap quality | Mobile touch | Vue 3 DX | Conflict with Phaser | Cost |
|--------|-------------|--------------|----------|----------------------|------|
| **GSAP ScrollTrigger** | Excellent (JS-controlled, configurable easing) | Good, known caveats (see Pitfalls) | Clean `onMounted` pattern, documented | None — Phaser owns its own canvas, ScrollTrigger owns the page scroll | Free (since April 2025) |
| CSS scroll-snap | Native, minimal code | Excellent (browser-native) | Trivial | None | Free |
| Lenis alone | Good (uses `lenis/snap` module) | Good | Needs `vue-lenis` wrapper | None | Free |

**Why GSAP over native CSS scroll-snap for this project:**

This portfolio has 7 chapters with _radically different visual styles_ and needs per-chapter entry/exit animation triggers (to fire `data-chapter` attribute updates that swap CSS themes). CSS scroll-snap provides snapping but gives you no hooks to fire code "when chapter 3 becomes active." GSAP ScrollTrigger's `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` callbacks are the right primitive for this.

The pattern: one `ScrollTrigger` per chapter, horizontal pinned track, `snap: 1/(sections.length-1)`, callbacks update `document.documentElement.dataset.chapter = '3'` which CSS variables respond to.

**Mobile caveat (HIGH confidence — verified in GSAP community forums 2024-2025):** GSAP horizontal pinning on mobile touchscreens has documented roughness — the ScrollSmoother+snap combo can feel laggy waiting for smooth-scroll physics to complete. Since this project's mobile target is landscape-only, and the portrait overlay blocks most casual mobile portrait usage, this is a manageable risk. Mitigation: keep `scrub` value tight (0.3–0.5, not 1), disable ScrollSmoother on mobile, test on real devices early.

**CSS scroll-snap as alternative:** Valid if you want zero JS scroll dependency. Loses per-chapter animation triggers. Would require a separate IntersectionObserver for chapter detection. More maintenance surface, less animation power. Appropriate only if GSAP performance on mobile proves unacceptable.

---

### 2. Theme Switching — VERDICT: `data-chapter` attribute on `:root` + CSS custom properties per chapter

**Pattern:**

```css
/* Base variables */
:root {
  --bg: #000;
  --text: #fff;
  --font-body: 'Inter', sans-serif;
  /* ... */
}

/* Chapter 0: Terminal */
:root[data-chapter="0"] {
  --bg: #0d0d0d;
  --text: #00ff00;
  --font-body: 'Courier New', monospace;
  /* full override */
}

/* Chapter 1: 90s HTML */
:root[data-chapter="1"] {
  --bg: #000080;
  --text: #ffffff;
  --font-body: 'Comic Sans MS', cursive;
  /* full override */
}
/* etc for all 7 chapters */
```

```javascript
// GSAP ScrollTrigger callback (in Vue onMounted)
ScrollTrigger.create({
  trigger: chapterEl,
  onEnter: () => document.documentElement.dataset.chapter = '3',
  onEnterBack: () => document.documentElement.dataset.chapter = '3',
})
```

**Why this over alternatives:**

| Approach | Verdict |
|----------|---------|
| `data-chapter` on `:root` + CSS custom properties | **USE THIS.** Zero runtime JS for styling. CSS handles all visual differences. Transitions between chapters are a `transition: all 0.4s ease` on root, or per-property. Works with scoped Vue styles too (via `:root[data-chapter="2"] .chapter-title { ... }`). |
| Tailwind per-chapter config | Overkill, generates bloat, requires separate config objects. Tailwind shines for component-level utility styling; theme-at-root-level is better served by native CSS variables. |
| Scoped CSS per Vue component | Chapters are sections, not components with isolated state — scoped CSS fights this model. Components _within_ chapters should use scoped CSS, but the chapter theme itself belongs at root level. |
| CSS-in-JS / dynamic style injection | Adds runtime cost, no benefit over data-attribute + variables. |

**Add `transition` carefully:** Each CSS custom property can transition individually. For chapter switches that should be instantaneous (terminal → 90s HTML), use `transition: none`; for smooth chapters (modern → Phaser), use `transition: background-color 0.5s ease`.

---

### 3. Phaser-in-Vue Embedding — VERDICT: Official template pattern (`PhaserGame.vue` bridge component)

**Pattern (from official Phaser + Vue 3 template, February 2024):**

```javascript
// PhaserChapter.vue (Chapter 6 component)
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Phaser from 'phaser'
import { MainScene } from './scenes/MainScene.js'
import EventBus from './EventBus.js'

const gameRef = ref(null)
const containerRef = ref(null)  // <div ref="containerRef"> in template

onMounted(() => {
  const config = {
    type: Phaser.AUTO,
    parent: containerRef.value,        // attach to Vue-managed div
    width: containerRef.value.offsetWidth,
    height: containerRef.value.offsetHeight,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MainScene],
  }
  gameRef.value = new Phaser.Game(config)
  EventBus.emit('phaser-ready', gameRef.value)
})

onBeforeUnmount(() => {
  if (gameRef.value) {
    gameRef.value.destroy(true)   // true = destroys the canvas DOM element
    gameRef.value = null
  }
})
```

**Key rules for this project:**

1. **`parent: containerRef.value`** — Always attach to the Vue-managed div, never to `document.body`. Gives you full control of sizing and avoids canvas orphans on chapter navigation.
2. **`game.destroy(true)` in `onBeforeUnmount`** — The `true` parameter removes the canvas from DOM. This prevents Phaser's WebGL context from leaking when the chapter is scrolled away. CRITICAL: use `onBeforeUnmount`, not `onUnmounted` — the DOM is still accessible in `onBeforeUnmount`.
3. **Sizing:** For this project, Chapter 6 is one of 7 horizontal sections at 100vw × 100vh. `Phaser.Scale.FIT` with `autoCenter: CENTER_BOTH` handles resize. The virtual resolution is 480×270 with ×3 zoom (as locked in CLAUDE.md) — configure this in Phaser config, not in the container div.
4. **EventBus:** Keep a simple `EventBus.js` (mitt or plain Vue's `createEmitter`) for Phaser→Vue communication (e.g., "planet clicked" → Vue shows project modal). Do NOT expose Vue reactive state directly into Phaser scenes — use `toRaw()` when passing Vue refs into Phaser.
5. **Only mount Phaser when chapter 6 is visible** — Use a Vue `v-if` on the `PhaserChapter.vue` component controlled by a `currentChapter === 6` flag. This avoids initializing Phaser's WebGL context on page load.

---

### 4. i18n — VERDICT: vue-i18n v11 in Composition API mode

**Install:** `npm install vue-i18n@11`

**Setup pattern:**

```javascript
// src/i18n.js
import { createI18n } from 'vue-i18n'

const messages = {
  en: { nav: { about: 'About', contact: 'Contact' } },
  es: { nav: { about: 'Sobre mí', contact: 'Contacto' } },
}

export const i18n = createI18n({
  legacy: false,          // MUST be false — Legacy API is deprecated in v11
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  messages,
})
```

```javascript
// Toggle component
import { useI18n } from 'vue-i18n'
const { locale } = useI18n()
const toggle = () => {
  locale.value = locale.value === 'en' ? 'es' : 'en'
  localStorage.setItem('lang', locale.value)
}
```

**Key facts (HIGH confidence — verified against official vue-i18n docs and npm):**
- v11.4.2 is current (published ~5 days ago as of research date)
- `legacy: false` is mandatory for Vue 3 Composition API — Legacy API is deprecated in v11 and will be removed in v12
- `localStorage` persistence is the standard pattern — no router or plugin needed
- The `v-t` directive is deprecated in v11; use `t()` function or `<i18n-t>` component
- No alternatives worth considering for Vue 3: `vue-next-i18n` is a dead micro-lib, Fluent.js is overkill for a two-language toggle

---

### 5. Firebase Hosting — VERDICT: Straightforward, one config file

**What you need to know:**

```json
// firebase.json — the only non-trivial configuration
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**The SPA rewrite rule is mandatory.** Without it, direct-linking to any URL other than `/` returns a 404 from Firebase's CDN (it looks for a real file, finds nothing). With it, all requests fall through to `index.html` and Vue Router handles them.

**Deploy steps (deferred, but document now):**

```powershell
# One-time global install (do this when ready to deploy)
npm install -g firebase-tools
firebase login
firebase init hosting   # select "dist", answer "yes" to SPA question → auto-generates firebase.json

# Every deploy
npm run build           # outputs to dist/
firebase deploy         # uploads dist/ to CDN
```

**Nothing tricky for Vite SPAs.** Firebase Hosting is well-documented with Vite. `vite.config.js` already outputs to `dist/` by default. The `firebase init` wizard's "SPA?" prompt auto-adds the rewrite rule.

**One gotcha:** `firebase init` may overwrite an existing `firebase.json`. Run it once, then manage the file manually.

---

### 6. Mobile Landscape Detection — VERDICT: `@vueuse/core` `useScreenOrientation` + CSS media query fallback

**Two-layer approach:**

**Layer 1 — CSS (instant, no JS flicker):**
```css
/* Show overlay when in portrait */
.rotate-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
  /* ... styling */
}

@media (orientation: portrait) and (max-width: 1024px) {
  .rotate-overlay { display: flex; }
}
```

**Layer 2 — Vue composable (reactive, for JS-driven logic):**
```javascript
import { useScreenOrientation } from '@vueuse/core'

const { orientation } = useScreenOrientation()
const isPortrait = computed(() =>
  orientation.value?.includes('portrait') ?? false
)
```

**Why two layers:** The CSS media query fires synchronously before JS hydration — prevents any flash of portrait content. The Vue composable is needed if you want to pause Phaser, stop GSAP animations, or fire analytics on orientation change.

**Known limitation (MEDIUM confidence — open GitHub issue #4220 on vueuse):** `useScreenOrientation` returns incorrect values on some iOS devices (Safari-specific bug in the Screen Orientation API). The CSS media query is unaffected by this bug. Use CSS as the source of truth for the overlay visibility; use the composable only for supplementary JS logic.

**`@vueuse/core` version requirement:** v14.3.0 requires Vue 3.5+. The scaffold currently pins `vue ^3.4.0`. Check if Vue is actually at 3.5+ in `node_modules`. If not, either upgrade Vue (non-breaking for this project) or use `@vueuse/core@10.x` (older, Vue 3.4 compatible).

---

## Installation

```powershell
# Core new dependencies (scaffold already has vue, vite, phaser)
npm install gsap
npm install vue-i18n@11
npm install @vueuse/core

# Optional — add only if scroll feel needs smoothing on trackpad/mobile
npm install lenis

# Dev only
# (no new dev deps required — vite already handles everything)
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| GSAP ScrollTrigger | Native CSS scroll-snap | Use if GSAP performance on mobile is unacceptable after testing. Requires separate IntersectionObserver for chapter detection callbacks. Simpler but less powerful. |
| GSAP ScrollTrigger | Locomotive Scroll | **Do NOT use.** Locomotive Scroll v4/v5 has known conflicts with Phaser's canvas pointer events. It intercepts all scroll/wheel events globally, interfering with Phaser's input system in Chapter 6. |
| `data-chapter` on `:root` | Tailwind dark-mode / multi-theme | Tailwind's `@theme` / `data-theme` pattern works, but Tailwind adds ~200KB (even purged) and the per-chapter theming here is rich enough to warrant raw CSS variables. No utility-class benefit that offsets the complexity. |
| vue-i18n v11 | i18next-vue | i18next-vue is React-first, Vue wrapper is thin. vue-i18n is the Vue-native solution, better Vue devtools integration, no reason to deviate. |
| @vueuse/core useScreenOrientation | Manual `window.screen.orientation` listener | Functionally equivalent, but @vueuse is already worth installing for other composables (`useEventListener`, `useResizeObserver` for Phaser resize). No cost to use it. |
| GSAP (free) | Pay-for animation alternatives | N/A — GSAP is free and best-in-class. No reason to look elsewhere. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Locomotive Scroll** | Intercepts all wheel/pointer events globally. Breaks Phaser input in Chapter 6. Also struggles with horizontal-first layouts. | GSAP ScrollTrigger (scroll driver) + optional Lenis (inertia only, doesn't hijack pointer events the same way) |
| **Swiper.js** | Built for carousels/sliders, not for driving chapter-level CSS theme transitions or complex per-section animations. Heavy (60KB+) for what is essentially a horizontal page layout. | GSAP ScrollTrigger |
| **vue-i18n Legacy API mode** | Deprecated in v11, removed in v12. Will break on next major upgrade. | `createI18n({ legacy: false })` |
| **vue-i18n v-t directive** | Deprecated in v11, no IDE key-completion support. | `t()` function from `useI18n()` |
| **`@gsap/vue` package** | This package is `@gsap/react` incorrectly named — it doesn't exist as an official Vue wrapper. GSAP is framework-agnostic; use it directly in `onMounted`. | GSAP directly |
| **Phaser on `document.body`** | Canvas orphans on Vue component unmount; sizing fights with Vue's layout. | `parent: containerRef.value` in Phaser config |
| **Mounting Phaser at app init** | Initializes WebGL context and loads all Chapter 6 assets on page load, degrading Chapter 3 (default landing) performance. | `v-if` the Phaser component, only mount when `currentChapter === 6` |
| **`game.destroy(false)`** | Leaves the `<canvas>` in the DOM as an orphan. | `game.destroy(true)` to remove canvas |

---

## Stack Patterns by Variant

**For the scroll engine (horizontal chapters):**
- Use GSAP `gsap.to(track, { xPercent: -100*(n-1), ease:'none', scrollTrigger: { pin: true, scrub: 0.4, snap: 1/(n-1) } })`
- The `track` is a flex container holding all 7 chapter divs at `min-width: 100vw` each
- One master ScrollTrigger; per-chapter attribute updates via `onEnter`/`onEnterBack` callbacks

**For Chapter 6 Phaser scene:**
- Wrap in `<PhaserChapter v-if="currentChapter === 6" />`
- Phaser config: `scale.mode: Phaser.Scale.FIT`, `scale.parent: containerRef.value`
- `game.destroy(true)` in `onBeforeUnmount`

**For i18n persistence:**
- Initialize locale from `localStorage.getItem('lang') || 'en'`
- On toggle: update `locale.value` AND `localStorage.setItem('lang', locale.value)`
- Locale state survives chapter navigation automatically (it's global app state)

**For orientation overlay:**
- CSS `@media (orientation: portrait) and (max-width: 1024px)` for overlay visibility (instant, no-JS)
- Vue `useScreenOrientation` for JS-side reactions (pause Phaser animations when portrait)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| gsap@3.15.0 | Vue 3.x, Vite 5.x, Phaser 3.86 | No conflicts. GSAP is framework-agnostic. |
| vue-i18n@11.4.2 | Vue ^3.2 | Legacy API removed — `legacy: false` is required. |
| @vueuse/core@14.3.0 | Vue ^3.5 | If scaffold's Vue is at 3.4.x, either upgrade Vue or pin @vueuse/core@10.x |
| lenis@1.3.23 | Vue 3.x, GSAP 3.x | No conflicts. Use `lenis/snap` module for snapping (CSS scroll-snap not supported). |
| Phaser@3.86.0 | Vue 3.x, Vite 5.x | No ESM issues with Vite. Keep `ssr: false` if SSR ever considered. |

---

## Sources

- GSAP npm: `gsap@3.15.0` published ~22 days before research date. Confirmed 100% free since April 30, 2025. Source: [Webflow Blog — GSAP becomes free](https://webflow.com/blog/gsap-becomes-free), [GSAP pricing](https://gsap.com/pricing/)
- GSAP ScrollTrigger horizontal snap: [Official CodePen — Horizontal snapping sections](https://codepen.io/GreenSock/pen/YzygYvM), [GSAP Docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- GSAP mobile horizontal issues (HIGH confidence — community verified): [GSAP forum — Horizontal ScrollTrigger in Mobile](https://gsap.com/community/forums/topic/44040-horizontal-scrolltrigger-in-mobile/)
- GSAP + data-attribute switching: [GSAP forum — Switching between dataset attribute using ScrollTrigger](https://gsap.com/community/forums/topic/42736-switching-between-dataset-attribute-using-scrolltrigger/)
- Phaser + Vue 3 official template: [Phaser.io news — Official Phaser 3 and Vue 3 Template](https://phaser.io/news/2024/02/official-phaser-3-and-vue-3-template), [GitHub phaserjs/template-vue](https://github.com/phaserjs/template-vue)
- Phaser ScaleManager: Context7 `/websites/phaser_io_phaser` — confirmed `scale.mode`, `scale.parent`, `scale.autoCenter` API
- vue-i18n: `vue-i18n@11.4.2` latest as of research date. [Vue I18n — Breaking Changes v10](https://vue-i18n.intlify.dev/guide/migration/breaking10), [Composition API guide](https://vue-i18n.intlify.dev/guide/advanced/composition)
- @vueuse/core: `@vueuse/core@14.3.0` latest. [useScreenOrientation docs](https://vueuse.org/core/usescreenorientation/). iOS bug: [GitHub issue #4220](https://github.com/vueuse/vueuse/issues/4220)
- Lenis: `lenis@1.3.23`. [GitHub darkroomengineering/lenis](https://github.com/darkroomengineering/lenis). CSS scroll-snap not supported natively — use `lenis/snap`.
- Firebase Hosting SPA config: [Firebase Hosting full config](https://firebase.google.com/docs/hosting/full-config), [Vite static deploy guide](https://vite.dev/guide/static-deploy)
- CSS scroll-snap browser support: [MDN — scroll-snap-type](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type), [caniuse](https://caniuse.com/css-snappoints)

---
*Stack research for: Horizontal-snap portfolio with per-chapter CSS theme switching, Vue 3 + Vite + Phaser 3.86*
*Researched: 2026-05-12*
