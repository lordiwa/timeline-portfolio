---
phase: 1
plan: 2
subsystem: scroll-shell
slug: walking-skeleton
wave: 1
tags: [walking-skeleton, scroll-snap, intersection-observer, deep-link, a11y, composable]
dependency_graph:
  requires:
    - "Plan 01 (W0, toolchain-setup) — @vueuse/core, Vitest harness, mocks globales"
  provides:
    - "src/composables/useScrollState.js — activeChapter, scrollProgress, scrollToChapter (consumido por W2 usePRM, W3 sticky-avatar, W4 sticky-timeline-marker)"
    - "src/components/ScrollShell.vue — 7 ChapterSection inline con scroll-snap-y mandatory (foundation visual de toda la fase)"
    - "src/App.vue rewrite — provide('scrollState', ...) cableado para que StickyAvatar (W3) y StickyTimeline (W4) lo inject sin prop drilling"
    - "CSS Custom Properties globales en :root (UI-SPEC §3 spacing + §4 colors) — Phase 2 las sobreescribirá por [data-chapter]"
    - "PRM CSS-side defensivo declarado (@media prefers-reduced-motion: reduce → scroll-behavior: auto, D-01)"
  affects:
    - "Plan 03 (W2, usePRM-composable): consumirá scrollToChapter para wire del PRM JS branch"
    - "Plan 04 (W3, sticky-avatar-placeholder): inject('scrollState') para leer activeChapter"
    - "Plan 05 (W4, sticky-timeline-marker): inject('scrollState') para leer scrollProgress + invocar scrollToChapter"
    - "Plan 06 (W5, skiplink-a11y-polish): el tabindex=0 del .scroll-shell es el target del skip link"
tech_stack:
  added:
    - "(ninguno nuevo — todo construido sobre el stack del W0)"
  patterns:
    - "PATTERN A (watch+immediate+flush:post): el composable se suscribe al shellRef vía watch reactivo en vez de onMounted; elimina el race con el :ref callback de Vue cuando el composable se instancia ANTES de que el template monte. flush:'post' garantiza que el callback corre DESPUÉS del DOM update."
    - "PATTERN B (canonical scrollToChapter): el deep-link ?ch=N invoca scrollToChapter(N, 'auto') del composable, NO getElementById().scrollIntoView() directo. Mantiene una sola ruta canónica spy-able desde tests."
    - "PATTERN C (wrapper template con 7 chapter stubs): los tests del composable montan un componente con <section id='chapter-0'>..<section id='chapter-6'> stubs para que document.getElementById('chapter-N') funcione en jsdom — sin esto los tests de scrollToChapter pasarían por accidente (early return del null check)."
    - "Doble RAF para deep-link initial: maybeApplyDeepLink usa requestAnimationFrame anidado 2x antes de invocar scrollToChapter, dando al browser tiempo de terminar el snap layout antes del scroll programático. Otros callers (tick click, keyboard) NO pagan ese costo."
    - "Function ref pattern en template: :ref=\"el => shellRef.value = el?.shellEl ?? null\" — App.vue extrae el shellEl expuesto vía defineExpose en ScrollShell y lo asigna al shellRef que el watch del composable está observando."
    - "Spy global vi.fn() sobre HTMLElement.prototype.scrollIntoView en tests/setup.js (no por suite con spyOn/mockRestore) — evita order-dependency en jsdom donde mockRestore deja referencias stale."
key_files:
  created:
    - src/composables/useScrollState.js
    - src/components/ScrollShell.vue
    - tests/composables/useScrollState.test.js
    - tests/components/ScrollShell.test.js
  modified:
    - src/App.vue (placeholder reemplazado por layout root con ScrollShell + provide(scrollState))
    - tests/setup.js (añadido stub global de scrollIntoView como vi.fn())
    - vite.config.js (alias @ → ./src)
    - vitest.config.js (alias @ → ./src)
decisions:
  - "watch(shellRef, ..., { immediate: true, flush: 'post' }) en lugar de onMounted (PATTERN A) — única forma robusta de sobrevivir al race con el :ref callback de Vue cuando el composable se instancia en setup()."
  - "Deep-link siempre via scrollToChapter (PATTERN B) — un canonical path testable; el doble RAF queda en maybeApplyDeepLink (caller-side), NO dentro de scrollToChapter para no penalizar otros consumers."
  - "Tests del composable usan wrapper template canónico con 7 <section> stubs (PATTERN C) — sin stubs, document.getElementById crasharía o el null-check del composable haría que los tests pasaran por accidente."
  - "Era titles en español neutro siguiendo UI-SPEC §7.1: `YYYY · {era}` (puntito-medio U+00B7, no asterisco)."
  - "CSS string asserts (regex sobre el SFC raw) para validar reglas críticas en el bloque <style scoped> — pragmático para Wave 1 ya que jsdom no aplica CSS realmente; el smoke test visual de Plan 07 confirmará el comportamiento real."
  - "Spy global de scrollIntoView vía vi.fn() en setup.js — descartado el patrón vi.spyOn + mockRestore por suite porque causaba flakiness order-dependent en jsdom (referencias stale en elementos creados por mounts previos)."
metrics:
  duration_minutes: 18
  completed_at: "2026-05-13T02:50:00.000Z"
  tasks_completed: 4
  files_created: 4
  files_modified: 4
  tests_added: 19
  tests_passing: 22  # 11 composable + 8 component + 3 smoke previos
---

# Phase 1 Plan 02: Walking Skeleton Summary

**One-liner:** Foundation completa del scroll shell — useScrollState composable + ScrollShell con 7 ChapterSection inline + App.vue layout root + provide(scrollState) — todo cableado con los 3 patterns críticos (watch en lugar de onMounted, canonical scrollToChapter, wrapper template con stubs) y 19 tests verde.

## Qué se construyó

### 1. `src/composables/useScrollState.js` — composable núcleo

Expone:

- `activeChapter` (`ref<number>`, readonly) — default 3, actualizado por IntersectionObserver cuando `intersectionRatio ≥ 0.6`
- `scrollProgress` (`ref<number 0..1>`, readonly) — default 0, calculado via RAF loop (pause/resume idle 150ms)
- `scrollToChapter(N, behavior = 'smooth')` — método canónico de navegación; defensive null-check para entornos sin DOM

Setup pattern (PATTERN A):

```javascript
const stopWatch = watch(
  shellRef,
  (el) => {
    if (!el) return
    initObserver(el)
    el.addEventListener('scroll', handleScroll, { passive: true })
    maybeApplyDeepLink()  // doble RAF → scrollToChapter(N, 'auto')
  },
  { immediate: true, flush: 'post' }
)
```

Cleanup en `onBeforeUnmount`: `observer.disconnect()`, `removeEventListener('scroll', ...)`, `rafCtl.pause()`, `clearTimeout(idleTimer)`, `stopWatch()`.

### 2. `src/components/ScrollShell.vue` — 7 ChapterSection inline

- `<main id="main-content" class="scroll-shell" tabindex="0" ref="shellEl">` con `defineExpose({ shellEl })`
- 7 `<section>` iteradas con `v-for` sobre array canónico `chapters` (id 0..6, year/era de UI-SPEC §7.1)
- IDs `chapter-0`..`chapter-6`, `data-chapter`, `aria-label="{era} — {year}"`
- Cada section contiene `<p class="era-title">{{ year }} · {{ era }}</p>`

CSS críticos en `<style scoped>`:

- `.scroll-shell`: `height: 100vh; height: 100dvh; overflow-y: scroll; scroll-snap-type: y mandatory; -webkit-overflow-scrolling: touch`
- `.chapter-section`: `height: 100dvh; scroll-snap-align: start; scroll-snap-stop: always`
- `.era-title`: `font-size: clamp(2rem, 5vw, 3.5rem)`

### 3. `src/App.vue` — layout root rewrite

```javascript
const shellRef = ref(null)
const scrollState = useScrollState(shellRef)
provide('scrollState', scrollState)
```

Template:

```html
<ScrollShell :ref="el => { shellRef.value = el?.shellEl ?? null }" />
```

`<style>` global declara los CSS Custom Properties de UI-SPEC §3 (spacing) y §4 (colors) en `:root`, más el branch `@media (prefers-reduced-motion: reduce)` que pone `scroll-behavior: auto` (D-01 CSS-side).

### 4. Tests (19 nuevos, 22 totales con smoke previo)

`tests/composables/useScrollState.test.js` — **11/11 verde:**

1. Exporta función `useScrollState`
2. Refs readonly con defaults correctos (activeChapter=3, scrollProgress=0); sin shellRef cableado, IO NO se crea
3. Deep-link `?ch=0` → `scrollIntoView({ behavior: 'auto', block: 'start' })` sobre `#chapter-0`
4. Deep-link `?ch=99` → fallback a `#chapter-3`
5. Deep-link `?ch=abc` → fallback a `#chapter-3`
6. Deep-link `?ch=` (vacío) → fallback a `#chapter-3`
7. Sin query string → `#chapter-3`
8. `scrollToChapter(2, 'smooth')` directo → invoca scrollIntoView correcto
9. IO callback con `intersectionRatio: 0.7` → `activeChapter.value = 4`
10. IO callback con `intersectionRatio: 0.4` → NO cambia activeChapter
11. `onBeforeUnmount` cleanup: disconnect + removeEventListener llamados

`tests/components/ScrollShell.test.js` — **8/8 verde:**

1. `<main>` root tiene class scroll-shell, id main-content, tabindex 0
2. Exactamente 7 sections con `data-chapter` 0..6
3. Cada section: id correcto + `aria-label="{era} — {year}"` (Terminal/HTML 90s/Flash/Web 2.0/AR/VR/Modern/Phaser)
4. Cada section: era-title con copy `YYYY · {era}` exacto
5. CSS: `scroll-snap-type: y mandatory` presente
6. CSS: `scroll-snap-align: start` + `scroll-snap-stop: always` presentes
7. CSS: `100vh` + `100dvh` fallback presentes
8. CSS: `-webkit-overflow-scrolling: touch` presente

## Verificación

### Automated (npm run test:run)

`npm run test:run` → exit 0 — **22/22 tests passing** en 3 runs consecutivos sin flakiness.

| Suite | Tests | Status |
|-------|-------|--------|
| tests/smoke.test.js | 3 | ✓ |
| tests/components/ScrollShell.test.js | 8 | ✓ |
| tests/composables/useScrollState.test.js | 11 | ✓ |
| **Total** | **22** | **PASS** |

### Build (npm run build)

`vite build` → exit 0; dist generado:

- `dist/index.html` 0.79 kB (gzip 0.45 kB)
- `dist/assets/index-*.css` 1.10 kB (gzip 0.56 kB)
- `dist/assets/index-*.js` 65.12 kB (gzip 26.06 kB)

Warnings de `/* #__PURE__ */` provienen de `node_modules/@vueuse/core` upstream — no afectan funcionalidad.

### Manual smoke test del walking skeleton

Los 12 ítems del Task 2.4 (verificación visual en browser) NO se ejecutaron por mí (soy un agente automatizado sin acceso al browser visual). En su lugar:

- ✓ `npm run dev` arranca sin errores (verificado: Vite 5.4.21 ready in ~760ms)
- ✓ HTTP 200 en `http://localhost:5173/` (puerto limpio tras matar stale node.exe)
- ✓ HTML servido incluye `<div id="app">` y `<script type="module" src="/src/main.js">`
- ✓ Vite transforma App.vue importando `ScrollShell.vue` + `useScrollState.js` correctamente
- ⚠️ Validación visual completa (12 ítems: snap chapter-a-chapter, deep-link en browser, snap-stop:always con flick, F12 inspect de tabindex/aria-label) queda pendiente para que Rafael la haga manualmente o para el Plan 07 (iOS smoke test).

Bonus: maté el proceso stale `node.exe` PID 21112 que W0 flageó. El puerto 5173 ahora está limpio.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Alias `@` no estaba configurado pero los tests del plan lo usaban**

- **Encontrado durante:** Task 2.1 (primer run de tests)
- **Problema:** El plan especifica `import { useScrollState } from '@/composables/useScrollState'` pero ni `vite.config.js` ni `vitest.config.js` declaraban el alias.
- **Fix:** Añadido `resolve.alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }` en ambos config files.
- **Files modified:** `vite.config.js`, `vitest.config.js`
- **Commit:** `2888599`

**2. [Rule 3 - Blocking] jsdom no implementa `HTMLElement.prototype.scrollIntoView`**

- **Encontrado durante:** Task 2.1 (primer run de tests)
- **Problema:** `vi.spyOn(HTMLElement.prototype, 'scrollIntoView')` fallaba con "property is not defined on the object".
- **Fix:** Añadido stub global en `tests/setup.js` como `vi.fn()` (no como no-op function) para que los tests puedan inspeccionar las llamadas sin crear su propio spy. El patrón `mockClear()` en beforeEach evita order-dependency.
- **Files modified:** `tests/setup.js`
- **Commit:** `c2e94e8`

**3. [Rule 1 - Bug] Flakiness en el primer test que mounta wrapper con deep-link**

- **Encontrado durante:** Task 2.3 (al integrar la full suite con ScrollShell.test.js antes)
- **Problema:** `waitForDeepLink` esperaba doble RAF + flushPromises, pero el watch flush:'post' del composable schedulea su callback como microtask que aún no había drenado cuando los RAFs corrían. Resultado: el doble RAF de `maybeApplyDeepLink` se programaba DESPUÉS de que ya esperamos los 2 RAFs del helper.
- **Fix:** Reordenar el helper a `flushPromises() → doble RAF → flushPromises()`. El primer flush garantiza que el watch corre antes de empezar a contar RAFs.
- **Files modified:** `tests/composables/useScrollState.test.js`
- **Commit:** `506e600`

### Auth gates

Ninguno — no hubo interacción con servicios externos.

### Authentication gates documentadas

N/A.

## PATTERN A/B/C compliance (el checker exigió no regresar)

| Pattern | Localización | Verificación |
|---------|--------------|--------------|
| **A — watch(shellRef, ..., immediate+flush:post), NO onMounted** | `src/composables/useScrollState.js:80-92` | `grep -n "watch(" src/composables/useScrollState.js` → línea 80; **no hay `onMounted` en el archivo** (sólo `onBeforeUnmount` para cleanup) |
| **B — deep-link invoca scrollToChapter, NO getElementById directo** | `src/composables/useScrollState.js:74-78` (función `maybeApplyDeepLink`) | El doble RAF llama a `scrollToChapter(initial, 'auto')`; no hay `getElementById` fuera de `scrollToChapter` |
| **C — wrapper template con 7 chapter stubs** | `tests/composables/useScrollState.test.js:25-46` (función `makeWrapper`) | El template literal incluye `<section id="chapter-0">..<section id="chapter-6">` |

Tests pertinentes verifican cada pattern indirectamente: PATTERN A se ejercita en el Test 2 ("does NOT wire IO yet" con null ref) y todos los demás (que requieren el watch funcione); PATTERN B se ejercita en Tests 3-7 (todos esperan que `scrollIntoView` se llame con `behavior:'auto'` vía el canonical path); PATTERN C es prerequisito para que cualquier test de deep-link no pase por accidente.

## Confirmaciones requeridas por el plan output

- ✅ `provide('scrollState', scrollState)` cableado en `App.vue:24` — disponible para `inject('scrollState')` en plans 04 (StickyAvatar) y 05 (StickyTimeline).
- ✅ El composable corre vía `watch(shellRef, ..., { immediate: true, flush: 'post' })` — no `onMounted`. Verificado por `grep`: el archivo no contiene `onMounted`.
- ✅ Sin race conditions de null ref observadas en los tests automatizados. El Test 2 prueba específicamente el caso `useScrollState(ref(null))` sin DOM cableado → IO no se crea, refs tienen defaults correctos.
- ✅ Sin desviaciones del UI-SPEC §7.1 — copy `YYYY · {era}`, IDs `chapter-N`, `aria-label="{era} — {year}"` cumplidos al pie de la letra.

## Self-Check: PASSED

Verificación de claims antes de cerrar:

- ✓ `src/composables/useScrollState.js` existe (commit `2888599`)
- ✓ `src/components/ScrollShell.vue` existe (commit `9d06b2c`)
- ✓ `tests/composables/useScrollState.test.js` existe (commit `2888599`)
- ✓ `tests/components/ScrollShell.test.js` existe (commit `9d06b2c`)
- ✓ `src/App.vue` modificado (commit `506e600`) — incluye `useScrollState`, `ScrollShell`, `--c-bg: #0b0b16`
- ✓ Commits encontrados en `git log`: `2888599`, `9d06b2c`, `506e600`, `c2e94e8`
- ✓ `npx vitest run` → 22/22 PASS
- ✓ `npm run build` → exit 0

## Siguientes pasos

Wave 1 cierra. Próximo: **Wave 2 — Plan 03 `usePRM-composable`** (`.planning/phases/01-scroll-shell-sticky-anchors/01-PLAN-usePRM-composable.md`). Plan 03 añadirá el composable `usePRM()` que consume `useMediaQuery('(prefers-reduced-motion: reduce)')` y se cableará al `scrollToChapter` para switchar `behavior` entre `'smooth'` y `'auto'` automáticamente (D-01 dimensión JS, complementando el branch CSS ya declarado en App.vue).
