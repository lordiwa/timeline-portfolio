---
phase: 05-phaser-chapter-6
plan: 04
subsystem: vue-phaser-integration
tags: [vue3, phaser-3.86, shallowref, lifecycle, hmr-dispose, locale-bridge, resize-observer, a11y, keyboard-navigation, mantra, ch6, sr-only, css-layers, chapter-overlap-mitigation, project-overlay-stub]

# Dependency graph
requires:
  - phase: 05-phaser-chapter-6
    plan: 01
    provides: "RED scaffolds Chapter6Content suite (5 archivos × 13 tests) + keyboard-planet-buttons + chapter-overlap-ch6 integration + locale-bridge T5"
  - phase: 05-phaser-chapter-6
    plan: 02
    provides: "8 assets PNG/JPG en public/assets/ch6-* (bg, 2 parallax layers, 3 planets, 2 ships) consumidos por SpaceScene preload"
  - phase: 05-phaser-chapter-6
    plan: 03
    provides: "src/phaser/index.js factory createGame() + src/phaser/SpaceScene.js scene completa (locale listener + show-project/arrival-complete emitters)"
  - phase: 01-scroll-shell-sticky-anchors
    provides: "scrollState inject (activeChapter ref) + prm inject (prefersReduced ref) + .scroll-shell snap-stop:always CORE-04"
  - phase: 02-theme-system-i18n
    provides: "i18n singleton + [data-chapter='6'] block en chapter-themes.css + ui.openProject/ui.closeOverlay/chapters.6.mantra keys"
  - phase: 03-chapter-3-end-to-end
    provides: "projects[].chapterEra/planetSprite/planetOrbit/planetColor shape D3-03"
provides:
  - "src/components/Chapter6Content.vue (~200 LOC) — Vue shell ch6 con lifecycle Phaser completo (shallowRef + watch immediate flush:post + destroy(true,false) + HMR dispose + ResizeObserver anti-thrash); bridge IN (show-project + arrival-complete listeners sin prefijo vue:) y bridge OUT (locale-changed emit con null-guard); 3 sr-only buttons keyboard A11Y (D5-06); mantra HTML v-if; ProjectOverlay v-if (stub W4 reemplaza)"
  - "src/components/ProjectOverlay.vue (STUB ~60 LOC) — section role=dialog + close button + emit('close') en click backdrop/close. API contrato locked para W4 (props.projectId + emits.close). Permite render end-to-end W3 sin crash."
  - "src/components/ScrollShell.vue: import + <Chapter6Content v-else-if='ch.id === 6' /> antes del placeholder dead-branch defensive"
  - "src/styles/chapter-themes.css @layer components reglas Phase 5 W3: .ch6-layout (position:relative SIN clipping — Pattern 12 mitigation), .ch6-canvas-host (absolute inset:0), .ch6-canvas-host canvas (display:block), .ch6-mantra (absolute bottom 80px + Audiowide + neon amber + mantra-fade-in 400ms), @keyframes mantra-fade-in, @media PRM override animation:none (D5-08 + A11Y-05)"
  - "Tests turned GREEN: Chapter6Content suite 5/5 (T1-T4 + lazy T1-T2 + bridge T1-T3 + resize T1-T2 + prm T1-T2 = 13 tests); keyboard-planet-buttons 3/3; chapter-overlap-ch6 integration 4/4; locale-bridge T4-T5 (Threat T-05-W0-05 mitigation). Total 22 tests."
  - "Updated 4 stale Phase 4 assertions post-wire: ScrollShell.test.js (Test 4 era-title count, T3 ch6 monta Chapter6Content) + ScrollShell.theme-isolation-phase4.test.js T6 — Rule 1 auto-fix bug: tests asumían ch6 placeholder, post-Plan 05-04 wire ch6 monta Chapter6Content. Mock @/phaser añadido para prevenir unhandled Phaser load en jsdom cuando mountShell{initialChapter:6} dispara watch immediate."
affects:
  - "05-05 W4 (ProjectOverlay full + chapter-overlap final guards): puede ahora reemplazar ProjectOverlay stub con synthwave glass + focus trap + ESC + project content rich; tests focus-trap.test.js (3) + ProjectOverlay.test.js T1/T3 (2) siguen RED esperando W4."
  - "05-06 W5 (manual checklist): Rafael ratifica visualmente el render ch6 end-to-end (canvas Phaser + planets + ships + arrival + mantra fade-in + stub overlay click) en dev preview + sign-off mantra ES copy."
  - "Phase 6 deploy: chunk Phaser lazy-split confirmed funcional — 341KB gzipped en chunk separado, fuera del initial bundle (63KB gzip). Target W3 ≤200KB excedido — flagged como deferred polish (manualChunks Vite opt) en W5 checklist o Phase 6."

# Tech tracking
tech-stack:
  added: []  # @vueuse/core useResizeObserver ya existía (Phase 1 MOB-03)
  patterns:
    - "Phaser lifecycle owned by Vue component (NO factory): src/phaser/index.js es stateless factory; Chapter6Content.vue es ÚNICO owner del shallowRef game + HMR dispose + onBeforeUnmount + watch lifecycle. Separation of concerns: factory crea, component gestiona vida."
    - "shallowRef(null) mandatory for Phaser.Game (PHA-01): ref()/reactive() proxy recursion rompe scene plugin internals + event emitter; shallowRef solo reactivisa .value top-level, el game tree queda raw."
    - "Lazy dynamic import string-literal `await import('@/phaser')` (PHA-04) — Vite chunk-split funcional verified: index principal 63KB gzip (sin Phaser); chunk lazy 341KB gzip (Phaser). Variable string imports rompen split — string literal mandatory."
    - "watch(activeChapter, {immediate:true, flush:'post'}) lifecycle pattern — handles deep-link inicial ?ch=6 + chapter transitions + leave reset. flush:'post' garantiza DOM <div ref> wired antes del watcher fire."
    - "Bridge event names sin prefijo `vue:` (D5-10 RESOLVED) — strings EXACT match entre Vue emit() y Phaser listener requerido. Threat T-05-W0-05 mitigation: source-regex en locale-bridge.test.js T5 enforça `game.value?.events.emit('locale-changed', ...)` literal."
    - "Defensive null-guard `game.value?.events.emit(...)` con optional chaining — locale watcher dispara siempre, game.value puede ser null (PRE-mount o POST-destroy)."
    - "useResizeObserver(document.documentElement, ...) NO window — ResizeObserver requiere Element observable (CSSOM spec); window no es Element. Pitfall 8 anti-thrash guard `if (newZoom !== game.value.scale.zoom)` previene re-render loop."
    - "Pattern 12 chapter-overlap mitigation: .ch6-layout SIN overflow:hidden (deliberadamente sin clipping). En .ch4-layout, `position:relative` + clipping creaba stacking context que dejaba a ch5 filtrarse durante scroll-snap (bug Phase 4 deferred). ch6 NO repite el patrón."
    - "ProjectOverlay STUB pattern (W3 → W4 contract handoff): stub minimal con API contract locked (props + emits) permite tests bridge GREEN en W3 mientras W4 implementa el componente synthwave completo. Defensive engineering: contrato API definido antes que implementación."
    - "sr-only utility local (no global): .sr-only WCAG visually-hidden + focus-visible reveal pattern declared en <style scoped> del Chapter6Content porque NO existe global; añadirlo global queda como deferred refactor cuando se introduzca el segundo consumer."
    - "Test source-regex anti-pattern guard: para evitar collision con strings literales en comentarios (e.g., regex `/overflow:\\s*hidden/`), reescribir comentarios sin la cadena literal exacta. Aplicado a .ch6-layout (`Deliberadamente SIN clipping`)."

key-files:
  created:
    - "src/components/Chapter6Content.vue (~200 LOC) — Vue shell ch6 con Phaser lifecycle completo"
    - "src/components/ProjectOverlay.vue (~85 LOC STUB) — minimal section role=dialog + close (W4 reemplaza)"
    - ".planning/phases/05-phaser-chapter-6/05-04-SUMMARY.md (este archivo)"
  modified:
    - "src/components/ScrollShell.vue — import + <Chapter6Content v-else-if> wire (2 cambios localizados)"
    - "src/styles/chapter-themes.css — @layer components nuevas reglas .ch6-layout + .ch6-canvas-host + .ch6-mantra + @keyframes mantra-fade-in + @media PRM override (~75 líneas)"
    - "tests/components/ScrollShell.test.js — Rule 1 stale assertion fix: Test 4 (.era-title count 1→0) + T3 ch6 monta Chapter6Content + vi.mock('@/phaser') prevent unhandled rejection"
    - "tests/components/ScrollShell.theme-isolation-phase4.test.js — Rule 1 stale T6 fix + vi.mock('@/phaser')"

decisions:
  - "Owner del HMR guard es Chapter6Content.vue (NO src/phaser/index.js factory): el factory es stateless, este componente mantiene state (game ref + arrivalDone + activeProject). Separation of concerns + evita doble-cleanup. Open Q8 RESOLVED a favor del component."
  - "ProjectOverlay STUB en W3 (no defineAsyncComponent + componente real W4 directo): el plan ofrecía 3 opciones; elegí STUB minimal para permitir render visible end-to-end W3 sin crash + tests bridge T1 GREEN. W4 reemplaza completo manteniendo API contract."
  - "sr-only utility declarado local en Chapter6Content.vue (NO global): SkipLink.vue ya tiene .skip-link con su propia visibility logic; añadir .sr-only global ahora sería refactor de scope mayor sin segundo consumer claro. Cuando aparezca el segundo consumer (W4 ProjectOverlay close button?), extraer global. Deferred refactor."
  - "BASE_W/BASE_H duplicated en Chapter6Content.vue (480/270): match con src/phaser/index.js. Importar las constantes desde @/phaser rompería PHA-04 lazy split (top-level import Phaser cargaría en initial chunk). Duplicación intencional documentada inline."
  - "Tests stale Phase 4 actualizados como Rule 1 auto-fix (no Rule 4 ask): los tests explícitamente comentan `Phase 5 lo wire` reconociendo que cambia con este plan. Actualización es completar el contrato declarado, no decisión arquitectural."

metrics:
  duration: ~45min
  completed: 2026-05-14
  tasks_completed: 2
  files_modified: 4
  files_created: 3
  tests_green_in_plan: 22
  commits:
    - "c255725 — feat(05-04): Chapter6Content shell + ProjectOverlay stub (PHA-01..09 + D5-06/10)"
    - "6d8d94e — feat(05-04): wire ch6 en ScrollShell + chapter-themes.css @layer components ch6"
---

# Phase 5 Plan 04: W3 Vue Shell ch6 + Lifecycle Phaser + Bridge + ResizeObserver + A11Y Summary

**One-liner:** Chapter6Content.vue completo con shallowRef lifecycle Phaser, bridge bidireccional Vue↔Phaser (locale + show-project + arrival-complete sin prefijo vue:), useResizeObserver anti-thrash zoom, 3 sr-only buttons keyboard A11Y, mantra HTML v-if, ProjectOverlay STUB minimal, wire en ScrollShell, chapter-overlap-defensive CSS rules + mantra animation con PRM override.

## What was built

### Task 1 — `src/components/Chapter6Content.vue` + `src/components/ProjectOverlay.vue` stub

**Chapter6Content.vue (~200 LOC)** — Vue shell completo del chapter 6 Phaser scene:

- **Lifecycle Phaser (PHA-01..04 + D5-11):**
  - `shallowRef(null)` para game (NUNCA `ref()` ni `reactive()` — pitfall mandatory).
  - `watch(activeChapter, async (v) => {...}, { immediate: true, flush: 'post' })`:
    - `v === 6 && !game.value`: `await import('@/phaser')` (lazy string-literal Vite-splittable PHA-04), `game.value = createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })`, registra listeners.
    - `v !== 6 && game.value`: `destroy(true, false)` (PHA-02) + reset `arrivalDone`/`activeProject`.
  - `onBeforeUnmount(() => game.value?.destroy(true, false))` defensive.
  - `if (import.meta.hot) import.meta.hot.dispose(() => { destroy + reset })` (Pitfall 3 — Vite HMR cleanup).

- **Bridge bidireccional (PHA-06 + PHA-07 + D5-10):**
  - IN (Phaser → Vue): `game.value.events.on('show-project', id => activeProject.value = id)` + `game.value.events.on('arrival-complete', () => arrivalDone.value = true)` — SIN prefijo `vue:` (D5-10 RESOLVED).
  - OUT (Vue → Phaser): `watch(locale, l => game.value?.events.emit('locale-changed', l))` con optional chaining defensive null-guard. **Nombre exacto** `'locale-changed'` match con SpaceScene listener (Threat T-05-W0-05 mitigation, locale-bridge T5 ✓).

- **ResizeObserver anti-thrash (PHA-09 + Pitfall 8):**
  - `useResizeObserver(document.documentElement, () => { ... })` (NO window — ResizeObserver requiere Element).
  - Recalcula `newZoom = Math.min(Math.floor(vw/480), Math.floor(vh/270)) || 1`.
  - Guard: `if (newZoom !== game.value.scale.zoom) game.value.scale.setZoom(newZoom)` previene re-render loop.

- **A11Y keyboard (D5-06 + extends A11Y-02 Phase 1):**
  - `v-for` sobre `ch6Projects` (computed `projects.filter(p => p.chapterEra === 6)`).
  - 3 `<button class="ch6-planet-trigger sr-only" :aria-label="t('ui.openProject') + ': ' + t(p.titleKey)" @click="activeProject = p.id">`.
  - Tab order cronológico ar-vr (0.2) → remoose (0.5) → software-mind (0.8).
  - `.sr-only` declarado local (no global existe), con focus-visible reveal pattern WCAG.

- **Mantra HTML (D5-03 + CON-04):**
  - `<p v-if="arrivalDone" class="ch6-mantra">{{ t('chapters.6.mantra') }}</p>`.
  - Render en Vue/HTML (NO dentro de Phaser) — mejor crispness, i18n directo, screen-reader accessible.

- **Overlay placeholder (D5-07):**
  - `<ProjectOverlay v-if="activeProject" :project-id="activeProject" @close="activeProject = null" />`.

**ProjectOverlay.vue STUB (~85 LOC)** — Minimal viable para W3 sin crash:
- Template: `<section role="dialog" aria-modal="true" class="project-overlay" @click="emit('close')">` + close button + stub text.
- API contract locked: `props: { projectId: String required }` + `emits: ['close']`.
- Estilo minimal cyan + amber synthwave hint.
- **W4 reemplaza completo** manteniendo este API (backdrop blur, neon glow, focus trap, ESC, content rich, PRM, mobile fullscreen).

**Commit:** `c255725 — feat(05-04): Chapter6Content shell + ProjectOverlay stub (PHA-01..09 + D5-06/10)`

### Task 2 — Wire ScrollShell + chapter-themes.css ch6 @layer components

**ScrollShell.vue:**
- Add `import Chapter6Content from './Chapter6Content.vue'`.
- Add `<Chapter6Content v-else-if="ch.id === 6" />` ANTES del `<div v-else class="chapter-placeholder">`.
- Placeholder queda como dead-branch defensive (futuro ch7+ si Rafael añade).
- CSS `scroll-snap-stop: always` (CORE-04) intacto.

**chapter-themes.css @layer components nuevo bloque Phase 5 W3:**
- `[data-chapter="6"] .ch6-layout`: `position:relative`, `width/height 100%`, **SIN clipping** (Pattern 12 mitigation chapter-overlap bug Phase 4 deferred). Comentario explicativo evita collision con regex test `overflow:\s*hidden`.
- `[data-chapter="6"] .ch6-canvas-host`: `position:absolute`, `inset:0`.
- `[data-chapter="6"] .ch6-canvas-host canvas`: `display:block` (elimina inline-baseline gap).
- `[data-chapter="6"] .ch6-mantra`: `position:absolute` `bottom: calc(80px + env(safe-area-inset-bottom, 0px))`, font Audiowide, color `var(--c-mantra, #ffd95c)`, text-shadow neon amber glow, `animation: mantra-fade-in 400ms ease-out forwards`, `z-index:40`, `pointer-events:none`.
- `@keyframes mantra-fade-in`: `from { opacity:0; transform: translate(-50%, 8px) }` → `to { opacity:1; transform: translate(-50%, 0) }`.
- `@media (prefers-reduced-motion: reduce) { .ch6-mantra { animation:none; opacity:1; transform:translateX(-50%) } }` — D5-08 + A11Y-05 cinturón CSS-side.

**Commit:** `6d8d94e — feat(05-04): wire ch6 en ScrollShell + chapter-themes.css @layer components ch6`

## Deviations from Plan

### Auto-fixed Issues (Rule 1 — stale Phase 4 test assertions)

**1. [Rule 1 - Bug] Tests Phase 4 asumían `.chapter-placeholder` / `.era-title` en ch6**

- **Found during:** Task 2 — suite global regression post-wire.
- **Issue:** 3 tests Phase 4 (`ScrollShell.test.js` Test 4 + T3 "ch3 integration"; `ScrollShell.theme-isolation-phase4.test.js` T6) asumen `.era-title` o `.chapter-placeholder` visible en `section[data-chapter="6"]`. El wire del Plan 05-04 reemplaza ese placeholder con `<Chapter6Content>` → tests rojos.
- **Why Rule 1 (not Rule 4):** Los tests explícitamente comentan `"Phase 5 lo wire"` reconociendo que cambia con este plan. Actualizar es completar el contrato declarado en los propios tests, no decisión arquitectural nueva.
- **Fix:**
  - `ScrollShell.test.js` Test 4: assertion `titles.length === 0` (era `=== 1` con `'2026 · Phaser'`).
  - `ScrollShell.test.js` T3 (ch3 integration): verifica `.ch6-layout` exists + `.era-title` NO exists.
  - `ScrollShell.theme-isolation-phase4.test.js` T6: verifica `.ch6-layout` exists + `.chapter-placeholder` NO exists.
- **Files modified:** `tests/components/ScrollShell.test.js`, `tests/components/ScrollShell.theme-isolation-phase4.test.js`.
- **Commit:** `6d8d94e` (incluido en Task 2 commit).

### Auto-fixed Issues (Rule 3 — blocking)

**2. [Rule 3 - Blocking] Unhandled Phaser require crash en jsdom**

- **Found during:** Task 2 — suite global regression.
- **Issue:** Cuando ScrollShell.vue importa `Chapter6Content.vue` y un test fuerza `activeChapter=6` (e.g., `ScrollShell.test.js` Test 9 bounds), el `watch immediate` dispara `await import('@/phaser')` → Phaser real intenta inicializar canvas en jsdom → `TypeError: Cannot set properties of null (setting 'fillStyle')` unhandled rejection. Esto NO falla un test específico pero contamina la suite con error.
- **Why Rule 3:** El error bloquea progreso (sin fix, cualquier nuevo mount de ScrollShell+ch6 sin mock crasheará). Solución estándar: mock del factory.
- **Fix:** Añadir `vi.mock('@/phaser', () => ({ createGame: vi.fn(...) }))` top-level en ambos `ScrollShell.test.js` y `ScrollShell.theme-isolation-phase4.test.js`.
- **Files modified:** `tests/components/ScrollShell.test.js`, `tests/components/ScrollShell.theme-isolation-phase4.test.js`.
- **Commit:** `6d8d94e`.

### Auto-fixed Issues (Rule 1 — regex collision)

**3. [Rule 1 - Bug] Comentario `NO overflow:hidden` colisiona con regex anti-pattern test**

- **Found during:** Task 2 verify — `integration/chapter-overlap-ch6.test.js` T2.
- **Issue:** El test usa `.not.toMatch(/overflow:\s*hidden/)` sobre el bloque `.ch6-layout`. Mi comentario inicial decía literal `NO overflow:hidden` que matchea el regex (regex ignora "NO" prefix).
- **Fix:** Reescribir comentario para evitar la cadena literal `overflow:hidden` — `"Deliberadamente SIN clipping aquí — Pattern 12 mitigation..."`.
- **File modified:** `src/styles/chapter-themes.css`.
- **Commit:** `6d8d94e` (single commit cubre el fix de regex).

## Verified Contracts

### Tests turned GREEN by this Plan (22 tests)

| File | Tests | Status | Notes |
|---|---|---|---|
| `tests/components/Chapter6Content.test.js` | T1-T4 | GREEN | PHA-04 lazy + PHA-02 destroy + PHA-01 shallowRef regex + bridge listeners regex |
| `tests/components/Chapter6Content-lazy.test.js` | T1-T2 | GREEN | `await import('@/phaser')` string-literal + NO top-level phaser import |
| `tests/components/Chapter6Content-bridge.test.js` | T1-T3 | GREEN | show-project → ProjectOverlay v-if; arrival-complete → mantra v-if; reset on leave |
| `tests/components/Chapter6Content-resize.test.js` | T1-T2 | GREEN | useResizeObserver(document.documentElement) + anti-thrash guard regex |
| `tests/components/Chapter6Content-prm.test.js` | T1-T2 | GREEN | createGame opt prefersReduced.value + @media PRM mantra animation:none |
| `tests/a11y/keyboard-planet-buttons.test.js` | T1-T3 | GREEN | 3 sr-only buttons aria-label + click sets activeProject + Tab order cronológico |
| `tests/integration/chapter-overlap-ch6.test.js` | T1-T4 | GREEN | scroll-snap-stop:always + .ch6-layout no clipping + Chapter6Content wired + mount renders .ch6-layout |
| `tests/phaser/locale-bridge.test.js` | T4-T5 | GREEN | game.value?.events.emit defensive + 'locale-changed' EXACT name match (Threat T-05-W0-05) |

### Threat surface scan

No new threat surface introducido — todos los threats del plan `<threat_model>` cubiertos por mitigaciones declaradas (T-05-W3-01 HMR cleanup ✓, T-05-W3-02 resize guard ✓, T-05-W3-04 bridge owner único ✓, T-05-W3-05 lazy split ✓, T-05-W3-07 overlap defensive ✓, T-05-W3-08 bridge name match ✓).

### Build verification

```
dist/assets/index-Ztk34044.js     181 KB  gzip:  63 KB   (initial chunk — NO Phaser ✓)
dist/assets/index-Cz8z6k2p.js   1,482 KB  gzip: 341 KB   (lazy chunk — Phaser detected via GameObjects/TileSprite markers)
```

**PHA-04 lazy split verified ✓** — el initial bundle (63KB gzip) NO contiene Phaser. El chunk grande (341KB gzip) sólo se carga cuando `activeChapter === 6` dispara el `await import('@/phaser')`.

## Known Stubs

| Stub | File | Why |
|---|---|---|
| `<ProjectOverlay>` minimal stub | `src/components/ProjectOverlay.vue` | W4 (Plan 05-05) implementa el componente synthwave completo con focus trap + ESC + content rich + PRM. Stub permite render end-to-end W3 sin crash y tests bridge GREEN. API contract locked (props.projectId + emits.close). |

## Deferred Issues

| Issue | Owner | Action |
|---|---|---|
| Phaser chunk size 341KB gzipped excede target W3 ≤200KB | W5 manual checklist o Phase 6 | Investigar Vite `build.rollupOptions.output.manualChunks` para split Phaser internals (Scene/GameObjects/Loader separados), o segundo nivel de splitting de SpaceScene. Bundle análisis con `vite-bundle-visualizer` recomendado. NO bloquea v1 — el lazy split funciona; sólo el tamaño del chunk lazy podría optimizarse. |
| 5 tests RED W4-owned (`focus-trap.test.js` 3 + `ProjectOverlay.test.js` T1/T3 = 2) | Plan 05-05 (W4) | ProjectOverlay synthwave completo + focus trap + ESC keydown + projectId content resolution. Confirmado pre-existente RED desde W0 (verificado con `git stash` baseline). NO regression introducida por Plan 05-04. |
| `.sr-only` utility duplicado local en Chapter6Content.vue (no global) | Future refactor (segundo consumer claro) | Cuando ProjectOverlay W4 o cualquier otro componente necesite `.sr-only`, extraer a `chapter-themes.css @layer utilities` o `App.vue` global. Por ahora con un solo consumer, local es OK. |

## TDD Gate Compliance

Plan tipo `execute` (no `tdd`); per-task TDD = `true`. Gate sequence:

- Task 1 commit: `feat(05-04)` — implementación añade GREEN a 13 tests RED scaffolds W0. No `test()` separate commit porque los tests existían pre-W3 como scaffolds RED (W0 territory). El feat commit los gira GREEN — válido bajo plan-level TDD.
- Task 2 commit: `feat(05-04)` — añade GREEN a 9 tests RED scaffolds W0 (chapter-overlap-ch6 integration + Chapter6Content-prm T2 mantra @media + ScrollShell tests updates).

REFACTOR commits: no necesarios — el código quedó en estado limpio post-GREEN.

## Self-Check: PASSED

- src/components/Chapter6Content.vue: **FOUND** ✓
- src/components/ProjectOverlay.vue: **FOUND** ✓
- src/components/ScrollShell.vue (modified Chapter6Content import + v-else-if): **FOUND** ✓
- src/styles/chapter-themes.css (modified @layer components ch6 block): **FOUND** ✓
- tests/components/ScrollShell.test.js (modified): **FOUND** ✓
- tests/components/ScrollShell.theme-isolation-phase4.test.js (modified): **FOUND** ✓
- Commit `c255725` (Task 1): **FOUND** ✓
- Commit `6d8d94e` (Task 2): **FOUND** ✓

---

*Plan 05-04 completed 2026-05-14. Slice end-to-end check ready for W5 manual verification: `npm run dev` + scroll a ch6 = canvas Phaser visible con planets/ships/arrival camera + mantra HTML fade-in al fin del arrival + click planet abre stub overlay (mensaje "STUB · W4 replaces"). Next plan: 05-05 (W4) — ProjectOverlay synthwave completo.*
