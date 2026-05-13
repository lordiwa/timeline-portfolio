---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Wave 5 complete, ready for Wave 6 (iOS smoke test — human gate)
stopped_at: Phase 1 Plan 06 (skiplink-a11y-polish) complete — SkipLink.vue + focus ring :focus-visible universal + ResizeObserver placeholder (MOB-03) + manual checklist con item 7 (MEDIUM 3) overflow 375×667, 67/67 tests verde
last_updated: "2026-05-12T23:05:00Z"
last_activity: 2026-05-12 — Plan 06 (W5, skiplink-a11y-polish) ejecutado: src/components/SkipLink.vue con DOM UI-SPEC §7.4 verbatim (<a href='#main-content' id='skip-link' class='skip-link'> con texto bilingüe "Saltar al contenido / Skip to content"); hide-on-scroll vía onMounted + window.addEventListener('scroll', handler, { once: true, passive: true }) directo — NO useEventListener (HIGH 5 fix iter 2 evita flake jsdom); defineExpose({ handleScrollOnce }) para test invocation determinístico; hide-on-blur vía @blur del <a>; onBeforeUnmount cleanup defensive. App.vue: <SkipLink /> primer hijo del template root (DOM order = tab order UI-SPEC §10); useResizeObserver(document.documentElement) cableado como placeholder defensive (MOB-03 satisfecho — viewportWidth/viewportHeight refs no consumidos en Phase 1, Phase 5 los promoverá para Phaser zoom); :focus-visible { outline 3px var(--c-focus) offset 3px } declarado en <style> NO scoped (aplica a SkipLink, main-content, tick-button y futuros). Tests: 8 SkipLink (Test 3 invoca wrapper.vm.handleScrollOnce() directo evitando dispatchEvent jsdom flake — HIGH 5; Test 5 vi.spyOn(window, 'addEventListener') verifica wiring con { once: true, passive: true }). Suite total 67/67 verde (+8 vs Plan 05). Build verde (71.76 KB JS gzip 28.51 + 4.50 KB CSS gzip 1.42; bundle CSS contiene :focus-visible + .skip-link + .skip-link.hidden + env(safe-area-inset-bottom) sin regresión Plan 05; bundle JS contiene handleScrollOnce + addEventListener('scroll' + once+passive). Tab order programáticamente verificado: [SkipLink, StickyAvatar, ScrollShell, StickyTimeline]. Manual checklist 01-06-MANUAL-CHECKLIST.md (10 secciones, 30+ items) escrito para Rafael en Plan 07: item 7 (★ MEDIUM 3) con dos mitigaciones documentadas (Opción A reducir copy / Opción B font-size 12px @media max-width 599px — preferida). Phase 1 funcionalmente completa salvo iOS smoke test (Plan 07/W6).
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 7
  completed_plans: 6
  percent: 86
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-12)

**Core value:** Que un visitante mueva el scroll, vea el sitio transformarse, y entienda en 30 segundos sin leer una sola viñeta de CV que está mirando a alguien que vivió tres décadas de tecnología y cuyas habilidades convergen en algo único.
**Current focus:** Phase 1 — Scroll Shell + Sticky Anchors

## Current Position

Phase: 1 of 6 (Scroll Shell + Sticky Anchors)
Plan: 6 of 7 in current phase
Status: Wave 5 complete, ready for Wave 6 (iOS smoke test — human gate)
Last activity: 2026-05-12 — Plan 06 (W5, skiplink-a11y-polish) ejecutado y commiteado; SkipLink.vue primer focusable del DOM con addEventListener nativo (HIGH 5) + defineExpose handler para tests + focus ring :focus-visible universal en App.vue + useResizeObserver(documentElement) defensive (MOB-03) + manual checklist con item 7 (MEDIUM 3) overflow 375×667, 67/67 tests verde (+8 vs Plan 05)

Progress: [████████░░] 86%

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: ~13 min
- Total execution time: ~1.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 6/7 | ~80 min | ~13 min |

**Recent Trend:**

- Last 6 plans: 01 (W0, toolchain-setup, ~8 min, PASS); 02 (W1, walking-skeleton, ~18 min, PASS); 03 (W2, usePRM-composable, ~10 min, PASS); 04 (W3, sticky-avatar-placeholder, ~12 min, PASS); 05 (W4, sticky-timeline-marker, ~18 min, PASS); 06 (W5, skiplink-a11y-polish, ~14 min, PASS)
- Trend: 6 plans completados, 67/67 tests green (+8 vs Plan 05), build verde, accessibility loop cerrado — SkipLink como primer focusable + focus ring universal + ResizeObserver defensive completan A11Y-01, A11Y-05 y MOB-03. Phase 1 funcionalmente completa salvo el iOS smoke test del Plan 07 (única wave restante, human gate).

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 2026-05-12 (W5): **SkipLink usa window.addEventListener nativo, NO useEventListener** — HIGH 5 fix iter 2. `useEventListener` de @vueuse/core + `dispatchEvent(new Event('scroll'))` es flake-prone en jsdom (timing del closure + re-attach del `{ once: true }`). Solución: `onMounted` + `window.addEventListener('scroll', handler, { once: true, passive: true })` directo. Más determinístico para el caso simple de "primer scroll oculta". `defineExpose({ handleScrollOnce })` adicional permite que los tests invoquen el handler directo (`wrapper.vm.handleScrollOnce()`) evitando dispatchEvent. `onBeforeUnmount` defensive si el componente unmount antes del primer scroll.
- 2026-05-12 (W5): **`:focus-visible` declarado en `<style>` NO scoped de App.vue** — Scoped no alcanzaría a componentes hijos. La regla `outline: 3px solid var(--c-focus); outline-offset: 3px` aplica universalmente a `.skip-link`, `#main-content`, `.tick-button` y cualquier futuro focusable. Phase 2 puede sobreescribir `--c-focus` por theme manteniendo grosor/offset. A11Y-05.
- 2026-05-12 (W5): **`useResizeObserver(document.documentElement)` placeholder defensive** — MOB-03 satisfecho literalmente. `viewportWidth/viewportHeight` refs NO consumidos en Phase 1; Phase 5 (Phaser zoom = `Math.floor(vw/480)`, `Math.floor(vh/270)`) los promoverá. Cablear desde day 1 evita re-cableo. vueuse maneja cleanup.
- 2026-05-12 (W5): **MEDIUM 3 mitigaciones documentadas en manual checklist** — Item 7 del `01-06-MANUAL-CHECKLIST.md` cubre overflow del SkipLink en 375×667 con dos opciones: A (reducir copy) / B (font-size 12px @media max-width 599px — preferida). Decisión Plan 06: cerrar con texto completo verificado en build; aplicar Opción B solo si Plan 07 detecta `scrollWidth > clientWidth` en hardware real.
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

- **★ Plan 07 es human gate (no autonomous):** Es la **única wave restante de Phase 1** y la **única que requiere participación humana**. Rafael debe ejecutar (a) la checklist iOS de 10 ítems en su iPhone real, (b) el `01-05-MANUAL-CHECKLIST.md` (10 secciones, marker tracking HIGH 3) en desktop emulator, (c) el `01-06-MANUAL-CHECKLIST.md` (10 secciones, SkipLink + focus ring + MEDIUM 3 overflow 375×667). Si todos PASS → `/gsd-verify-work 1` cierra Phase 1.
- **iOS smoke test (Phase 1 / Plan 07):** Confirmar que vertical snap responde chapter-a-chapter en iPhone/iPad real y que el avatar/timeline sticky no entran en conflicto con Safari's bottom toolbar dynamic. El env(safe-area-inset-bottom, 0) preventivo del Plan 05 + viewport-fit=cover en index.html ya están aplicados (HIGH 4 fix iter 2). El SkipLink overflow check del Plan 06 item 7 (MEDIUM 3) tiene dos mitigaciones documentadas listas para aplicar si FAIL. Ya NO es gate bloqueante; cualquier issue se mitiga dentro de la fase.
- **Content readiness (Phase 3):** Bio en ES/EN y lista de proyectos por chapter no están escritos aún. Necesarios antes de finalizar Phase 3.
- ~~**Vue version (pre-work):** `@vueuse/core@14.3.0` requiere Vue 3.5+; scaffold pineado en `^3.4.0`.~~ **RESUELTO 2026-05-13** por Plan 01: manifest sincronizado a `^3.5.0` (la instalación real ya era 3.5.34), `@vueuse/core@14.3.0` añadido sin warnings de peer.
- **pixelforge palette consistency:** Paletas por chapter deben documentarse ANTES de generar assets (ART-06). Rafael debe aprobar paletas antes de Phase 3.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-05-12T23:05:00Z
Stopped at: Plan 06 (W5, skiplink-a11y-polish) complete — Wave 6 (ios-smoke-test) desbloqueado. **Última wave técnica + única human gate de Phase 1.**
Resume file: .planning/phases/01-scroll-shell-sticky-anchors/01-PLAN-ios-smoke-test.md
Next command: /gsd-execute-plan 1 7  (Plan 07 NO es autonomous — requiere Rafael ejecutar checklist iOS en iPhone real + manual checklists del Plan 05/06 en desktop emulator)
