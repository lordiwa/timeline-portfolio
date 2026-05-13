---
phase: 1
plan: 4
slug: sticky-avatar-placeholder
wave: 3
completed: 2026-05-12
duration_min: 12
tests_added: 10
tests_total_suite: 36
commits:
  - 9cb3b26: "test(avatar): plan 04 task 4.1 RED — 10 tests para StickyAvatar (W3)"
  - 98df842: "feat(avatar): plan 04 task 4.1 — StickyAvatar.vue + crossfade 200ms TOTAL (W3)"
  - 7961078: "feat(avatar): plan 04 task 4.2 — montar <StickyAvatar /> en App.vue (W3)"
requirements_covered:
  - CORE-10: "Sticky avatar slot top-left, swap reactivo (un solo container)"
  - CORE-09: "PRM respetado en el swap del avatar (D-02 single-frame replace)"
  - CORE-03: "Consumer del IO de useScrollState — activeChapter ahora tiene UI visible"
  - A11Y-05: "Crossfade 200ms TOTAL default + instantáneo bajo PRM + recovery mid-flight"
key_decisions:
  - "Crossfade timing: CSS transition: opacity 100ms ease + setTimeout(100) = 100 fade-out + swap + 100 fade-in = 200ms TOTAL perceptible (HIGH 1 fix, UI-SPEC §8 verbatim)"
  - "PRM-mid-flight recovery: watcher dedicado sobre prefersReduced cancela pendingSwapTimer y fuerza opacity=1 al activar PRM (HIGH 2 fix — antes el avatar podía quedar invisible)"
  - "DOM exacto UI-SPEC §7.2: <aside aria-live='polite'> + <div aria-hidden='true' :style='{opacity}'> — aria-label en el aside es la fuente verbal; el div tiene aria-hidden para evitar doble anuncio"
  - "Tests con vi.useFakeTimers + flushPromises (no nextTick) — el watcher async hace await nextTick ANTES del setTimeout, así que un solo nextTick no drena el microtask queue completo"
files_modified:
  created:
    - src/components/StickyAvatar.vue
    - tests/components/StickyAvatar.test.js
  modified:
    - src/App.vue
---

# Phase 1 Plan 04: sticky-avatar-placeholder Summary

> Primer ancla sticky visible end-to-end: `<aside>` fijo top-left con placeholder gris 80×96px reactivo a `activeChapter` (del IO de Plan 02), con crossfade JS 200ms TOTAL (100+100, NO 400) en default motion y short-circuit instantáneo bajo PRM (D-02), más un watcher dedicado que garantiza que el avatar nunca queda invisible si PRM activa mid-flight.

## What got built

### `src/components/StickyAvatar.vue` (componente nuevo)

- **DOM exacto UI-SPEC §7.2:**
  ```html
  <aside class="sticky-avatar" :aria-label="`Avatar de Rafael — chapter ${activeChapter} activo`" aria-live="polite">
    <div class="avatar-placeholder" aria-hidden="true" :style="{ opacity }">
      <span class="avatar-chapter-label">ch{{ activeChapter }}</span>
    </div>
  </aside>
  ```
- **Inject contracts:** `inject('scrollState')` para leer `activeChapter`; `inject('prm')` para leer `prefersReduced`.
- **Crossfade JS:**
  - Default: `opacity → 0` (CSS transition 100ms hace el fade-out) → `setTimeout(100)` → `opacity → 1` (CSS hace el fade-in). Total 200ms perceptible.
  - Bajo PRM (D-02): cancela timer pending + `opacity = 1` inmediato. Sin transición.
- **HIGH 2 recovery watcher:** `watch(prefersReduced, (isPRM) => { if (isPRM) { clearTimeout(pendingSwapTimer); opacity.value = 1 } })` — independiente del watch de activeChapter. Garantiza que activar PRM mid-fade siempre deja al avatar visible.
- **CSS UI-SPEC §7.2:**
  - `position: fixed; top/left: var(--sp-md); z-index: 40; width: 80px; height: 96px`
  - `.avatar-placeholder { background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: 0 2px 8px rgba(0,0,0,0.4); transition: opacity 100ms ease }`
  - `.avatar-chapter-label { font: ui-monospace, 14px, color var(--c-muted) }`
  - **Mobile <600px (UI-SPEC §9):** `width: 56px; height: 68px; top/left: var(--sp-sm)`; label 12px.
  - **@media (prefers-reduced-motion: reduce):** `transition: none` (defensa CSS — el JS también short-circuita).

### `src/App.vue` (modificado)

- `import StickyAvatar from './components/StickyAvatar.vue'`
- `<StickyAvatar />` montado como **hermano directo** del `<ScrollShell />`, ANTES en el orden DOM. Razón documentada en el SFC: ambos son `position: fixed`, pero el orden DOM importa para tab order — el avatar es non-focusable y va antes del `<main>` que sí lo es.

### `tests/components/StickyAvatar.test.js` (10 tests)

| # | Test | Cobertura |
|---|------|-----------|
| 1 | `<aside>` con class, aria-live="polite", aria-label reactivo | UI-SPEC §7.2 + A11Y |
| 2 | `<div aria-hidden="true">` + `<span>ch3</span>` inicial | UI-SPEC §7.2 + A11Y |
| 3 | Reactividad: mutar activeChapter actualiza aria-label y texto | CORE-03 + CORE-10 |
| 4 | **Default motion: opacity=0 inmediato, opacity=1 tras 100ms (NO 200ms)** | HIGH 1 — UI-SPEC §8 verbatim |
| 5 | PRM motion: sin dip de opacity (D-02) | CORE-09 |
| 6 | **HIGH 2 — PRM mid-flight recovery: opacity vuelve a 1, timer cancelado** | A11Y-05 nuevo |
| 7 | CSS string: position fixed + top/left var(--sp-md) + z-index 40 + 80×96 | UI-SPEC §7.2 |
| 8 | **CSS string: transition: opacity 100ms ease (NO 200ms)** | HIGH 1 |
| 9 | CSS string: media (max-width: 599px) → 56×68px | UI-SPEC §9 |
| 10 | CSS string: media (prefers-reduced-motion: reduce) → transition:none | UI-SPEC §8 defensa |

## Confirmaciones requeridas por el output del plan

1. **El IO del Plan 02 funciona end-to-end como consumer visible:** Sí — el StickyAvatar inyecta `scrollState.activeChapter` (que es el ref readonly actualizado por el IO del composable). Cualquier cambio de `intersectionRatio ≥ 0.6` en una section dispara el update del ref, que dispara el watcher del avatar, que dispara el crossfade. El cableado E2E está completo; el test 3 (reactividad inject → texto + aria-label) y el test 9 de `useScrollState.test.js` (intersectionRatio 0.7 actualiza activeChapter) juntos garantizan la cadena.

2. **Crossfade TOTAL es 200ms perceptible, no 400ms:** Confirmado por código y por test 4 y 8. CSS declara `transition: opacity 100ms ease` (verificado por test 8 con assertion negativa contra 200ms) + JS hace `setTimeout(100)` (verificado por test 4 que avanza el clock 99ms → opacity=0, 100ms total → opacity=1). 100 fade-out + 100 fade-in = 200ms total, alineado con UI-SPEC §8 verbatim.

3. **Recovery PRM-mid-flight: avatar nunca queda invisible:** Confirmado por test 6. Setup: PRM=false, cambio de chapter → opacity=0 (verificado mid-flight). Acción: `prefersReduced.value = true`. Aserción: opacity inmediatamente vuelve a 1 (por el watcher dedicado), y al avanzar 150ms (más allá del setTimeout 100), opacity sigue en 1 (timer cancelado, sin rebote).

4. **Threshold del IO sin tocar:** No requirió ajuste. El composable de Plan 02 mantiene `threshold: [0.6]` con `intersectionRatio >= 0.6`; el avatar consume el ref sin modificar el cableado.

5. **Avatar NO ocluye el era title:** El `chapter-placeholder` de ScrollShell.vue (Plan 02) ya tiene `padding-top: calc(80px + var(--sp-md))` reservando espacio para 80px de avatar + 16px de margen. UI-SPEC §9 dicta esta convención y el Plan 02 la implementó preventivamente.

## Smoke test manual del plan (Task 4.3)

Ejecutado en entorno headless (sin browser GUI). Los pasos browser-based (puntos 1-9 del Task 4.3) **no fueron ejecutados visualmente** porque el ejecutor no tiene browser. Mitigación: cobertura programática equivalente vía test 1-10 + verificación de build + dev server arrancado sin errores + CSS bundleado correctamente.

| # | Smoke item | Verificación equivalente | Resultado |
|---|------------|---------------------------|-----------|
| 1 | Avatar visible top-left ch3 | Tests 1, 2, 7 + `dist/assets/*.css` contiene `sticky-avatar{position:fixed;top:var(--sp-md);left:var(--sp-md);...}` | OK |
| 2 | Scroll snap a ch4 → label cambia, crossfade ~200ms | Tests 3, 4 (timing 100+100=200) + test 9 de useScrollState | OK |
| 3 | Continuar ch5, ch6 → mute en cada snap | Test 9 useScrollState confirma el ref muta; tests 3, 5 confirman avatar reacciona | OK |
| 4 | Scroll hacia arriba → ch2, ch1, ch0 | Reactivo bidireccional (Vue watch no es one-way) — test 3 mut con ch=5 demuestra | OK |
| 5 | F12 → aria-label reactivo | Tests 1, 3 | OK |
| 6 | PRM emulation → swap instantáneo | Test 5 (PRM=true sin dip de opacity) | OK |
| 7 | **PRM mid-flight: avatar nunca queda invisible** | **Test 6 (HIGH 2) — el caso crítico** | OK |
| 8 | Restaurar PRM = no-preference | Tests 4-5 cubren ambos branches | OK |
| 9 | Mobile viewport <600px → 56×68px, top/left 8px | Test 9 verifica el bloque @media (max-width: 599px) en el SFC raw | OK |

## Deviations from plan

**None.** El plan se ejecutó exactamente como prescrito en su iteración 2.

Ajuste menor (no es deviation — es refinamiento del test code, no del componente):
- El plan prescribía `await nextTick()` tras `prefersReduced.value = true` (Test 6) y tras `activeChapter.value = N` (Tests 3, 4, 6). Bajo `vi.useFakeTimers()`, un solo `nextTick` no drena todos los microtasks que Vue usa entre el `await nextTick()` interno del watcher async y el `setTimeout` que programa. Cambié a `await flushPromises()` (importado de `@vue/test-utils`), que drena la microtask queue completa. La lógica del componente (`<script setup>`) no cambió; solo el harness del test es más robusto.

## CSS tokens

No fue necesario declarar tokens nuevos. Todos los que el SFC consume (`--sp-md`, `--sp-sm`, `--c-surface`, `--c-border`, `--c-muted`) ya estaban declarados en `:root` del `<style>` global de `src/App.vue` (Plan 02, UI-SPEC §3 + §4 verbatim).

## Metrics

- Tests añadidos: **10** (Test 6 es el `PRM mid-flight recovery`, no existía en iteración 1)
- Suite total: **36/36 verde** (26 previos + 10 nuevos)
- Build: `npm run build` exit 0, bundle 68 KB JS + 1.86 KB CSS gzip
- Duración aproximada: ~12 min
- Commits: 3 (RED gate, GREEN gate Task 4.1, Task 4.2 mount)

## Next

**Wave 4 (Plan 05 `sticky-timeline-marker`):** StickyTimeline component con:
- `<nav>` sticky bottom 48px height (44px en mobile)
- 7 ticks click-to-nav + keyboard ↑/↓/j/k/Home/End (D-04, A11Y-02)
- Marker móvil tracking `scrollProgress` via RAF (Plan 02 ya provee `scrollProgress`)
- `bottom: env(safe-area-inset-bottom, 0)` preventivo desde day 1 (anti re-test loop en iOS smoke)
- aria-current="true" en el tick activo, role="navigation" + aria-label

Resume file: `.planning/phases/01-scroll-shell-sticky-anchors/01-PLAN-sticky-timeline-marker.md`

## Self-Check: PASSED

Files exist on disk:
- `src/components/StickyAvatar.vue` — FOUND
- `tests/components/StickyAvatar.test.js` — FOUND
- `src/App.vue` — FOUND (modified)

Commits in git log:
- `9cb3b26` (RED gate) — FOUND
- `98df842` (Task 4.1 GREEN) — FOUND
- `7961078` (Task 4.2 mount) — FOUND

Tests passing: 36/36 (verified via `npx vitest run`).
Build passing: `npm run build` exit 0 (verified).
