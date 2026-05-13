# Project Research Summary

**Project:** mato-new-portfolio
**Domain:** Horizontal scroll-snap storytelling portfolio — 7 chapters, multi-theme, Phaser island, bilingual
**Researched:** 2026-05-12
**Confidence:** HIGH

---

## Headline TL;DR

- **Stack consensus:** Vue 3 + GSAP ScrollTrigger + CSS `data-chapter` theming + vue-i18n v11 (`legacy: false`). Phaser 3.86 lazy-loaded for chapter 6 only. No Pinia, no Vue Router. Firebase Hosting at deploy time.
- **Build-order consensus:** Infrastructure first (scroll shell, theme system, i18n), then chapter 3 end-to-end as polished default landing, then chapters 0-2 and 4-5 in parallel, then Phaser chapter 6 last. Do not touch Phaser until every other chapter is stable.
- **Top critical risk:** iOS Safari WebKit bug #243582 kills momentum scrolling on scroll-snap containers and can skip to the last chapter on fast swipe. Must be validated on a real iOS device in the scaffold phase before any content is built.

---

## Stack Consensus

| Library | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| Vue 3 (Composition API) | ^3.4.0 (locked) | UI framework | Closed decision, scaffold already built |
| Vite | ^5.4.0 (locked) | Build tool + HMR | Closed decision |
| Phaser | ^3.86.0 (locked) | Chapter 6 interactive scene only | Closed decision |
| GSAP + ScrollTrigger | 3.15.0 | Chapter entry/exit animation callbacks | 100% free since April 2025. `onEnter`/`onLeave` hooks fire `data-chapter` attribute updates. CSS scroll-snap alone can't call code when a chapter activates. |
| vue-i18n | 11.4.2 | ES/EN toggle + localStorage persistence | De-facto Vue 3 i18n standard. `legacy: false` mandatory — Legacy API deprecated in v11, removed in v12. |
| @vueuse/core | 14.3.0 | `useScreenOrientation` for portrait overlay | Requires Vue 3.5+. Verify scaffold installed version. Fallback: pin @vueuse/core@10.x if Vue is at 3.4.x. |
| lenis | 1.3.23 | Optional: momentum feel on trackpad/mobile | Add only if native GSAP-driven scroll feels mechanical. Start without it. |
| firebase-tools | latest (CLI only) | Deploy to Firebase Hosting | Global install, not a project dep. Needed at deploy time only. |

**Explicit exclusions:** Locomotive Scroll (breaks Phaser input in ch6), Swiper.js (wrong tool class), Vue Router (conflicts with scroll-snap, triggers mount/unmount on nav), Pinia (overkill for a single integer ref), @gsap/vue (does not exist as an official Vue wrapper).

---

## Feature Priorities

### Table Stakes (v1 launch blockers)

| Feature | Notes |
|---------|-------|
| Chapter scroll-snap (7 chapters, mouse + trackpad) | The core concept. Nothing ships without this. |
| Era-authentic CSS styles for all 7 chapters | The visual transformation IS the product. |
| Pixel art avatar bust per chapter (7 portraits via pixelforge) | The aging face is the emotional anchor. |
| Chapter navigation HUD (dots + chapter label) | Without this, users are disoriented in horizontal scroll. |
| Default landing at Chapter 3 on first load | First impression must be polished Web 2.0, not a confusing terminal chapter. |
| Bio + era projects per chapter (1-2 projects min) | Core content; recruiter primary scan target. |
| Persistent contact info accessible from every chapter | Recruiter goal is often: get contact info fast. Burying it loses applicants. |
| ES/EN language toggle with localStorage persistence | Rafael bilingual brand signal. Broken i18n undermines core value proposition. |
| Mobile portrait overlay | Prevents broken experience on portrait mobile. |
| OG meta tags + JSON-LD Person schema | URL sharing must look intentional for recruiter sharing on LinkedIn/Slack. |
| Skip-to-content link + keyboard arrow navigation | WCAG minimum; laptop keyboard is primary recruiter device. |
| prefers-reduced-motion for all transitions | WCAG 2.3.3 — wraps chapter transitions and Phaser movement. |

### Differentiators (competitive advantage)

| Feature | Value |
|---------|-------|
| Chapter-locked visual style morphing | Site IS the bio — recruiter understands career arc without reading a CV line. |
| Scroll-backward reward (chapters 0-1 before default landing) | Easter egg dynamic; pre-career origin story. No extra implementation beyond having those chapters first. |
| Projects styled as part of their era | Chapter 2 projects look like Flash portals; chapter 5 like modern dashboards. |
| Phaser chapter 6 explorable space scene | Most technically demanding, most memorable. Planets = projects. |
| Warm tonal throughline — "always show a smile" | What makes the portfolio feel like a person, not a product. |

### Out of Scope (v1)

Deep linking (#chapter-N), fully era-authentic project cards (simplified era-appropriate for v1), character animation (pixelforge documented limitation), analytics, dark/light mode toggle, bento grids, glassmorphism.

### Accessibility Floor (non-negotiable minimums)

- Skip-to-content link (WCAG 2.4.1)
- Keyboard arrow navigation on scroll container with `tabindex="0"` (WCAG 2.1.1)
- Focus visible on HUD controls — do not remove `outline`
- Color contrast 4.5:1 per chapter (WCAG 1.4.3) — era-authentic colors may need adjustment
- prefers-reduced-motion respected (WCAG 2.3.3)
- Alt text on avatar busts with era-accurate descriptions
- `<html lang="">` updated on locale toggle (WCAG 3.1.1)

---

## Architectural Backbone

Single-page, no Vue Router. All 7 chapters in the DOM simultaneously inside a horizontal scroll shell. CSS `scroll-snap-type: x mandatory` handles snapping; `IntersectionObserver` tracks active chapter reactively. GSAP ScrollTrigger fires `data-chapter` attribute updates on chapter entry/exit. Phaser runs as an isolated island — never imported until chapter 6 is active via a `watch(activeChapter)` watcher (not a `v-if`, which would disrupt scroll-snap DOM layout).

**Key components:**

| Component | File | Responsibility |
|-----------|------|---------------|
| App.vue | src/App.vue | Root shell; calls `provideLocale()`, `provideScrollState()`; orientation guard + lang toggle |
| ScrollShell.vue | src/components/ScrollShell.vue | overflow-x scroll container, CSS snap, `initObserver()` call on mount |
| Chapter.vue | src/chapters/Chapter.vue | Generic section wrapper; applies `data-chapter`; renders avatar, copy, projects |
| PhaserChapter.vue | src/chapters/PhaserChapter.vue | Phaser Game lifecycle (create/destroy); canvas container; locale bridge via `game.events.emit` |
| useScrollState.js | src/composables/useScrollState.js | `activeChapter` ref (module-level singleton); `initObserver()`; `scrollTo()` |
| useLocale.js | src/composables/useLocale.js | `locale` ref; `toggle()`; `t()` translation lookup |
| chapter-themes.css | src/styles/chapter-themes.css | Single source of truth: all `[data-chapter="N"]` CSS custom property overrides |
| chapters.js | src/data/chapters.js | Chapter config array (id, era, avatar src, project ids) — pure config, no Vue imports |

**Asset layout:** Everything in `public/assets/` (not `src/assets/`). Phaser loads assets by URL string at runtime; Vite module hashing cannot be used for Phaser assets. Vue chapters use absolute paths `/assets/...`. Naming convention: `ch{N}-{descriptor}[-{variant}].png`.

**Data flow:** User scrolls → IntersectionObserver → activeChapter.value = N → PhaserChapter watcher mounts/destroys Phaser → locale toggle → game.events.emit("locale-changed") → Phaser updates UI → planet click → game.events.emit("vue:show-project", id) → Vue overlay shows project detail.

---

## Build Order Recommendation

Steps 1-3 are serial dependencies. Steps 4-5 can run in parallel once step 3 is complete. Step 6 requires steps 1-3 but is independent of 4-5.

1. **Scroll infrastructure** — ScrollShell.vue, useScrollState.js, OrientationGuard.vue, 7 empty placeholder sections. Validate snap physics and default-to-ch3 landing. **Test iOS momentum scroll on a real iOS device before proceeding** — this pitfall has no code fix if the approach is wrong.

2. **Theme system** — chapter-themes.css with all 7 `[data-chapter="N"]` blocks (placeholder colors acceptable). Validate no theme bleeding across chapter boundaries during snap transitions. Establish CSS `@layer` order: reset / themes / components / utilities.

3. **i18n infrastructure** — useLocale.js (backed by vue-i18n v11), both JSON locale files with skeleton keys, LangToggle.vue. Validate toggle, localStorage persistence, and `<html lang>` update before filling any copy.

4. **Chapter 3 end-to-end** (default landing) — Chapter.vue generic wrapper, AvatarBust.vue, BioCopy.vue, ProjectGrid.vue, real JSON content, real avatar from pixelforge. This chapter must be polished before anything else ships.

5. **Chapters 0-2 and 4-5** — Fill remaining five Vue chapters. Chapters 0-1 are CSS-only (fastest). Chapters 2, 4-5 require pixelforge assets; artist-creator and artist-editor agents can work in parallel with frontend-dev.

6. **Phaser chapter 6** — PhaserChapter.vue, SpaceScene.js, Ship.js, Planet.js. Build last. Establish `shallowRef` + `game.destroy(true, false)` + `import.meta.hot.dispose` scaffold BEFORE writing any scene code.

7. **Polish** — Parallax tuning, GSAP chapter reveal animations, keyboard navigation hardening, ARIA labels, Core Web Vitals pass, Firebase deploy.

---

## Critical Pitfalls (Top 7)

1. **iOS Safari kills snap momentum (WebKit bug #243582 — OPEN as of April 2026)** — `scroll-snap-type` suppresses kinetic scroll; fast swipe jumps to last chapter. Mitigation: `scroll-snap-stop: always` on each section, `-webkit-overflow-scrolling: touch`, JS scroll intercept fallback. Validate on real iOS device in Phase 1 before any content is built.

2. **100vh causes snap drift when mobile address bar hides** — Chrome Mobile animates the address bar; 100vh sections reflow and re-snap the user to the wrong chapter. Mitigation: use `height: 100dvh` on all chapter sections. Phase: Scaffold.

3. **Phaser game instance leak on Vue unmount (double canvas, WebGL context exhaustion)** — `new Phaser.Game()` without `game.destroy(true)` creates orphaned canvases; Chrome limits ~16 WebGL contexts per page. Mitigation: `shallowRef` for game ref, `game.destroy(true, false)` in `onBeforeUnmount`, `import.meta.hot.dispose` guard for dev. Phase: Chapter 6 day 1.

4. **Vue reactivity proxy wrapping Phaser instances** — Storing `Phaser.Game` in `ref()` or `reactive()` causes ES Proxy interception at 60fps, 10x slowdown, TypeErrors, infinite update loops. Mitigation: always `shallowRef` or plain `let` variable for game and scene objects. Phase: Chapter 6 day 1.

5. **CSS theme bleed via inherited properties** — `font-family`, `color`, `background` are inherited CSS properties; if themes are applied to `body` or `:root` instead of `[data-chapter="N"]` on the chapter root, styles bleed across chapters visible during snap transitions. Mitigation: scope all theme tokens to chapter container via CSS Custom Properties + `@layer`. Phase: Establish at chapters 0-1 scaffold before building the remaining 5 chapters.

6. **Phaser pixel art blurs on HiDPI / non-integer scale** — `pixelArt: true` sets `imageSmoothingEnabled: false` on canvas context but CSS compositing still applies bilinear filtering at non-integer ratios on Retina displays. `Phaser.Scale.FIT` allows fractional scaling. Mitigation: `mode: Phaser.Scale.NONE`, `zoom = Math.min(Math.floor(vw/480), Math.floor(vh/270))` for integer-only scale. Phase: Chapter 6 scaffold.

7. **orientationchange event is deprecated and fires before viewport dimensions update** — Stale width/height values cause portrait overlay to flicker or miss rotation. Mitigation: `ResizeObserver` on `document.documentElement` as primary trigger, check `window.innerWidth > window.innerHeight`; CSS `@media (orientation: portrait)` as no-JS fallback. Phase: Scaffold.

---

## Conflicts Surfaced and Resolution Recommendations

### Conflict 1: vue-i18n v11 (STACK.md) vs custom useLocale composable (ARCHITECTURE.md)

**Resolution: Use vue-i18n v11. STACK.md wins.**

- The 63 KB overhead argument is not compelling at portfolio scale; Firebase CDN compression reduces it further.
- vue-i18n provides IDE key-completion, Vue devtools locale inspector, and `fallbackLocale` for graceful missing-key handling during incremental content authoring.
- The custom composable in ARCHITECTURE.md manually re-implements key traversal via split('.'), has no error reporting beyond returning the key string, and no fallback mechanism.
- ES strings are 20-30% longer than EN; fallbackLocale handles gaps during content authoring; the custom composable does not.
- Scales to a third language without surgery.
- **Mandatory constraint:** `createI18n({ legacy: false })`. The `v-t` directive is deprecated in v11; use `t()` from `useI18n()` only.

### Conflict 2: GSAP ScrollTrigger as primary scroll driver (STACK.md) vs CSS scroll-snap + IntersectionObserver only (ARCHITECTURE.md)

**Resolution: Hybrid — CSS snap owns the mechanics, GSAP owns the animations. ARCHITECTURE.md wins for the scroll driver; STACK.md wins for animation triggers.**

- CSS `scroll-snap-type: x mandatory` + `IntersectionObserver` handles snapping and active chapter tracking. This is correct for the snap mechanic.
- GSAP is justified for chapter reveal animations (parallax, opacity, entrance effects) triggered by `isActive` prop on individual chapter components — not for driving the scroll container position.
- Avoid making GSAP own the scroll position: GSAP horizontal pinning on mobile has its own documented Safari roughness, compounding the iOS snap bug.
- Practical implementation: CSS snap on ScrollShell.vue, useScrollState.js with IntersectionObserver, GSAP used declaratively within chapter components for visual effects only.

---

## Open Questions for Rafael

1. **Vue version installed:** `@vueuse/core@14.3.0` requires Vue 3.5+. Scaffold pins `^3.4.0`. Run: `npm list vue`. If 3.4.x, upgrade Vue (non-breaking) or pin `@vueuse/core@10.x`.

2. **Project content per chapter:** Need 1-3 project entries per era to size content work. Placeholder titles fine for Phase 4 if real content is not ready.

3. **Avatar art style direction:** pixelforge needs a style reference (color palette, rendering style, background preset) before generating 7 busts. Should the art style age/evolve per chapter, or stay consistent across all 7?

4. **Chapter 6 planet count:** How many planets (projects) in the space scene? Each requires a pixelforge sprite + a project entry in projects.js. Best-of-career selection or Software Mind / AI-era only?

5. **Copy readiness:** Rafael bio and project descriptions in both ES and EN are required for Phase 4. Available now, or does writing time need to be built into the schedule?

6. **"Always show a smile" placement:** Where does this mantra appear? End of chapter 6? Persistent in HUD footer? Embedded in chapter 3 or 5 copy?

7. **Color palette per chapter:** Does Rafael have references (screenshots, hex codes, mood boards) for each era palette to guide pixelforge generation, or should the team propose palettes for approval?

8. **Firebase project ID:** Has a project been created in Firebase Console? Does not block development but is needed before Phase 7.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified against npm, official docs, community sources. Version compatibility matrix confirmed. |
| Features | HIGH (table stakes) / MEDIUM (differentiators) | Table stakes verified against WCAG + industry analysis. Differentiator value from Awwwards/FWA analysis. |
| Architecture | HIGH (Vue/CSS patterns) / MEDIUM (Phaser-Vue boundary) | Vue and CSS from official docs. Phaser-Vue communication from official template + community sources. |
| Pitfalls | HIGH | All critical pitfalls traced to open bugs (WebKit #243582), MDN deprecation notices, or Phaser issue tracker. |

**Overall confidence:** HIGH

### Gaps to Address During Implementation

- **iOS Safari momentum scroll:** WebKit bug #243582 has no ETA for a fix. JS fallback must be validated on real hardware in Phase 1. If unresolvable, fall back to pure JS-driven scroll with `scrollTo()` and no CSS `scroll-snap-type`.
- **@vueuse/core useScreenOrientation iOS bug (issue #4220):** Still open. CSS `@media (orientation: portrait)` must be the primary overlay trigger; the composable is secondary only.
- **GSAP + CSS snap coexistence:** Hybrid approach must be validated during scroll infrastructure scaffolding. If GSAP animations interfere with CSS snap on Safari, default to pure CSS snap + IntersectionObserver only.
- **pixelforge palette consistency:** Gemini can drift between generation runs. All 7 busts and backgrounds should be generated with explicit palette references and visually compared before any chapter layouts are coded.
- **ES/EN copy length in tight layouts:** Spanish is typically 20-30% longer. Every chapter layout must be tested with both languages loaded. Do not finalize layouts in EN-only.

---

## Sources

### Primary (HIGH confidence)
- GSAP npm + Webflow blog — GSAP 3.15.0 free since April 2025, ScrollTrigger horizontal snap
- vue-i18n official docs — v11.4.2 Composition API, legacy: false requirement, migration guide from v10
- Phaser.io official Vue 3 template (Feb 2024) — Phaser-Vue bridge pattern, game.destroy(true) semantics
- MDN — CSS scroll-snap, scroll-snap-stop, screen.orientationchange deprecation, image-rendering
- WebKit Bugzilla #243582 — iOS Safari scroll-snap momentum bug, confirmed OPEN April 2026
- Vue 3 official docs — Composition API, provide/inject, shallowRef, SFC scoped styles
- WCAG 2.2 — criteria 2.4.1, 2.1.1, 1.4.3, 2.3.3, 3.1.1

### Secondary (MEDIUM confidence)
- GSAP community forums — mobile horizontal ScrollTrigger roughness
- Phaser GitHub issue #3092 — game.destroy() canvas pool behavior
- @vueuse/core GitHub issue #4220 — useScreenOrientation iOS Safari bug (still open)
- Tympanus/Codrops scroll-driven 3D portfolio (2026) — architecture patterns extrapolated to Vue/Phaser
- Awwwards storytelling collection + Muzli top 100 portfolios 2025 — differentiator analysis
- CreativeBoom 2026 design trends — anti-pattern identification (bento grids, glassmorphism)

### Tertiary (LOW confidence)
- Lenis + GSAP combo on trackpad/mobile — documented pattern, project-specific validation required

---

*Research completed: 2026-05-12*
*Ready for roadmap: yes*