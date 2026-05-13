---
phase: 2
plan: 4
slug: wave3-background-morph-engine
wave: 3
completed: 2026-05-13
duration_min: 35
tests_added: 15
tests_total_suite: 141
commits:
  - c1696d2: "test(02-04): RED — tests useBackgroundMorph (8 tests, state machine + PRM recovery + cleanup)"
  - 4ba8e30: "feat(02-04): GREEN — useBackgroundMorph composable (state machine 2-layer crossfade + PRM mid-flight recovery + cleanup)"
  - 0d8edc7: "test(02-04): RED — tests BackgroundLayers.vue (7 tests DOM contract + aria + data-chapter + opacity + CSS readFileSync)"
  - dd862f2: "feat(02-04): GREEN — BackgroundLayers.vue + App.vue wiring + index.html cleanup (Pitfall 9)"
requirements_covered:
  - THM-03: "Color morph engine — background full-viewport crossfade entre 7 chapters vía 2-layer opacity state machine"
key_decisions:
  - "DEFAULT_DURATION_MS=200ms: sync visual con avatar swap Phase 1 (D2-05 + Open-Q2-B locked) — el fondo y el avatar morfean en el mismo intervalo temporal"
  - "PRM_DURATION_MS=150ms: crossfade más corto bajo prefers-reduced-motion (D-03 cross-cutting) — DIFERENTE del avatar D-02 que es instant; el bg mantiene crossfade perceptible ≤150ms"
  - "PRM mid-flight recovery watcher dedicado: análogo al HIGH 2 fix de StickyAvatar Phase 1 — previene layer atascada en opacity parcial si user activa PRM durante un crossfade"
  - ".value explícito en template bindings de BackgroundLayers.vue: refs nested en objetos ({ chapter: ref(), opacity: ref() }) no se auto-unwrapean en template de <script setup> — se usa :data-chapter='layerA.chapter.value' explícito"
  - "Pitfall 9 aplicado: background:#0b0b16 removido de index.html body — BackgroundLayers con z-index:-1 quedaría oculta detrás del body bg sin este cleanup"
files_modified:
  created:
    - src/composables/useBackgroundMorph.js
    - src/components/BackgroundLayers.vue
    - tests/composables/useBackgroundMorph.test.js
    - tests/components/BackgroundLayers.test.js
  modified:
    - src/App.vue
    - index.html
---

# Phase 2 Plan 4: wave3-background-morph-engine Summary

> Motor de background morph end-to-end: composable `useBackgroundMorph` con state machine de 2 capas opacity crossfade (200ms default / 150ms PRM) + PRM mid-flight recovery + componente `BackgroundLayers.vue` HUD fijo detrás de todo el contenido + wiring via provide/inject en App.vue + cleanup del body bg legacy de index.html (Pitfall 9). Los 7 chapters del portafolio ahora morfean su fondo full-viewport al unísono con el avatar swap de Phase 1.

## What got built

### `src/composables/useBackgroundMorph.js` (~120 LOC con comentarios)

State machine análoga al avatar swap de Phase 1 (StickyAvatar.vue Plan 03) pero adaptada a 2 capas independientes con opacity crossfade continuo.

**API (UI-SPEC §7.4 verbatim):**
```javascript
useBackgroundMorph(activeChapter, { prefersReduced })
→ { layerA, layerB, transitionPhase }

layerA/layerB: { chapter: Ref<number|null>, opacity: Ref<0..1> }
transitionPhase: Ref<'idle' | 'crossfading'>
```

**Estado inicial:**
- `layerA = { chapter: activeChapter.value, opacity: 1 }` — visible con chapter inicial
- `layerB = { chapter: null, opacity: 0 }` — transparente en espera
- `transitionPhase = 'idle'`

**Función `morph(newChapter)`:**
1. `clearTimeout(pendingTimer)` — defensive rapid scroll (T6)
2. Compute `duration`: 200ms default / 150ms PRM
3. Identificar `incoming`/`outgoing` por `activeLayer` (alterna entre 'A' y 'B')
4. `incoming.chapter.value = newChapter` — ANTES de tocar opacidades (data-chapter correcto para CSS transition)
5. `transitionPhase = 'crossfading'`; `incoming.opacity = 1`; `outgoing.opacity = 0`
6. `setTimeout(duration)`: limpia `outgoing.chapter = null`, `transitionPhase = 'idle'`, flip `activeLayer`

**Watchers:**
- `watch(activeChapter, (newCh, oldCh) => { if (newCh === oldCh) return; morph(newCh) })` — noop guard T8
- `watch(prefersReduced, (isPRM) => { if (isPRM && pendingTimer) { /* snap-finaliza */ } })` — PRM mid-flight recovery T5

**Cleanup:** `onBeforeUnmount(() => { clearTimeout(pendingTimer) })` — defensive HMR leaks (T7)

**Constantes exportadas:** `DEFAULT_DURATION_MS = 200`, `PRM_DURATION_MS = 150`

**Restricciones cumplidas:** NO usa `inject`/`provide` (recibe args directamente — PATTERNS.md decisión #1). NO referencia `useScrollState` ni `scrollProgress` (solo consume `activeChapter` discrete — anti Pitfall 2).

### `src/components/BackgroundLayers.vue` (~60 LOC con comentarios)

HUD invariante decorativo no-pointer. Primero en el DOM de App.vue para quedar detrás de todo por z-index stacking.

**Script setup:**
```javascript
import { inject } from 'vue'
const { layerA, layerB } = inject('bgMorph')
```

**Template (UI-SPEC §7.1 VERBATIM):**
```html
<div class="bg-layers" aria-hidden="true">
  <div class="bg-layer bg-layer-a"
       :data-chapter="layerA.chapter.value"
       :style="{ opacity: layerA.opacity.value }">
  </div>
  <div class="bg-layer bg-layer-b"
       :data-chapter="layerB.chapter.value"
       :style="{ opacity: layerB.opacity.value }">
  </div>
</div>
```

Nota: `.value` explícito necesario porque las refs están anidadas dentro de objetos `{ chapter: ref(), opacity: ref() }` — Vue <script setup> no auto-unwrapea refs de segundo nivel en el template.

**CSS scoped (UI-SPEC §7.2 VERBATIM):**
```css
.bg-layers { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
.bg-layer  { position: absolute; inset: 0; background: var(--c-bg); transition: opacity 200ms ease; }
@media (prefers-reduced-motion: reduce) {
  .bg-layer { transition: opacity 150ms ease; }
}
```

`var(--c-bg)` se resuelve automáticamente al valor del chapter del `[data-chapter="N"]` selector en `chapter-themes.css` (W2) — sin lógica JS adicional para el color.

### `src/App.vue` (modificado)

**Imports añadidos:**
```javascript
import BackgroundLayers from './components/BackgroundLayers.vue'
import { useBackgroundMorph } from './composables/useBackgroundMorph'
```

**Setup (tras `provide('prm', prm)`):**
```javascript
const bgMorph = useBackgroundMorph(scrollState.activeChapter, prm)
provide('bgMorph', bgMorph)
```

**Orden DOM final (UI-SPEC §7.3 + §10 post-W3):**
```html
<BackgroundLayers />   ← NUEVO primer hijo (z-index:-1, detrás de todo)
<SkipLink />
<StickyAvatar />
<ScrollShell :ref="..." />
<StickyTimeline />
<LangToggle />
```

### `index.html` cleanup (Pitfall 9 — UI-SPEC §7.6)

Línea removida de `html, body`:
```css
background: #0b0b16;   /* REMOVIDO */
```

Razón: `BackgroundLayers` con `z-index: -1` quedaría invisible detrás del fondo opaco del body. Sin este cleanup, el motor de morph funcionaría en el DOM pero el usuario nunca lo vería.

**Preservation criteria verificados (todos True):**
- `min-height: 100vh` presente
- `color: #e7e7f0` presente
- `margin: 0; padding: 0` presentes
- `font-family: ui-monospace, ...` presente
- `<html lang="es">` presente
- `image-rendering: pixelated` presente
- `viewport-fit=cover` presente

## Tests añadidos

### `tests/composables/useBackgroundMorph.test.js` (8 tests)

| # | Test | Cobertura |
|---|------|-----------|
| T1 | Initial state: layerA.chapter=3/opacity=1, layerB.chapter=null/opacity=0, transitionPhase='idle' | UI-SPEC §7.4 verbatim |
| T2 | Default motion: chapter change → crossfading + 200ms timer finaliza (outgoing.chapter=null) | D2-05 timing |
| T3 | activeLayer flips: tras morph 3→4+200ms, siguiente morph usa layerA como incoming | State machine flipping |
| T4 | PRM branch: timer dispara a 150ms (no 200ms) bajo prefersReduced=true | D-03 cross-cutting |
| T5 | PRM mid-flight recovery: activar PRM durante crossfade snap-finaliza sin timer | HIGH 2 análogo |
| T6 | Rapid scroll defensive: 3 morphs back-to-back solo el último timer queda en flight | clearTimeout defensive |
| T7 | Cleanup onBeforeUnmount: clearTimeout llamado al desmontar mid-fade | HMR leak prevention |
| T8 | Same-chapter noop: mutar al mismo valor no dispara crossfade (if newCh===oldCh guard) | Guard correcto |

### `tests/components/BackgroundLayers.test.js` (7 tests)

| # | Test | Cobertura |
|---|------|-----------|
| T1 | DOM contract: .bg-layers + 2 .bg-layer (.bg-layer-a + .bg-layer-b) | UI-SPEC §7.1 |
| T2 | aria-hidden="true" en .bg-layers (HUD decorativo) | A11Y no-announce |
| T3 | data-chapter binding inicial: layerA.chapter=3 → data-chapter="3" | Reactivo inicial |
| T4 | opacity binding reactivo: mutate layerB.opacity.value → style actualiza | Vue reactivity |
| T5 | data-chapter binding reactivo: mutate layerA.chapter.value → data-chapter actualiza | Vue reactivity |
| T6 | CSS readFileSync: .bg-layers con fixed/inset/z-index:-1/pointer-events:none | UI-SPEC §7.2 |
| T7 | CSS readFileSync: .bg-layer + @media PRM 150ms | D-03 + UI-SPEC §7.2 |

## Bundle delta vs W2

| Métrica | W2 (post-02-03) | W3 (este plan) | Delta |
|---------|----------------|----------------|-------|
| CSS (gzip) | ~6.5 KB | 6.98 KB / 2.04 KB gz | +~0.5 KB |
| JS (gzip) | ~130 KB | 131.55 KB / 48.06 KB gz | +~1.5 KB |
| Test suite | 134 tests | 141 tests | +7 (componente) |

## Deviations from plan

### Auto-fixed — Rule 1

**[Rule 1 - Bug] refs nested no auto-unwrap en template (`.value` explícito en BackgroundLayers.vue)**
- **Encontrado durante:** Task 4.2, primera ejecución de tests (T3, T4, T5 fallaban)
- **Issue:** `:data-chapter="layerA.chapter"` pasaba el ref object completo (renderizando `"[object Object]"`) en lugar del valor número. Vue <script setup> auto-unwrapea refs declaradas directamente en setup, pero NO las refs anidadas dentro de objetos `{ chapter: ref(), opacity: ref() }` que vienen de `inject()`.
- **Fix:** Usar `.value` explícito en todos los bindings del template: `:data-chapter="layerA.chapter.value"` y `:style="{ opacity: layerA.opacity.value }"`.
- **Archivos:** `src/components/BackgroundLayers.vue`
- **Commit:** incluido en dd862f2

**[Rule 1 - Test adjustment] clearTimeout spy en Node.js retorna objeto Timeout (no Number)**
- **Encontrado durante:** Task 4.1, T7 (cleanup onBeforeUnmount)
- **Issue:** `expect(clearTimeoutSpy).toHaveBeenCalledWith(expect.any(Number))` fallaba porque en Node.js/jsdom, `setTimeout()` retorna un objeto `Timeout` (no un número primitivo como en browser). El assertion era correcto conceptualmente pero incorrecto en el entorno de test.
- **Fix:** Cambiar a `expect(clearTimeoutSpy).toHaveBeenCalled()` — verifica que se llamó clearTimeout sin restringir el tipo del argumento.
- **Archivos:** `tests/composables/useBackgroundMorph.test.js`
- **Commit:** incluido en 4ba8e30

## Stubs scan

No hay stubs que bloqueen el objetivo del plan. `var(--c-bg)` se resuelve correctamente via `chapter-themes.css` para los 7 chapters. Las layers muestran el color de fondo real de cada era.

Los únicos valores "vacíos" son esperados y correctos por diseño:
- `layerB.chapter = null` en estado inicial (la segunda capa arranca transparente sin chapter)
- No hay `--bg-image` por chapter aún — esto es intencional (Phase 3/4 añadirá pixel art backgrounds)

## Threat surface scan

Sin nuevas superficies de seguridad. `BackgroundLayers` no tiene eventos, no expone APIs, no hace fetch, no lee input. El `inject('bgMorph')` consume solo refs reactivos locales.

## Pending para W4 (Plan 02-05)

- Fuentes self-hosted por chapter: `@fontsource/vt323`, `@fontsource/comic-neue`, etc.
- Import de cada fuente en `main.js` condicionado al chapter activo (o font-display: swap para precargar)
- Los chapter-themes.css ya tienen `--font-body` por chapter — W4 hace que las fuentes custom estén disponibles

## Self-Check: PASSED

**Archivos creados/modificados verificados en disco:**
- `src/composables/useBackgroundMorph.js` — FOUND
- `src/components/BackgroundLayers.vue` — FOUND
- `tests/composables/useBackgroundMorph.test.js` — FOUND
- `tests/components/BackgroundLayers.test.js` — FOUND
- `src/App.vue` — FOUND (modificado)
- `index.html` — FOUND (modificado, sin #0b0b16)

**Commits verificados en git log:**
- `c1696d2` — RED useBackgroundMorph tests — FOUND
- `4ba8e30` — GREEN useBackgroundMorph composable — FOUND
- `0d8edc7` — RED BackgroundLayers tests — FOUND
- `dd862f2` — GREEN BackgroundLayers + App.vue + index.html — FOUND

**Tests:** 141/141 verdes (verificado con `npx vitest run`)
**Build:** `npm run build` exit 0 (CSS 6.98 KB / 2.04 KB gz, JS 131.55 KB / 48.06 KB gz)
