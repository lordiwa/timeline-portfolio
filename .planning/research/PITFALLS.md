# Pitfalls Research

> ⚠ **SUPERSEDED 2026-05-12** — Pivote a **scroll vertical**. El pitfall principal documentado (WebKit bug #243582 "horizontal momentum skips snap targets") **deja de aplicar**: era específico de momentum horizontal en iOS y vertical snap está bien soportado. Otros pitfalls **siguen vigentes**: theme bleed entre chapters durante snap, layout shift al cambiar locale, Phaser memory leaks al unmount, IntersectionObserver thresholds para active chapter tracking, pixel-art image-rendering CSS, address-bar drift mitigado con `100dvh`. Fuente canonica: `PROJECT.md` + `REQUIREMENTS.md`.

**Domain:** ~~Horizontal~~ Vertical scroll-snap portfolio — multi-theme, pixel art, Phaser-in-Vue, bilingual, sticky anchors
**Researched:** 2026-05-12
**Confidence:** HIGH (all critical claims verified against MDN, WebKit Bugzilla, Phaser docs, or official sources) — horizontal-era pitfalls reframed for vertical post-2026-05-12

---

## Critical Pitfalls

### Pitfall 1: iOS Safari Kills Momentum Scrolling When scroll-snap Is Active

**What goes wrong:**
On iOS Safari, enabling `scroll-snap-type` on the container causes the browser to snap to items
immediately on finger release — completely suppressing the native momentum / kinetic scroll feel
users expect. A fast flick also jumps straight to the last snap point, skipping all chapters in
between.

**Why it happens:**
WebKit bug #243582 (filed 2022, still OPEN as of April 2026 — confirmed via Bugzilla). WebKit's
snap implementation differs from Blink: it snaps on touchend instead of letting momentum carry
through. The bug is unresolved and has no ETA.

**How to avoid:**
- Do NOT rely on `scroll-snap-type: x mandatory` alone on mobile. Use `scroll-snap-stop: always`
  on each chapter `<section>` to ensure single-chapter steps (prevents jumping to end).
- Keep `-webkit-overflow-scrolling: touch` on the scroll container for momentum baseline.
- For chapter 6 (Phaser scene), consider a `pointer-events: none` overlay while Phaser is
  rendering to prevent scroll conflict with Phaser's input system.
- Test on a real iOS device or BrowserStack early — simulator does not reproduce momentum bugs.
- Consider a JS fallback for mobile: intercept `touchstart`/`touchend`, compute velocity, then
  call `scrollTo({ behavior: 'smooth' })` programmatically with `snap-stop` hints.

**Warning signs:**
- Scroll feels "choppy" or "instant snap" on iPhone during testing.
- Fast swipe teleports to last chapter.
- Trackpad two-finger scroll on macOS Safari behaves differently from Chrome.

**Phase to address:** Scaffold phase — implement scroll container structure with tested snap
behavior before any chapter content exists. Do not defer this to polish.

---

### Pitfall 2: 100vh / 100svh Resets Snap Position When Mobile Address Bar Hides

**What goes wrong:**
Chrome Mobile (and iOS Safari) animate the address bar in/out as the user scrolls. The viewport
height changes by ~56px. If chapter sections use `height: 100vh`, that reflow can force the snap
container to recalculate snap points mid-scroll, jumping the user to a different chapter or
causing a flash of mis-positioned content.

**Why it happens:**
`100vh` in mobile browsers is calculated against the layout viewport (address bar included), not
the visual viewport. When the bar hides, the visual area grows but `100vh` doesn't change in
time, creating an 80px overflow. The snap engine re-snaps to the nearest point, which may not be
the chapter the user was on.

**How to avoid:**
- Use `height: 100dvh` (Dynamic Viewport Height — supported by all modern mobile browsers as of
  2023) on chapter sections instead of `100vh`. `dvh` updates as the address bar moves.
- Alternatively, set a CSS variable via `window.visualViewport` resize listener:
  ```js
  window.visualViewport?.addEventListener('resize', () => {
    document.documentElement.style.setProperty('--vh', `${window.visualViewport.height * 0.01}px`)
  })
  // CSS: height: calc(var(--vh, 1vh) * 100)
  ```
- The project already requires landscape-only mobile — portrait is blocked with an overlay. In
  landscape, the address bar problem is less severe but still present on Android Chrome.

**Warning signs:**
- Chapter snaps "drift" by one position when scrolling from the address bar appearing/disappearing.
- Content in chapter footer gets clipped on first load on mobile.

**Phase to address:** Scaffold phase — the scroll container height formula must be correct from
day one, before chapter theming is added.

---

### Pitfall 3: Phaser Game Instance Leaks on Vue Component Unmount (Double Canvas)

**What goes wrong:**
Every time the Vue component containing the Phaser game is mounted/unmounted (e.g., route
changes, HMR reload, Vue re-render), a new `Phaser.Game` instance is created and appended to the
DOM. The old canvas is never removed. `Phaser.CanvasPool.pool` grows without bound. WebGL
contexts accumulate; browsers limit WebGL contexts per page (Chrome: ~16). Memory usage climbs
until the tab crashes or renders blank.

**Why it happens:**
Phaser.Game constructor immediately creates and appends a `<canvas>` to the parent element.
Vue's `onUnmounted` hook does NOT automatically destroy third-party DOM children. Developers
often call `new Phaser.Game()` in `onMounted` but forget the paired `game.destroy(true)` in
`onBeforeUnmount`. During Vite HMR in dev mode, modules are replaced without a full page reload,
so the old game instance survives while a new one spawns alongside it (duplicate canvases visible
in DevTools).

**How to avoid:**
```js
// ChapterSix.vue — minimal safe pattern
import { onMounted, onBeforeUnmount, shallowRef } from 'vue'
import Phaser from 'phaser'

const gameRef = shallowRef(null)

onMounted(() => {
  gameRef.value = new Phaser.Game({ /* config */ })
})

onBeforeUnmount(() => {
  if (gameRef.value) {
    gameRef.value.destroy(true)  // true = remove canvas from DOM
    gameRef.value = null
  }
})

// Vite HMR guard — prevents duplicate canvas during dev
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    gameRef.value?.destroy(true)
    gameRef.value = null
  })
}
```
- Always pass `true` to `game.destroy()` — the boolean flag removes the canvas element.
- Use `shallowRef` (not `ref`) for the game instance — `ref` will deeply proxy Phaser internals
  and cause infinite loops or massive slowdowns.
- Add a guard: if a canvas with the game's `id` already exists in the parent, destroy it before
  creating a new one.

**Warning signs:**
- Multiple `<canvas>` elements visible in DevTools when refreshing in dev mode.
- Memory usage climbs steadily every time you save a file during dev.
- WebGL warning: "Too many active WebGL contexts" in console.
- Black canvas after navigating away and back to chapter 6.

**Phase to address:** Chapter 6 (Phaser) implementation phase. Set up the scaffold with correct
mount/unmount lifecycle before writing any Phaser scene code.

---

### Pitfall 4: Phaser Canvas Blurs on Non-Integer Scale / HiDPI Display

**What goes wrong:**
The project uses `zoom: 3` (480×270 → 1440×810). On a Retina / HiDPI display (devicePixelRatio
= 2), the CSS canvas size is 1440×810 but the device renders at 2880×1620 physical pixels. Phaser
draws at 1440×810 internal and the browser scales up with bilinear filtering — making pixel art
blurry despite `pixelArt: true` and `image-rendering: pixelated`.

**Why it happens:**
`pixelArt: true` in Phaser sets `imageSmoothingEnabled = false` on the canvas context, but it
does NOT scale the canvas backing store to match `devicePixelRatio`. Browser CSS scaling then
applies smoothing at the compositing layer, bypassing canvas-level settings.

**How to avoid:**
- In Phaser Scale Manager config, set `mode: Phaser.Scale.NONE` (default for embedded SPAs) and
  manually size the canvas. For pixel art with integer scaling, the safest approach:
  ```js
  // Compute largest integer scale that fits viewport
  const scale = Math.min(
    Math.floor(window.innerWidth / 480),
    Math.floor(window.innerHeight / 270)
  )
  new Phaser.Game({
    width: 480,
    height: 270,
    zoom: scale,      // integer only (1, 2, 3…)
    pixelArt: true,
    scale: { mode: Phaser.Scale.NONE }
  })
  ```
- Add `image-rendering: pixelated` AND `image-rendering: crisp-edges` to the canvas in CSS
  (already in index.html — keep it there).
- Do NOT use `Phaser.Scale.FIT` with pixel art — FIT allows fractional scaling which will blur
  at non-integer ratios.
- The chapter 6 container must be sized to an integer multiple of 480×270 before Phaser mounts.

**Warning signs:**
- Pixel art looks slightly blurry or "soft" on MacBook retina screens.
- Font characters in chapter 0 (monospace terminal) show sub-pixel anti-aliasing bleed.
- Sharp pixel borders visible at 100% zoom but fuzzy at browser 125% zoom.

**Phase to address:** Chapter 6 (Phaser) scaffold — establish the integer-scale sizing formula
before any assets are loaded. Also verify `image-rendering: pixelated` applies globally to all
pixel art `<img>` elements outside Phaser.

---

### Pitfall 5: CSS Theme Bleed via Inherited Properties and Global Body Styles

**What goes wrong:**
Each of the 7 chapters has a radically different visual theme (terminal green → HTML 90s → Flash
gradients → Web 2.0 → AR/VR → modern → Phaser). If theme styles are applied via body classes or
global CSS rules instead of scoped chapter containers, the themes "bleed" — chapter 0's
`font-family: monospace` leaks into chapter 3's glossy Web 2.0 section, or chapter 5's scroll-
driven animation CSS resets chapter 4's parallax.

**Why it happens:**
`font-family`, `color`, `background`, `line-height`, `letter-spacing` are inherited CSS
properties — they flow down the DOM from parent to child unless explicitly overridden. Vue's
`<style scoped>` only adds a unique attribute selector; it does not prevent inheritance from
parent elements outside the component. Third-party widgets (any future social embed) inherit
styles from the nearest ancestor.

**How to avoid:**
- Apply all theme styles to a `.chapter--X` class on the chapter's root element, never on
  `body` or `:root`.
- Use CSS Custom Properties (variables) as the theme API:
  ```css
  .chapter--0 { --font-primary: 'Courier New', monospace; --bg: #000; --fg: #00ff41; }
  .chapter--3 { --font-primary: 'Trebuchet MS', sans-serif; --bg: #f0f4ff; --fg: #333; }
  /* All children use var(--font-primary) etc. */
  ```
- Use `all: revert` or explicit `font-family: initial` at chapter root boundaries if a chapter
  must fully reset inherited styles from a parent.
- Use CSS `@layer` to establish a cascade order: `@layer reset, themes, components, utilities` —
  theme rules in the `themes` layer cannot accidentally override `components` layer rules.
- Never use `* { font-family: ... }` in chapter-specific CSS files.

**Warning signs:**
- Opening DevTools and inspecting a chapter element shows inherited styles from a different
  chapter's data in the Computed tab.
- Adding a new chapter breaks the visual appearance of an adjacent chapter.
- Font or color looks correct in isolation but wrong in the full page scroll.

**Phase to address:** Chapter 0/1 scaffold (first two chapters built) — establish the theming
architecture with CSS variables before the remaining 5 chapters are built.

---

### Pitfall 6: Phaser + Vue Reactivity Collision (Never Wrap Game Objects in reactive/ref)

**What goes wrong:**
Vue 3's reactivity system uses ES Proxy. If a Phaser `GameObject`, `Scene`, or `Phaser.Game`
instance is stored in a `ref()` or `reactive()`, Vue wraps it in a Proxy. Phaser internally
accesses instance methods by direct property lookup; the Proxy intercepts these, causing:
- TypeError: game.scene is not a function
- Infinite update loops as Vue tracks property accesses inside Phaser's game loop
- ~10x performance drop as the Proxy fires on every frame update

**Why it happens:**
The Phaser game loop runs at 60fps calling `scene.update()`, which accesses dozens of reactive-
proxied properties per frame. Vue marks all these accesses as dependencies and queues re-renders
on every tick.

**How to avoid:**
- Store Phaser instances in `shallowRef()` or plain variables outside Vue's reactivity system:
  ```js
  // WRONG:
  const game = ref(new Phaser.Game(config))    // wraps in Proxy — breaks Phaser
  const game = reactive({ instance: new Phaser.Game(config) })  // same problem
  
  // CORRECT:
  const game = shallowRef(null)  // shallowRef only tracks the reference, not internals
  // or:
  let game = null                // plain variable, no reactivity
  ```
- If you need to expose Phaser state to Vue (e.g., score, current scene name), extract the
  minimal data into a separate `ref()` and update it manually from Phaser callbacks.

**Warning signs:**
- Frame rate drops from 60fps to 5-10fps as soon as the Phaser component mounts.
- Console warnings: "Maximum update depth exceeded" or "Proxy get trap" errors.
- Phaser methods throw TypeError with "... is not a function" on reactive-wrapped instances.

**Phase to address:** Chapter 6 (Phaser) — first day of implementation. Never demonstrate
Phaser working in Vue without this guard in place.

---

### Pitfall 7: Orientation Detection — orientationchange Event Is Deprecated and Unreliable

**What goes wrong:**
The project requires landscape-only mobile with a "rotate your device" overlay in portrait.
Using `window.addEventListener('orientationchange', ...)` is deprecated (MDN marks it as
non-standard) and has known bugs: on Android, it fires before the viewport dimensions update,
giving stale width/height values. The returned angles are also wrong on some Android devices.

**Why it happens:**
`window.orientation` and `orientationchange` are legacy APIs, never standardized, and MDN now
recommends using `screen.orientation.addEventListener('change', ...)` instead. However, iOS
Safari had limited support for `screen.orientation` until Safari 16.4 (released March 2023).

**How to avoid:**
- Use a `ResizeObserver` on `document.documentElement` as the primary trigger (fires after
  layout is complete with correct dimensions), and only check `window.innerWidth > window.innerHeight`:
  ```js
  const ro = new ResizeObserver(() => {
    const isLandscape = window.innerWidth > window.innerHeight
    showOrientationOverlay.value = !isLandscape
  })
  ro.observe(document.documentElement)
  // Cleanup in onBeforeUnmount: ro.disconnect()
  ```
- As a secondary check, use `screen.orientation.type` (includes "landscape-primary",
  "landscape-secondary") — supported in all modern browsers except old iOS Safari.
- Do NOT use `window.orientation` angle values — they are deprecated and unreliable.
- Add a `matchMedia('(orientation: landscape)')` listener as a fallback for devices where
  ResizeObserver fires at unexpected times.
- iPad in split-screen mode may report landscape even though the app pane is portrait-shaped —
  test with `window.innerWidth / window.innerHeight` ratio, not just orientation type.

**Warning signs:**
- Overlay flashes briefly and disappears on correct-orientation load.
- Overlay doesn't appear when device is quickly rotated to portrait and back.
- On iPad, orientation detection fires even when the device hasn't rotated (split-screen resize).

**Phase to address:** Scaffold phase — implement and test the orientation gate before any chapter
content is built, since it affects the entire navigation architecture.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `body` classes for theme switching instead of chapter-root classes | Simple JS toggle | All 7 themes share body-level specificity; adding a new theme risks breaking all others | Never — scope all themes to chapter containers from day 1 |
| Hardcoding scroll position with `scrollLeft` calculations instead of `scroll-snap` | More control | Breaks on resize, orientation change, browser zoom changes | Never for main nav |
| Using `ref()` for Phaser game instances | Feels "idiomatic Vue" | Proxy wrapping causes performance collapse and TypeErrors | Never |
| Storing language toggle state in component local state instead of a Pinia store / localStorage | Simpler initially | Language resets to default when user scrolls back (chapter re-mounts) | Never — persisted global state from day 1 |
| Generating all 7 background assets at full resolution (960×540) | Higher detail | All backgrounds load on initial page load (~7–14MB uncached) | Acceptable if lazy-loaded by chapter |
| Using `width: 100%; height: 100%` for Phaser container instead of computing integer scale | Flexible layout | Fractional canvas scaling blurs pixel art | Never for chapter 6 |
| Lossy WebP for pixel art sprites | ~60% smaller files | Color palette drift on thin-contrast edges; YUV 4:2:0 chroma subsampling destroys 1px details | Never — use lossless WebP or PNG |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| pixelforge + parallax layers | Generating sprites with `forge_sprite` for opaque background layers | Use `forge_background` for any full-frame layer; `forge_sprite` applies bg-removal and creates holes |
| pixelforge + intermediate parallax | Prompting for "detailed tree silhouettes with visible branches" | Request "solid filled shape, no internal lineart, no negative space, single flat color" — outlines create internal transparency that breaks depth illusion |
| pixelforge + background preset | Using `background: "black"` or `background: "white"` in `forge_sprite` | Use named presets: "night", "forest", "sky", "dungeon" — Gemini ignores hex/named colors for bg removal |
| Adobe MCP + pixel art | Using `image_generative_expand` expecting pixel-art output | Adobe MCP generates photorealistic fill, not pixel art — use it ONLY for seamless edge extension, then re-quantize palette if needed |
| Phaser + Vue HMR | No cleanup on module hot-dispose | Add `import.meta.hot.dispose(() => game.destroy(true))` in dev builds; assets will reload each hot-replace otherwise |
| Firebase Hosting + Vite SPA | Missing `rewrites` config — 404 on direct URL access | Add `"rewrites": [{"source": "**", "destination": "/index.html"}]` in `firebase.json`; place BEFORE any specific redirects |
| Firebase Hosting + Vite assets | Setting `max-age=31536000` on all files including `index.html` | Only set long cache on hashed assets (`/assets/**`); `index.html` must be `no-cache` or users get stuck on old builds |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| All 7 chapters rendered in DOM simultaneously, all backgrounds loaded at boot | 3–5s initial load; long idle on mobile | Lazy-render chapter DOM using IntersectionObserver; lazy-load background images with `loading="lazy"` or dynamic `import()` | With 7 × 150KB backgrounds, ~1MB+ blocking load |
| Phaser bundle pulled into initial JS chunk | 2MB+ initial JS payload; chapter 6 loads for everyone even if never visited | Code-split Phaser: `const Phaser = await import('phaser')` inside the chapter 6 component's `onMounted` | First load on mobile 3G — Phaser is ~1MB minified |
| parallax `tileSprite` updating every frame without dirty-checking | CPU/GPU fan spin on idle chapters | Only run `tileSprite.tilePositionX += speed` when the chapter is the active/visible one; pause when scrolled away | 7 parallax layers all ticking simultaneously = 42+ texture updates/frame |
| All pixel art images at 960×540 (2× virtual res) | Bandwidth waste for 1440×810 display (3× virtual) | Generate at 480×270 base and let Phaser/CSS `image-rendering: pixelated` zoom up; or offer 2 sizes via `<picture>` | On desktop Retina screens |
| `scroll-snap-stop: always` on a slow device with 7 snap points | User cannot jump from chapter 0 to chapter 6 easily | Add a chapter navigation UI (dots, number strip, keyboard shortcut) | Power users, slow trackpad |
| CSS transitions/animations running on all 7 chapters at once | Battery drain, thermal throttle on mobile | Use `prefers-reduced-motion` media query and pause non-essential animations on non-active chapters | Long sessions on mobile |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No chapter indicator / progress signal | User doesn't know where they are in the timeline or how many chapters exist | Persistent timeline dots or year label overlay (fixed position, always visible regardless of chapter) |
| Language toggle buried inside a chapter | International recruiter misses EN content | Pin language toggle to a fixed overlay outside the scroll container, always visible |
| Scroll horizontally to navigate = not obvious on desktop | Many users try vertical scroll first, give up | Add a visible hint on first load: arrow animation or "scroll / swipe to navigate" tooltip that disappears after first interaction |
| Fast-scroll skipping chapters with `scroll-snap-stop: normal` | User misses Rafael's Flash era entirely by accident | Use `scroll-snap-stop: always` on each chapter — one gesture = one chapter max |
| Chapter 6 Phaser scene captures all pointer events | User cannot scroll away from chapter 6 via mouse | Implement explicit "exit scene" UI or release pointer capture after a timeout / intentional gesture |
| Translate button only accessible from the current chapter | User scrolls past it mid-journey | Language preference persisted in localStorage — if set, applies immediately on every load without requiring UI interaction |
| Copy length differences in ES vs EN breaking layout | Long Spanish copy wrapping into 3 lines where EN fits 1 line | Design all chapter layouts with the longer language in mind; test both languages during layout development, not at the end |

---

## "Looks Done But Isn't" Checklist

- [ ] **Scroll snap on mobile:** Tested on a real iOS device (not simulator) — snap behavior and momentum scroll work without jumping to end.
- [ ] **Address bar height:** Chapter sections fill exactly one viewport height on mobile with address bar both shown AND hidden — no clipping.
- [ ] **Phaser cleanup:** Navigate to chapter 6 → back to chapter 1 → back to chapter 6. DevTools Memory tab shows no new detached canvas nodes.
- [ ] **Pixel art crispness:** Screenshots taken on a 2× Retina MacBook — pixel art looks sharp, not blurry.
- [ ] **Theme isolation:** Inspect chapter 3 in DevTools Computed styles — no inherited styles from chapter 0 (monospace font, green color) bleeding in.
- [ ] **Language persistence:** Set language to EN → scroll to chapter 6 → reload page → language is still EN.
- [ ] **Language layout:** Open both ES and EN copies in adjacent windows — no text overflows, truncation, or z-index stacking from different line heights.
- [ ] **Orientation overlay:** Rotate iPhone to portrait → overlay appears. Rotate to landscape → overlay disappears. No flicker on load in correct orientation.
- [ ] **Firebase SPA:** Open `/` → works. Type a direct URL (e.g., `/chapter/3`) → does NOT return 404.
- [ ] **Firebase cache:** Deploy a new build → hard-reload browser → new assets load (no stale JS from previous deploy).
- [ ] **Phaser bundle split:** Open DevTools Network on chapter 1 → Phaser is NOT in the initial JS payload. Navigate to chapter 6 → Phaser loads then.
- [ ] **pixelforge seamless tiles:** Background tileSprites scroll without visible seam at the right edge join.
- [ ] **Generated asset palette:** All pixel art assets across all chapters share the same base palette — no random Gemini color drift between sessions.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| iOS scroll snap momentum disabled | MEDIUM | Add JS-driven scroll intercept; `scroll-snap-type: none` on mobile + manual `scrollTo()` with easing |
| Theme bleed discovered late (after 5+ chapters built) | HIGH | Audit all chapter root styles; move to CSS Custom Properties + `@layer`; regression-test all 7 themes |
| Phaser memory leak discovered in production | MEDIUM | Add `game.destroy(true)` in `onBeforeUnmount` + `import.meta.hot.dispose` — 30min fix, deploy, verify in DevTools |
| Pixel art blurry on Retina after assets generated | LOW | Add CSS: `image-rendering: pixelated` + `image-rendering: crisp-edges` globally; no asset regeneration needed for CSS-rendered images |
| Language toggle loses scroll position | LOW | Store active chapter index in a `ref`; on locale change, call `scrollContainer.scrollLeft = chapterIndex * containerWidth` immediately after Vue re-render |
| Firebase showing 404 on direct URL | LOW | Add `rewrites` to `firebase.json`; redeploy (2-minute fix) |
| Wrong generated asset naming convention | MEDIUM | Rename files + update all import paths + bust cache; preventable with naming convention doc before first asset generation |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| iOS scroll snap momentum / jumping to end | Scaffold (scroll container) | Test on real iOS device before adding chapter content |
| Address bar 100dvh reflow | Scaffold (scroll container) | Compare `window.innerHeight` before/after scrolling on Android Chrome |
| Phaser game instance leak on unmount | Chapter 6 scaffold (day 1) | DevTools Memory → Detached elements after mount/unmount cycle |
| Phaser canvas blur on non-integer scale | Chapter 6 scaffold (day 1) | Screenshot on Retina display; compare 1× vs 2× pixel sharpness |
| Vue reactivity wrapping Phaser instances | Chapter 6 scaffold (day 1) | Check frame rate in DevTools Performance tab on mount |
| CSS theme bleed | Chapter 0+1 scaffold (establish theming architecture) | Computed styles in DevTools show no cross-chapter inheritance |
| Orientation detection reliability | Scaffold | Test portrait/landscape switch on iOS + Android + iPad split-screen |
| Language state lost between chapters | i18n setup phase | Set language, scroll all 7 chapters, reload — language must persist |
| ES/EN layout breakage from copy length | All chapter layout phases | Always build layout with both languages loaded; use longer copy as the sizing reference |
| Phaser bundle in initial payload | Chapter 6 integration phase | Vite bundle analysis (`npx vite-bundle-visualizer`) — Phaser must not appear in initial chunk |
| Firebase SPA 404 | Deploy phase | Test direct URL navigation after first Firebase deploy |
| Generated asset palette drift | Asset generation phase (each chapter) | Visual comparison of all chapter assets side-by-side before coding chapter layout |
| pixelforge frame incoherence (animation) | Asset generation phase | Only generate idle frame; never request walk cycles or multi-frame sheets from pixelforge |
| Seamless tile seam | Asset generation phase | Loop tile in browser at full parallax scroll speed to check seam |

---

## Sources

- [WebKit Bug #243582 — CSS Scroll Snap disables momentum scrolling on iOS](https://bugs.webkit.org/show_bug.cgi?id=243582) — OPEN as of April 2026
- [MDN — scroll-snap-stop](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-stop)
- [MDN — Screen: orientationchange event (deprecated)](https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientationchange_event)
- [MDN — Crisp pixel art look with image-rendering](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look)
- [web.dev — High DPI Canvas](https://web.dev/articles/canvas-hidipi)
- [Phaser Discourse — Webpack HMR + duplicate canvas issue and solutions](https://phaser.discourse.group/t/webpack-hot-module-replacement/8899)
- [Phaser GitHub Issue #3092 — game.destroy() and canvas pool behavior](https://github.com/phaserjs/phaser/issues/3092)
- [Phaser Docs — ScaleManager](https://docs.phaser.io/api-documentation/class/scale-scalemanager)
- [Markus Oberlehner — Cleaning up global event listeners in Vue components](https://markus.oberlehner.net/blog/how-to-clean-up-global-event-listeners-intervals-and-third-party-libraries-in-vue-components)
- [CSS-Tricks — Practical CSS Scroll Snapping](https://css-tricks.com/practical-css-scroll-snapping/)
- [DEV.to — Fix mobile 100vh jumps using VisualViewport](https://dev.to/__8b11c872ed501135af2/fix-mobile-100vh-jumps-url-bar-keyboard-using-visualviewport-5h0h)
- [Firebase Hosting — Full config (SPA rewrites)](https://firebase.google.com/docs/hosting/full-config)
- [Firebase Hosting — Manage cache behavior](https://firebase.google.com/docs/hosting/manage-cache)
- [Accessibility — Horizontally scrollable regions](https://cerovac.com/a11y/2024/02/consider-accessibility-when-using-horizontally-scrollable-regions-in-webpages-and-apps/)
- [CLAUDE.md section 6 — Documented pixelforge errors in this project](../CLAUDE.md)
- [Tinify Blog — WebP pros and cons (pixel art color loss warning)](https://blog.tinify.com/pros-and-cons-webp-images/)

---
*Pitfalls research for: horizontal scroll-snap portfolio — Vue 3 + Phaser + multi-theme + pixel art via MCP*
*Researched: 2026-05-12*
