# Phase 2: Theme System + i18n — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 17 (8 nuevos + 7 modificados + 2 dev infra)
**Analogs found:** 15 / 17 (2 sin analog directo en codebase — fonts asset + JSON locales)

> Mapea cada archivo Phase 2 a su analog vivo en el codebase post-Phase 1. El planner
> debe citar este documento literal en sus PLAN-XX.md (file paths + line ranges) en
> lugar de re-derivar patrones.

---

## File Classification

| Archivo (new/modified) | Rol | Data Flow | Closest Analog | Match Quality |
|------------------------|-----|-----------|----------------|---------------|
| **NEW** `src/styles/chapter-themes.css` | css-source (themes) | static-tokens | `src/App.vue` `<style>` `:root` block (líneas 76-98) | exact-role (mismo: declare CSS Custom Props) |
| **NEW** `src/styles/fonts.css` | css-source (font-face) | static-asset-decl | RESEARCH §Example 6 (sin analog local — primer @font-face del proyecto) | no-analog (research-only) |
| **NEW** `public/fonts/*.woff2` (7 archivos) | asset (binary) | static-file | n/a — no hay analogs en `public/assets/` aún | no-analog |
| **NEW** `src/composables/useBackgroundMorph.js` | composable (state-machine) | event-driven (watch activeChapter → crossfade) | `src/components/StickyAvatar.vue` script setup (líneas 28-77) — mismo crossfade state machine pattern | exact-role + same data-flow (crossfade on chapter change) |
| **NEW** `src/components/BackgroundLayers.vue` | component (HUD invariante, no-pointer) | reactive-binding (inject 'bgMorph' → opacity bindings) | `src/components/StickyAvatar.vue` (fixed-positioned aside con opacity reactiva + inject) | exact-role (fixed overlay, opacity binding, aria-hidden) |
| **NEW** `src/components/LangToggle.vue` | component (button HUD) | request-response (click → mutate locale + persist) | `src/components/SkipLink.vue` (fixed standalone button-like + a11y) + `src/components/StickyTimeline.vue` `.tick-button` (44×44 touch target + neutral CSS Custom Props) | role-match (combine ambos) |
| **NEW** `src/i18n/index.js` | config (plugin factory) | hydration-then-runtime (localStorage → navigator.language → fallback) | `src/composables/usePRM.js` (wrap minimalista de fuente externa con composable propio) — RESEARCH Pattern 3 verbatim | role-match + research-blueprint |
| **NEW** `src/i18n/es.json` + `src/i18n/en.json` | data (i18n messages) | static-data | n/a — primer JSON de strings del proyecto | no-analog (UI-SPEC §11 + RESEARCH Pattern 4 verbatim) |
| **NEW** `tests/composables/useBackgroundMorph.test.js` | test (composable) | unit | `tests/composables/usePRM.test.js` (defineComponent wrapper + fake timers para state machine) + `tests/components/StickyAvatar.test.js` Tests 4-6 (mid-flight recovery) | exact-role |
| **NEW** `tests/components/BackgroundLayers.test.js` | test (component) | unit | `tests/components/StickyAvatar.test.js` (mount + inject mutables + assert opacity + readFileSync CSS asserts) | exact (mismo shape) |
| **NEW** `tests/components/LangToggle.test.js` | test (component) | unit | `tests/components/SkipLink.test.js` (mount + assert texto bilingue + CSS readFileSync) + `tests/components/StickyTimeline.test.js` Test 7-8 (click handler spy) | exact (combine) |
| **NEW** `tests/i18n/locale-init.test.js` | test (config) | unit | `tests/composables/usePRM.test.js` (mock matchMedia → mock localStorage + navigator.language) | role-match (mock external browser API) |
| **NEW** `tests/i18n/parity.test.js` (recomendado per RESEARCH Pattern 4) | test (data integrity) | unit | `tests/smoke.test.js` (trivial assertions sobre data shape) | role-match (no DOM, solo data) |
| **MOD** `src/main.js` | entrypoint | bootstrap | `src/main.js` actual (líneas 1-4) | self (modify in place) |
| **MOD** `src/App.vue` | root layout | provide/orchestrate | self — `src/App.vue` actual (líneas 33-38 provide pattern) | self-extend |
| **MOD** `src/components/ScrollShell.vue` | component (route-ish) | reactive-binding | self — `ScrollShell.vue` actual (líneas 25-33 chapters array + 74-85 v-for con `:data-chapter`) | self-extend (ya tiene el patrón locked) |
| **MOD** `src/components/StickyTimeline.vue` | component | reactive-binding | self — `StickyTimeline.vue` actual (líneas 43-54 inject + 96 aria-label literal) | self-extend |
| **MOD** `src/components/SkipLink.vue` | component | static | self — `SkipLink.vue` actual (línea 70 texto bilingue hardcoded) | self-extend |
| **MOD** `src/components/StickyAvatar.vue` | component | reactive-binding | self — `StickyAvatar.vue` actual (línea 83 aria-label literal) | self-extend |
| **MOD** `index.html` | scaffold HTML | static | self — `index.html` actual (línea 16 `background: #0b0b16`) | self-extend |
| **MOD** `package.json` | manifest | static-config | self — `package.json` actual (líneas 13-17 dependencies) | self-extend |

---

## Pattern Assignments

### `src/composables/useBackgroundMorph.js` (composable, event-driven)

**Analog:** `src/components/StickyAvatar.vue` (script setup, líneas 28-77).

**Por qué este analog:** Mismo patrón state-machine `watch(activeChapter, ...)` + setTimeout para crossfade + watcher dedicado de PRM para recuperación mid-flight. RESEARCH Pattern 2 cita explícitamente: "Análogo al patrón del avatar Phase 1 (StickyAvatar.vue + Plan 03)".

**Imports pattern** (StickyAvatar.vue líneas 28-31, adaptar de SFC a composable factory):

```javascript
// StickyAvatar usa:
import { ref, inject, watch, nextTick } from 'vue'
// useBackgroundMorph debe usar (composable factory, recibe args en vez de inject):
import { ref, watch, onBeforeUnmount } from 'vue'
```

**State machine pattern** (StickyAvatar.vue líneas 33-62 — replicar shape):

```javascript
// StickyAvatar (líneas 33-34):
const opacity = ref(1)
let pendingSwapTimer = null

// StickyAvatar (líneas 47-62) — el main watch:
watch(activeChapter, async () => {
  if (prefersReduced.value) {
    if (pendingSwapTimer) {
      clearTimeout(pendingSwapTimer)
      pendingSwapTimer = null
    }
    opacity.value = 1
    return
  }
  opacity.value = 0
  await nextTick()
  pendingSwapTimer = setTimeout(() => {
    opacity.value = 1
    pendingSwapTimer = null
  }, 100)
})
```

> **Adaptación clave Phase 2:** StickyAvatar tiene UNA capa que fade-out → swap → fade-in
> (200ms total = 100+100). BackgroundMorph tiene DOS capas y hace crossfade simultáneo
> (200ms total = una sola transición opacity 0↔1 en cada capa). Ver RESEARCH Pattern 2
> líneas 478-507 para la state machine de 2 capas con `activeLayer` bookkeeping.

**PRM mid-flight recovery pattern** (StickyAvatar.vue líneas 64-77 — copiar literal, adaptar al cleanup de 2 capas):

```javascript
// StickyAvatar (líneas 69-77):
watch(prefersReduced, (isPRM) => {
  if (isPRM) {
    if (pendingSwapTimer) {
      clearTimeout(pendingSwapTimer)
      pendingSwapTimer = null
    }
    opacity.value = 1
  }
})
```

> RESEARCH líneas 519-532 muestra la adaptación 2-capa: snap incoming.opacity=1, outgoing.opacity=0,
> outgoing.chapter=null, flip activeLayer. Replicar exacto.

**Cleanup pattern** (similar a `useScrollState.js` líneas 101-109):

```javascript
// useScrollState (líneas 101-109):
onBeforeUnmount(() => {
  observer?.disconnect()
  if (scrollListener && shellRef.value) {
    shellRef.value.removeEventListener('scroll', scrollListener)
  }
  rafCtl.pause()
  clearTimeout(idleTimer)
  stopWatch()
})
```

> Para useBackgroundMorph: solo `clearTimeout(pendingTimer)` defensive — sin listeners.

**Testing pattern:** `tests/composables/usePRM.test.js` líneas 62-72 (defineComponent wrapper para correr el composable en lifecycle real) + `tests/components/StickyAvatar.test.js` Test 4 (líneas 113-134, fake timers + advance + assert opacity) + Test 6 (líneas 155-173, PRM mid-flight recovery).

---

### `src/components/BackgroundLayers.vue` (component, reactive-binding HUD invariante)

**Analog:** `src/components/StickyAvatar.vue` (entire SFC).

**Por qué este analog:** Mismo patrón estructural — fixed-positioned, aria-hidden internamente, opacity reactiva via inject de composable global, sin pointer-events. Solo diferencia: 2 hijos en lugar de 1, y `z-index: -1` en lugar de `40`.

**Inject pattern** (StickyAvatar.vue líneas 30-31 — copiar literal, cambiar key):

```javascript
// StickyAvatar:
const { activeChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

// BackgroundLayers:
const { layerA, layerB } = inject('bgMorph')
```

**Template pattern** (StickyAvatar.vue líneas 80-90 — replicar shape con 2 hijos):

```vue
<!-- StickyAvatar template (líneas 80-90): -->
<aside class="sticky-avatar" :aria-label="..." aria-live="polite">
  <div class="avatar-placeholder" aria-hidden="true" :style="{ opacity }">
    <span class="avatar-chapter-label">ch{{ activeChapter }}</span>
  </div>
</aside>

<!-- BackgroundLayers (UI-SPEC §7.1 + RESEARCH líneas 568-581):
     - Raíz <div class="bg-layers" aria-hidden="true">
     - Dos hijos .bg-layer con :data-chapter + :style="{ opacity }" -->
```

**CSS scoped pattern** (StickyAvatar.vue líneas 92-166 — patrón general; para BackgroundLayers usar UI-SPEC §7.2 verbatim):

```css
/* StickyAvatar (líneas 101-108):
   - position: fixed
   - top/left var(--sp-md)
   - z-index 40
   - dimensiones explícitas */
.sticky-avatar {
  position: fixed;
  top: var(--sp-md);
  left: var(--sp-md);
  z-index: 40;
  width: 80px;
  height: 96px;
}

/* BackgroundLayers analogous (UI-SPEC §7.2):
   .bg-layers { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
   .bg-layer { position: absolute; inset: 0; background: var(--c-bg);
               transition: opacity 200ms ease; } */
```

**PRM defensive CSS** (StickyAvatar.vue líneas 161-165 — replicar para `.bg-layer` con 150ms en lugar de none):

```css
/* StickyAvatar (líneas 161-165):
   @media (prefers-reduced-motion: reduce) {
     .avatar-placeholder { transition: none; }
   }

   BackgroundLayers (UI-SPEC §7.2 + D-03):
   @media (prefers-reduced-motion: reduce) {
     .bg-layer { transition: opacity 150ms ease; }
   } */
```

**Testing pattern:** `tests/components/StickyAvatar.test.js` líneas 44-56 (mountAvatar helper con provides mutables `ref(initialPRM)` + `ref(initialChapter)`) — adaptar para provee `bgMorph` con `layerA` + `layerB` mutables. Tests críticos: render 2 capas, opacity reactiva, transition CSS 200ms default + 150ms PRM, `z-index: -1`, `pointer-events: none`.

---

### `src/components/LangToggle.vue` (component, button HUD)

**Analogs combinados:**
- `src/components/SkipLink.vue` (estructura: standalone fixed-positioned focusable + bilingue + a11y)
- `src/components/StickyTimeline.vue` `.tick-button` (líneas 195-208) (touch target 44×44 + neutral CSS Custom Props sin theme override)

**Por qué estos analogs:** SkipLink es el otro elemento "HUD invariante" Phase 1 que NO cambia entre chapters (mismo invariant que la decisión D2-10 LangToggle). `.tick-button` aporta el patrón de touch target 44px + uso de neutral tokens (`--c-fg`, `--c-muted`) sin override per-chapter.

**Setup pattern** (RESEARCH Pattern 5 — usa `useI18n()` directamente, no inject):

```javascript
// LangToggle (RESEARCH líneas 808-818):
import { useI18n } from 'vue-i18n'
import { persistLocale } from '@/i18n'

const { locale, t } = useI18n()

function toggle() {
  const next = locale.value === 'es' ? 'en' : 'es'
  locale.value = next
  persistLocale(next)
}
```

**Click handler pattern** (StickyTimeline.vue líneas 66-69 — `onTickClick` shape):

```javascript
// StickyTimeline:
function onTickClick(N) {
  const behavior = prefersReduced.value ? 'auto' : 'smooth'
  scrollToChapter(N, behavior)
}

// LangToggle análogo (sin PRM branch — D-06: textual instant en ambos modes):
function toggle() {
  const next = locale.value === 'es' ? 'en' : 'es'
  locale.value = next
  persistLocale(next)
}
```

**Template + aria pattern** (SkipLink.vue línea 70 + StickyTimeline.vue líneas 93-104):

```vue
<!-- SkipLink (línea 70): texto bilingue hardcoded.
     Phase 2 lo reemplaza por t('ui.skipLink'). -->
<a href="#main-content" ...>Saltar al contenido / Skip to content</a>

<!-- StickyTimeline (líneas 93-104) — patrón button + aria-label dinámico: -->
<button
  class="tick-button"
  :data-chapter="ch.id"
  :aria-label="`Ir a ${ch.era} (${ch.year})`"
  :aria-current="activeChapter === ch.id ? 'true' : undefined"
  @click="onTickClick(ch.id)"
>
```

> LangToggle (UI-SPEC §8.1): combina shape — single button (no list), aria-label vía `t()`,
> click handler `toggle`, content = `<span>ES</span><span aria-hidden>|</span><span>EN</span>`.

**CSS fixed-positioned pattern** (StickyAvatar.vue líneas 101-108 + StickyTimeline.vue líneas 195-208):

```css
/* StickyAvatar (.sticky-avatar) muestra el patrón top-left simétrico
   que el LangToggle replicará en top-right (UI-SPEC §8.2):
   - position: fixed
   - top: var(--sp-md)
   - right: var(--sp-md)   ← cambio vs avatar
   - z-index: 40           ← mismo nivel
   - min-width/min-height 44px (del .tick-button) */

/* StickyTimeline .tick-button (líneas 195-208) — touch target:
   min-width: 44px;
   min-height: 44px;
   justify-content: center;
   cursor: pointer;
   background: none;
   border: none;
   font-family: ui-monospace, ...; */
```

**Mobile breakpoint pattern** (StickyAvatar.vue líneas 142-152 + StickyTimeline.vue líneas 265-273):

```css
/* StickyAvatar (líneas 142-152) — patrón shrink mobile:
   @media (max-width: 599px) {
     .sticky-avatar {
       width: 56px;
       height: 68px;
       top: var(--sp-sm);
       left: var(--sp-sm);
     }
     .avatar-chapter-label { font-size: 12px; }
   } */

/* LangToggle (UI-SPEC §8.3) — icon-only shrink: oculta .lang-sep + .lang-inactive,
   añade ::before content '🌐'. Mismo breakpoint 599px. */
```

**Testing pattern:**
- `tests/components/SkipLink.test.js` Tests 1-4 (líneas 38-82): assert `<a>` shape + texto bilingue + hide-on-handler. Para LangToggle: assert texto inicial "ES | EN", aria-label, click toggle.
- `tests/components/StickyTimeline.test.js` Tests 7-8 (líneas 172-189): patrón de click handler que invoca un spy. Para LangToggle: spy sobre `locale.value` mutation + `persistLocale` import mockeado.
- `tests/components/StickyAvatar.test.js` Tests 7-9 (líneas 178-207): CSS readFileSync asserts. Replicar para LangToggle (position fixed top/right `var(--sp-md)`, z-index 40, min-44px, mobile breakpoint).
- **i18n-aware test setup:** `mount(LangToggle, { global: { plugins: [createTestI18n()] } })`. Sin analog directo — el planner debe ver RESEARCH Pattern 3 líneas 679-694 y `vue-i18n` docs (test-utils integration).

---

### `src/i18n/index.js` (config, hydration-then-runtime)

**Analog parcial:** `src/composables/usePRM.js` (líneas 1-30).

**Por qué este analog:** Es el único archivo del codebase que **encapsula una fuente browser-API externa** (matchMedia para PRM) detrás de un export limpio. `src/i18n/index.js` hace lo equivalente: encapsula `localStorage` + `navigator.language` + `createI18n()` detrás de un export `i18n` consumido por `main.js`.

**Single-source-of-truth + minimal wrap pattern** (usePRM.js líneas 23-30):

```javascript
// usePRM.js — encapsula la matchMedia API:
import { computed } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

export function usePRM() {
  const motion = usePreferredReducedMotion()
  const prefersReduced = computed(() => motion.value === 'reduce')
  return { motion, prefersReduced }
}
```

> Para `src/i18n/index.js`: usar la misma filosofía minimalista — encapsular `resolveInitialLocale()`
> y `persistLocale()` como funciones puras + export `i18n` singleton. RESEARCH Pattern 3 líneas
> 623-663 da el código completo verbatim (locked en VALIDATION/UI-SPEC).

**Comment header pattern** (usePRM.js líneas 1-22): bloque de comentarios con `// Source:`, `// Cleanup:`, `// API:`. Replicar para `src/i18n/index.js` con:
- `// Source: vue-i18n.intlify.dev/guide/migration/breaking11`
- `// Decisions baked in: legacy: false (I18N-01), fallbackLocale: 'en' (I18N-06), missing handler dev marker (Open-Q2-D), locale: localStorage > navigator.language > 'es' (D2-09)`

**Testing pattern:** `tests/composables/usePRM.test.js` líneas 33-57 (`installMatchMediaMock` helper que reemplaza `window.matchMedia`). Para `tests/i18n/locale-init.test.js`:
- Reemplazar `localStorage.getItem`/`setItem` con vi.spyOn (jsdom soporta localStorage nativo, pero los tests deben aislar).
- Reemplazar `navigator.language` via `Object.defineProperty(navigator, 'language', { value: 'es-EC', configurable: true })`.
- Verificar precedencia: localStorage > navigator > fallback. Una sub-test por rama, similar a usePRM.test.js T1-T4.

---

### `src/i18n/es.json` + `src/i18n/en.json` (data, static)

**No analog en codebase.** Primer archivo JSON de strings.

**Source of truth:** RESEARCH Pattern 4 líneas 706-780 (locked) + UI-SPEC §11.2-11.3 (verbatim, idéntico). El planner debe copiar literal — los strings están bloqueados.

**Parity test pattern:** RESEARCH Pattern 4 líneas 786-800 (locked):

```javascript
// tests/i18n/parity.test.js (RESEARCH §Pattern 4):
import en from '@/i18n/en.json'
import es from '@/i18n/es.json'

function flatten(obj, prefix = '') {
  return Object.keys(obj).flatMap(k => {
    const path = prefix ? `${prefix}.${k}` : k
    return typeof obj[k] === 'object' ? flatten(obj[k], path) : [path]
  })
}

test('en.json and es.json have identical key sets (I18N-02)', () => {
  expect(flatten(en).sort()).toEqual(flatten(es).sort())
})
```

> Sin analog vivo, pero el shape es simple — `tests/smoke.test.js` da el wrapper mínimo de
> `describe`/`it`/`expect` sin DOM.

---

### `src/styles/chapter-themes.css` (css-source, static-tokens)

**Analog:** `src/App.vue` `<style>` block líneas 76-98 (`:root` declaration).

**Por qué este analog:** Es el archivo donde Phase 1 estableció el patrón **CSS Custom Props como vehículo de tematización**. Phase 2 escala el patrón de UN selector (`:root`) a OCHO (`:root` + 7 `[data-chapter="N"]`), pero la estructura, naming convention (`--c-*`, `--sp-*`), y orden de tokens permanecen idénticos.

**Comment-doc pattern** (App.vue líneas 71-75 + 78-98):

```css
/* App.vue líneas 71-75 — comment que ancla el override Phase 2 viene:
   Global tokens (UI-SPEC §3 + §4). NO scoped — declaran CSS Custom Properties
   en :root para que cualquier componente descendiente las consuma. Phase 2 las
   sobreescribirá por [data-chapter="N"] selectors a nivel de tema. */

/* App.vue líneas 78-86 — Spacing scale orden + naming locked: */
:root {
  --sp-xs: 4px;
  --sp-sm: 8px;
  --sp-md: 16px;
  --sp-lg: 24px;
  --sp-xl: 32px;
  --sp-2xl: 48px;
  --sp-3xl: 64px;
}
```

**Token structure pattern** (App.vue líneas 87-98 — orden y naming):

```css
/* App.vue (líneas 87-98) — Phase 1 neutral palette, 10 tokens, orden semántico:
   bg → fg → surface → border → track → track-active → marker → focus → muted → tick-hover */
:root {
  --c-bg: #0b0b16;
  --c-fg: #e7e7f0;
  --c-surface: #1a1a2e;
  --c-border: #2e2e4a;
  /* ... */
  --c-focus: #7dd3fc;
  --c-muted: #6b6b8a;
}
```

> Phase 2 cada `[data-chapter="N"]` overridea SOLO 5 tokens + `--font-body`: `--c-bg`,
> `--c-fg`, `--c-accent`, `--c-border`, `--c-focus`. NO toca `--c-surface`, `--c-track`,
> `--c-track-active`, `--c-marker`, `--c-muted`, `--c-tick-hover` (HUD invariante per
> UI-SPEC §8.5 + D2-02). El analog vivo (App.vue `:root`) define el conjunto de tokens
> que el override deja intactos.

**Layer pattern:** RESEARCH Pattern 1 líneas 294-409 (locked). `@layer reset, themes, components, utilities` declaration al top + `@layer themes { :root {...} [data-chapter="0"] {...} ... }`. Sin analog vivo (primer `@layer` del proyecto), copiar verbatim del RESEARCH.

**Contrast tradeoff comment pattern** (D2-03 verbatim, UI-SPEC §4.2):

```css
/* contrast(fg, bg) = X.X:1 — chapter N (era) accepts Y:1 here as era-authentic tradeoff per THM-05 */
```

Aplicar SOLO si ratio < 4.5:1 (ch1 magenta on navy = 3.2:1 — único caso Phase 2 que requiere comentario).

**Testing pattern:** UI-SPEC §10.3 + RESEARCH Strategy 1-2 (líneas 1192-1244):
- Computed-style test (jsdom limitation: NO procesa `@layer` o CSS Custom Props heredados profundos, pero SÍ verifica que cada `<section>` tiene el `data-chapter` correcto).
- Raw-source test análogo a `tests/components/StickyAvatar.test.js` Test 7 (líneas 178-185, readFileSync + regex sobre el .css) para asegurar que cada chapter block declara los 6 tokens.

---

### `src/styles/fonts.css` (css-source, static-asset-decl)

**No analog en codebase** (primer `@font-face` del proyecto).

**Source of truth:** RESEARCH Example 6 líneas 1116-1147 + UI-SPEC §5.2 (locked).

**Locked rules:**
- `font-display: swap` en todos (R1 FOIT mitigation)
- `format('woff2')` para estáticos, `format('woff2-variations')` para Inter Variable
- `font-weight: 100 900` en Inter Variable (R5 fix)
- `unicode-range: U+0020-007F, U+00A0-00FF, U+0131, U+0152-0153` (Latin Basic + Latin-1 + extras ES) — Open-Q2-E resuelto
- Ubicación: `/public/fonts/{slug}-latin-ext.woff2`

**Comment-doc pattern** análogo a `src/App.vue` líneas 71-75 (anchor del propósito + UI-SPEC ref). Cabecera sugerida:

```css
/* src/styles/fonts.css — @font-face declarations (UI-SPEC §5.2 locked).
   7 self-hosted fonts: VT323, Comic Neue, Lobster, Audiowide,
   Inter Variable, Press Start 2P. ch2 Verdana NO se self-hosta
   (RESEARCH §R4 — system-safe stack OK).
   font-display: swap mandatory (Risk R1 FOIT). */
```

> Decisión planner: si usa `@fontsource` packages (RESEARCH Example 7 Option A), entonces
> `fonts.css` puede ser solo `import '@fontsource/...'` lines en `main.js` y este archivo no
> existe. Si usa manual subset (Option B/C), `src/styles/fonts.css` con `@font-face` verbatim.

---

### `public/fonts/*.woff2` (asset, binary)

**No analog en codebase** (`public/assets/` está vacío post-Phase 1).

**Acquisition pipeline:** RESEARCH Example 7 (líneas 1149-1180). Tres opciones (planner lockea una):
- A: `@fontsource` npm packages (RECOMENDADO Windows — RESEARCH §Q3 nota)
- B: glyphhanger manual subset (requiere Python + brotli)
- C: gwfh.mranftl.com web UI (zero-setup)

**Naming convention:** `{slug}-latin-ext.woff2` (locked, UI-SPEC §5.2). 6 archivos esperados (no 7 — ch2 no self-host):
- `vt323-latin-ext.woff2` (ch0)
- `comic-neue-latin-ext.woff2` (ch1)
- `lobster-latin-ext.woff2` (ch3)
- `audiowide-latin-ext.woff2` (ch4)
- `inter-variable-latin-ext.woff2` (ch5)
- `press-start-2p-latin-ext.woff2` (ch6)

> Si planner elige Option A (`@fontsource`), los archivos viven en `node_modules/@fontsource/.../`
> y los `@font-face` los wire los CSS imports automáticos — NO se ponen archivos en `public/fonts/`.

---

### `src/main.js` (MOD — entrypoint)

**Self-modify.** Diff esperado:

```javascript
// ANTES (líneas 1-4):
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

// DESPUÉS (RESEARCH Pattern 3 líneas 669-675):
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './styles/chapter-themes.css'  // @layer + 7 themes
import './styles/fonts.css'           // @font-face declarations (o reemplazar por @fontsource imports)

createApp(App).use(i18n).mount('#app')
```

---

### `src/App.vue` (MOD — root layout)

**Self-extend.** Diff esperado:

**Imports** (añadir a líneas 24-31):

```javascript
// AÑADIR:
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BackgroundLayers from './components/BackgroundLayers.vue'
import LangToggle from './components/LangToggle.vue'
import { useBackgroundMorph } from './composables/useBackgroundMorph'
```

**Provide pattern** (App.vue líneas 33-38 ya tiene el patrón locked — extender):

```javascript
// App.vue actual (líneas 33-38):
const shellRef = ref(null)
const scrollState = useScrollState(shellRef)
const prm = usePRM()

provide('scrollState', scrollState)
provide('prm', prm)

// PHASE 2 EXTEND — añadir bgMorph + i18n watcher:
const bgMorph = useBackgroundMorph(scrollState.activeChapter, prm)
provide('bgMorph', bgMorph)

// I18N-04 + A11Y-07 (RESEARCH Pattern 6 líneas 874-883):
const { locale } = useI18n()
watch(locale, (l) => {
  document.documentElement.lang = l
}, { immediate: true })
```

**Template extend** (App.vue líneas 65-68 — añadir BackgroundLayers como PRIMER hijo + LangToggle como último):

```vue
<!-- App.vue ACTUAL (líneas 65-68):
  <SkipLink />
  <StickyAvatar />
  <ScrollShell :ref="el => { shellRef.value = el?.shellEl ?? null }" />
  <StickyTimeline />

  PHASE 2 ORDEN (UI-SPEC §7.3 + CONTEXT.md §code_context Integration Points):
  <BackgroundLayers />          ← NUEVO primer hijo (z-index -1, detrás de todo)
  <SkipLink />
  <StickyAvatar />
  <ScrollShell ... />
  <StickyTimeline />
  <LangToggle />                ← NUEVO último hijo (z-index 40, top-right) -->
```

**No tocar `<style>`** (líneas 76-121) — el `:root` neutral, focus-visible universal y PRM CSS defensive del scroll-shell se mantienen sin cambios. Phase 2 escribe las CSS Custom Props per chapter en `src/styles/chapter-themes.css`, NO acá.

---

### `src/components/ScrollShell.vue` (MOD — already has the pattern)

**Self-extend trivial.** El componente YA tiene el patrón D2-06 (data-chapter hardcoded via v-for) en líneas 74-85:

```vue
<!-- ScrollShell.vue ACTUAL (líneas 74-85): -->
<section
  v-for="ch in chapters"
  :key="ch.id"
  :id="`chapter-${ch.id}`"
  :data-chapter="ch.id"
  :aria-label="`${ch.era} — ${ch.year}`"
  class="chapter-section"
>
  <div class="chapter-placeholder">
    <p class="era-title">{{ ch.year }} · {{ ch.era }}</p>
  </div>
</section>
```

**Phase 2 diff:** i18nificar el `aria-label` (D2-11). Cambio mínimo:

```vue
<!-- ANTES línea 79: -->
:aria-label="`${ch.era} — ${ch.year}`"

<!-- DESPUÉS (usando vue-i18n + el chapter title key locked en UI-SPEC §11): -->
:aria-label="t('chapters.' + ch.id + '.title')"
<!-- (planner decide si manternener era+year ES hardcoded o también usar i18n keys
     adicionales `chapters.N.ariaLabel`; UI-SPEC §11.4 no especifica — recomienda usar
     `chapters.N.title` simple) -->
```

**Inject pattern** (líneas 40-42 muestran `inject('scrollState')` + `inject('prm')` — añadir `useI18n()`):

```javascript
// ScrollShell.vue ACTUAL (líneas 40-42):
const { activeChapter, scrollToChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

// PHASE 2 EXTEND:
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
```

**Open-Q2-A resolved:** El planner NO debe re-arquitecturar el v-for. Ya está locked en `chapters` array de ScrollShell.vue (líneas 25-33). Si Phase 3 introduce `src/data/chapters.js`, el array se moverá entonces — NO en Phase 2.

---

### `src/components/StickyTimeline.vue` (MOD)

**Self-extend.** Diff en líneas 75-76 (`<nav>` aria-label) + líneas 96-97 (tick aria-label):

```vue
<!-- StickyTimeline.vue ACTUAL (líneas 73-77): -->
<nav class="sticky-timeline" aria-label="Navegación de capítulos por era" role="navigation">

<!-- PHASE 2: -->
<nav class="sticky-timeline" :aria-label="t('ui.timeline.navAria')" role="navigation">

<!-- ACTUAL (líneas 93-99): -->
<button
  class="tick-button"
  :data-chapter="ch.id"
  :aria-label="`Ir a ${ch.era} (${ch.year})`"
  :aria-current="activeChapter === ch.id ? 'true' : undefined"
  @click="onTickClick(ch.id)"
>

<!-- PHASE 2 (UI-SPEC §11.4 + RESEARCH Pattern 7 líneas 898-): -->
:aria-label="t('ui.timeline.tickAria', { era: ch.era, year: ch.year })"
```

**Pitfall to avoid (RESEARCH Pitfall 3, líneas 968-989):** el aria-label binding usa `t()` reactivo — debe re-evaluarse al cambiar `locale`. Verificar en test que mutar `locale.value` actualiza el atributo después de nextTick (sin recargar). Tests existentes (líneas 86-104) hacen assert literal del string ES; Phase 2 los actualiza para multiplexer ES/EN según `locale.value`.

**Inject pattern:** Igual que ScrollShell — añadir `import { useI18n } from 'vue-i18n'; const { t } = useI18n()` al setup.

---

### `src/components/SkipLink.vue` (MOD)

**Self-extend trivial.** Diff línea 70:

```vue
<!-- SkipLink.vue ACTUAL (línea 70): -->
<a href="#main-content" id="skip-link" class="skip-link" :class="{ hidden: isHidden }" @blur="onBlur">Saltar al contenido / Skip to content</a>

<!-- PHASE 2 (RESEARCH Pattern 7 líneas 894-896): -->
<a href="#main-content" ...>{{ t('ui.skipLink') }}</a>
```

**Test impact** (`tests/components/SkipLink.test.js` Test 1 línea 45): el assertion `expect(a.text()).toBe('Saltar al contenido / Skip to content')` debe actualizarse a leer `t('ui.skipLink')` según el locale provisto en el test mount. Wrapper necesita `plugins: [createTestI18n({ locale: 'es' })]`.

---

### `src/components/StickyAvatar.vue` (MOD)

**Self-extend trivial.** Diff línea 83:

```vue
<!-- StickyAvatar.vue ACTUAL (línea 83): -->
:aria-label="`Avatar de Rafael — chapter ${activeChapter} activo`"

<!-- PHASE 2 (UI-SPEC §11.4 `avatar.ariaTemplate` key con interpolación {chapter}): -->
:aria-label="t('avatar.ariaTemplate', { chapter: activeChapter })"
```

> **No tocar** el state machine de opacity (líneas 33-77) — Phase 2 NO modifica el avatar
> swap (D-02 cross-cutting permanece). Solo el aria-label se i18nifica.
> **Phase 2 NO toca alt-text de busts** (busts placeholder no se renderean visualmente —
> A11Y-06 es Phase 3/4 cuando llegue pixel art real).

**Test impact** (`tests/components/StickyAvatar.test.js` Test 1 línea 73): assertion literal `'Avatar de Rafael — chapter 3 activo'` se actualiza a leer `t()` o se reemplaza por regex `/Avatar de Rafael.+3.+/`.

---

### `index.html` (MOD)

**Self-extend.** Diff línea 16 (Pitfall 4 RESEARCH líneas 1065-1073 + UI-SPEC §7.6):

```html
<!-- ACTUAL líneas 12-20: -->
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: #0b0b16;     /* ← REMOVER esta línea */
    color: #e7e7f0;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    min-height: 100vh;
  }

<!-- PHASE 2 (mandatory): remover background del body porque BackgroundLayers
     con z-index: -1 quedaría OCULTO por el body bg. -->
```

**No tocar línea 2** (`<html lang="es">`) — queda como fallback estático antes de que JS hidrate. App.vue watcher reactivo mutará el atributo cuando vue-i18n cargue.

**No tocar línea 10** (`viewport-fit=cover`) — necesario para `env(safe-area-inset-bottom)` heredado de Phase 1.

---

### `package.json` (MOD)

**Self-extend.** Añadir a `dependencies` (línea 14-17):

```json
{
  "dependencies": {
    "@vueuse/core": "^14.3.0",
    "phaser": "^3.86.0",
    "vue": "^3.5.0",
    "vue-i18n": "^11.4.2"
  }
}
```

> Si planner elige `@fontsource` packages (RESEARCH Example 7 Option A), añadir también:
> `@fontsource/vt323`, `@fontsource/comic-neue`, `@fontsource/lobster`, `@fontsource/audiowide`,
> `@fontsource/press-start-2p`, `@fontsource-variable/inter`.

---

## Shared Patterns (cross-cutting)

### Pattern: Composable + provide/inject

**Source vivo:** `src/App.vue` líneas 33-38 + `src/composables/usePRM.js` + `src/composables/useScrollState.js`.

**Apply to (Phase 2 nuevos):**
- `useBackgroundMorph` → instanciado en App.vue setup, `provide('bgMorph', bgMorph)`, `inject('bgMorph')` en BackgroundLayers.vue.

```javascript
// App.vue líneas 33-38 (literal):
const shellRef = ref(null)
const scrollState = useScrollState(shellRef)
const prm = usePRM()

provide('scrollState', scrollState)
provide('prm', prm)
```

> Phase 2 nota: `useI18n()` de vue-i18n NO se provide/inject manualmente — el plugin Vue
> hace la inyección global cuando `app.use(i18n)` corre en main.js. Cada componente que
> necesite traducir hace `const { t, locale } = useI18n()` directamente. NO duplicar
> `provide('i18n', ...)`. (RESEARCH §923-924, Don't Hand-Roll table.)

### Pattern: PRM mid-flight recovery (HIGH 2 fix)

**Source vivo:** `src/components/StickyAvatar.vue` líneas 64-77 (watcher dedicado sobre `prefersReduced`).

**Apply to:** `useBackgroundMorph` (snap a final state si PRM activa mid-crossfade). RESEARCH Pattern 2 líneas 519-532 muestra la adaptación a 2 capas verbatim.

### Pattern: Focus ring universal (NO duplicar `outline` per-component)

**Source vivo:** `src/App.vue` líneas 117-120:

```css
:focus-visible {
  outline: 3px solid var(--c-focus);
  outline-offset: 3px;
}
```

**Apply to:** Phase 2 NUEVO `.lang-toggle` — NO declarar `outline:` propio. Hereda automáticamente. UI-SPEC §9.3 (Pitfall 1 RESEARCH líneas 1041-1045): "NUNCA declarar `outline: 1px` o `outline: 2px`". Solo overridear `--c-focus` per chapter (eso lo hace `chapter-themes.css`).

### Pattern: Defensive PRM CSS branch

**Source vivo:** `src/App.vue` líneas 105-109 + `src/components/StickyAvatar.vue` líneas 161-165 + `src/components/SkipLink.vue` líneas 126-130.

```css
/* App.vue (líneas 102-109): */
.scroll-shell { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  .scroll-shell { scroll-behavior: auto; }
}

/* StickyAvatar (líneas 161-165): */
@media (prefers-reduced-motion: reduce) {
  .avatar-placeholder { transition: none; }
}
```

**Apply to:** `BackgroundLayers.vue` (transition: opacity 200ms ease default → 150ms ease bajo PRM, NO `none` — D-03 dicta crossfade ≤150ms, no instant). UI-SPEC §7.2 verbatim.

### Pattern: readFileSync raw-source CSS asserts

**Source vivo:** `tests/components/StickyAvatar.test.js` líneas 36-40 + Tests 7-10 (líneas 178-218) + `tests/components/SkipLink.test.js` líneas 28-32 + Tests 6-8 (líneas 102-123).

```javascript
// StickyAvatar.test.js (líneas 36-40):
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const STICKY_AVATAR_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/StickyAvatar.vue'),
  'utf8'
)

// Test 7 (líneas 178-185) — patrón verbatim:
it('CSS: .sticky-avatar declares position fixed...', () => {
  expect(STICKY_AVATAR_SOURCE).toMatch(/\.sticky-avatar\s*\{[\s\S]*?position:\s*fixed/)
  expect(STICKY_AVATAR_SOURCE).toMatch(/top:\s*var\(--sp-md\)/)
  // ...
})
```

**Apply to:** TODOS los tests CSS de Phase 2 (`BackgroundLayers.test.js`, `LangToggle.test.js`, y theme-tokens.test.js si planner lo añade). Replicar el pattern.

### Pattern: mount helper con provides mutables

**Source vivo:** `tests/components/StickyAvatar.test.js` líneas 44-56 + `tests/components/StickyTimeline.test.js` líneas 51-69.

```javascript
// StickyAvatar.test.js (líneas 44-56) — patrón canónico:
function mountAvatar({ initialChapter = 3, initialPRM = false } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(initialPRM)
  const wrapper = mount(StickyAvatar, {
    global: {
      provide: {
        scrollState: { activeChapter },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, activeChapter, prefersReduced }
}
```

**Apply to:**
- `BackgroundLayers.test.js` → `mount(BackgroundLayers, { global: { provide: { bgMorph: { layerA: {chapter: ref(3), opacity: ref(1)}, layerB: {...} } } } })`
- `LangToggle.test.js` → además del provide, requiere `plugins: [createTestI18n({ locale: 'es' })]` (sin analog vivo — planner sigue vue-i18n test docs).

### Pattern: defineComponent wrapper para correr composable

**Source vivo:** `tests/composables/usePRM.test.js` líneas 62-72 + `tests/composables/useScrollState.test.js` líneas 22-48.

```javascript
// usePRM.test.js (líneas 62-72):
function makeWrapper() {
  let exposed = null
  const Comp = defineComponent({
    setup() {
      exposed = usePRM()
      return () => null
    },
  })
  const wrapper = mount(Comp, { attachTo: document.body })
  return { wrapper, get: () => exposed }
}
```

**Apply to:** `tests/composables/useBackgroundMorph.test.js`. Adaptar para pasar `activeChapter` y `prm` como args al composable factory.

### Pattern: Fake timers + flushPromises para state machine

**Source vivo:** `tests/components/StickyAvatar.test.js` Tests 3, 4, 6 (líneas 92-173).

```javascript
// StickyAvatar.test.js (líneas 113-134) — Test 4 patrón:
it('default motion: chapter change drops opacity to 0, then restores to 1 after 100ms', async () => {
  vi.useFakeTimers()
  const { wrapper, activeChapter } = mountAvatar({ initialChapter: 3, initialPRM: false })
  activeChapter.value = 4
  await flushPromises()
  expect(placeholder().attributes('style')).toContain('opacity: 0')
  vi.advanceTimersByTime(99)
  await flushPromises()
  expect(placeholder().attributes('style')).toContain('opacity: 0')
  vi.advanceTimersByTime(1)
  await flushPromises()
  expect(placeholder().attributes('style')).toContain('opacity: 1')
})
```

**Apply to:** `useBackgroundMorph.test.js` — test que verifica que tras 200ms (default), la `outgoing.chapter` pasa a null y `transitionPhase` vuelve a 'idle'. PRM branch: tras 150ms en lugar de 200.

---

## No Analog Found

| Archivo | Rol | Data Flow | Razón |
|---------|-----|-----------|-------|
| `src/i18n/es.json` + `src/i18n/en.json` | data static | n/a | Primer JSON de strings del proyecto. Copy verbatim de UI-SPEC §11.2-11.3. |
| `public/fonts/*.woff2` | binary asset | n/a | `public/assets/` está vacío post-Phase 1. Pipeline en RESEARCH Example 7 (3 opciones). |
| `src/styles/fonts.css` (si planner elige path manual) | css source | n/a | Primer `@font-face` del proyecto. RESEARCH Example 6 verbatim. Si planner elige `@fontsource` packages, este archivo NO existe. |
| `tests/i18n/locale-init.test.js` mock de `navigator.language` | test setup | n/a | Sin analog directo (`usePRM.test.js` mockea matchMedia, no navigator). Patrón: `Object.defineProperty(navigator, 'language', { value: 'es-EC', configurable: true })`. |
| `tests/i18n/parity.test.js` flatten helper | test util | n/a | Solo trivial JSON flattening — RESEARCH Pattern 4 líneas 786-800 da el código verbatim. |

---

## Metadata

**Analog search scope:**
- `src/` (App.vue, components/, composables/, main.js)
- `tests/` (composables/, components/, smoke.test.js)
- `index.html`, `package.json`
- `.planning/phases/02-theme-system-i18n/` (CONTEXT, RESEARCH, UI-SPEC)

**Files scanned:** 17 archivos vivos + 3 artefactos de planning.

**Files re-read across both passes:** 0 (todos en pasada única o ranges no-overlapping).

**Decisiones críticas tomadas por este patterns-mapper:**

1. **`useBackgroundMorph` analog es `StickyAvatar.vue` (no `useScrollState.js`).** Aunque el composable es JS y StickyAvatar es componente, el state-machine pattern es el match exacto — un componente fuente puede ser analog de un composable si el shape del watcher + setTimeout + PRM recovery es el mismo. `useScrollState` aporta solo el cleanup pattern.

2. **`LangToggle.vue` requiere DOS analogs combinados** (SkipLink + StickyTimeline) porque ningún componente Phase 1 cubre simultáneamente: (a) HUD invariante fixed-positioned + (b) button con click handler + (c) tap target 44×44 + (d) bilingue i18n. El planner debe citar ambos.

3. **`src/i18n/index.js` analog es `usePRM.js`** porque ambos encapsulan una browser API externa con minimal wrap. NO es analog de `useScrollState.js` (más complejo, no factory pattern).

4. **El v-for de ScrollShell.vue YA está locked** (líneas 74-85). Open-Q2-A no es realmente "abierto" — el planner debe preservar el array `chapters` actual y solo i18nificar `aria-label`. NO migrar a `src/data/chapters.js` en Phase 2 (eso es Phase 3 CON-05).

5. **`index.html` `background: #0b0b16` MUST go** — sin esto, BackgroundLayers con z-index -1 quedan invisibles (RESEARCH Pitfall 4 + UI-SPEC §7.6). Documentado verbatim.

6. **NO duplicar focus ring per-component.** El `:focus-visible` universal de App.vue líneas 117-120 hereda automáticamente al LangToggle. Phase 2 SOLO override `--c-focus` per chapter en `chapter-themes.css`.

**Pattern extraction date:** 2026-05-13.
