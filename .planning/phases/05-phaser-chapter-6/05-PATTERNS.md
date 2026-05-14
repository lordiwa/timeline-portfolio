# Phase 5: Phaser Chapter 6 - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 26 (10 source files new/modified + 16 test files new)
**Analogs found:** 22 / 26 (84%)
**Novel (Phaser-first integration):** 4 (`src/phaser/index.js`, `src/phaser/SpaceScene.js`, `Chapter6Content.vue` lifecycle, locale bridge tests) — source-of-truth = RESEARCH.md §Patterns 1-13.

---

## File Classification

### Source files (new + modified)

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/phaser/index.js` (NEW) | factory / config provider | request-response (createGame) | none — first Phaser integration | novel — RESEARCH §Pattern 1, 3 |
| `src/phaser/SpaceScene.js` (NEW) | Phaser Scene (game logic) | event-driven (game loop + bridge) | none — first Phaser integration | novel — RESEARCH §Patterns 5,6,7,8,9 |
| `src/components/Chapter6Content.vue` (NEW) | era-specific wrapper component | event-driven (watch + bridge) | `Chapter4Content.vue` (layout shell) + `ParallaxLayers.vue` (inject scrollState+prm) | partial-match (~40%) |
| `src/components/ProjectOverlay.vue` (NEW) | modal/dialog component | request-response (open/close events) | `FloatingPanel.vue` (synth structure) + `ContactHUD.vue` (fixed overlay z-index) | loose-match (~25%) |
| `src/components/ScrollShell.vue` (MOD) | router/insertion shell | request-response (v-else-if chain) | self — established pattern | exact (self-extend) |
| `src/data/chapters.js` (MOD) | data record (palette field) | data-shape | self — D3-06 stub-fill pattern (ch2/ch4/ch5 already poblated) | exact (self-extend) |
| `src/data/projects.js` (MOD) | data record (3 ch6 items) | data-shape | self — D3-03 stub pattern (ch4/ch5 items as template) | exact (self-extend) |
| `src/styles/chapter-themes.css` (MOD) | theme block + @layer components | data-shape (CSS tokens) | self — `[data-chapter="4"]` finalization pattern (D4-W3) | exact (self-extend) |
| `src/i18n/{es,en}.json` (MOD) | i18n keys (chapters.6.* + projects.ch6-*) | data-shape | self — Phase 4 added chapters.{2,4,5}.* same shape | exact (self-extend) |

### Pixel-art assets (new)

| File | Role | Generator | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `public/assets/ch6-bg.png` | background full-frame | `forge_background` (no bg-removal) | `public/assets/ch2-bg.jpg` + `ch4-bg-*.jpg` (Phase 4 W2/W3) | exact (same forge call) |
| `public/assets/ch6-bg-stars-far.png` (opt) | parallax layer back | `forge_background` | `public/assets/ch4-bg-stars-far.jpg` | exact |
| `public/assets/ch6-bg-nebulae-mid.png` (opt) | parallax layer mid | `forge_background` | `public/assets/ch4-bg-planet-mid.jpg` | exact |
| `public/assets/ch6-planet-{ar-vr,remoose,software-mind}.png` (×3) | interactive sprites | `forge_sprite` + bg removal | `public/assets/ch4-fg-panels.png` / `ch4-fg-ships.png` | exact (same forge call) |
| `public/assets/ch6-ship-{1,2}.png` (×2) | decorative sprites | `forge_sprite` + bg removal | `public/assets/ch4-fg-ships.png` | exact |

### Test files (W0 RED stubs)

| File | Test Type | Closest Analog | Match Quality |
|------|-----------|----------------|---------------|
| `tests/assets/ch6-assets.test.js` | architectural (readdirSync + regex) | `tests/assets/asset-naming.test.js` | exact (extend regex enum) |
| `tests/phaser/factory.test.js` | source-regex (readFileSync) | `tests/styles/themes-file.test.js` (readFileSync+regex) | role-match |
| `tests/phaser/scale.test.js` | source-regex | `tests/styles/themes-file.test.js` | role-match |
| `tests/phaser/space-scene-shape.test.js` | source-regex | `tests/styles/themes-file.test.js` | role-match |
| `tests/phaser/no-character-animation.test.js` | architectural (anti-pattern regex) | `tests/assets/asset-naming.test.js` T3 (offenders pattern) | role-match |
| `tests/phaser/locale-bridge.test.js` | integration (mock game.events) | `tests/components/Chapter4Content.test.js` T5 (locale reactive) | role-match |
| `tests/phaser/prm.test.js` | integration (mock registry) | `tests/components/ParallaxLayers.test.js` T5 (PRM mock) | exact pattern |
| `tests/components/Chapter6Content.test.js` | integration (mount+inject+i18n) | `tests/components/Chapter4Content.test.js` | exact (clone shape) |
| `tests/components/Chapter6Content-lazy.test.js` | source-regex (dynamic import) | `tests/styles/themes-file.test.js` (readFileSync) | role-match |
| `tests/components/Chapter6Content-bridge.test.js` | integration (event listener) | `tests/components/StickyAvatar.test.js` (inject + watch behavior) | partial-match |
| `tests/components/Chapter6Content-resize.test.js` | integration (ResizeObserver mock) | none — first ResizeObserver test | novel — RESEARCH §Pattern 4 |
| `tests/components/Chapter6Content-prm.test.js` | integration (PRM mock) | `tests/components/ParallaxLayers.test.js` | exact |
| `tests/components/ProjectOverlay.test.js` | integration (ESC + click-outside + focus) | `tests/components/StickyAvatar.test.js` + `tests/components/LangToggle.test.js` (keyboard events) | role-match |
| `tests/a11y/keyboard-planet-buttons.test.js` | integration (sr-only buttons + Tab) | `tests/components/SkipLink.test.js` (sr-only + focus-visible) | role-match |
| `tests/a11y/focus-trap.test.js` | integration (focus restoration) | none — first focus-trap test | novel — RESEARCH §Pattern 10 |
| `tests/integration/chapter-overlap-ch6.test.js` | architectural defensive | `tests/components/ScrollShell.theme-isolation-phase4.test.js` | exact (extend ch6) |
| `tests/i18n/mantra-parity.test.js` | architectural (i18n keys present) | `tests/i18n/parity.test.js` | exact (extend or auto-cover) |

---

## Pattern Assignments

### NEW: `src/phaser/index.js` (factory, request-response)

**Role:** Export `createGame(parentEl, { prefersReduced })` que devuelve `new Phaser.Game(config)`. Configura `pixelArt:true`, `roundPixels:true`, `scale.mode: Phaser.Scale.NONE`, integer zoom via `Math.floor`, registry `prefersReduced` flag.

**Closest analog:** **NONE** — primer integration Phaser. Source-of-truth: **RESEARCH.md §Pattern 1 (lines 354-396)** + **§Pattern 3 (lines 558-580)**.

**Critical claims (PHA-01..03):**
- `Phaser.Scale.NONE` + `Math.floor(vw/480, vh/270) || 1` (defensive fallback)
- `parent: parentEl` (DOM node, NO id string — race-condition guard)
- `physics: { default: 'none' }` (bundle saving ~30KB)
- `callbacks.preBoot` sets `game.registry.set('prefersReduced', !!prefersReduced)`

**Verbatim skeleton (from RESEARCH §Pattern 1):**
```js
// src/phaser/index.js
import Phaser from 'phaser'
import { SpaceScene } from './SpaceScene'

const BASE_W = 480
const BASE_H = 270

function computeZoom() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return Math.min(Math.floor(vw / BASE_W), Math.floor(vh / BASE_H)) || 1
}

export function createGame(parentEl, { prefersReduced } = {}) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentEl,
    width: BASE_W,
    height: BASE_H,
    zoom: computeZoom(),
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#1a0e3d',
    transparent: false,
    physics: { default: 'none' },
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [SpaceScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('prefersReduced', !!prefersReduced)
      },
    },
  })
}
```

---

### NEW: `src/phaser/SpaceScene.js` (Phaser scene, event-driven)

**Role:** Class extends `Phaser.Scene`. `preload()` loads 6-8 sprite assets. `create()` builds bg parallax layers + 3 planets + 2 ships + arrival camera tween + tooltip layer + locale listener + project click handlers. `update()` (minimal — ship loops use tweens, no per-frame logic needed).

**Closest analog:** **NONE** — primer scene Phaser. Source-of-truth: **RESEARCH.md §Pattern 5 (locale), §Pattern 6 (click bridge), §Pattern 7 (arrival camera), §Pattern 8 (ships loop), §Pattern 9 (PRM via registry), §Pattern 13 (i18n singleton)**.

**Verbatim core pattern (arrival + planets + ships) from RESEARCH §Pattern 7 lines 801-852:**
```js
create() {
  const prefersReduced = this.registry.get('prefersReduced')

  // Parallax layers
  this.add.image(240, 135, 'ch6-bg-stars-far').setScrollFactor(0.2).setOrigin(0.5, 0.5)
    .setDisplaySize(480, 270 * 4)
  this.add.image(240, 135, 'ch6-bg-nebulae-mid').setScrollFactor(0.5).setOrigin(0.5, 0.5)
    .setDisplaySize(480, 270 * 4)

  // 3 planets distributed vertically (Y from data.planetOrbit 0..1)
  const ARRIVAL_DESCENT = 270 * 3
  this.projectsData.forEach((proj, idx) => {
    const planet = this.add.sprite(240, proj.planetOrbit * ARRIVAL_DESCENT + 135,
      `ch6-planet-${proj.id.replace('ch6-', '')}`)
    planet.setScrollFactor(1.0)
    // ... setInteractive Pattern 6 ...
    this.planets.push(planet)
  })

  // Arrival cinematic camera tween
  this.cameras.main.setScroll(0, 0)
  if (prefersReduced) {
    this.cameras.main.setScroll(0, ARRIVAL_DESCENT - 135)
    this.game.events.emit('vue:arrival-complete')
  } else {
    this.tweens.add({
      targets: this.cameras.main,
      scrollY: ARRIVAL_DESCENT - 135,
      duration: 3500,
      ease: 'Power2.easeOut',
      onComplete: () => this.game.events.emit('vue:arrival-complete'),
    })
  }
}
```

**Bridge pattern (Pattern 6 lines 723-745):**
```js
planet.setInteractive(
  new Phaser.Geom.Circle(planet.width / 2, planet.height / 2, planet.width / 2 + 16),
  Phaser.Geom.Circle.Contains
)
planet.on('pointerdown', () => {
  this.game.events.emit('vue:show-project', this.projectsData[idx].id)
})
```

**Locale listener pattern (Pattern 5 lines 689-707):**
```js
import { i18n } from '@/i18n'
// ...
this.game.events.on('locale-changed', this.handleLocaleChange, this)
this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
  this.game.events.off('locale-changed', this.handleLocaleChange, this)
})

handleLocaleChange(locale) {
  this.tooltipTexts.forEach(({ tooltip, titleKey }) => {
    if (tooltip.visible) tooltip.setText(i18n.global.t(titleKey))
  })
}
```

**Anti-patterns to avoid (RESEARCH §Anti-Patterns lines 1320-1339):**
- NO `forge_animation` (character animation pixelforge incoherente)
- NO Phaser physics
- NO new i18n instance — singleton import only
- NO EventBus singleton — `game.events` directly
- NO `wheel`/`touchmove` capture (rompe scroll-snap)

---

### NEW: `src/components/Chapter6Content.vue` (component, event-driven)

**Role:** Wrapper Vue. `shallowRef(game)`, `watch(activeChapter)` mount/destroy lifecycle, `useResizeObserver`, locale bridge emit, PRM injection, 3 sr-only A11Y buttons, mantra fade-in, `<ProjectOverlay>` v-if.

**Closest analog:** **`src/components/Chapter4Content.vue`** (layout shell + inject scrollState/prm + projects filter computed) — **partial match ~40%**. Chapter6Content NO usa 2-col grid (canvas full-bleed) y NO usa FloatingPanel; PERO reusa el pattern de:
1. `inject('scrollState')` + `inject('prm')` (RESEARCH §Pattern 1 + Chapter4Content lines 18-19)
2. `computed(() => projects.filter(p => p.chapterEra === N))` (Chapter4Content line 29)
3. SFC structure: `<script setup>` + `<template>` + `<style scoped>`
4. `chapters[N]` lookup pattern (`chapter.avatarSrc`, `chapter.titleKey`)

**Layout difference:** Chapter4Content tiene `.ch4-layout { display: grid; grid-template-columns: 200px 1fr }`; Chapter6Content tiene `.ch6-layout { position: relative; width: 100%; height: 100%; NO overflow:hidden }` con `.ch6-canvas-host { position: absolute; inset: 0 }` (RESEARCH §Pattern 12 lines 1240-1260 — explicit mitigation for chapter-overlap bug Phase 4).

**Excerpt analog (Chapter4Content.vue lines 17-30 — inject + filter pattern):**
```js
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import ParallaxLayers from './ParallaxLayers.vue'
import FloatingPanel from './FloatingPanel.vue'

const { t } = useI18n()

const chapter = chapters[4]
const ch4Projects = computed(() => projects.filter((p) => p.chapterEra === 4))
</script>
```

**Verbatim Phase 5 skeleton (RESEARCH §Pattern 1 lines 407-471) — copy + adapt:**
```vue
<script setup>
import { shallowRef, ref, watch, onBeforeUnmount, inject, useTemplateRef, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useResizeObserver } from '@vueuse/core'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import ProjectOverlay from './ProjectOverlay.vue'

const { activeChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')
const { locale, t } = useI18n()

const game = shallowRef(null)  // PHA-01: shallowRef, NEVER ref/reactive
const canvasHostRef = useTemplateRef('canvasHost')
const arrivalDone = ref(false)
const activeProject = ref(null)
const ch6Projects = computed(() => projects.filter((p) => p.chapterEra === 6))

watch(activeChapter, async (v) => {
  if (v === 6 && !game.value) {
    if (!canvasHostRef.value) await nextTick()
    const { createGame } = await import('@/phaser')  // PHA-04 lazy
    game.value = createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })
    game.value.events.on('vue:show-project', (id) => { activeProject.value = id })
    game.value.events.on('vue:arrival-complete', () => { arrivalDone.value = true })
  } else if (v !== 6 && game.value) {
    game.value.destroy(true, false)  // PHA-02
    game.value = null
    arrivalDone.value = false
    activeProject.value = null
  }
}, { immediate: true, flush: 'post' })

watch(locale, (l) => {
  game.value?.events.emit('locale-changed', l)  // PHA-06
})

useResizeObserver(document.documentElement, () => {
  if (!game.value) return
  const newZoom = Math.min(Math.floor(window.innerWidth / 480),
                           Math.floor(window.innerHeight / 270)) || 1
  if (newZoom !== game.value.scale.zoom) game.value.scale.setZoom(newZoom)
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.value?.destroy(true, false)
    game.value = null
  })
}

onBeforeUnmount(() => {
  game.value?.destroy(true, false)
  game.value = null
})
</script>

<template>
  <div class="ch6-layout">
    <div ref="canvasHost" class="ch6-canvas-host" aria-hidden="true" />

    <!-- D5-06 sr-only keyboard A11Y -->
    <button v-for="p in ch6Projects" :key="p.id" type="button"
            class="ch6-planet-trigger sr-only"
            :aria-label="t('ui.openProject') + ': ' + t(p.titleKey)"
            @click="activeProject = p.id" />

    <p v-if="arrivalDone" class="ch6-mantra">{{ t('chapters.6.mantra') }}</p>

    <ProjectOverlay v-if="activeProject" :project-id="activeProject"
                    @close="activeProject = null" />
  </div>
</template>
```

**Critical: difference from Chapter4Content:**
- NO `.ch4-layout { overflow: hidden }` — explicit mitigation chapter-overlap bug (Pattern 12)
- NO `<aside class="ch4-meta">` avatar block — StickyAvatar already global
- NO 2-col grid — canvas full-bleed

---

### NEW: `src/components/ProjectOverlay.vue` (modal/dialog, request-response)

**Role:** Modal Vue synthwave. ESC + click-outside + focus trap + restore focus. `role="dialog"`, `aria-modal="true"`. Mobile fullscreen. PRM instant.

**Closest analog:** **LOOSE — `src/components/FloatingPanel.vue` (DOM shape only — slot pattern) + `src/components/ContactHUD.vue` (fixed overlay z-index + i18n aria-label)**.

**Why not FloatingPanel:** D5-07 explicit: "NO reusa FloatingPanel — era distinta synthwave neon vs AR/VR glass". FloatingPanel sirve solo como reference for SFC structure + slot/title pattern (FloatingPanel.vue lines 18-32, all 14 lines).

**Why not ContactHUD:** structure-wise no es modal, es HUD persistente. Pero sirve para: `position: fixed` + `z-index` layering + SVG inline icons + `aria-label` + `@vueuse/core` integration patterns.

**Excerpt analog (FloatingPanel.vue lines 18-32 — minimal SFC structure with optional title):**
```vue
<script setup>
defineProps({
  title: { type: String, default: '' },
})
</script>

<template>
  <article class="floating-panel">
    <h3 v-if="title" class="floating-panel__title">{{ title }}</h3>
    <slot />
  </article>
</template>
```

**Excerpt analog (ContactHUD.vue lines 28-43 — fixed overlay + i18n aria pattern):**
```vue
<template>
  <div class="contact-hud" :aria-label="t('contact.hudAria')">
    <a
      :href="emailDisabled ? undefined : `mailto:${contact.email}`"
      class="contact-icon"
      :aria-label="t('contact.emailAria')"
      :aria-disabled="emailDisabled ? 'true' : undefined"
    >
      <!-- SVG inline -->
    </a>
  </div>
</template>
```

**Verbatim Phase 5 skeleton (RESEARCH §Pattern 10 lines 947-1059) — copy + adapt:**
```vue
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, inject, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { projects } from '@/data/projects'

const props = defineProps({ projectId: { type: String, required: true } })
const emit = defineEmits(['close'])

const { t } = useI18n()
const { prefersReduced } = inject('prm')
const project = computed(() => projects.find((p) => p.id === props.projectId))

const overlayRef = useTemplateRef('overlay')
const closeBtnRef = useTemplateRef('closeBtn')
let lastFocusedEl = null

function handleKeydown(e) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'Tab') trapTab(e)
}

function trapTab(e) {
  if (!overlayRef.value) return
  const focusables = overlayRef.value.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus()
  }
}

function handleBackdropClick(e) {
  if (e.target === overlayRef.value) emit('close')
}

onMounted(() => {
  lastFocusedEl = document.activeElement
  setTimeout(() => closeBtnRef.value?.focus(), 0)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  lastFocusedEl?.focus()
})
</script>

<template>
  <div ref="overlay" class="project-overlay" role="dialog" aria-modal="true"
       :aria-labelledby="`project-${projectId}-title`" @click="handleBackdropClick">
    <article class="project-overlay__card">
      <button ref="closeBtn" type="button" class="project-overlay__close"
              :aria-label="t('ui.closeOverlay')" @click="emit('close')">
        <span aria-hidden="true">×</span>
      </button>
      <h2 :id="`project-${projectId}-title`" class="project-overlay__title">
        {{ t(project.titleKey) }}
      </h2>
      <p class="project-overlay__year">{{ project.year }}</p>
      <p class="project-overlay__role">{{ project.role }}</p>
      <ul class="project-overlay__tech">
        <li v-for="tech in project.techStack" :key="tech">{{ tech }}</li>
      </ul>
      <p class="project-overlay__desc">{{ t(project.descKey) }}</p>
      <a v-if="project.link" :href="project.link" target="_blank"
         rel="noopener noreferrer" class="project-overlay__link">
        {{ t('ui.openProject') }} →
      </a>
    </article>
  </div>
</template>
```

**Decision the planner owes:** `@vueuse/integrations` `useFocusTrap` vs manual ~30 LOC. Manual is simpler (5 focusables, no extra dep). RESEARCH §Don't Hand-Roll table lines 1350 left it open.

---

### MODIFIED: `src/components/ScrollShell.vue` (router/insertion point)

**Role:** Reemplazar `<div v-else class="chapter-placeholder">` con `<Chapter6Content v-else-if="ch.id === 6" />`.

**Closest analog:** **SELF** — pattern ya establecido con Chapter0..5Content imports + v-else-if chain. Exact match (extend by one).

**Excerpt analog (ScrollShell.vue current state lines 22-96 — pattern to extend):**
```vue
<script setup>
import Chapter0Content from './Chapter0Content.vue'
import Chapter1Content from './Chapter1Content.vue'
import Chapter2Content from './Chapter2Content.vue'
import Chapter3Content from './Chapter3Content.vue'
import Chapter4Content from './Chapter4Content.vue'
import Chapter5Content from './Chapter5Content.vue'
// + import Chapter6Content from './Chapter6Content.vue'   <-- ADD
</script>

<template>
  <main ...>
    <section v-for="ch in chapters" :data-chapter="ch.id" ...>
      <Chapter0Content v-if="ch.id === 0" />
      <Chapter1Content v-else-if="ch.id === 1" />
      <Chapter2Content v-else-if="ch.id === 2" />
      <Chapter3Content v-else-if="ch.id === 3" />
      <Chapter4Content v-else-if="ch.id === 4" />
      <Chapter5Content v-else-if="ch.id === 5" />
      <!-- <Chapter6Content v-else-if="ch.id === 6" />   ADD -->
      <div v-else class="chapter-placeholder">
        <!-- placeholder cae solo si ch.id === 6 currently — Phase 5 removes -->
      </div>
    </section>
  </main>
</template>
```

**Planner note:** Confirmar si `<div v-else class="chapter-placeholder">` se queda como dead-branch defensive o se elimina completamente (no hay otro ch sin component custom post-Phase 5).

---

### MODIFIED: `src/data/chapters.js` (data record)

**Role:** Poblar `chapters[6].palette` con paleta synthwave D5-04.

**Closest analog:** **SELF** — pattern Phase 2 stub-fill (ch2, ch4, ch5 ya tienen array poblado). Exact match.

**Excerpt analog (chapters.js lines 42-44 — ch2 stub→populated example):**
```js
{
  id: 2,
  year: 2009,
  era: 'Flash',
  // ...
  palette: ['#2a1a4a', '#e0c0ff', '#ff8800', '#8060c0', '#ffaa00'],  // 4-5 hex
},
```

**Phase 5 fill (D5-04 locked):**
```js
{
  id: 6,
  year: 2026,
  era: 'Phaser',
  eraKey: 'chapters.6.era',
  titleKey: 'chapters.6.title',
  avatarSrc: '/assets/ch6-bust.png',
  palette: ['#1a0e3d', '#ff3ca6', '#4dffff', '#ffd95c'],  // optional 5th: '#0a061f'
},
```

---

### MODIFIED: `src/data/projects.js` (data record)

**Role:** Añadir 3 items chapterEra=6 (ch6-ar-vr, ch6-remoose, ch6-software-mind) con campos Phaser `planetSprite/planetOrbit/planetColor` poblados.

**Closest analog:** **SELF** — 10 items ya existentes en ch2/ch4/ch5 son template exacta. Phase 5 es el primer set con planet* != null. Exact match.

**Excerpt analog (projects.js lines 68-81 — ch4 stub as template):**
```js
{
  id: 'ch4-arvr-own',
  chapterEra: 4,
  year: 2015,
  titleKey: 'projects.ch4-arvr-own.title',
  descKey: 'projects.ch4-arvr-own.desc',
  link: null,
  imageSrc: null,
  role: 'Founder / Tech Lead',
  techStack: ['Unity', 'ARKit', 'Vuforia'],
  planetSprite: null,   // <-- Phase 5 ch6 items: poblar
  planetOrbit: null,    // <-- 0..1 Y-normalized within arrival descent
  planetColor: null,    // <-- hex of halo neon-orb
},
```

**Phase 5 ch6 fill skeleton (D5-01 locked + RESEARCH §Pattern 7 orbit math):**
```js
{
  id: 'ch6-ar-vr',
  chapterEra: 6,
  year: 2015,
  titleKey: 'projects.ch6-ar-vr.title',
  descKey: 'projects.ch6-ar-vr.desc',
  link: null,
  imageSrc: null,
  role: 'Founder / Tech Lead',
  techStack: ['Unity', 'ARKit'],
  planetSprite: '/assets/ch6-planet-ar-vr.png',
  planetOrbit: 0.2,           // arriba (chronological earliest)
  planetColor: '#ff3ca6',     // hot pink
},
// + ch6-remoose: planetOrbit: 0.5, planetColor: '#4dffff'
// + ch6-software-mind: planetOrbit: 0.8, planetColor: '#ffd95c'
```

**Test contract enforcement:** `tests/data/projects.test.js` T2 verifica los 12 campos D3-03 exactos. NO añadir campos nuevos (planner: si surge necesidad, requiere D-decision separada).

---

### MODIFIED: `src/styles/chapter-themes.css` (theme block + @layer components)

**Role:** Finalizar `[data-chapter="6"]` block con paleta synthwave + `--bg-image: url('/assets/ch6-bg.png')`. Añadir `@layer components` reglas para `.ch6-layout`, `.ch6-canvas-host`, `.ch6-mantra`, `.project-overlay`.

**Closest analog:** **SELF** — el patrón `[data-chapter="4"]` (Phase 4 W3) y `[data-chapter="2"]` (Phase 4 W2) ya finalizados son template exacta. Exact match.

**Excerpt analog (chapter-themes.css lines 64-77 — ch2 finalized block):**
```css
[data-chapter="2"] {
  --c-bg: #2a1a4a;
  --c-fg: #e0c0ff;
  --c-accent: #ff8800;
  --c-border: #8060c0;
  --c-focus: #ffaa00;
  --c-surface: #1a0a3a;
  --bg-image: url('/assets/ch2-bg.jpg');
  --font-body: 'Verdana', 'Trebuchet MS', sans-serif;
  /* contrast(...) = X:1 — chapter 2 (Flash era) — Phase 4 W2 ✓ */
}
```

**Excerpt analog (chapter-themes.css lines 348-388 — `@layer components` block for ch4 FloatingPanel — analog for ch6 ProjectOverlay):**
```css
[data-chapter="4"] .floating-panel {
  position: relative;
  z-index: 4;
  padding: var(--sp-lg);
  background-color: rgba(10, 15, 46, 0.4);
  border: 1px solid var(--c-accent);
  border-radius: 8px;
  box-shadow:
    0 0 20px rgba(0, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: var(--c-fg);
  margin-bottom: var(--sp-md);
}

@supports ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {
  [data-chapter="4"] .floating-panel {
    background-color: rgba(10, 15, 46, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}
```

**Phase 5 ch6 theme block (D5-04 + RESEARCH §Pattern 12 mitigation):**
```css
[data-chapter="6"] {
  --c-bg: #1a0e3d;                       /* deep purple D5-04 */
  --c-fg: #c0e0ff;                       /* keep readable on bg */
  --c-accent: #4dffff;                   /* electric cyan */
  --c-accent-2: #ff3ca6;                 /* hot pink */
  --c-mantra: #ffd95c;                   /* soft amber easter egg */
  --c-border: #4dffff;
  --c-focus: #ffd95c;
  --c-surface: #0a061f;                  /* near-black starfield contrast */
  --bg-image: url('/assets/ch6-bg.png'); /* BackgroundLayers crossfade ch5→ch6 */
  --font-body: 'Audiowide', sans-serif;
  /* contrast(#c0e0ff, #1a0e3d) = X:1 — Phase 5 ✓ */
}
```

**Phase 5 ch6 @layer components additions (RESEARCH §Pattern 11 mantra + §Pattern 12 layout + §Pattern 10 overlay):**
```css
@layer components {
  /* ... existing ch3/ch4/ch5 blocks ... */

  /* Phase 5 — ch6 canvas full-bleed (D5-09 + Pattern 12) */
  [data-chapter="6"] .ch6-layout {
    position: relative;
    width: 100%;
    height: 100%;
    /* NO overflow:hidden — Pattern 12 mitigation chapter-overlap bug */
  }
  [data-chapter="6"] .ch6-canvas-host {
    position: absolute;
    inset: 0;
  }
  [data-chapter="6"] .ch6-canvas-host canvas {
    display: block;
  }

  /* Phase 5 — mantra easter egg (Pattern 11) */
  [data-chapter="6"] .ch6-mantra {
    position: absolute;
    bottom: calc(80px + env(safe-area-inset-bottom, 0));
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Audiowide', sans-serif;
    font-size: clamp(1rem, 3vw, 1.5rem);
    color: #ffd95c;
    text-shadow: 0 0 12px rgba(255, 217, 92, 0.6);
    opacity: 0;
    animation: mantra-fade-in 400ms ease-out forwards;
    pointer-events: none;
    text-align: center;
    z-index: 40;
  }
  @keyframes mantra-fade-in {
    from { opacity: 0; transform: translate(-50%, 8px); }
    to   { opacity: 1; transform: translate(-50%, 0); }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-chapter="6"] .ch6-mantra { animation: none; opacity: 1; }
  }

  /* Phase 5 — ProjectOverlay synthwave (Pattern 10) */
  .project-overlay { /* fixed, blur, glow — full snippet RESEARCH §Pattern 10 */ }
}
```

**Test extends auto:** `tests/styles/themes-file.test.js` T4 expects `[data-chapter="N"]` selectors 0..6 — ch6 stub ya existe, Phase 5 finalize.

---

### MODIFIED: `src/i18n/{es,en}.json` (i18n keys)

**Role:** Añadir keys `chapters.6.{title,era,flavor,mantra}` + `projects.ch6-{ar-vr,remoose,software-mind}.{title,desc,role}` + `ui.closeOverlay` + (opcional) `tooltip.planet.*`. ES y EN simultáneo enforced.

**Closest analog:** **SELF** — Phase 4 W2/W3/W4 ya añadió `chapters.{2,4,5}.*` y `projects.ch{2,4,5}-*.*` simultáneo. Exact match.

**Test contract enforcement:** `tests/i18n/parity.test.js` T1 (flatten EN ↔ ES exact equality) ya auto-cubre los nuevos keys. Cero código nuevo de test — solo añadir keys.

**Excerpt analog (parity.test.js lines 24-29 — T1 auto-covers):**
```js
it('T1 — en.json y es.json tienen exactamente las mismas keys', () => {
  const enKeys = flatten(en).sort()
  const esKeys = flatten(es).sort()
  expect(enKeys).toEqual(esKeys)
})
```

**Phase 5 keys to add (RESEARCH §Pattern 11 mantra example):**
```json
{
  "chapters": {
    "6": {
      "title": "...",
      "era": "Phaser / AI",
      "flavor": "...",
      "mantra": "Y siempre muestra una sonrisa"   // ES — Rafael ratifica W5
    }
  },
  "projects": {
    "ch6-ar-vr": { "title": "...", "desc": "...", "role": "..." },
    "ch6-remoose": { "title": "...", "desc": "...", "role": "..." },
    "ch6-software-mind": { "title": "...", "desc": "...", "role": "..." }
  },
  "ui": {
    "closeOverlay": "Cerrar"   // EN: "Close"
  }
}
```

---

### NEW: `public/assets/ch6-*.png` (pixel-art assets)

**Role:** 1 bg + (0-2 opt parallax bgs) + 3 planets + 2 ships = 6-8 PNG files.

**Closest analog:** **`public/assets/ch4-*` (Phase 4 W3) + `public/assets/ch2-bg.jpg` (Phase 4 W2)** — exact same forge calls + Adobe post-process pattern.

**Existing assets evidencia (chapter-themes.css line 71 + ParallaxLayers.vue lines 26-31):**
```js
// ParallaxLayers.vue — Phase 4 W3 generated assets:
const layers = [
  { src: '/assets/ch4-bg-stars-far.jpg', factor: 0.2, name: 'stars' },
  { src: '/assets/ch4-bg-planet-mid.jpg', factor: 0.5, name: 'planet' },
  { src: '/assets/ch4-fg-panels.png', factor: 0.8, name: 'panels' },
  { src: '/assets/ch4-fg-ships.png', factor: 1.0, name: 'ships' },
]
```

**Generation pattern (CLAUDE.md §4 + RESEARCH.md §Asset Pipeline lines 1469-1620):**
- `ch6-bg.png` (or `.jpg` if opaque) → `forge_background` (NO bg removal)
- `ch6-planet-*.png` → `forge_sprite` with `background: "night"` preset (NEVER `"black"`/`"white"` — Pitfall 6.2)
- `ch6-ship-*.png` → `forge_sprite` with `background: "night"` preset
- Pass `palette: chapters[6].palette` explicit in each call (ART-06)
- Adobe MCP post-process if alpha not clean → `image_remove_background`
- Target size: bg ≤80KB (Phase 6 blocker carry-forward)

**Test extends auto:** `tests/assets/asset-naming.test.js` regex `^ch[0-6]-(bust|bg|bg-stars-far|bg-planet-mid|fg-panels|fg-ships|hero)\.(png|jpg)$` debe extenderse para incluir `planet-(ar-vr|remoose|software-mind)` + `ship-(1|2)` + opcional `bg-nebulae-mid`. **NOTA del checker:** ch6 introduce descriptors NUEVOS NO listados en regex actual — el regex enum DEBE actualizarse en W0.

**Excerpt analog (asset-naming.test.js lines 50-51 — regex to extend):**
```js
const ASSET_NAMING_REGEX =
  /^ch[0-6]-(bust|bg|bg-stars-far|bg-planet-mid|fg-panels|fg-ships|hero)\.(png|jpg)$/
// Phase 5 W0: extender a:
//   /^ch[0-6]-(bust|bg|bg-stars-far|bg-planet-mid|bg-nebulae-mid|
//              fg-panels|fg-ships|hero|
//              planet-(ar-vr|remoose|software-mind)|ship-[12])\.(png|jpg)$/
```

---

### NEW: `tests/assets/ch6-assets.test.js` (architectural)

**Closest analog:** **`tests/assets/asset-naming.test.js`** — clone shape. Exact match.

**Excerpt analog (asset-naming.test.js lines 28-58 — readdirSync + regex + existsSync pattern):**
```js
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ASSETS_DIR = resolve(process.cwd(), 'public/assets')

function imageFilesInAssets() {
  if (!existsSync(ASSETS_DIR)) return []
  return readdirSync(ASSETS_DIR).filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
}

describe('ch6 assets existence (Phase 5 W2 gate)', () => {
  it('T1: ch6-bg.png exists', () => {
    expect(existsSync(resolve(ASSETS_DIR, 'ch6-bg.png'))).toBe(true)
  })
  it('T2: 3 planets ch6-planet-{ar-vr,remoose,software-mind}.png exist', () => {
    ['ar-vr', 'remoose', 'software-mind'].forEach((slug) => {
      expect(existsSync(resolve(ASSETS_DIR, `ch6-planet-${slug}.png`))).toBe(true)
    })
  })
  it('T3: 2 ships ch6-ship-{1,2}.png exist', () => {
    expect(existsSync(resolve(ASSETS_DIR, 'ch6-ship-1.png'))).toBe(true)
    expect(existsSync(resolve(ASSETS_DIR, 'ch6-ship-2.png'))).toBe(true)
  })
})
```

---

### NEW: `tests/phaser/{factory,scale,space-scene-shape,no-character-animation}.test.js` (source-regex)

**Closest analog:** **`tests/styles/themes-file.test.js`** — `readFileSync` + regex match pattern. Role-match (different file type but same testing technique). Also analog: `tests/assets/asset-naming.test.js` T3 (anti-pattern regex).

**Excerpt analog (themes-file.test.js lines 22-50 — readFileSync + regex pattern):**
```js
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const CSS_PATH = resolve(process.cwd(), 'src/styles/chapter-themes.css')
let source = ''
try { source = readFileSync(CSS_PATH, 'utf8') } catch (_) { source = '' }

describe('themes-file.test.js — @layer architecture', () => {
  it('T1: file exists and non-empty', () => {
    expect(existsSync(CSS_PATH)).toBe(true)
    expect(source.length).toBeGreaterThan(0)
  })
  it('T2: contains @layer reset, themes, components, utilities', () => {
    expect(source).toMatch(/@layer\s+reset\s*,\s*themes\s*,\s*components\s*,\s*utilities\s*;/)
  })
})
```

**Phase 5 phaser/factory.test.js skeleton (RESEARCH §Pattern 3 lines 591-601 verbatim test pattern):**
```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FACTORY_PATH = resolve(process.cwd(), 'src/phaser/index.js')
const src = readFileSync(FACTORY_PATH, 'utf8')

describe('phaser factory (PHA-01..03)', () => {
  it('PHA-03: Phaser.Scale.NONE present', () => {
    expect(src).toMatch(/Phaser\.Scale\.NONE/)
  })
  it('PHA-03: Math.floor zoom present', () => {
    expect(src).toMatch(/Math\.floor\s*\(/)
  })
  it('PHA-03: pixelArt: true present', () => {
    expect(src).toMatch(/pixelArt:\s*true/)
  })
  it('PHA-03: roundPixels: true present', () => {
    expect(src).toMatch(/roundPixels:\s*true/)
  })
  it('PHA-config: physics default none (anti-pattern guard)', () => {
    expect(src).toMatch(/physics:\s*\{\s*default:\s*['"]none['"]/)
  })
  it('PHA-config: parent: parentEl (DOM node, NOT string id)', () => {
    expect(src).toMatch(/parent:\s*parentEl/)
  })
})
```

**Phase 5 phaser/no-character-animation.test.js (anti-pattern guard PHA-08):**
```js
const SCENE_SOURCE = readFileSync(resolve(process.cwd(), 'src/phaser/SpaceScene.js'), 'utf8')

describe('PHA-08: NO character animation', () => {
  it('does not call this.anims.create()', () => {
    expect(SCENE_SOURCE).not.toMatch(/this\.anims\.create/)
  })
  it('does not use spritesheet frames', () => {
    expect(SCENE_SOURCE).not.toMatch(/spritesheet.*frames/)
  })
  it('does not call playAnimation', () => {
    expect(SCENE_SOURCE).not.toMatch(/play(Animation)?\s*\(/)
  })
})
```

---

### NEW: `tests/phaser/locale-bridge.test.js` + `tests/phaser/prm.test.js` (integration)

**Closest analog:** **`tests/components/ParallaxLayers.test.js`** — PRM mock + provide pattern. Exact match for `prm.test.js`. Role-match for `locale-bridge.test.js` (uses mock event emitter instead of inject provide).

**Excerpt analog (ParallaxLayers.test.js lines 25-37 — PRM mock pattern):**
```js
function mountParallax({ scrollProgress = 0, prefersReduced = false } = {}) {
  const sp = ref(scrollProgress)
  const pr = ref(prefersReduced)
  const wrapper = mount(ParallaxLayers, {
    global: {
      provide: {
        scrollState: { scrollProgress: sp },
        prm: { prefersReduced: pr },
      },
    },
  })
  return { wrapper, sp, pr }
}
```

**Phase 5 phaser/prm.test.js skeleton (RESEARCH §Common Operation 4 lines 1799-1819 mockgame pattern):**
```js
// Mock Phaser game.events + registry — verify SpaceScene reads prefersReduced
import { describe, it, expect, vi } from 'vitest'

function mockGame({ prefersReduced = false } = {}) {
  return {
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    registry: { get: vi.fn((k) => k === 'prefersReduced' ? prefersReduced : null) },
  }
}

describe('SpaceScene PRM behavior', () => {
  it('PRM=true → arrival camera scrollY set instantly (no tween)', () => {
    // Source-level regex en SpaceScene.js
    const src = readFileSync('src/phaser/SpaceScene.js', 'utf8')
    expect(src).toMatch(/prefersReduced[\s\S]*setScroll[\s\S]*ARRIVAL_DESCENT/)
    expect(src).toMatch(/this\.game\.events\.emit\(['"]vue:arrival-complete['"]\)/)
  })
})
```

---

### NEW: `tests/components/Chapter6Content*.test.js` (5 files: base, lazy, bridge, resize, prm) (integration)

**Closest analog:** **`tests/components/Chapter4Content.test.js`** — exact clone shape (inject + mount + i18n + projects mock + readFileSync source markers). Exact match.

**Excerpt analog (Chapter4Content.test.js lines 24-75 — full setup pattern):**
```js
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter4Content from '@/components/Chapter4Content.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    { id: 'ch4-arvr-own', chapterEra: 4, /* ... shape D3-03 ... */ },
    { id: 'ch5-x', chapterEra: 5, /* filtered out by computed */ },
  ],
}))

const CH4_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter4Content.vue'),
  'utf8'
)

function mountCh4({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter4Content, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { scrollProgress: ref(4.5 / 7) },
        prm: { prefersReduced: ref(false) },
      },
    },
  })
  return { wrapper, i18n }
}
```

**Phase 5 Chapter6Content.test.js skeleton — adapt with `activeChapter` watch + Phaser mock:**
```js
vi.mock('@/phaser', () => ({
  createGame: vi.fn(() => ({
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    scale: { zoom: 3, setZoom: vi.fn() },
    destroy: vi.fn(),
  })),
}))

function mountCh6({ locale = 'es', activeChapter: ac = 6, prefersReduced = false } = {}) {
  const activeChapter = ref(ac)
  const pr = ref(prefersReduced)
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter6Content, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter, scrollProgress: ref(6 / 7), scrollToChapter: vi.fn() },
        prm: { prefersReduced: pr },
      },
    },
  })
  return { wrapper, activeChapter, i18n }
}

describe('Chapter6Content lifecycle (PHA-01..04)', () => {
  it('PHA-04: dynamic import called when activeChapter=6', async () => {
    const { createGame } = await import('@/phaser')
    mountCh6({ activeChapter: 6 })
    await flushPromises()
    expect(createGame).toHaveBeenCalledTimes(1)
  })
  it('PHA-02: destroy(true, false) called when activeChapter !== 6', async () => {
    const { wrapper, activeChapter } = mountCh6({ activeChapter: 6 })
    await flushPromises()
    activeChapter.value = 5
    await flushPromises()
    // Verify destroy called on mock game
  })
})
```

---

### NEW: `tests/components/ProjectOverlay.test.js` + `tests/a11y/{keyboard-planet-buttons,focus-trap}.test.js`

**Closest analog:** **`tests/components/LangToggle.test.js`** (keyboard events + aria-label) + **`tests/components/SkipLink.test.js`** (sr-only + focus-visible). Role-match.

**Phase 5 ProjectOverlay.test.js skeleton (RESEARCH §Pattern 10 — verify focus-trap behavior):**
```js
describe('ProjectOverlay (D5-07)', () => {
  it('ESC key emits close', async () => {
    const wrapper = mount(ProjectOverlay, { /* projectId prop */ })
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toBeTruthy()
  })
  it('click on backdrop emits close', async () => {
    const wrapper = mount(ProjectOverlay, { /* ... */ })
    await wrapper.find('.project-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
  it('focus trap: Tab from last → first focusable', async () => {
    // Mount, focus last, fire Tab → expect document.activeElement === first
  })
  it('restore focus to lastFocusedEl on unmount', () => {
    // Mount with prior focus set, unmount, expect activeElement restored
  })
})
```

---

### NEW: `tests/integration/chapter-overlap-ch6.test.js` (architectural defensive)

**Closest analog:** **`tests/components/ScrollShell.theme-isolation-phase4.test.js`** — full mount + ch-specific assertions. Exact match.

**Excerpt analog (ScrollShell.theme-isolation-phase4.test.js lines 41-73 — chapter-specific DOM assertions):**
```js
it('T2: section[data-chapter="4"] contiene .parallax-layers', () => {
  const wrapper = mountShell()
  const ch4 = wrapper.find('section[data-chapter="4"]')
  expect(ch4.find('.parallax-layers').exists()).toBe(true)
})

it('T6: section[data-chapter="6"] renderea .chapter-placeholder (Phase 5 wire)', () => {
  const wrapper = mountShell()
  const ch6 = wrapper.find('section[data-chapter="6"]')
  expect(ch6.find('.chapter-placeholder').exists()).toBe(true)
})
```

**Phase 5 chapter-overlap-ch6.test.js skeleton (RESEARCH §Pattern 12 lines 1266-1280):**
```js
describe('ch6 stacking context — defensive (Phase 4 bug vigilance)', () => {
  it('T1: ScrollShell renders Chapter6Content (not placeholder)', () => {
    const wrapper = mountShell({ initialChapter: 6 })
    const ch6 = wrapper.find('section[data-chapter="6"]')
    expect(ch6.find('.ch6-layout').exists()).toBe(true)
    expect(ch6.find('.chapter-placeholder').exists()).toBe(false)  // Phase 5 replaces
  })
  it('T2: scroll-snap-stop: always present in ScrollShell', () => {
    const SOURCE = readFileSync(resolve(process.cwd(),
      'src/components/ScrollShell.vue'), 'utf8')
    expect(SOURCE).toMatch(/scroll-snap-stop:\s*always/)
  })
  it('T3: .ch6-layout does NOT have overflow:hidden (Pattern 12 mitigation)', () => {
    const CH6_SOURCE = readFileSync(resolve(process.cwd(),
      'src/styles/chapter-themes.css'), 'utf8')
    // Verify .ch6-layout block does NOT include overflow:hidden
    const ch6Block = CH6_SOURCE.match(
      /\[data-chapter="6"\]\s*\.ch6-layout\s*\{[^}]*\}/s
    )
    expect(ch6Block?.[0]).not.toMatch(/overflow:\s*hidden/)
  })
})
```

---

## Shared Patterns

### 1. inject('scrollState') + inject('prm') (cross-cutting)

**Source:** `src/App.vue` (Phase 1 — provide), consumed by all era-content components.

**Apply to:** `Chapter6Content.vue`, `ProjectOverlay.vue` (only prm), tests via `provide` global mock.

**Concrete excerpt (Chapter4Content.vue analog via ParallaxLayers.vue lines 18-21):**
```js
import { computed, inject } from 'vue'

const { scrollProgress } = inject('scrollState')
const { prefersReduced } = inject('prm')
```

Phase 5 adds `activeChapter` consumption (already provided by useScrollState Phase 1 W2):
```js
const { activeChapter } = inject('scrollState')
```

---

### 2. i18n parity auto-enforced

**Source:** `tests/i18n/parity.test.js` T1 — flatten(en) === flatten(es).

**Apply to:** All new i18n keys (chapters.6.*, projects.ch6-*.*, ui.closeOverlay). NO new test code needed — extending JSON files triggers parity test automatically.

---

### 3. readFileSync + regex for source-level architectural tests

**Source:** `tests/styles/themes-file.test.js`, `tests/assets/asset-naming.test.js`, `tests/components/Chapter{3,4,5}Content.test.js` T6.

**Apply to:** All `tests/phaser/*.test.js` source-regex tests + `tests/integration/chapter-overlap-ch6.test.js` + `tests/components/Chapter6Content-lazy.test.js`.

**Justification:** jsdom NO renderea WebGL — Phaser canvas behavior NO testeable runtime. Source-regex verifica forma del código (lifecycle calls, anti-patterns, config shape) que es el contrato real.

**Pattern (themes-file.test.js lines 16-20):**
```js
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
let source = ''
try { source = readFileSync(resolve(process.cwd(), 'PATH'), 'utf8') } catch (_) { source = '' }
```

---

### 4. createTestI18n helper + mock @/data/projects

**Source:** `tests/i18n/test-helpers.js` (creates i18n instance for tests) + Chapter{3,4,5}Content.test.js inline mock.

**Apply to:** `tests/components/Chapter6Content.test.js`, `tests/components/ProjectOverlay.test.js`.

**Pattern:**
```js
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    { id: 'ch6-ar-vr', chapterEra: 6, /* shape D3-03 */ },
    { id: 'other', chapterEra: 5, /* filtered by computed */ },
  ],
}))

const i18n = createTestI18n({ locale: 'es' })
mount(Chapter6Content, { global: { plugins: [i18n], provide: { ... } } })
```

---

### 5. Asset generation pipeline (artist-creator + artist-editor agents)

**Source:** `.claude/agents/artist-creator.md` + `.claude/skills/crear-arte-pixelforge.md` + Phase 4 W3 asset commits (`art(04-04):` series).

**Apply to:** All 6-8 ch6-* assets.

**Constraints (CLAUDE.md §6):**
- `forge_background` for opaque full-frame (NO bg removal)
- `forge_sprite` with `background: "night"` preset (NEVER `"black"`/`"white"`)
- NO `forge_animation` (PHA-08 + Pitfall 6.4)
- Pass `palette: chapters[6].palette` explicit (ART-06)
- Adobe MCP post-process for clean alpha or precise resize
- Naming `ch6-{descriptor}[-{variant}].png` (ART-05 + asset-naming.test.js regex)

---

## No Analog Found

Files with no close match in the codebase — planner should use RESEARCH.md patterns as source-of-truth:

| File | Role | Data Flow | Reason | Source-of-truth |
|------|------|-----------|--------|-----------------|
| `src/phaser/index.js` | factory | request-response | First Phaser integration in codebase | RESEARCH §Pattern 1 (lines 354-396) + §Pattern 3 |
| `src/phaser/SpaceScene.js` | Phaser scene | event-driven | First Phaser scene; idioms are Phaser-native (not Vue) | RESEARCH §Patterns 5, 6, 7, 8, 9, 13 |
| `tests/components/Chapter6Content-resize.test.js` | integration (ResizeObserver mock) | event-driven | First ResizeObserver-specific test | RESEARCH §Pattern 4 (lines 603-638) |
| `tests/a11y/focus-trap.test.js` | integration (focus restoration) | event-driven | First focus-trap test | RESEARCH §Pattern 10 (lines 940-1059) |

For these 4 files, planner copies the verbatim snippets from RESEARCH.md and adapts variable names — no codebase analog to base the structure on.

---

## Pattern Summary Table

| New/Modified File | Closest Analog | Risk | Reuse % |
|-------------------|----------------|------|---------|
| `src/phaser/index.js` | none (novel) | HIGH | 0% (RESEARCH verbatim) |
| `src/phaser/SpaceScene.js` | none (novel) | HIGH | 0% (RESEARCH verbatim) |
| `Chapter6Content.vue` | `Chapter4Content.vue` | MED | ~40% (inject + filter + SFC structure) |
| `ProjectOverlay.vue` | `FloatingPanel.vue` + `ContactHUD.vue` | MED | ~20% (loose — era/structure both differ) |
| `ScrollShell.vue` (MOD) | self (Phase 1..4 pattern) | LOW | ~100% (extend chain) |
| `chapters.js` (MOD) | self (ch2/4/5 fill) | LOW | ~100% (one-line fill) |
| `projects.js` (MOD) | self (ch4/5 stubs as template) | LOW | ~100% (stub-shape clone + Phaser fields fill) |
| `chapter-themes.css` (MOD) | self (`[data-chapter="4"]` block) | LOW | ~80% (theme block + components additions) |
| `i18n/{es,en}.json` (MOD) | self (Phase 4 keys) | LOW | ~100% (key add) |
| `ch6-*.png` assets | `ch4-*.png` Phase 4 W3 | LOW | ~100% (same forge calls) |
| `tests/assets/ch6-assets.test.js` | `tests/assets/asset-naming.test.js` | LOW | ~80% (clone + new assertions) |
| `tests/phaser/factory.test.js` | `tests/styles/themes-file.test.js` | MED | ~50% (technique match, content novel) |
| `tests/phaser/scale.test.js` | same | MED | ~50% |
| `tests/phaser/space-scene-shape.test.js` | same | MED | ~40% (more assertions) |
| `tests/phaser/no-character-animation.test.js` | `asset-naming.test.js` T3 | MED | ~50% (anti-pattern regex idiom) |
| `tests/phaser/locale-bridge.test.js` | `Chapter4Content.test.js` T5 (locale) | MED | ~40% (mock game.events novel) |
| `tests/phaser/prm.test.js` | `ParallaxLayers.test.js` T5 | LOW | ~70% (PRM mock pattern exact) |
| `tests/components/Chapter6Content.test.js` | `Chapter4Content.test.js` | LOW | ~70% (clone shape; add Phaser mock) |
| `tests/components/Chapter6Content-lazy.test.js` | `themes-file.test.js` | MED | ~50% (readFileSync + regex novel pattern) |
| `tests/components/Chapter6Content-bridge.test.js` | `StickyAvatar.test.js` + `LangToggle.test.js` | MED | ~30% (event listener integration novel) |
| `tests/components/Chapter6Content-resize.test.js` | none (novel) | HIGH | 0% (RESEARCH §Pattern 4) |
| `tests/components/Chapter6Content-prm.test.js` | `ParallaxLayers.test.js` | LOW | ~70% |
| `tests/components/ProjectOverlay.test.js` | `LangToggle.test.js` (keydown) | MED | ~40% (focus trap novel) |
| `tests/a11y/keyboard-planet-buttons.test.js` | `SkipLink.test.js` | MED | ~40% (sr-only pattern reused) |
| `tests/a11y/focus-trap.test.js` | none (novel) | HIGH | 0% (RESEARCH §Pattern 10) |
| `tests/integration/chapter-overlap-ch6.test.js` | `ScrollShell.theme-isolation-phase4.test.js` | LOW | ~80% (extend ch6 assertions) |
| `tests/i18n/mantra-parity.test.js` | `parity.test.js` | LOW | ~100% (auto-extends or trivial extension) |

**Aggregate risk:**
- HIGH-risk files: 4 (Phaser integration novel — RESEARCH is source-of-truth)
- MED-risk files: 10 (partial analog — planner copies analog skeleton + adapts)
- LOW-risk files: 13 (exact analog — self-extension or trivial clone)

---

## Metadata

**Analog search scope:**
- `src/components/*.vue` (21 files inspected, top 5 detailed: Chapter{3,4,5}Content, ParallaxLayers, FloatingPanel, ContactHUD)
- `src/data/*.js` (chapters, projects)
- `src/styles/chapter-themes.css`
- `tests/**/*.test.js` (44 files inspected, top 8 detailed for patterns)
- `.planning/phases/05-phaser-chapter-6/05-{CONTEXT,RESEARCH,VALIDATION}.md`

**Files scanned:** ~70 (read fully or partially via Grep/Glob/Read)

**Pattern extraction date:** 2026-05-14

**Confidence:**
- HIGH: layout patterns, data shape patterns, asset pipeline, i18n parity, theme block extension — all have exact in-codebase analogs
- MEDIUM: test patterns for Phaser source-regex (technique exists, content novel)
- LOW: Chapter6Content lifecycle (novel; RESEARCH §Pattern 1 is the contract) — planner copies verbatim

## PATTERN MAPPING COMPLETE
