---
phase: 4
slug: chapters-0-2-4-5
created: 2026-05-13
status: ready-for-planning
files_new: 27
files_modified: 7
analogs_found: 26
analogs_partial: 1
---

# Phase 4 — Pattern Map

Para cada archivo NUEVO de Phase 4, este mapa identifica el analog más cercano en el código existente (Phase 1/2/3) y extrae el excerpt concreto que el planner debe referenciar en cada task `<read_first>`. Cuando no hay analog directo (TerminalScroll, MarqueeBanner, ScrollRevealCard), se identifica el patrón más cercano y se explicita.

---

## Resumen

| Categoría | Count |
|-----------|-------|
| Componentes Vue nuevos (chapters wrappers) | 5 (`Chapter0Content`, `Chapter1Content`, `Chapter2Content`, `Chapter4Content`, `Chapter5Content`) |
| Componentes Vue nuevos (era-signature) | 6 (`TerminalScroll`, `MarqueeBanner`, `FlashBanner`, `ParallaxLayers`, `FloatingPanel`, `ScrollRevealCard`) |
| Tests nuevos | 12 (1 arquitectural `asset-naming` + 11 component + extension parity guard) |
| Modificaciones | 7 (`ScrollShell.vue`, `chapter-themes.css`, `chapters.js`, `projects.js`, `es.json`, `en.json`, `.gitignore`) |
| Assets pixel-art a commitear | 13 (`ch0..ch6-bust.png` × 7 + `ch2-bg.png` + 4 ch4 layers + `ch5-hero.png`) |
| Total nuevos files (código): | **27** (11 Vue + 12 tests + 4 carpetas-prep) |
| Analogs found (exact + role-match) | **26 / 27** |
| Sin analog directo (1) | `ScrollRevealCard.vue` — único component que importa `useIntersectionObserver` (vueuse) sin precedente en codebase; analog parcial = `useScrollState.js` (`useRafFn` import pattern) |

---

## Tabla principal — File → Analog

| Nuevo archivo | Analog | Match | Líneas relevantes | Reuse | Cambia |
|---------------|--------|-------|-------------------|-------|--------|
| `src/components/Chapter0Content.vue` | `src/components/Chapter3Content.vue` | exact | 19-36 (script), 38-70 (template), 72-182 (style) | Layout 2-col + i18n + `chapters[N]` lookup + `chapterEra===N` filter | Embebe `<TerminalScroll>` en lugar de bio plain; ch0 NO tiene proyectos (CONTENT-CHECKLIST §2.6) → `<aside>` + flavor text only |
| `src/components/Chapter1Content.vue` | `src/components/Chapter3Content.vue` | exact | idem | idem | Embebe `<MarqueeBanner>`; ch1 NO tiene proyectos; tabla `border="1"` + GIFs construction era-auténticos |
| `src/components/Chapter2Content.vue` | `src/components/Chapter3Content.vue` | exact | idem | idem | Embebe `<FlashBanner>` arriba del bio; project cards filter `chapterEra===2`; bg consume `--bg-image` via BackgroundLayers global (D4-07 path estándar) |
| `src/components/Chapter4Content.vue` | `src/components/Chapter3Content.vue` | role-match (más rico) | idem + RESEARCH §Pattern 1 lines 281-352 | Layout 2-col + filter `chapterEra===4` | Embebe `<ParallaxLayers>` (`position:absolute; inset:0; z-index:0`) + `<FloatingPanel>` (`z-index:4`); aside meta queda encima de parallax con z-index intermedio |
| `src/components/Chapter5Content.vue` | `src/components/Chapter3Content.vue` | role-match | idem + RESEARCH §Pattern 6 lines 722-783 | Layout 2-col + filter `chapterEra===5` | Cada `<ProjectCard>` envuelto en `<ScrollRevealCard>` con `:delay` staggered (100ms × index); hero bg via `--bg-image` |
| `src/components/TerminalScroll.vue` | `src/components/BackgroundLayers.vue` (CSS-only decorativo) + `src/components/StickyAvatar.vue` (PRM CSS branch) | role-match parcial | BackgroundLayers 1-25 (script con inject mínimo) + StickyAvatar 156-167 (PRM @media branch) | `useI18n` import; `@media (prefers-reduced-motion: reduce)` branch CSS; sin JS state; usa `var(--c-fg)` / `var(--c-bg)` del [data-chapter="0"] | Animation `@keyframes` staggered con `animation-delay` (nuevo idiom); cursor blink `steps(2)` (nuevo); template renderea `<pre>` con `<span v-for>` lines |
| `src/components/MarqueeBanner.vue` | `src/components/StickyAvatar.vue` (PRM v-if swap pattern) + `src/components/StickyTimeline.vue` (inject prm pattern) | role-match | StickyAvatar lines 49-79 (PRM branch logic) + StickyTimeline lines 38-44 (inject pattern) | `inject('prm')` + `prefersReduced` consumo; `useI18n`; `<style scoped>` con `@media PRM` branch | Usa tag `<marquee>` deprecated (único caso en codebase); template `v-if="!prefersReduced"` swap a `<span>`; starfield CSS `radial-gradient` repeated (nuevo idiom) |
| `src/components/FlashBanner.vue` | `chapter-themes.css @layer components .project-card` (skeumorphic Web 2.0) | role-match | chapter-themes.css 158-247 (skeumorphic ProjectCard verbatim) | Linear-gradient + box-shadow + inset highlight + text-shadow embossed patterns | Variante orange-purple gradient (`--c-accent` ch2 = `#ff8800`); banner full-width + "browser chrome" elements (nuevo); pixel art `--bg-image` background |
| `src/components/ParallaxLayers.vue` | `src/components/BackgroundLayers.vue` | role-match (HUD invariante + inject) | BackgroundLayers 1-43 (full file) | `inject(...)` pattern + `aria-hidden="true"` + `pointer-events: none` (decorativo) + `position: absolute; inset: 0` | Consume `scrollState.scrollProgress` (NO bgMorph); 4 capas v-for con `transform: translateY(...)` reactivo; `will-change: transform`; PRM JS branch `factor=1.0` uniform (no `@media` CSS, lógica está en `getTransform()`) |
| `src/components/FloatingPanel.vue` | `src/components/ProjectCard.vue` (slot-less card) + chapter-themes.css `.project-card` (CSS structural) | role-match | ProjectCard 1-55 (full file structure) + chapter-themes.css 158-180 | `defineProps` + slot rendering pattern (similar a ProjectCard que renderea `t(title)`) | Glass aesthetic via `backdrop-filter: blur(10px)` con `@supports` fallback (nuevo idiom); border `--c-accent` cyan; box-shadow holographic glow; `<slot />` en lugar de fixed template |
| `src/components/ScrollRevealCard.vue` | `src/composables/useScrollState.js` (vueuse import pattern) + `src/components/StickyAvatar.vue` (PRM defensive double — JS + CSS) | partial (sin analog directo) | useScrollState 20-21 (vueuse import) + StickyAvatar 156-167 (PRM @media defensive) | `import { useIntersectionObserver } from '@vueuse/core'` (nuevo en codebase pero patrón gemelo a `useRafFn`); `inject('prm')` + PRM defensive double (JS-side `isRevealed.value = prefersReduced.value` + CSS-side `@media`); `<slot />` wrapper | Único en codebase con IO; single-shot reveal con `stop()` (nuevo); `props.delay` para staggered (nuevo); template `<div ref="cardEl">` + `:class` conditional |
| `tests/assets/asset-naming.test.js` | `tests/styles/themes-file.test.js` + `tests/styles/fonts-bundle.test.js` | role-match (architectural fs-based) | themes-file 1-50 (full file readFileSync + regex) + fonts-bundle 22-54 (fs.readdirSync pattern) | `readFileSync` + `existsSync` + `readdirSync` + regex matchAll; `resolve(process.cwd(), '...')` | Lista archivos `public/assets/*.png` recursivo (no CSS); regex `^ch[0-6]-(bust|bg|bg-stars-far\|bg-planet-mid\|fg-panels\|fg-ships\|hero)\.png$` |
| `tests/components/Chapter0Content.test.js` | `tests/components/Chapter3Content.test.js` | exact | 1-205 (full file) | TDD pattern: `mountCh3()` helper + `createTestI18n` + `vi.mock('@/data/projects', ...)` + readFileSync para CSS asserts + T1..T6 cobertura | Reemplaza `ch3` → `ch0`; mock NO necesita projects (ch0 sin proyectos); asserts CSS sobre `terminal-scroll` markers + PRM `@media` branch |
| `tests/components/Chapter1Content.test.js` | `tests/components/Chapter3Content.test.js` | exact | idem | idem | Verifica `<marquee>` tag presence default + `<span class="marquee-banner__static">` bajo PRM (v-if swap test); mount con `prefersReduced=true` provide |
| `tests/components/Chapter2Content.test.js` | `tests/components/Chapter3Content.test.js` | exact | idem | idem | T4 projects filter con `chapterEra===2`; T6 asserts CSS variants ch2 en chapter-themes.css (`[data-chapter="2"] .project-card`) |
| `tests/components/Chapter4Content.test.js` | `tests/components/Chapter3Content.test.js` | exact | idem | idem | Asserts ParallaxLayers + FloatingPanel embebidos; T4 con chapterEra===4 mock |
| `tests/components/Chapter5Content.test.js` | `tests/components/Chapter3Content.test.js` | exact | idem | idem | Asserts ScrollRevealCard wrapping ProjectCards; T4 con chapterEra===5 mock |
| `tests/components/TerminalScroll.test.js` | `tests/components/StickyAvatar.test.js` (PRM toggle + CSS read) | role-match | StickyAvatar.test.js 1-80 (helper + provide PRM ref + readFileSync) | Helper `mount...({ initialPRM: bool })` con `provide: { prm: { prefersReduced: ref(...) } }`; readFileSync CSS asserts | Sin scrollState provide (componente puro CSS); valida `animation: none` bajo PRM via CSS readFileSync; asserts `@keyframes terminal-cursor-blink` markers |
| `tests/components/MarqueeBanner.test.js` | `tests/components/StickyAvatar.test.js` | role-match | StickyAvatar.test.js 1-80 + 38-54 (PRM mutable provide pattern) | mount con `prefersReduced` ref mutable + `await flushPromises()` para reactividad | Asserts: `<marquee>` exists when `prefersReduced=false`; tras `prefersReduced.value = true`, `<span>` renderiza y `<marquee>` desaparece; starfield `radial-gradient` markers |
| `tests/components/FlashBanner.test.js` | `tests/components/ProjectCard.test.js` (props + CSS markers) | role-match | ProjectCard.test.js 1-180 (full file) | `mountCard({ project }, { locale })` helper + readFileSync THEMES_CSS markers (linear-gradient, inset, box-shadow) | Valida skeumorphic markers en `[data-chapter="2"] .flash-banner` block; sin `props.project` (banner solo flavor); locale es/en title text |
| `tests/components/ParallaxLayers.test.js` | `tests/components/BackgroundLayers.test.js` | exact (inject pattern) | BackgroundLayers.test.js 1-160 (full file) | `mountBgLayers({ ...layers })` helper con `provide: { bgMorph: ... }` mutable; `ref` + `nextTick` reactivity asserts; readFileSync CSS markers | Provide `scrollState: { scrollProgress: ref(0..1) }` + `prm: { prefersReduced }`; T: mutar `scrollProgress.value = 0.5` → cada `.parallax-layer` style.transform contiene `translateY(...)` correcto; T PRM: factor uniforme verificación matemática `(0.5 - 0.5) * 100vh = 0vh` |
| `tests/components/FloatingPanel.test.js` | `tests/components/ProjectCard.test.js` (props + slot mount) | role-match | ProjectCard.test.js 46-54 (mountCard helper) | mount con `slots: { default: '<p>Content</p>' }` para verificar slot rendering | Asserts `@supports (backdrop-filter: blur(10px))` block exists en CSS; fallback `background-color: rgba(10, 15, 46, 0.4)` declarado outside @supports |
| `tests/components/ScrollRevealCard.test.js` | `tests/composables/useScrollState.test.js` (IO mock) + `tests/components/StickyAvatar.test.js` (PRM toggle) | role-match | useScrollState.test.js IO mock pattern (ya hay setup global) + StickyAvatar PRM provide helper | jsdom IntersectionObserver mock (ya existe en `tests/setup.js`); provide `prm: { prefersReduced }` mutable; `mount(ScrollRevealCard, { slots: { default: '...' } })` | T: scroll-into-view trigger setea `isRevealed=true` + CSS class `--revealed`; T PRM: `prefersReduced.value=true` → `isRevealed=true` inicial sin trigger IO |
| `tests/i18n/avatar-busts-parity.test.js` (extension or new) | `tests/i18n/parity.test.js` | exact | parity.test.js 1-58 (full file) | flatten + sort parity comparator | Añade T4 que valida `avatar.busts.{0..6}.alt` NO contiene "Placeholder" ni "PENDING" (guard contra commit accidental tras W5 ratificación Rafael) |
| `src/components/ScrollShell.vue` (MODIFICADO) | Self — current file lines 76-90 | exact | ScrollShell.vue 76-90 (template section v-for) | Reemplaza placeholder genérico con `<ChapterNContent v-else-if="ch.id === N">` × 5 manteniendo el v-for shell intact | Añade 5 imports + 5 v-else-if branches; `<div v-else class="chapter-placeholder">` queda SOLO para ch6 (Phase 5) |
| `src/styles/chapter-themes.css` (MODIFICADO) | Self — current file lines 64-123 (ch2/ch4/ch5 stubs) + 158-247 (@layer components ProjectCard) | exact | chapter-themes.css 64-89 (ch2/ch4 stubs to finalize) + 158-247 (ProjectCard skeumorphic to extend) | Mismo patrón `[data-chapter="N"] { tokens }` y `.project-card` con linear-gradient + inset shadow | Pobla tokens finales ch2/4/5 con §5.1/§5.3/§5.4; añade `--bg-image: url('/assets/chN-bg.png')` (ch2/ch5); añade `[data-chapter="N"] .project-card { ... }` variants × 5 + `.flash-banner` + `.terminal-scroll` + `.marquee-banner` + `.floating-panel` + `.scroll-reveal-card` rules en `@layer components` |
| `src/data/chapters.js` (MODIFICADO) | Self — current file 13-84 | exact | chapters.js 36-83 (ch2..ch6 con `palette: []`) | Misma shape D3-04 lockeada | Pobla `palette: [hex, hex, ...]` para ch2/4/5 con §5.1/§5.3/§5.4; opcional añadir `bgImage: '/assets/chN-bg.png'` field si se prefiere data-driven |
| `src/data/projects.js` (MODIFICADO) | `tests/components/Chapter3Content.test.js` lines 23-68 (shape D3-03 verbatim mock) | exact | Chapter3Content.test.js 26-67 (fixture verbatim) | Shape D3-03 los 12 campos (`id, chapterEra, year, titleKey, descKey, link, imageSrc, role, techStack, planetSprite, planetOrbit, planetColor`) | Añade items reales ch2 (BlueLizard/Matte/Joju), ch4 (ARVR/Metrodigi), ch5 (BairesDev/number8/VivoEnVivo/RocketSnail/Remoose); `planetSprite/Orbit/Color: null` (Phase 5) |
| `src/i18n/{es,en}.json` (MODIFICADOS) | Self — current es.json/en.json (1-55 each) | exact | es.json 1-55 (full file structure) | Misma estructura anidada `chapters.{N}.{title,era}` + `projects.{id}.{title,desc}` + `avatar.busts.{N}.alt` | Añade `chapters.{0..5}.flavor` (5 keys × 2 locales) + `ch0.terminal.{line1..line4}` + `ch1.marquee.{greeting,construction}` + `projects.{ch2-*,ch4-*,ch5-*}.{title,desc}` (~10 items × 2 fields × 2 locales) + refresh `avatar.busts.{0..6}.alt` con texto era-accurate (D4-11 W5) |
| `.gitignore` (MODIFICADO) | N/A (operación trivial) | n/a | n/a | n/a | Añade entrada `public/references/` (privacy gate D4-02) |

---

## Pattern excerpts — uno por archivo nuevo

### 1. `Chapter0Content.vue` / `Chapter1Content.vue` / `Chapter2Content.vue` / `Chapter4Content.vue` / `Chapter5Content.vue`

**Analog (exact):** `src/components/Chapter3Content.vue` — los 5 archivos clonan estructura.

**Excerpt clave — script setup (lines 19-36):**

```vue
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'

const { t } = useI18n()

// chapters[N] lookup directo por index (D3-04). El array es estable.
const chapter = chapters[3]

// computed para reactividad si projects.js cambia en HMR
const ch3Projects = computed(() => projects.filter((p) => p.chapterEra === 3))
</script>
```

**Excerpt clave — template (lines 38-70):**

```vue
<template>
  <div class="ch3-layout">
    <aside class="ch3-meta">
      <img
        class="ch3-avatar"
        :src="chapter.avatarSrc"
        :alt="t('avatar.busts.3.alt')"
        width="160"
        height="192"
        loading="lazy"
      />
      <p class="ch3-year">{{ chapter.year }}</p>
      <p class="ch3-era">{{ t(chapter.eraKey) }}</p>
    </aside>

    <div class="ch3-content">
      <div class="ch3-bio">
        <p>{{ t(bio.coreKey) }}</p>
      </div>

      <div v-if="ch3Projects.length > 0" class="ch3-projects">
        <ProjectCard
          v-for="project in ch3Projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </div>
  </div>
</template>
```

**Excerpt clave — CSS layout (lines 79-89 desktop, 148-182 mobile):**

```css
.ch3-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--sp-lg);
  padding-left: 160px;          /* StickyTimeline desktop clearance */
  padding-right: var(--sp-lg);
  padding-top: calc(96px + var(--sp-lg));  /* StickyAvatar clearance */
  padding-bottom: var(--sp-lg);
  height: 100%;
  overflow-y: hidden;
}

@media (max-width: 599px) {
  .ch3-layout {
    grid-template-columns: 1fr;
    padding-left: 60px;          /* StickyTimeline mobile clearance */
    padding-top: calc(68px + var(--sp-sm));
    height: auto;
    overflow-y: visible;
  }
  .ch3-content {
    overflow-y: auto;            /* D3-12: scroll-chaining nativo al outer snap shell */
    max-height: calc(100dvh - 200px - env(safe-area-inset-bottom, 0px));
  }
}
```

**Reuse exacto:**
- Script: imports + `chapters[N]` lookup + `projects.filter(p => p.chapterEra === N)` computed
- Template: `<aside class="chN-meta">` + `<img class="chN-avatar">` con i18n alt + `.chN-content` + `.chN-bio` (con `t(bio.coreKey)`) + `.chN-projects` con v-for ProjectCard
- CSS: 2-col desktop / stacked mobile grid + paddings de StickyAvatar/StickyTimeline clearance

**Qué cambia per chapter:**

| Chapter | Inserción extra |
|---------|-----------------|
| **Ch0** | Embebe `<TerminalScroll>` en `.ch0-content` arriba del `.ch0-bio`. NO renderea `.ch0-projects` (ch0 no tiene proyectos — CONTENT-CHECKLIST §2.6). Fuente Phase 2 ya carga 'VT323' del [data-chapter="0"] block. |
| **Ch1** | Embebe `<MarqueeBanner>` arriba del `.ch1-content`. NO renderea `.ch1-projects`. Añade `<table border="1">` legacy era-auténtico + GIFs construction. Fuente 'Comic Neue' del [data-chapter="1"]. |
| **Ch2** | Embebe `<FlashBanner>` arriba del `.ch2-content`. SÍ renderea `.ch2-projects` filter `chapterEra===2`. Bg consume `--bg-image: url('/assets/ch2-bg.png')` via BackgroundLayers global (D4-07 path estándar). |
| **Ch4** | NO embebe FlashBanner. Embebe `<ParallaxLayers>` como **primer hijo del `<div class="ch4-layout">`** con `position: absolute; inset: 0; z-index: 0`. Cards de projects van envueltos en `<FloatingPanel>` (z-index: 4) que queda encima de las parallax layers. ¡Reset CSS de `.ch4-layout { position: relative }` para que parallax esté contenida! D4-07 parallax self-contained DENTRO del section, NO en BackgroundLayers. |
| **Ch5** | SÍ renderea `.ch5-projects`. Cada `<ProjectCard>` se envuelve en `<ScrollRevealCard :delay="idx * 100">` para staggered fade+slide-in. Bg consume `--bg-image: url('/assets/ch5-hero.png')` via BackgroundLayers global. |

---

### 2. `TerminalScroll.vue` (ch0)

**Analog parcial:** `BackgroundLayers.vue` (componente CSS-puro decorativo con `inject` mínimo) + `StickyAvatar.vue` (patrón `@media (prefers-reduced-motion: reduce)` CSS branch defensive).

**Excerpt — BackgroundLayers script minimalism (lines 22-25):**

```vue
<script setup>
import { inject } from 'vue'
const { layerA, layerB } = inject('bgMorph')
</script>
```

**Excerpt — StickyAvatar PRM CSS branch (lines 156-167):**

```css
/* PRM defensive — JS-side ya hace short-circuit; CSS doble defensa.
   Si JS no corre o se desincroniza, CSS garantiza no transition. */
@media (prefers-reduced-motion: reduce) {
  .avatar-placeholder {
    transition: none;
  }
}
```

**Reuse:**
- Script: `useI18n` (las lines son texto bilingüe) — sin `inject('prm')` necesario (PRM se maneja 100% CSS)
- CSS: tokens `var(--c-fg)` y `var(--c-bg)` del `[data-chapter="0"]` block aplican automáticamente vía cascade
- `@media (prefers-reduced-motion: reduce)` para apagar `animation`

**Qué cambia:**
- Template: `<pre>` con `<span v-for="line" class="terminal-line" :style="{ animationDelay: line.delay + 's' }">` — nuevo idiom, sin precedente en codebase
- `@keyframes terminal-reveal` + `@keyframes terminal-cursor-blink` con `steps(2)` para look CRT — nuevo
- Carga 'VT323' del [data-chapter="0"] block ya self-hosted (Phase 2 W4)

**Source completo:** RESEARCH §Pattern 2 lines 365-427.

---

### 3. `MarqueeBanner.vue` (ch1)

**Analog (role-match):** `StickyAvatar.vue` para PRM v-if swap pattern + `StickyTimeline.vue` para `inject('prm')` consumption.

**Excerpt — StickyAvatar PRM JS branch (lines 49-79):**

```javascript
import { ref, inject, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { activeChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

watch(activeChapter, async () => {
  if (prefersReduced.value) {
    // PRM branch — short-circuit a estado final
    if (pendingSwapTimer) {
      clearTimeout(pendingSwapTimer)
      pendingSwapTimer = null
    }
    opacity.value = 1
    return
  }
  // ... default branch (animated)
})
```

**Excerpt — StickyTimeline simple inject (lines 38-44):**

```javascript
const { activeChapter, scrollToChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

function onTickClick(N) {
  const behavior = prefersReduced.value ? 'auto' : 'smooth'
  scrollToChapter(N, behavior)
}
```

**Reuse:**
- `inject('prm')` + `prefersReduced.value` ternario para branch
- `useI18n` para texto bilingüe
- `<style scoped>` con tokens `var(--c-bg)` / `var(--c-fg)` / `var(--c-accent)` del [data-chapter="1"]

**Qué cambia:**
- Tag `<marquee>` deprecated REAL (único caso en codebase) — D4-05 era-authenticity intentional
- Template `v-if="!prefersReduced"` swap a `<span class="marquee-banner__static">` (no `v-show` — `<marquee>` debe desaparecer del DOM, no solo ocultarse, para que el browser deje de scrollearlo)
- `eslint-disable-next-line vue/no-deprecated-html-element-is` comment necesario
- Starfield CSS-only `radial-gradient` × 6 patterns repetido con `background-size: 200px 200px` + `@keyframes starfield-twinkle` animando solo `opacity` (NO `box-shadow` — perf)

**Source completo:** RESEARCH §Pattern 3 lines 442-528.

---

### 4. `FlashBanner.vue` (ch2)

**Analog (role-match):** `chapter-themes.css @layer components .project-card` (lines 158-247) — patrón skeumorphic Web 2.0 con linear-gradient + inset highlight + text-shadow embossed + box-shadow press effect.

**Excerpt — chapter-themes.css skeumorphic pattern verbatim (lines 159-247):**

```css
.project-card {
  border-radius: 14px;
  padding: var(--sp-md);

  /* Gradiente glossy top-light → bottom-darker (Web 2.0 signature) */
  background:
    linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.18) 0%,
      rgba(255, 255, 255, 0.04) 40%,
      rgba(0, 0, 0, 0.06) 100%
    ),
    var(--c-surface, #fff);

  /* Drop shadow + inset highlight (embossed) */
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);

  border: 1px solid rgba(255, 255, 255, 0.25);
}

.project-card-title {
  font-family: 'Lobster', Georgia, serif;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);  /* Embossed text */
}

.project-card-link:active {
  transform: translateY(1px);  /* Press depth effect */
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.25),
    inset 0 2px 3px rgba(0, 0, 0, 0.1);
}
```

**Reuse:**
- Linear-gradient top-light → bottom-darker (glossy Web 2.0)
- `box-shadow` outer drop + `inset 0 1px 0` highlight (embossed depth)
- `text-shadow: 0 1px 0 rgba(255,255,255,0.7)` (embossed text)
- `.project-card-link:active` press effect con `translateY(1px)`

**Qué cambia:**
- Variante orange→purple gradient (`--c-accent: #ff8800` + `--c-bg: #2a1a4a` ya en [data-chapter="2"] stub)
- Banner full-width (no card-sized) + "browser chrome" elements (Internet Explorer 6 mockup era-auténtico)
- Border más grueso (`border-width: 2px` o `3px` para look Flash plugin frame era-auténtico)
- Pixel-art `--bg-image: url('/assets/ch2-bg.png')` aplicada via BackgroundLayers (D4-07 path estándar)

**Donde vive el CSS:** `chapter-themes.css @layer components` añade `[data-chapter="2"] .flash-banner { ... }` siguiendo la convención existente.

---

### 5. `ParallaxLayers.vue` (ch4)

**Analog (role-match):** `src/components/BackgroundLayers.vue` (full file, lines 1-43) — HUD invariante decorativo con `inject(...)` + `aria-hidden="true"` + `pointer-events: none`.

**Excerpt — BackgroundLayers structural pattern (full file 22-43):**

```vue
<script setup>
import { inject } from 'vue'
const { layerA, layerB } = inject('bgMorph')
</script>

<template>
  <div class="bg-layers" aria-hidden="true">
    <div
      class="bg-layer bg-layer-a"
      :data-chapter="layerA.chapter.value"
      :style="{ opacity: layerA.opacity.value }"
    ></div>
    <div
      class="bg-layer bg-layer-b"
      :data-chapter="layerB.chapter.value"
      :style="{ opacity: layerB.opacity.value }"
    ></div>
  </div>
</template>
```

**Reuse:**
- `inject(...)` pattern (consume composable provisto por App.vue)
- `aria-hidden="true"` (HUD decorativo, screen readers skip)
- `position: absolute; inset: 0; pointer-events: none` (no intercepta clicks)
- `<div v-for="layer">` con `:style="{ ... }"` reactive binding

**Qué cambia:**
- Consume `scrollState.scrollProgress` (NO `bgMorph` — D4-07 self-contained dentro del section, NO global)
- 4 capas (no 2) con `transform: translateY(...)` reactive (no opacity crossfade)
- `inject('prm')` para PRM JS branch — `getTransform(factor)` retorna factor uniforme 1.0 bajo PRM
- `will-change: transform` hint compositor (ONLY en estas 4 capas — nunca global)
- `position: absolute` dentro del `<section data-chapter="4">` (parent debe ser `position: relative`)

**Source completo:** RESEARCH §Pattern 1 lines 281-352.

---

### 6. `FloatingPanel.vue` (ch4)

**Analog (role-match):** `src/components/ProjectCard.vue` (props + minimal template) + chapter-themes.css `.project-card` structural CSS.

**Excerpt — ProjectCard.vue structure (lines 15-55):**

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  project: {
    type: Object,
    required: true,
    // ...validator
  },
})
</script>

<template>
  <article class="project-card">
    <h3 class="project-card-title">{{ t(props.project.titleKey) }}</h3>
    <p class="project-card-desc">{{ t(props.project.descKey) }}</p>
    <!-- ... -->
  </article>
</template>
```

**Reuse:**
- `defineProps` pattern
- Template estructural simple (no scroll/IO logic)
- NO tiene `<style scoped>` — los estilos viven en `chapter-themes.css @layer components` para que CSS Custom Props del tema apliquen via cascade

**Qué cambia:**
- Prop `title: String` simple (no `project` object D3-03)
- `<slot />` en lugar de fixed template — wrapper genérico para cards/HUD
- CSS NUEVO en `chapter-themes.css`: `[data-chapter="4"] .floating-panel { ... }` con:
  - `background-color: rgba(10, 15, 46, 0.4)` fallback opaco
  - `@supports ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) { backdrop-filter: blur(10px); background-color: rgba(10, 15, 46, 0.15); }`
  - Mobile `@media (max-width: 599px)` reduce blur a `6px` (4 parallax + backdrop satura GPU)
  - `border: 1px solid var(--c-accent)` (cyan `#00ffff`)
  - `box-shadow: 0 0 20px rgba(0, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)` (holographic glow)
  - `font-family: 'Audiowide'` (ya self-hosted Phase 2 W4) para `.floating-panel__title`

**Source completo:** RESEARCH §Pattern 7 lines 798-845.

---

### 7. `ScrollRevealCard.vue` (ch5) — **SIN ANALOG DIRECTO**

**Analog parcial:** `src/composables/useScrollState.js` (vueuse import pattern lines 20-21) + `src/components/StickyAvatar.vue` (PRM defensive double JS + CSS lines 49-79 + 156-167).

**Excerpt — useScrollState.js vueuse import pattern (lines 20-21):**

```javascript
import { ref, readonly, watch, onBeforeUnmount } from 'vue'
import { useRafFn } from '@vueuse/core'
```

**Excerpt — StickyAvatar PRM defensive double (JS lines 49-79 + CSS 156-167):**

```javascript
watch(activeChapter, async () => {
  if (prefersReduced.value) {
    opacity.value = 1
    return  // ← short-circuit JS-side bajo PRM
  }
  // ... animated branch
})
```

```css
/* CSS defensive doble — si JS falla, CSS garantiza no animation bajo PRM */
@media (prefers-reduced-motion: reduce) {
  .avatar-placeholder { transition: none; }
}
```

**Reuse:**
- `import { useIntersectionObserver } from '@vueuse/core'` (paralelo a `useRafFn` import existente)
- `inject('prm')` + `prefersReduced.value` short-circuit JS-side
- `@media (prefers-reduced-motion: reduce)` CSS defensive doble
- `onBeforeUnmount(stop)` cleanup pattern (paralelo a `useScrollState` onBeforeUnmount)
- `<style scoped>` con CSS class `--revealed` BEM toggle

**Qué cambia:**
- ÚNICO componente en codebase que importa `useIntersectionObserver` (vueuse 14.3.0 ya disponible per package.json)
- `<slot />` wrapper genérico (paralelo a FloatingPanel)
- Props `threshold` (default 0.15) + `delay` (default 0 ms para staggered)
- Single-shot reveal con `stop()` en callback (no re-trigger en scroll up/down)
- `isRevealed: ref(prefersReduced.value)` init — bajo PRM, arranca true desde antes de mount

**Source completo:** RESEARCH §Pattern 6 lines 722-783.

**Tests:** `tests/setup.js` ya hace mock global de `IntersectionObserver` (visto en proyecto via jsdom — verificar en gsd-planner). El test pattern existente más cercano es `tests/composables/useScrollState.test.js` (mock observer + scroll dispatch) — el planner referencia ese test setup.

---

### 8. `tests/assets/asset-naming.test.js` (W0 architectural)

**Analog (role-match):** `tests/styles/themes-file.test.js` (architectural readFileSync) + `tests/styles/fonts-bundle.test.js` (readdirSync filesystem listing).

**Excerpt — themes-file.test.js full pattern (lines 12-50):**

```javascript
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const CSS_PATH = resolve(process.cwd(), 'src/styles/chapter-themes.css')

let source = ''
try {
  source = readFileSync(CSS_PATH, 'utf8')
} catch (_) {
  source = ''
}

describe('themes-file.test.js — @layer architecture', () => {
  it('T4: contains exactly 7 unique [data-chapter="N"] selectors (0..6)', () => {
    const matches = Array.from(source.matchAll(/\[data-chapter="(\d)"\]/g)).map(m => m[1])
    const unique = [...new Set(matches)]
    unique.sort()
    expect(unique).toEqual(['0', '1', '2', '3', '4', '5', '6'])
  })
})
```

**Excerpt — fonts-bundle.test.js fs.readdirSync pattern (lines 22-37):**

```javascript
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const DIST_ASSETS = resolve(process.cwd(), 'dist/assets')

const allFiles = () => {
  if (!existsSync(DIST_ASSETS)) {
    throw new Error(`dist/assets/ no existe. Ejecutar "npm run build" antes...`)
  }
  return readdirSync(DIST_ASSETS)
}

const cssFiles = () => allFiles().filter(f => f.endsWith('.css'))
```

**Reuse:**
- `readFileSync` / `readdirSync` / `existsSync` con `resolve(process.cwd(), ...)`
- `regex.matchAll(...)` + `new Set(...)` para unique elements
- Defensive: existsSync check con error message accionable

**Qué cambia:**
- Path `public/assets/` (no `dist/assets/`)
- Filtrar `.png` solamente
- Regex `^ch[0-6]-(bust|bg|bg-stars-far|bg-planet-mid|fg-panels|fg-ships|hero)\.png$` enforza naming convention (SC-2 carry-forward)
- 13 archivos esperados post-Phase 4 completa (7 busts + 1 ch2-bg + 4 ch4 layers + 1 ch5-hero)

---

### 9. `tests/components/Chapter{0,1,2,4,5}Content.test.js`

**Analog (exact):** `tests/components/Chapter3Content.test.js` (full file, lines 1-205).

**Excerpt — mount helper + mocks + CSS readFileSync (lines 22-86):**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter3Content from '@/components/Chapter3Content.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Mock con fixtures determinísticos
vi.mock('@/data/projects', () => ({
  projects: [
    { id: 'pp1', chapterEra: 3, year: 2013, titleKey: 'projects.pp1.title', /* shape D3-03 */ },
    // ... ch4 item que NO debe aparecer (verifica filter)
  ],
}))

// Helper mount con i18n plugin
function mountCh3({ locale = 'es', stubs } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter3Content, {
    global: { plugins: [i18n], stubs },
  })
  return { wrapper, i18n }
}

// readFileSync raw source para asserts CSS estático
const CH3_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter3Content.vue'),
  'utf8'
)
```

**Excerpt — cobertura T1-T6 (lines 92-204):**

```javascript
// T1 DOM contract
it('T1: .ch3-layout existe con .ch3-meta y .ch3-content', () => {
  const { wrapper } = mountCh3()
  expect(wrapper.find('.ch3-layout').exists()).toBe(true)
})

// T2 avatar img src + alt i18n locale-switch
it('T2 avatar img: src === /assets/ch3-bust.png', () => {
  const img = wrapper.find('img.ch3-avatar')
  expect(img.attributes('src')).toBe('/assets/ch3-bust.png')
})

// T4 projects filter
it('T4: chapterEra===3 → 2 ProjectCards (filtra ch4)', () => {
  const cards = wrapper.findAllComponents(ProjectCard)
  expect(cards.length).toBe(2)
})

// T5 reactive Pitfall 3
it('T5: toggle locale es→en → bio actualiza sin re-mount', async () => {
  i18n.global.locale.value = 'en'
  await flushPromises()
  // ...
})

// T6 CSS readFileSync
it('T6 CSS desktop: grid-template-columns: 200px 1fr', () => {
  expect(CH3_SOURCE).toMatch(/grid-template-columns:\s*200px 1fr/)
})
```

**Reuse:**
- `vi.mock('@/data/projects', () => ({ projects: [...] }))` con fixtures shape D3-03
- `createTestI18n({ locale })` + `mount(Component, { global: { plugins: [i18n] } })`
- `readFileSync` para asserts CSS estático
- Cobertura T1-T6: DOM contract, i18n alt, bio text, projects filter, reactive locale, CSS markers

**Qué cambia per chapter:**
- Reemplazar `ch3` → `chN` en mocks + selectors + asserts
- **Ch0/Ch1:** mock projects vacío (no proyectos); asserts `findComponent(TerminalScroll)` o `findComponent(MarqueeBanner)` exists
- **Ch1 extra:** test PRM swap: mount con `provide: { prm: { prefersReduced: ref(true) } }` → `<marquee>` no existe, `.marquee-banner__static` SÍ
- **Ch2:** mock 3 projects ch2 + 1 ch4 (verifica filter); asserts `findComponent(FlashBanner)` exists
- **Ch4:** mock 2 projects ch4; asserts `findComponent(ParallaxLayers)` + `findAllComponents(FloatingPanel)` exists
- **Ch5:** mock 5 projects ch5; asserts cada ProjectCard envuelto en `<ScrollRevealCard>` con `:delay` staggered

---

### 10. `tests/components/TerminalScroll.test.js` / `MarqueeBanner.test.js` / `FlashBanner.test.js` / `ParallaxLayers.test.js` / `FloatingPanel.test.js` / `ScrollRevealCard.test.js`

**Analog (role-match):** `tests/components/StickyAvatar.test.js` (lines 1-80) — mount helper con `provide` mutable PRM ref + CSS readFileSync.

**Excerpt — mount helper con provide mutable + readFileSync (lines 33-54):**

```javascript
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import StickyAvatar from '@/components/StickyAvatar.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Lee SFC raw para asserts CSS estático
const STICKY_AVATAR_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/StickyAvatar.vue'),
  'utf8'
)

// Helper: monta con refs mutables + i18n
function mountAvatar({ initialChapter = 3, initialPRM = false, locale = 'es' } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(initialPRM)
  const i18n = createTestI18n({ locale })
  const wrapper = mount(StickyAvatar, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, activeChapter, prefersReduced, i18n }
}
```

**Reuse:**
- `mount(Component, { global: { plugins: [i18n], provide: { ... } } })` con refs mutables
- `await flushPromises()` + `await nextTick()` para reactividad
- `readFileSync(SFC_PATH)` para asserts CSS estático sobre `<style scoped>` block

**Qué cambia per file:**

| Test file | Provide específico | Asserts únicos |
|-----------|--------------------|----------------|
| `TerminalScroll.test.js` | Solo `i18n` (sin scrollState/prm — componente CSS-puro) | CSS readFileSync: `@keyframes terminal-reveal`, `@keyframes terminal-cursor-blink`, `steps(2)`, `@media (prefers-reduced-motion: reduce) { .terminal-cursor { animation: none } }` |
| `MarqueeBanner.test.js` | `prm: { prefersReduced: ref(false) }` mutable | T1: `<marquee>` exists when `prefersReduced=false`; T2: mutate `prefersReduced.value = true` + `flushPromises` → `<marquee>` NO existe, `.marquee-banner__static` SÍ |
| `FlashBanner.test.js` | Solo `i18n` | CSS readFileSync sobre `chapter-themes.css`: `[data-chapter="2"] .flash-banner { ... linear-gradient ... inset 0 1px 0 ... }` markers skeumorphic |
| `ParallaxLayers.test.js` | `scrollState: { scrollProgress: ref(0) }` + `prm: { prefersReduced: ref(false) }` mutables | T1: 4 `.parallax-layer` rendered; T2: mutate `scrollProgress.value = 0.5` → `.parallax-layer--stars` style.transform contiene `translateY(...vh)` con factor 0.2 math; T3 PRM: mutate `prefersReduced.value = true` → todos los layers factor 1.0 uniforme |
| `FloatingPanel.test.js` | Solo `slots: { default: '<p>Content</p>' }` | T1: slot renderea; T2 CSS readFileSync: `@supports ((backdrop-filter: blur(10px))` block exists; fallback `background-color: rgba(...)` outside @supports |
| `ScrollRevealCard.test.js` | `prm: { prefersReduced: ref(false) }` mutable + `slots: { default: '<p>...</p>' }` | T1: opacity 0 inicial (no IO triggered); T2: mock IO trigger → `isRevealed=true` + class `.scroll-reveal-card--revealed`; T3 PRM: `prefersReduced.value=true` mount → `isRevealed=true` desde init sin IO |

**IntersectionObserver mock note (ScrollRevealCard):** Verificar en `tests/setup.js` si hay mock global de `IntersectionObserver`. Si no, el planner añade setup tipo:

```javascript
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

---

### 11. `tests/i18n/avatar-busts-parity.test.js` (extension)

**Analog (exact):** `tests/i18n/parity.test.js` lines 38-58 (T3 que ya valida `avatar.busts.N.alt` existe).

**Excerpt — parity.test.js T3 (lines 38-58):**

```javascript
it('T3 — ambos JSON tienen ui.skipLink, ui.langToggle.*, ui.timeline.*, avatar.ariaTemplate, avatar.busts.*.alt', () => {
  expect(en.avatar?.ariaTemplate).toBeDefined()
  expect(es.avatar?.ariaTemplate).toBeDefined()
  for (let i = 0; i <= 6; i++) {
    expect(en.avatar?.busts[String(i)]?.alt).toBeDefined()
    expect(es.avatar?.busts[String(i)]?.alt).toBeDefined()
  }
})
```

**Reuse:**
- For loop sobre `i = 0..6`
- `expect(en.avatar.busts[i].alt).toBeDefined()` pattern

**Qué cambia (decisión planner: EXTENSION o NEW FILE):**
- **Recommended: extension** — añadir T4 en `parity.test.js` que valida que `avatar.busts.{N}.alt` NO contiene strings "Placeholder" ni "PENDING" (guard contra commit accidental de placeholder text post-W5 ratificación Rafael):

```javascript
it('T4 — avatar.busts.N.alt NO contiene placeholder text (W5 sign-off guard)', () => {
  for (let i = 0; i <= 6; i++) {
    const altEs = es.avatar?.busts[String(i)]?.alt || ''
    const altEn = en.avatar?.busts[String(i)]?.alt || ''
    expect(altEs).not.toMatch(/^Placeholder/i)
    expect(altEs).not.toMatch(/PENDING/)
    expect(altEn).not.toMatch(/^Placeholder/i)
    expect(altEn).not.toMatch(/PENDING/)
  }
})
```

- Alternativa: archivo nuevo `tests/i18n/avatar-busts-parity.test.js` — solo si la separación de archivos ayuda. Recommended: extension porque parity.test.js es el "policy file" de i18n + 1 test extra no agrega complejidad.

---

## Archivos modificados (sección target específica)

### `src/components/ScrollShell.vue`

**Sección target:** Template lines 76-90 (placeholder replacement).

**Antes:**
```vue
<section v-for="ch in chapters" ...>
  <Chapter3Content v-if="ch.id === 3" />
  <div v-else class="chapter-placeholder">
    <p class="era-title">{{ ch.year }} · {{ ch.era }}</p>
  </div>
</section>
```

**Después (Phase 4 add):**
```vue
<section v-for="ch in chapters" ...>
  <Chapter0Content v-if="ch.id === 0" />
  <Chapter1Content v-else-if="ch.id === 1" />
  <Chapter2Content v-else-if="ch.id === 2" />
  <Chapter3Content v-else-if="ch.id === 3" />
  <Chapter4Content v-else-if="ch.id === 4" />
  <Chapter5Content v-else-if="ch.id === 5" />
  <div v-else class="chapter-placeholder">
    <p class="era-title">{{ ch.year }} · {{ ch.era }}</p>
  </div>
</section>
```

**Imports a añadir (lines 22-24):** 5 nuevos imports paralelos al `import Chapter3Content from './Chapter3Content.vue'` existente.

---

### `src/styles/chapter-themes.css`

**Sección target 1:** `[data-chapter="2"]` block (lines 64-73), `[data-chapter="4"]` block (lines 97-106), `[data-chapter="5"]` block (lines 114-123). Reemplazar tokens stub con valores finales §5.1/§5.3/§5.4.

**Sección target 2:** Final del `[data-chapter="N"]` block añadir `--bg-image: url('/assets/chN-bg.png')` (ch2/ch5 — ch4 NO, parallax es self-contained D4-07).

**Sección target 3:** `@layer components` (line 149) — añadir DESPUÉS del bloque `.project-card` existente (lines 158-247):

```css
@layer components {
  .project-card { /* ... existing ... */ }

  /* Phase 4: variants per chapter */
  [data-chapter="2"] .project-card {
    /* Flash era: orange gradient + thicker border */
    background:
      linear-gradient(to bottom, rgba(255, 136, 0, 0.4) 0%, rgba(42, 26, 74, 0.6) 100%),
      var(--c-surface, var(--c-bg));
    border: 3px solid var(--c-accent);  /* #ff8800 orange */
  }

  [data-chapter="4"] .project-card {
    /* AR/VR: glass holographic — minimal override (FloatingPanel wraps these) */
    /* La estética glass viene del FloatingPanel wrapper, no del card directo */
  }

  [data-chapter="5"] .project-card {
    /* Modern: flat minimal, sin gradient skeumorphic */
    background: var(--c-surface, #fff);
    border: 1px solid var(--c-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  /* Phase 4: era-signature component styles */
  [data-chapter="0"] .terminal-scroll { /* ... see RESEARCH Pattern 2 ... */ }
  [data-chapter="1"] .marquee-banner { /* ... see RESEARCH Pattern 3 ... */ }
  [data-chapter="2"] .flash-banner { /* ... new skeumorphic variant ... */ }
  [data-chapter="4"] .floating-panel { /* ... see RESEARCH Pattern 7 ... */ }
  [data-chapter="5"] .scroll-reveal-card { /* ... see RESEARCH Pattern 6 ... */ }
}
```

---

### `src/data/chapters.js`

**Sección target:** Lines 36-72 (ch2/ch4/ch5 con `palette: []`).

**Cambio:** Reemplazar `palette: []` con arrays hex de §5.1/§5.3/§5.4. Opcional: añadir `bgImage: '/assets/chN-bg.png'` field (ch2 + ch5). Ejemplo:

```javascript
{
  id: 2,
  year: 2009,
  era: 'Flash',
  eraKey: 'chapters.2.era',
  titleKey: 'chapters.2.title',
  avatarSrc: '/assets/ch2-bust.png',
  palette: ['#2a1a4a', '#e0c0ff', '#ff8800', /* ... §5.1 final 5-8 hex */],
  bgImage: '/assets/ch2-bg.png',  // opcional, si planner elige data-driven
},
```

---

### `src/data/projects.js`

**Sección target:** Array vacío (current line 10-27).

**Cambio:** Añadir items reales para ch2 (BlueLizard/Matte/Joju), ch4 (ARVR-company/Metrodigi), ch5 (BairesDev/number8/VivoEnVivo/RocketSnail/Remoose) siguiendo shape D3-03 verbatim. Los keys i18n se añaden en paralelo a `es.json/en.json`.

**Shape verbatim (de `tests/components/Chapter3Content.test.js` lines 26-46):**

```javascript
{
  id: 'ch2-bluelizard',
  chapterEra: 2,
  year: 2009,
  titleKey: 'projects.ch2-bluelizard.title',
  descKey: 'projects.ch2-bluelizard.desc',
  link: 'https://...' || null,
  imageSrc: null,
  role: 'Gameplay Programmer' || null,
  techStack: ['ActionScript 3', 'Flash CS5'] || null,
  planetSprite: null,  // Phase 5 puebla solo ch6
  planetOrbit: null,
  planetColor: null,
}
```

---

### `src/i18n/{es,en}.json`

**Sección target 1:** `chapters.{N}` blocks (current `{title, era}`) — añadir `flavor` key per chapter.

**Sección target 2:** Después de `chapters` key, añadir nuevos top-level `ch0.terminal.{line1..line4}` y `ch1.marquee.{greeting, construction}` blocks.

**Sección target 3:** `projects` block (current solo `pp1`) — añadir keys para los ~10 nuevos proyectos ch2/4/5.

**Sección target 4:** `avatar.busts.{0..6}.alt` — refresh con texto era-accurate (D4-11, W5 Rafael ratifica). Source ejemplos: RESEARCH §Pattern 8 lines 857-877.

**Parity enforcement:** Cada key añadida en `es.json` DEBE replicarse en `en.json` exact mismo path (paridad). Test `tests/i18n/parity.test.js` T1 enforza esto automatic.

---

### `.gitignore`

**Cambio (sección target — final del file):** Añadir línea:

```gitignore
# Phase 4 D4-02 privacy gate — fotos de referencia para pixelforge avatar batch
public/references/
```

---

## Shared patterns (cross-cutting Phase 4)

### Pattern A: `inject('prm')` PRM consumption

**Source:** `StickyAvatar.vue` lines 32-34 + `StickyTimeline.vue` lines 38-39.

**Apply to:** `MarqueeBanner.vue`, `ParallaxLayers.vue`, `ScrollRevealCard.vue` (los 3 que tienen rama PRM JS-side).

```javascript
import { inject } from 'vue'
const { prefersReduced } = inject('prm')
```

### Pattern B: PRM defensive double (JS + CSS)

**Source:** `StickyAvatar.vue` JS lines 49-79 + CSS lines 156-167.

**Apply to:** Todos los components Phase 4 con animation/transition:
- JS-side: `if (prefersReduced.value) return` short-circuit
- CSS-side: `@media (prefers-reduced-motion: reduce) { ... animation: none / transition: none }`

### Pattern C: i18n bilingual con `createTestI18n` helper

**Source:** `tests/i18n/test-helpers.js` (full file).

**Apply to:** Los 11 component tests nuevos (todos pasan `{ plugins: [createTestI18n({ locale: 'es' })] }` a `mount`).

### Pattern D: Architectural readFileSync CSS asserts

**Source:** `tests/styles/themes-file.test.js` + `tests/components/StickyAvatar.test.js` (lines 32-36) + `tests/components/ProjectCard.test.js` (lines 57-60).

**Apply to:** Todos los component tests Phase 4 — readFileSync sobre el SFC raw para asserts de `<style scoped>` markers que jsdom no resuelve.

### Pattern E: `[data-chapter="N"]` theme isolation

**Source:** `chapter-themes.css` `@layer themes` lines 33-141 + `@layer components` lines 158-247.

**Apply to:** Cada bloque CSS Phase 4 nuevo en `chapter-themes.css` vive bajo `[data-chapter="N"]` selector. Theme isolation garantizado por:
- Section v-for en ScrollShell.vue emite `data-chapter="N"` per section
- CSS Custom Props son scoped al subtree del selector
- Parallax + scroll-reveal viven DENTRO del section (no escapan via overflow:hidden ancestor)

### Pattern F: Composable inject + chapter array (Vue/Phaser data flow)

**Source:** App.vue (`provide('scrollState', ...)`, `provide('prm', ...)`, `provide('bgMorph', ...)` — visto via consumers en StickyAvatar/StickyTimeline/BackgroundLayers).

**Apply to:** ParallaxLayers (`inject('scrollState')` para scrollProgress + `inject('prm')`), MarqueeBanner (`inject('prm')`), ScrollRevealCard (`inject('prm')`).

---

## Archivos sin analog directo (1 / 27)

| File | Por qué | Mitigation |
|------|---------|------------|
| `src/components/ScrollRevealCard.vue` | Primer componente en codebase que importa `useIntersectionObserver` de @vueuse/core. El único otro vueuse import es `useRafFn` en `useScrollState.js`. | **Combine analogs:** importar `useIntersectionObserver` siguiendo el mismo pattern que `useRafFn` import (line 21 useScrollState.js). Para PRM defensive double aplicar StickyAvatar pattern (JS short-circuit + CSS @media). Para tests: el mock IO ya debe existir en `tests/setup.js` (verificar — si no, planner instala global mock similar al `matchMedia` mock que ya tiene jsdom). RESEARCH §Pattern 6 lines 722-783 da el código completo. |

---

## Metadata

**Analog search scope:**
- `src/components/*.vue` (9 archivos)
- `src/composables/*.js` (3 archivos)
- `src/styles/*.css` (2 archivos)
- `src/data/*.js` (4 archivos)
- `src/i18n/*.json` (2 archivos)
- `tests/components/*.test.js` (10 archivos)
- `tests/styles/*.test.js` (5 archivos)
- `tests/i18n/*.test.js` (5 archivos)
- `tests/data/*.test.js` (4 archivos)

**Files scanned for analog selection:** 44 archivos source + tests.

**Confidence:**
- HIGH para Chapter wrappers (analog `Chapter3Content` directo y maduro)
- HIGH para tests (analog `Chapter3Content.test.js` + `BackgroundLayers.test.js` + `StickyAvatar.test.js` cubren todos los idioms)
- MEDIUM-HIGH para era-signature components (analogs parciales pero patrones de inject/PRM/i18n claros)
- MEDIUM para `ScrollRevealCard` (sin precedente IO en codebase, pero patrón vueuse import + PRM defensive establecido)

**Pattern extraction date:** 2026-05-13.
