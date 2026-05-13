---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Wave 4 complete, ready for Wave 5
stopped_at: Phase 1 Plan 05 (sticky-timeline-marker) complete — StickyTimeline.vue + marker RAF-bound + 7 ticks click-to-nav + keyboard ↑/↓/j/k/Home/End + env(safe-area-inset-bottom, 0) preventivo, 59/59 tests verde
last_updated: "2026-05-12T22:35:00Z"
last_activity: 2026-05-12 — Plan 05 (W4, sticky-timeline-marker) ejecutado: src/components/StickyTimeline.vue con DOM UI-SPEC §7.3 verbatim (<nav role="navigation"> + .timeline-track > .timeline-marker + <ol> con 7 .tick-button con aria-current reactivo); marker left bindeado a scrollProgress*100% via computed (RAF de Plan 02 cableado E2E); transition: left 0ms linear explícito (binding de gesto no animación); click handler PRM-aware D-04 (smooth default / auto bajo PRM); touch target ≥44×44px en .tick-button; mobile <600px height 44px (UI-SPEC §9); bottom: env(safe-area-inset-bottom, 0) PREVENTIVO desde day 1 (HIGH 4 fix iter 2). ScrollShell ampliado con inject('scrollState')+inject('prm') + navigate(delta) helper con clamping [0..6] + 6 @keydown.<key>.prevent (up/down/k/j/home/end); .prevent declarativo de Vue bloquea scroll nativo del browser. App.vue monta <StickyTimeline /> tras <ScrollShell />. index.html: viewport-fit=cover (pre-condición env safe-area en iOS). Tests: 13 StickyTimeline + 10 keyboard navigation (test 11 preventDefault ELIMINADO por BLOCKER 3 iter 2 — Vue Test Utils trigger no expone spy verificable; .prevent es declarative framework code, confiamos en él). Suite total 59/59 verde. Build verde (70.74 KB JS + 3.72 KB CSS gzip; bundle CSS minificado contiene env(safe-area-inset-bottom) + min-width:44px + transition left 0ms — HIGH 4 verificado en producción). Manual checklist Task 5.4 escrito como artefacto para Plan 07: 10 secciones, items 3.1/3.2 son HIGH 3 críticos (marker recorre track bajo smooth vs salta bajo PRM — ambos correctos).
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 7
  completed_plans: 5
  percent: 71
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-12)

**Core value:** Que un visitante mueva el scroll, vea el sitio transformarse, y entienda en 30 segundos sin leer una sola viñeta de CV que está mirando a alguien que vivió tres décadas de tecnología y cuyas habilidades convergen en algo único.
**Current focus:** Phase 1 — Scroll Shell + Sticky Anchors

## Current Position

Phase: 1 of 6 (Scroll Shell + Sticky Anchors)
Plan: 5 of 7 in current phase
Status: Wave 4 complete, ready for Wave 5
Last activity: 2026-05-12 — Plan 05 (W4, sticky-timeline-marker) ejecutado y commiteado; StickyTimeline + marker RAF-bound + 7 ticks click-to-nav + keyboard ↑/↓/j/k/Home/End con clamping y PRM branch + env(safe-area-inset-bottom, 0) preventivo + viewport-fit=cover, 59/59 tests verde

Progress: [███████░░░] 71%

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: ~13 min
- Total execution time: ~1.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 5/7 | ~66 min | ~13 min |

**Recent Trend:**

- Last 5 plans: 01 (W0, toolchain-setup, ~8 min, PASS); 02 (W1, walking-skeleton, ~18 min, PASS); 03 (W2, usePRM-composable, ~10 min, PASS); 04 (W3, sticky-avatar-placeholder, ~12 min, PASS); 05 (W4, sticky-timeline-marker, ~18 min, PASS)
- Trend: 5 plans completados, 59/59 tests green (+23 vs Plan 04), build verde, loop visible cerrado — el usuario puede navegar entre los 7 chapters por 3 medios (scroll wheel/swipe, click en tick, teclado) y siempre ve dónde está (avatar + marker reactivos)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 2026-05-12 (W4): **Marker bind directo a scrollProgress sin transition CSS** — el `left` del marker se bindea via computed `${scrollProgress * 100}%` con `transition: left 0ms linear` explícito. Durante click smooth (default motion), el browser anima scrollTop y el RAF de useScrollState refleja en scrollProgress 60fps → marker recorre la track. Bajo PRM (D-04), scrollTop salta → marker salta. Ambos correctos. Si el marker brincara bajo default motion habría un bug en el CSS (ease implícito) o en el RAF pause/resume — los tests programáticos lo cubren parcialmente, el manual checklist Task 5.4 items 3.1/3.2 (HIGH 3) lo cubre visualmente.
- 2026-05-12 (W4): **env(safe-area-inset-bottom, 0) PREVENTIVO desde day 1, no condicional** — HIGH 4 fix iter 2. El fallback graceful a `0` significa que en desktop browsers el comportamiento es idéntico a `bottom: 0`. En iPhone con notch/Dynamic Island el inset previene overlap con Safari toolbar. Zero downside, evita un re-test loop en Plan 07. Pre-condición: `viewport-fit=cover` en `<meta name=viewport>` (sin esto, env() retorna 0 en iOS).
- 2026-05-12 (W4): **preventDefault test eliminado (BLOCKER 3 iter 2)** — Vue Test Utils `trigger('keydown.up')` no expone el evento nativo subyacente con un spy verificable sobre `event.preventDefault`. La directiva `.prevent` de Vue es declarative framework code que llama preventDefault() internamente — confiamos en el framework. Los tests funcionales 2-10 verifican el behavior correcto (navigate dispara con la delta correcta + clamping + PRM branch).
- 2026-05-12 (W4): **chapters array duplicado en ScrollShell y StickyTimeline** — locked en plan §key-decisions. Phase 3 consolida en `src/data/chapters.js` con i18n + asset refs expandidos. Duplicar 14 LOC ahora evita acoplar prematuramente al módulo que Phase 3 va a expandir significativamente.
- 2026-05-12 (W4): **j/k vim aliases incluidos en keyboard nav** — `@keydown.j.prevent="navigate(1)"` + `@keydown.k.prevent="navigate(-1)"`. 2 LOC adicionales, preferencia frecuente para devs/recruiters técnicos, ROI alto vs costo cero. NO se documenta visualmente (no es A11Y constraint, es nice-to-have). Page Up/Down (mencionados en CORE-06 como opcionales) NO implementados en Phase 1.
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

Last session: 2026-05-12T22:35:00Z
Stopped at: Plan 05 (W4, sticky-timeline-marker) complete — Wave 5 (skiplink-a11y-polish) desbloqueado
Resume file: .planning/phases/01-scroll-shell-sticky-anchors/01-PLAN-skiplink-a11y-polish.md
Next command: /gsd-execute-plan 1 6  (o continuar la cadena con /gsd-execute-phase 1)
