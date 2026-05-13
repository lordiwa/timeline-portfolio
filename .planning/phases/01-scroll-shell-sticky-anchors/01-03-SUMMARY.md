---
phase: 1
plan: 3
subsystem: scroll-shell
slug: usePRM-composable
wave: 2
tags: [prm, prefers-reduced-motion, composable, a11y, vueuse, provide-inject]
dependency_graph:
  requires:
    - "Plan 01 (W0, toolchain-setup) — @vueuse/core ^14.3, Vitest harness, matchMedia mock global en tests/setup.js"
    - "Plan 02 (W1, walking-skeleton) — App.vue layout root con provide(scrollState) ya cableado; CSS branch @media (prefers-reduced-motion: reduce) ya declarado en App.vue global <style>"
  provides:
    - "src/composables/usePRM.js — { motion: Ref<'reduce' | 'no-preference'>, prefersReduced: ComputedRef<boolean> } reactivo a matchMedia, con cleanup automático via vueuse"
    - "App.vue: provide('prm', usePRM()) — single source of truth global, sin prop drilling"
  affects:
    - "Plan 04 (W3, sticky-avatar-placeholder): inject('prm') para short-circuit del avatar crossfade bajo PRM (D-02) + watcher de PRM-mid-flight recovery"
    - "Plan 05 (W4, sticky-timeline-marker): inject('prm') para derivar behavior 'smooth' vs 'auto' en tick click y keyboard nav (D-04)"
tech_stack:
  added:
    - "(ninguno nuevo — usePreferredReducedMotion ya estaba en @vueuse/core 14.3 instalado en W0)"
  patterns:
    - "PATTERN single-source-of-truth (UI-SPEC §8): un único composable lee matchMedia; consumers inject('prm') en lugar de importar usePRM en cada componente. Evita divergencia entre múltiples MediaQueryList y duplicación de listeners."
    - "PATTERN cleanup-by-vueuse: usePreferredReducedMotion registra/quita su listener 'change' automáticamente en el lifecycle del componente que lo invocó. Nuestro wrapper NO añade onBeforeUnmount — el unmount es responsabilidad de vueuse, no nuestro."
    - "PATTERN computed-derivation: prefersReduced es computed() (no ref()) porque deriva de motion. Vue 3 computed sin setter es la primitiva correcta para valores derivados; consumers que intenten escribir reciben un warning del framework (no throw)."
    - "PATTERN controllable matchMedia mock (test-only): el mock por test sobrescribe window.matchMedia retornando un MediaQueryList con getter dinámico de `matches` + listeners capturados via addEventListener('change', cb), permitiendo invocar fireChange(newMatches) manualmente para simular toggle de PRM sin depender de jsdom interno."
key_files:
  created:
    - src/composables/usePRM.js
    - tests/composables/usePRM.test.js
    - .planning/phases/01-scroll-shell-sticky-anchors/01-03-SUMMARY.md
  modified:
    - src/App.vue (añadido import usePRM + const prm + provide('prm', prm))
decisions:
  - "API mínima: solo { motion, prefersReduced }. NO helpers tipo withPRM(fn) o prmBehavior() — anti-pattern hasta tener 3+ consumers que justifiquen extraer (key-decisions del plan)."
  - "prefersReduced via computed() (no ref()) — primitiva canónica de Vue 3 para valores derivados."
  - "Cleanup delegado a vueuse — NO añadimos onBeforeUnmount en el wrapper."
  - "Test 5 (readonly computed assertion) eliminado por MEDIUM 2 del plan-checker — computed sin setter emite warning, no throw; verificarlo sería testear Vue framework interno, no nuestro código. Total: 4 tests (T1 export shape, T2 no-preference, T3 reduce, T4 reactividad)."
  - "Plan 03 NO modifica scrollToChapter ni introduce JS branch PRM en useScrollState — eso es anti-scope explícito del plan (líneas 52-55): 'NO modifica el behavior de scrollToChapter para usar PRM — eso es Plan 05'. El CSS branch en App.vue (heredado de Plan 02) ya cubre el comportamiento de scroll-snap bajo PRM. Plan 03 solo cablea el conduit (composable + provide) para que Plans 04 y 05 lo consuman."
metrics:
  duration_minutes: 10
  completed_at: "2026-05-13T03:00:37Z"
  tasks_completed: 3  # 3.1 composable+tests (TDD), 3.2 App.vue wire, 3.3 smoke (no-op para automation)
  files_created: 2    # usePRM.js + usePRM.test.js (SUMMARY no cuenta como código)
  files_modified: 1   # App.vue
  tests_added: 4
  tests_passing: 26   # 22 previos (3 smoke + 11 useScrollState + 8 ScrollShell) + 4 nuevos usePRM
---

# Phase 1 Plan 03: usePRM Composable Summary

**One-liner:** `usePRM` composable cableado vía `usePreferredReducedMotion` de @vueuse/core, expuesto globalmente con `provide('prm', usePRM())` en App.vue — single source of truth para `prefers-reduced-motion` listo para que Plans 04 y 05 inject. 4 tests verde, suite total 26/26.

## Qué se construyó

### 1. `src/composables/usePRM.js` — wrap mínimo sobre vueuse

```javascript
import { computed } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

export function usePRM() {
  const motion = usePreferredReducedMotion()          // Ref<'reduce' | 'no-preference'>
  const prefersReduced = computed(() => motion.value === 'reduce')
  return { motion, prefersReduced }
}
```

- **API contractual** (UI-SPEC §8): `{ motion, prefersReduced }`. Sin helpers extra.
- **Reactividad**: vueuse internamente añade un listener `'change'` al `MediaQueryList` de `(prefers-reduced-motion: reduce)`. Toggle del OS mientras la página está cargada → `motion.value` se actualiza → `prefersReduced.value` re-evalúa el computed → consumers reactivos re-renderizan.
- **Cleanup**: delegado a vueuse — registra/quita el listener en el lifecycle del componente que invocó `usePRM()`.

### 2. `tests/composables/usePRM.test.js` — 4 tests verde

| # | Test | Aserciones clave |
|---|------|------------------|
| T1 | export shape | `usePRM` es función; retorna `{ motion, prefersReduced }` con `isRef` true en ambos |
| T2 | sin PRM | `matchMedia.matches=false` → `motion.value === 'no-preference'`, `prefersReduced.value === false` |
| T3 | con PRM | `matchMedia.matches=true` → `motion.value === 'reduce'`, `prefersReduced.value === true` |
| T4 | reactividad | Disparar manualmente el callback `'change'` registrado por vueuse con `{matches: true}` → tras `nextTick`, `prefersReduced.value === true` (verifica el wire reactivo end-to-end) |

**Test 5 eliminado** por MEDIUM 2 del plan-checker (ambigüedad framework-level — ver decisions).

**Patrón de mock**: helper `installMatchMediaMock(initialMatches)` sobrescribe `window.matchMedia` por test devolviendo un `MediaQueryList` con getter dinámico de `matches` y un Set de listeners capturados via `addEventListener('change', cb)`. Expone `fireChange(newMatches)` que actualiza el getter e invoca todos los listeners con un event `{matches, media}` — simulando exactamente lo que el browser hace cuando el OS toggle cambia.

### 3. `src/App.vue` — `provide('prm', usePRM())` cableado

```diff
 import { ref, provide } from 'vue'
 import ScrollShell from './components/ScrollShell.vue'
 import { useScrollState } from './composables/useScrollState'
+import { usePRM } from './composables/usePRM'

 const shellRef = ref(null)
 const scrollState = useScrollState(shellRef)
+const prm = usePRM()

 provide('scrollState', scrollState)
+provide('prm', prm)
```

Consumers futuros (StickyAvatar Plan 04, StickyTimeline Plan 05, ScrollShell keyboard handlers Plan 05) hacen `const { prefersReduced } = inject('prm')` y derivan su comportamiento sin prop drilling ni duplicar listeners.

## Verificación

### Automated

```
npx vitest run
```

- **4/4** tests nuevos de `usePRM` passing.
- **26/26** suite completa passing (22 previos + 4 nuevos): smoke + 11 useScrollState + 8 ScrollShell + 4 usePRM.
- `npm run build` → OK, 1.18s, 67.46 kB JS / 1.10 kB CSS gzip. Warnings de `/* #__PURE__ */` provienen de `@vueuse/core/dist/index.js` (upstream package), no de nuestro código — Rollup las trata como no-bloqueantes.

### Manual (smoke test del Plan 03 Task 3.3)

> **Limitación del executor**: este agente automatizado no puede activar el toggle de "Animation effects" en Windows 11 Accessibility ni operar Chrome DevTools "Emulate CSS prefers-reduced-motion: reduce". El smoke test queda PENDIENTE de validación humana — Rafael puede ejecutarlo cuando lo desee (3 minutos). Plan 07 (`ios-smoke-test`) incluye un check formal de PRM como parte de su manual checklist.

**Steps para Rafael** (cuando quiera verificar):
1. `npm run dev` → abrir `http://127.0.0.1:5173/`.
2. Confirmar landing en chapter 3, scroll smooth entre chapters.
3. Chrome DevTools → `Cmd/Ctrl+Shift+P` → "Emulate CSS prefers-reduced-motion: reduce" → recargar.
4. Hacer scroll → ahora el snap es **instantáneo** (jump) en lugar de smooth. ✅ confirma D-01 del CSS branch ya en App.vue.
5. Restaurar el toggle al estado normal.

El JS-side branch (D-04, click-to-nav instantáneo bajo PRM) se valida en Plan 05 cuando los ticks de la timeline existen y consumen `inject('prm')`. Plan 03 solo cablea el conduit — los consumers que activan el branch JS vienen después.

## Deviations from Plan

**None** — plan executed exactly as written. Los 3 tasks (3.1 TDD del composable, 3.2 provide en App.vue, 3.3 smoke) ejecutados en orden, sin deviaciones de Rules 1-4.

Observaciones (no-deviaciones):
- El smoke manual del Task 3.3 queda PENDIENTE por limitación del entorno headless (documentado arriba) — no es una deviation sino una transferencia de la verificación visual a Rafael.
- Las warnings de `/* #__PURE__ */` en el build provienen de `@vueuse/core` upstream (no causadas por este plan). Out-of-scope per scope-boundary; no se actuó sobre ellas.

## Authentication Gates

Ninguno.

## Known Stubs

Ninguno introducido por este plan. El composable está completo y cableado; los consumers vendrán en Plans 04 y 05.

## Cómo lo consumen los próximos planes

### Plan 04 — StickyAvatar (W3)

```javascript
import { inject, watch } from 'vue'
const { prefersReduced } = inject('prm')
const { activeChapter } = inject('scrollState')

watch(activeChapter, async (newCh, oldCh) => {
  if (prefersReduced.value) {
    // short-circuit: swap inmediato sin crossfade (D-02)
    currentAvatar.value = avatarFor(newCh)
    return
  }
  // Crossfade 100+100 = 200ms total
  opacity.value = 0
  await new Promise(r => setTimeout(r, 100))
  currentAvatar.value = avatarFor(newCh)
  opacity.value = 1
})

// Watcher dedicado: si el OS toggle activa PRM mid-flight,
// cancelar timer pending y restaurar opacity = 1 (HIGH 2).
watch(prefersReduced, (isReduced) => {
  if (isReduced && pendingTimer) {
    clearTimeout(pendingTimer)
    opacity.value = 1
  }
})
```

### Plan 05 — StickyTimeline + keyboard nav (W4)

```javascript
const { prefersReduced } = inject('prm')
const { scrollToChapter } = inject('scrollState')

function onTickClick(N) {
  const behavior = prefersReduced.value ? 'auto' : 'smooth'
  scrollToChapter(N, behavior)   // D-04: PRM → jump instantáneo
}
```

El composable de Plan 03 es deliberadamente unopinionated sobre el `behavior` — cada consumer decide su propio `'smooth' vs 'auto'` derivado de `prefersReduced.value`. Si en el futuro 3+ consumers replicaran exactamente esa derivación, refactorizaríamos a un helper `prmBehavior()` — pero ahora sería anti-pattern (key-decisions del plan).

## Commits

- `95e9bc8` — feat(prm): plan 03 task 3.1 — usePRM composable + 4 tests (W2)
- `4b08f47` — feat(prm): plan 03 task 3.2 — provide('prm', usePRM()) en App.vue (W2)

(Task 3.3 no genera commit — es smoke manual sin archivos modificados.)

## Self-Check: PASSED

Verificación post-SUMMARY:

- ✅ `src/composables/usePRM.js` existe (FOUND).
- ✅ `tests/composables/usePRM.test.js` existe (FOUND, 4 tests).
- ✅ `src/App.vue` contiene `usePRM` y `provide('prm'` (FOUND, verificado via node assert script en Task 3.2).
- ✅ Commit `95e9bc8` existe en git log (FOUND).
- ✅ Commit `4b08f47` existe en git log (FOUND).
- ✅ Suite Vitest 26/26 verde, build Vite OK.
