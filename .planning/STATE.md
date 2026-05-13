---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Wave 3 complete, ready for Wave 4
stopped_at: Phase 1 Plan 04 (sticky-avatar-placeholder) complete — StickyAvatar.vue + crossfade JS 200ms TOTAL + PRM-mid-flight recovery watcher, 36/36 tests verde
last_updated: "2026-05-12T22:12:00Z"
last_activity: 2026-05-12 — Plan 04 (W3, sticky-avatar-placeholder) ejecutado: src/components/StickyAvatar.vue con DOM UI-SPEC §7.2 verbatim (<aside aria-live="polite"> + placeholder gris ch{N} + inject('scrollState') + inject('prm')); crossfade JS 200ms TOTAL = fade-out 100ms + swap + fade-in 100ms (HIGH 1 fix, CSS transition: opacity 100ms ease, NO 200ms); watcher dedicado sobre prefersReduced cancela timer pending + restaura opacity=1 si PRM activa mid-flight (HIGH 2 fix); mobile <600px → 56×68px (UI-SPEC §9). App.vue monta <StickyAvatar /> antes del <ScrollShell /> como hermano. Tests: 10 nuevos (incl. T4 timing 100ms NO 200ms, T6 PRM-mid-flight recovery, T8 negative assertion contra "transition: opacity 200ms", T9 mobile breakpoint), suite total 36/36 verde. Build verde (68 KB JS + 1.86 KB CSS gzip). Smoke test browser-based no ejecutado (entorno headless); cobertura programática equivalente vía tests + build + dev server arrancado sin errores.
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 7
  completed_plans: 4
  percent: 57
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-12)

**Core value:** Que un visitante mueva el scroll, vea el sitio transformarse, y entienda en 30 segundos sin leer una sola viñeta de CV que está mirando a alguien que vivió tres décadas de tecnología y cuyas habilidades convergen en algo único.
**Current focus:** Phase 1 — Scroll Shell + Sticky Anchors

## Current Position

Phase: 1 of 6 (Scroll Shell + Sticky Anchors)
Plan: 4 of 7 in current phase
Status: Wave 3 complete, ready for Wave 4
Last activity: 2026-05-12 — Plan 04 (W3, sticky-avatar-placeholder) ejecutado y commiteado; StickyAvatar + crossfade 200ms TOTAL + recovery PRM-mid-flight, 36/36 tests verde

Progress: [█████░░░░░] 57%

## Performance Metrics

**Velocity:**

- Total plans completed: 4
- Average duration: ~12 min
- Total execution time: ~0.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 4/7 | ~48 min | ~12 min |

**Recent Trend:**

- Last 5 plans: 01 (W0, toolchain-setup, ~8 min, PASS); 02 (W1, walking-skeleton, ~18 min, PASS); 03 (W2, usePRM-composable, ~10 min, PASS); 04 (W3, sticky-avatar-placeholder, ~12 min, PASS)
- Trend: 4 plans completados, 36/36 tests green, build verde, primer ancla sticky funcional (avatar reactivo end-to-end al IO de Plan 02)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 2026-05-12 (W3): **Crossfade timing 200ms TOTAL** — CSS `transition: opacity 100ms ease` + JS `setTimeout(100)` = fade-out 100 + swap + fade-in 100 = 200ms total perceptible, alineado con UI-SPEC §8 verbatim. NO 400ms (que sería transition 200ms + setTimeout 200ms). HIGH 1 fix de la iter 2 del plan-checker.
- 2026-05-12 (W3): **PRM-mid-flight recovery watcher** — `watch(prefersReduced, isPRM => { if (isPRM) { clearTimeout(pendingSwapTimer); opacity.value = 1 } })` dedicado, independiente del watch de activeChapter. Sin él, activar PRM mid-fade dejaría el avatar invisible permanentemente. HIGH 2 fix de la iter 2 del plan-checker.
- 2026-05-12 (W3): **Tests con flushPromises bajo fake timers** — bajo `vi.useFakeTimers()`, el watcher async del componente hace `await nextTick()` antes del `setTimeout()`. Un solo `nextTick()` desde el test NO drena todos los microtasks; `flushPromises()` de @vue/test-utils sí. Lección para Plans 05+: usar `flushPromises` (no `nextTick`) cuando se mockean timers y se prueba lógica async.
- 2026-05-13 (W2): **usePRM single source of truth** — un único composable `{ motion, prefersReduced }` provisto vía `provide('prm', usePRM())` en App.vue; consumers (Plans 04 y 05) inyectan en lugar de duplicar `matchMedia` listeners. `prefersReduced` es `computed` (no `ref`) porque deriva de `motion`. Cleanup delegado a vueuse — no `onBeforeUnmount` propio.
- 2026-05-13 (W2): **Plan 03 anti-scope** — NO modifica `scrollToChapter` para usar PRM (eso es Plan 05). El CSS branch `@media (prefers-reduced-motion: reduce)` ya está en App.vue desde Plan 02. Plan 03 solo cablea el conduit JS para que Plans 04 (avatar crossfade) y 05 (click-to-nav, keyboard) lo consuman.
- 2026-05-13 (W2): **Test 5 (readonly setter assertion) eliminado por ambigüedad** — MEDIUM 2 del plan-checker: `computed()` sin setter emite warning, no throw; verificarlo sería test de Vue framework, no de nuestro código. Total: 4 tests (T1-T4).
- 2026-05-13 (W1): **PATTERN A** — `useScrollState` se cablea vía `watch(shellRef, ..., { immediate: true, flush: 'post' })` en lugar de `onMounted`, porque el composable se instancia ANTES del :ref callback de Vue; watch reactivo elimina el race con null ref.
- 2026-05-13 (W1): **PATTERN B** — Deep-link `?ch=N` invoca `scrollToChapter(N, 'auto')` (método canónico del composable), NO `getElementById().scrollIntoView()` directo; mantiene una sola ruta testeable.
- 2026-05-13 (W1): **PATTERN C** — Tests del composable usan wrapper template con 7 chapter stubs `<section id="chapter-N">` para que `document.getElementById` funcione en jsdom; sin stubs los tests pasarían por accidente.
- 2026-05-13 (W1): `provide('scrollState', ...)` en App.vue es el canal de comunicación cross-componente; StickyAvatar/StickyTimeline futuros usarán `inject('scrollState')` sin prop drilling.
- 2026-05-13 (W1): Stub global `HTMLElement.prototype.scrollIntoView = vi.fn()` en `tests/setup.js` (no spyOn+mockRestore por suite) — descartado el patrón con mockRestore porque causaba flakiness order-dependent en jsdom.
- 2026-05-12: **Pivote a scroll vertical** con avatar pixel-art sticky top-left + timeline sticky bottom; ambas orientaciones mobile soportadas; iOS-02 reframed de gate bloqueante a smoke test confirmatorio (WebKit #243582 era específico de momentum horizontal).
- Init: Phaser se carga SOLO cuando `activeChapter === 6` (lazy import dinámico); NUNCA con `v-if` que remueva secciones del DOM (rompe scroll-snap layout).
- Init: Todos los assets pixel art en `public/assets/` (no `src/assets/`); naming: `ch{N}-{descriptor}[-{variant}].png`.

### Pending Todos

None yet.

### Blockers/Concerns

- **iOS smoke test (Phase 1):** Confirmar que vertical snap responde chapter-a-chapter en iPhone/iPad real y que el avatar/timeline sticky no entran en conflicto con Safari's bottom toolbar dynamic. Ya NO es gate bloqueante; cualquier issue se mitiga dentro de la fase.
- **Content readiness (Phase 3):** Bio en ES/EN y lista de proyectos por chapter no están escritos aún. Necesarios antes de finalizar Phase 3.
- ~~**Vue version (pre-work):** `@vueuse/core@14.3.0` requiere Vue 3.5+; scaffold pineado en `^3.4.0`.~~ **RESUELTO 2026-05-13** por Plan 01: manifest sincronizado a `^3.5.0` (la instalación real ya era 3.5.34), `@vueuse/core@14.3.0` añadido sin warnings de peer.
- **pixelforge palette consistency:** Paletas por chapter deben documentarse ANTES de generar assets (ART-06). Rafael debe aprobar paletas antes de Phase 3.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-05-12T22:12:00Z
Stopped at: Plan 04 (W3, sticky-avatar-placeholder) complete — Wave 4 (sticky-timeline-marker) desbloqueado
Resume file: .planning/phases/01-scroll-shell-sticky-anchors/01-PLAN-sticky-timeline-marker.md
Next command: /gsd-execute-plan 1 5  (o continuar la cadena con /gsd-execute-phase 1)
