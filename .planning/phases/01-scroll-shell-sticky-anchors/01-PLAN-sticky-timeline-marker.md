---
phase: 1
plan: 5
slug: sticky-timeline-marker
wave: 4
type: execute
mode: mvp
autonomous: true
gap_closure: false
requirements_covered: [CORE-07, CORE-11, CORE-06, CORE-09, A11Y-02, A11Y-05]
depends_on: [1, 2, 3, 4]
files_modified:
  - src/components/StickyTimeline.vue
  - src/components/ScrollShell.vue
  - src/App.vue
  - tests/components/StickyTimeline.test.js
  - tests/components/ScrollShell.test.js
must_haves:
  truths:
    - "El StickyTimeline es visible bottom durante todo el scroll, con 7 ticks (1995, 2001, 2009, 2013, 2015, 2022, 2026)"
    - "El tick correspondiente al activeChapter tiene aria-current='true' y mayor peso visual (font-weight 700 + color --c-track-active)"
    - "El marker (puck) se mueve continuamente mientras el usuario hace swipe libre, derivado de scrollProgress (RAF en useScrollState)"
    - "Click en cualquier tick navega smoothly al chapter correspondiente (default motion) Y el marker se ve recorrer la track durante el smooth scroll (no salta de golpe)"
    - "Click en cualquier tick navega INSTANTÁNEAMENTE al chapter bajo PRM (D-04) — el brinco-instantáneo del marker es correcto bajo PRM"
    - "Las flechas ↑/↓/j/k navegan entre chapters cuando el ScrollShell tiene foco; Home/End van a chapter 0/6 respectivamente; los handlers son keyboard-derived y respetan PRM"
    - "Touch targets de los ticks son ≥44×44px (UI-SPEC §3 excepción declarada)"
    - "El bottom del .sticky-timeline usa env(safe-area-inset-bottom, 0) desde day 1 (preventivo, fallback graceful a 0)"
  artifacts:
    - path: src/components/StickyTimeline.vue
      provides: "Componente sticky bottom con 7 ticks click-to-nav + marker móvil RAF + estados hover/focus/active + bottom: env(safe-area-inset-bottom, 0)"
      contains: "scrollProgress"
    - path: src/components/ScrollShell.vue
      provides: "Actualizado con keyboard handlers @keydown.up.prevent / .down / .home / .end + j/k mappings via @keydown"
      contains: "@keydown"
    - path: src/App.vue
      provides: "Layout actualizado para montar <StickyTimeline /> después del ScrollShell"
      contains: "StickyTimeline"
    - path: tests/components/StickyTimeline.test.js
      provides: "Tests de DOM structure, 7 ticks, marker derivado de scrollProgress, click handlers, PRM branch, safe-area CSS"
    - path: tests/components/ScrollShell.test.js
      provides: "Tests adicionales para keyboard handlers ↑/↓/j/k/Home/End + PRM branch (preventDefault no testado — declarativo de Vue, ver key-decisions)"
  key_links:
    - from: src/components/StickyTimeline.vue
      to: src/composables/useScrollState.js
      via: "inject('scrollState') + scrollProgress + scrollToChapter"
      pattern: "inject\\('scrollState'\\)"
    - from: src/components/StickyTimeline.vue
      to: src/composables/usePRM.js
      via: "inject('prm') + behavior switch en click handlers"
      pattern: "prefersReduced"
    - from: src/components/ScrollShell.vue
      to: src/composables/useScrollState.js
      via: "scrollToChapter en keyboard handlers"
      pattern: "scrollToChapter"
---

<objective>
Construir el segundo ancla sticky funcional: la timeline horizontal bottom con 7 ticks (años 1995..2026), marker móvil derivado de `scrollProgress` (RAF en `useScrollState` que ya está corriendo desde Plan 02), click-to-navigate, estados hover/focus/active, y cableo del keyboard navigation `↑/↓/j/k/Home/End` en el ScrollShell.

**Purpose:** Cubre CORE-07 (timeline sticky), CORE-11 (marker via scrollProgress), CORE-06 (keyboard nav), y completa A11Y-02 (keyboard handlers reales — el `tabindex="0"` ya estaba desde Plan 02). Cierra el loop visible del concepto: el usuario puede navegar entre los 7 chapters por 3 medios distintos (scroll wheel/swipe, click en tick, teclado) y siempre ve dónde está (avatar + marker).

**Output:**
- `src/components/StickyTimeline.vue` con DOM exacto UI-SPEC §7.3 + `bottom: env(safe-area-inset-bottom, 0)` aplicado preventivamente (no condicional).
- `src/components/ScrollShell.vue` actualizado con `@keydown` handlers + inject de `prm` y `scrollState`.
- `src/App.vue` actualizado: añade `<StickyTimeline />` después del ScrollShell.
- Tests cubriendo timeline (13 tests) y keyboard handlers ampliados (10 tests nuevos — Test 11 de preventDefault eliminado por ambigüedad).

**Lo que ESTE plan NO hace:**
- NO añade el SkipLink (Plan 06).
- NO añade focus ring universal `:focus-visible` (Plan 06 lo hace global).
- NO modifica StickyAvatar (Plan 04 ya cubierto).
- NO cambia themes (Phase 2).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-PLAN.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-UI-SPEC.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-RESEARCH.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-CONTEXT.md
@src/App.vue
@src/components/ScrollShell.vue
@src/components/StickyAvatar.vue
@src/composables/useScrollState.js
@src/composables/usePRM.js

<interfaces>
<!-- Chapters array (ya en ScrollShell.vue desde Plan 02; redeclarar en StickyTimeline para mantener separación, O extraer a src/data/chapters.js como single source — decisión abajo). -->

**Decisión:** mantener el array `chapters` duplicado en ScrollShell.vue y StickyTimeline.vue por ahora. Phase 3 (CON-05) introduce `src/data/chapters.js` como single source con más metadata (era labels i18n, asset refs). Duplicar 14 LOC por componente en Phase 1 es aceptable y evita prematuramente acoplar a un módulo que Phase 3 va a expandir significativamente.

```javascript
const chapters = [
  { id: 0, year: 1995, era: 'Terminal' },
  { id: 1, year: 2001, era: 'HTML 90s' },
  { id: 2, year: 2009, era: 'Flash' },
  { id: 3, year: 2013, era: 'Web 2.0' },
  { id: 4, year: 2015, era: 'AR/VR' },
  { id: 5, year: 2022, era: 'Modern' },
  { id: 6, year: 2026, era: 'Phaser' },
]
```

<!-- DOM contract (UI-SPEC §7.3): -->
```html
<nav
  class="sticky-timeline"
  aria-label="Navegación de capítulos por era"
  role="navigation"
>
  <div class="timeline-track" aria-hidden="true">
    <div
      class="timeline-marker"
      aria-hidden="true"
      :style="{ left: `${scrollProgress * 100}%` }"
    ></div>
  </div>
  <ol class="timeline-ticks" role="list">
    <li
      v-for="ch in chapters"
      :key="ch.id"
      class="timeline-tick"
      role="listitem"
    >
      <button
        class="tick-button"
        :data-chapter="ch.id"
        :aria-label="`Ir a ${ch.era} (${ch.year})`"
        :aria-current="activeChapter === ch.id ? 'true' : undefined"
        @click="onTickClick(ch.id)"
      >
        <span class="tick-notch" aria-hidden="true"></span>
        <span class="tick-year">{{ ch.year }}</span>
      </button>
    </li>
  </ol>
</nav>
```

<!-- Click handler (D-04): -->
```javascript
function onTickClick(N) {
  const behavior = prefersReduced.value ? 'auto' : 'smooth'
  scrollToChapter(N, behavior)
}
```

<!-- ScrollShell keyboard handlers (UI-SPEC §10, RESEARCH §Área 4): -->
```html
<main
  id="main-content"
  class="scroll-shell"
  tabindex="0"
  ref="shellEl"
  @keydown.up.prevent="navigate(-1)"
  @keydown.down.prevent="navigate(1)"
  @keydown.home.prevent="navigate('home')"
  @keydown.end.prevent="navigate('end')"
  @keydown.j.prevent="navigate(1)"
  @keydown.k.prevent="navigate(-1)"
>
```

```javascript
// En ScrollShell.vue script setup:
import { inject } from 'vue'
const { activeChapter, scrollToChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

function navigate(delta) {
  let target
  if (delta === 'home') target = 0
  else if (delta === 'end') target = 6
  else target = Math.max(0, Math.min(6, activeChapter.value + delta))
  scrollToChapter(target, prefersReduced.value ? 'auto' : 'smooth')
}
```

<!-- CSS contract (UI-SPEC §7.3 — copiar valores exactos): -->
```css
.sticky-timeline {
  position: fixed;
  /* Preventive safe-area: fallback to 0 on browsers without env() (Chrome desktop, FF, etc.).
     This avoids a second iOS smoke-test session in Plan 07 if Safari toolbar overlaps. */
  bottom: env(safe-area-inset-bottom, 0);
  left: 0;
  right: 0;
  height: var(--sp-2xl);  /* 48px */
  z-index: 40;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0 var(--sp-md);
}
.timeline-track {
  position: absolute;
  top: 50%;
  left: var(--sp-md);
  right: var(--sp-md);
  height: 10px;
  background: var(--c-track);
  border-radius: 5px;
  transform: translateY(-50%);
}
.timeline-marker {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: var(--c-marker);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: left 0ms linear;  /* binding continuo — sin ease */
}
.timeline-ticks {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
}
.tick-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-xs);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  min-width: 44px;    /* touch target */
  min-height: 44px;
  justify-content: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.tick-notch {
  display: block;
  width: 2px;
  height: 8px;
  background: var(--c-track-active);
  opacity: 0.4;
  transition: opacity 150ms ease, height 150ms ease;  /* D-05 interaction-derived */
}
.tick-button:hover .tick-notch {
  opacity: 0.7;
  height: 10px;
}
.tick-button:hover .tick-year {
  color: var(--c-tick-hover);
}
.tick-button[aria-current="true"] .tick-notch {
  opacity: 1;
}
.tick-button[aria-current="true"] .tick-year {
  font-weight: 700;
  color: var(--c-track-active);
}
.tick-year {
  font-size: 12px;
  font-weight: 400;
  color: var(--c-muted);
  transition: color 150ms ease;
}
@media (max-width: 599px) {
  .sticky-timeline {
    height: 44px;
    padding: 0 var(--sp-sm);
  }
  .tick-year {
    font-size: 11px;  /* executor discretion within 9-11px per UI-SPEC §9 nota */
  }
}
```

Nota: NO añadir `@media (prefers-reduced-motion: reduce)` que quite el `transition` de hover/focus — D-05 dice que las micro-transitions ≤150ms en hover/focus se mantienen bajo PRM (son interaction-derived). El branch PRM aquí solo afecta el `scrollTo({behavior})` programático (D-04).
</interfaces>

<key-decisions>
- UI-SPEC §7.3 es la fuente de verdad. DOM + CSS replicados 1:1.
- **`bottom: env(safe-area-inset-bottom, 0)` aplicado desde day 1, NO condicional post-FAIL.** El fallback graceful a `0` significa que en browsers sin notch (Chrome desktop, Firefox, Safari macOS) el valor evalúa a `0` exactamente como si no estuviera. En iPhone con notch/Dynamic Island, el inset previene overlap con la Safari toolbar dinámica. NO hay downside — solo previene un re-test loop en Plan 07.
- El marker `left` se binda directamente a `scrollProgress * 100%`. NO usar transition CSS sobre `left` (RESEARCH §7.3 — el binding continuo es data binding de gesto, no animación; un transition lo "atrasaría" del scroll real). `transition: left 0ms linear` está declarado explícitamente para sobreescribir cualquier herencia futura. **Esto significa que durante un click suave (behavior: 'smooth'), el browser anima el scrollTop del shell continuamente — el RAF en useScrollState actualiza scrollProgress 60fps — el marker (left bindeado a scrollProgress) se mueve continuamente con el scroll. NO salta de golpe.** Bajo PRM (behavior: 'auto'), el scrollTop salta instantáneo → scrollProgress salta → marker salta. Ambos casos son correctos.
- El RAF en `useScrollState` ya está corriendo (Plan 02). `scrollProgress` es un ref readonly inyectado. El template hace `:style="{ left: \`${scrollProgress * 100}%\` }"` y Vue se encarga del rebind 60fps gracias al RAF que actualiza el ref.
- Click handler: D-04 dicta `behavior: 'auto'` bajo PRM. El switch lo hace el componente, no el composable (el composable acepta `behavior` como parámetro libre).
- Touch target ≥44×44px: declarado en UI-SPEC §3 (excepción declarada) y §7.3 (`min-width: 44px; min-height: 44px` en `.tick-button`). NO usar `width/height` fijos — `min-*` permite que el botón crezca si el contenido lo pide.
- ScrollShell keyboard handlers consumen `inject('scrollState')` y `inject('prm')`. Esto es la primera vez que ScrollShell consume el composable directamente — antes (Plan 02) solo exponía el `shellEl` ref para que App.vue lo pasara al composable. Ahora ScrollShell ya puede inyectar lo provided.
- `j` / `k` mappings: vim-style keybindings — opcionales pero baratos (2 LOC en template). Son una preferencia frequent para devs/recruiters técnicos; ROI alto vs costo bajo. NO documentar visualmente (no es un constraint A11Y, es un nice-to-have).
- Page Up/Down mencionados en CORE-06 como opcionales: NO implementar en Phase 1. Si Rafael lo pide después, 2 LOC añadidos sin frenos.
- Para ScrollShell.vue tests adicionales, expandir `tests/components/ScrollShell.test.js` sin sobreescribirlo (Plan 02 tiene tests existentes ahí).
- **preventDefault testing (BLOCKER 3 fix):** Vue's `.prevent` modifier es declarative — Vue llama `event.preventDefault()` sobre el evento nativo cuando dispatcha el handler. Testearlo via `trigger('keydown.up')` de @vue/test-utils NO da acceso al spy del preventDefault. **Decisión: eliminar el Test 11 ambiguous** y confiar en que `.prevent` funciona (es Vue framework code, no nuestro). Si en algún momento queremos un test real, hacer construct manual del event: `const ev = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }); const spy = vi.spyOn(ev, 'preventDefault'); mainEl.dispatchEvent(ev); expect(spy).toHaveBeenCalled();`. Pero para Phase 1 lo eliminamos — los Tests 2-10 ya verifican el comportamiento correcto (navigate dispara con la delta correcta).
</key-decisions>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 5.1: Crear StickyTimeline.vue con DOM/CSS UI-SPEC §7.3 + marker RAF + click handlers PRM-aware + env(safe-area-inset-bottom) preventivo</name>
  <files>src/components/StickyTimeline.vue, tests/components/StickyTimeline.test.js</files>
  <behavior>
    - Test 1: Render: el `<nav class="sticky-timeline">` raíz tiene `role="navigation"` y `aria-label="Navegación de capítulos por era"`.
    - Test 2: Render: existen exactamente 7 `<button class="tick-button">` con `data-chapter` 0..6, cada uno con `aria-label="Ir a {era} ({year})"`.
    - Test 3: Render: cada tick-button contiene un `<span class="tick-notch">` y un `<span class="tick-year">` con el año correcto.
    - Test 4: Render del marker: `<div class="timeline-marker">` existe con `style="left: 0%"` inicial (scrollProgress = 0 default).
    - Test 5: Reactividad del marker: provide un `scrollProgress` ref mutable; cambiar a 0.5 → tras nextTick, el marker `left: 50%`.
    - Test 6: aria-current reactivo: provide un `activeChapter` ref mutable; cambiar a 4 → el tick `[data-chapter="4"]` tiene `aria-current="true"`; los otros 6 no lo tienen.
    - Test 7: Click default motion: mock `prefersReduced.value === false`; click en tick `[data-chapter="2"]` invoca `scrollToChapter(2, 'smooth')` (spy en el provide mock).
    - Test 8: Click PRM motion: mock `prefersReduced.value === true`; click en tick `[data-chapter="2"]` invoca `scrollToChapter(2, 'auto')` (D-04).
    - Test 9: CSS string check: `.sticky-timeline` declara `position: fixed; bottom: env(safe-area-inset-bottom, 0); height: var(--sp-2xl)` (48px) y `z-index: 40`.
    - Test 10: CSS string check: `.tick-button` declara `min-width: 44px; min-height: 44px` (touch target).
    - Test 11: CSS string check: media query `(max-width: 599px)` con `height: 44px` en `.sticky-timeline`.
    - Test 12: CSS string check: `.timeline-marker` declara `transition: left 0ms linear` (binding continuo, no animation).
    - Test 13 (nuevo): CSS string check: `bottom: env(safe-area-inset-bottom, 0)` está presente en `.sticky-timeline` (verifica HIGH 4 preventive fix).
  </behavior>
  <action>
    Escribir `tests/components/StickyTimeline.test.js` con los 13 tests. Usar mount + provide de `scrollState` (con refs mutables para tests) y `prm`. Spy `scrollToChapter` en el provide para Tests 7 y 8.

    Después implementar `src/components/StickyTimeline.vue`:

    `<script setup>`:
    ```javascript
    import { inject } from 'vue'

    const chapters = [
      { id: 0, year: 1995, era: 'Terminal' },
      { id: 1, year: 2001, era: 'HTML 90s' },
      { id: 2, year: 2009, era: 'Flash' },
      { id: 3, year: 2013, era: 'Web 2.0' },
      { id: 4, year: 2015, era: 'AR/VR' },
      { id: 5, year: 2022, era: 'Modern' },
      { id: 6, year: 2026, era: 'Phaser' },
    ]

    const { activeChapter, scrollProgress, scrollToChapter } = inject('scrollState')
    const { prefersReduced } = inject('prm')

    function onTickClick(N) {
      const behavior = prefersReduced.value ? 'auto' : 'smooth'
      scrollToChapter(N, behavior)
    }
    ```

    `<template>`: copiar exactamente el HTML del `<interfaces>` arriba (DOM contract).

    `<style scoped>`: copiar el bloque CSS exacto del `<interfaces>` arriba. **Importante:** la regla `.sticky-timeline { bottom: env(safe-area-inset-bottom, 0); ... }` va desde la primera implementación — NO usar `bottom: 0` para luego cambiarlo en Plan 07. El fallback a `0` es graceful y zero-downside en browsers sin notch.

    Iterar hasta que los 13 tests pasen.
  </action>
  <verify>
    <automated>`npx vitest run tests/components/StickyTimeline.test.js`. Exit 0, 13 tests passed.</automated>
  </verify>
  <done>
    `src/components/StickyTimeline.vue` existe con DOM/CSS UI-SPEC §7.3. Los 13 tests pasan. Marker reactivo a scrollProgress. Click handlers PRM-aware. Touch targets ≥44px. aria-current reactivo. `bottom: env(safe-area-inset-bottom, 0)` desde day 1.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 5.2: Expandir ScrollShell.vue con keyboard handlers ↑/↓/j/k/Home/End + tests (preventDefault test removido por ambigüedad)</name>
  <files>src/components/ScrollShell.vue, tests/components/ScrollShell.test.js</files>
  <behavior>
    - Test 1 (nuevo): `<main>` tiene los 6 `@keydown` handlers declarados (verificable via SFC raw + lookup de `@keydown.up`, `.down`, `.home`, `.end`, `.j`, `.k`).
    - Test 2: Simular keydown `ArrowDown` con activeChapter=3: invoca `scrollToChapter(4, 'smooth')` (default motion).
    - Test 3: Simular keydown `ArrowUp` con activeChapter=3: invoca `scrollToChapter(2, 'smooth')`.
    - Test 4: Simular keydown `j` con activeChapter=3: invoca `scrollToChapter(4, 'smooth')` (alias de ↓).
    - Test 5: Simular keydown `k` con activeChapter=3: invoca `scrollToChapter(2, 'smooth')` (alias de ↑).
    - Test 6: Simular keydown `Home`: invoca `scrollToChapter(0, 'smooth')`.
    - Test 7: Simular keydown `End`: invoca `scrollToChapter(6, 'smooth')`.
    - Test 8: Bounds: activeChapter=0 + ArrowUp → `scrollToChapter(0, 'smooth')` (clamped, no negativo).
    - Test 9: Bounds: activeChapter=6 + ArrowDown → `scrollToChapter(6, 'smooth')` (clamped, no >6).
    - Test 10: PRM branch: mock prefersReduced=true; ArrowDown → `scrollToChapter(4, 'auto')` (D-04).

    **Test 11 ELIMINADO (BLOCKER 3):** El test original asertaba `preventDefault` fue llamado via `trigger('keydown.up')`. Vue Test Utils' `trigger` no expone el evento nativo subyacente con un spy verificable de `preventDefault`. La directiva `.prevent` es declarative de Vue framework y llama `event.preventDefault()` internamente. Confiar en el framework — los Tests 2-10 ya verifican el behavior funcional (navegación correcta con clamping y PRM). Si en el futuro se necesita verificar preventDefault realmente, construct manual del event: `const ev = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }); const spy = vi.spyOn(ev, 'preventDefault'); mainEl.dispatchEvent(ev); expect(spy).toHaveBeenCalled();` — pero NO para Phase 1.
  </behavior>
  <action>
    Expandir `tests/components/ScrollShell.test.js` (NO sobreescribir — mantener los tests del Plan 02 intactos). Añadir los 10 tests nuevos en un `describe('keyboard navigation', ...)` block. Usar `wrapper.find('main').trigger('keydown.up')` etc. Spy `scrollToChapter` via provide mock.

    **NO añadir el Test 11 de preventDefault** — eliminado por ambigüedad de testability. La protección viene del modifier `.prevent` declarativo de Vue, que es framework-internal. Documentar en un comment del describe block: "Note: preventDefault behavior is provided by Vue's .prevent modifier and not unit-tested here — see Plan 05 key-decisions for rationale."

    Editar `src/components/ScrollShell.vue`:

    En `<script setup>` añadir:
    ```javascript
    import { inject } from 'vue'
    const { activeChapter, scrollToChapter } = inject('scrollState')
    const { prefersReduced } = inject('prm')

    function navigate(delta) {
      let target
      if (delta === 'home') target = 0
      else if (delta === 'end') target = 6
      else target = Math.max(0, Math.min(6, activeChapter.value + delta))
      scrollToChapter(target, prefersReduced.value ? 'auto' : 'smooth')
    }
    ```

    En `<template>`, expandir el `<main>` con los 6 keydown handlers:
    ```html
    <main
      id="main-content"
      class="scroll-shell"
      tabindex="0"
      ref="shellEl"
      @keydown.up.prevent="navigate(-1)"
      @keydown.down.prevent="navigate(1)"
      @keydown.home.prevent="navigate('home')"
      @keydown.end.prevent="navigate('end')"
      @keydown.j.prevent="navigate(1)"
      @keydown.k.prevent="navigate(-1)"
    >
      <!-- 7 sections como en Plan 02 -->
    </main>
    ```

    NO modificar `defineExpose({ shellEl })` ni el array chapters ni el `<style scoped>` — todo eso ya está correcto desde Plan 02.

    Iterar hasta que los nuevos 10 tests + los 8 originales del Plan 02 pasen (total ≥18, no 19 — el Test 11 original fue eliminado).
  </action>
  <verify>
    <automated>`npx vitest run tests/components/ScrollShell.test.js`. Exit 0, ≥18 tests passed (8 originales del Plan 02 + 10 nuevos de keyboard nav).</automated>
  </verify>
  <done>
    `src/components/ScrollShell.vue` consume `inject('scrollState')` e `inject('prm')`, declara los 6 keyboard handlers, implementa `navigate(delta)` con clamping y PRM-aware behavior. ≥18 tests pasan. El test de preventDefault fue eliminado por ambigüedad — documentado en describe block comment.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 5.3: Montar StickyTimeline en App.vue después del ScrollShell</name>
  <files>src/App.vue</files>
  <action>
    Editar `src/App.vue`. Añadir:
    - `import StickyTimeline from './components/StickyTimeline.vue'` junto a los imports existentes.
    - En el `<template>`, después de `<ScrollShell ... />`, añadir `<StickyTimeline />`. Resultado:
      ```html
      <template>
        <StickyAvatar />
        <ScrollShell :ref="el => { shellRef.value = el?.shellEl ?? null }" />
        <StickyTimeline />
      </template>
      ```
      Orden DOM (UI-SPEC §6): SkipLink → StickyAvatar → ScrollShell → StickyTimeline. El SkipLink llega en Plan 06.

    NO modificar el `<script setup>` ni el `<style>`.

    Ejecutar la suite Vitest para verificar que no hay regresiones.
  </action>
  <verify>
    <automated>`node -e "const fs = require('fs'); const app = fs.readFileSync('./src/App.vue', 'utf8'); if (!app.includes('StickyTimeline')) process.exit(1); if (!app.match(/<StickyTimeline\\s*\\/>/)) process.exit(1); console.log('OK App.vue StickyTimeline mounted')"`. Plus `npx vitest run` exit 0.</automated>
  </verify>
  <done>
    `src/App.vue` importa y monta `<StickyTimeline />` después del `<ScrollShell />`. Suite Vitest passing.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 5.4: Smoke test manual de timeline + keyboard</name>
  <files>(verificación, ninguno modificado)</files>
  <action>
    Ejecutar `npm run dev`. Abrir `http://localhost:5173/`.

    Timeline visual:
    1. Timeline bottom visible: 48px de altura, fondo `#1a1a2e`, border-top sutil.
    2. 7 ticks distribuidos uniformemente con `justify-content: space-between`, con años 1995, 2001, 2009, 2013, 2015, 2022, 2026.
    3. El tick `2013` (chapter 3, default landing) tiene mayor peso visual: `font-weight: 700`, color `#e7e7f0`, notch opacity 1.0.
    4. Los otros 6 ticks tienen `font-weight: 400`, color `#6b6b8a`, notch opacity 0.4.
    5. El marker (puck redondo `#a0a0c0` de 16px) está posicionado sobre el tick `2013` aproximadamente (scrollProgress = 3/6 = 0.5 → left: 50%).

    Marker reactivo (manual scroll):
    6. Hacer scroll lento hacia abajo → el marker se mueve continuamente a la derecha mientras el chapter 4 entra en viewport.
    7. Soltar el scroll → snap completa → el marker queda en una posición proporcional al ch4 (~66%).

    **Marker tracking durante click smooth-scroll (HIGH 3 fix):**
    8. **Click en tick `2026` (con PRM OFF) → el marker se ve recorrer la track horizontalmente durante el smooth scroll, no salta de golpe.** Verificar visualmente que durante los ~600-1000ms del smooth scroll, el marker progresa continuamente de izquierda a derecha; no aparece directamente en el extremo. Si el marker brinca instantáneamente bajo default motion, hay un bug: revisar que `transition: left 0ms linear` está en el CSS (no `transition: left 200ms ease` o similar) Y que el RAF de useScrollState está pausando/reanudando correctamente.
    9. **Mismo click bajo PRM ON → el marker brincado-instantáneo es correcto (no es un bug).** Bajo PRM, `behavior: 'auto'` hace que `scrollTop` salte instantáneo → scrollProgress salta → marker salta. Esto es D-04 funcionando.

    Click-to-nav adicional:
    10. Click en el tick `1995` → snap smooth a chapter 0 (`1995 · Terminal`). El avatar muestra `ch0`. El tick `1995` ahora es activo (peso 700).
    11. Click en `2013` → snap smooth a chapter 3.

    Hover state:
    12. Hover sobre `2009` → tick-year cambia a color `#c0c0d8` (`--c-tick-hover`), notch grows a 10px altura y opacity 0.7, con transition de 150ms.

    Keyboard nav:
    13. Tab dos veces desde la URL bar → el foco llega al `<main.scroll-shell>` (visible outline si tiene focus — el outline universal viene en Plan 06, pero `tabindex="0"` ya hace focusable).
    14. Presionar ↓ → snap a ch4. ↑ → vuelve a ch3.
    15. Presionar `j` → snap a ch4 (alias). `k` → vuelve a ch3 (alias).
    16. Presionar `End` → snap a ch6. `Home` → snap a ch0.
    17. En ch0 presionar `k` o ↑ → no pasa nada (clamped).

    PRM:
    18. DevTools → Emulate "prefers-reduced-motion: reduce" → Recargar → Click en `2026` → snap **instantáneo** + marker salta instantáneo (D-04 verified).

    Mobile:
    19. DevTools viewport 375×667 → timeline shrink a 44px de altura, padding 8px. Touch targets siguen siendo ≥44px (verificable inspeccionando el button).

    Cualquier falla → revisar el componente correspondiente. Documentar resultado en SUMMARY.
  </action>
  <verify>
    <automated>`npx vitest run`. Suite passing (incluyendo los nuevos tests del marker + keyboard sin el preventDefault test eliminado).</automated>
  </verify>
  <done>
    Los 19 ítems manuales pasan. Timeline visualmente correcta, marker reactivo (incluyendo tracking durante smooth scroll y jump bajo PRM — ambos esperados), click-to-nav funcional, keyboard nav funcional, PRM respetado en click, mobile breakpoint funcional, env(safe-area-inset-bottom) graceful en desktop (no afecta visualmente).
  </done>
</task>

</tasks>

<verification>
**Automated:**
```powershell
npx vitest run
```
Exit 0, todos los tests passing (significativamente más que en Plans previos por los nuevos del timeline y los expandidos del shell; el test de preventDefault fue eliminado por ambigüedad).

**Manual (checklist Task 5.4):**
- [ ] 7 ticks visibles con años correctos
- [ ] Marker móvil reactivo a scroll manual
- [ ] **Marker tracking durante click smooth-scroll (no jump bajo default motion)**
- [ ] **Marker jump bajo PRM (correcto, no es bug)**
- [ ] aria-current="true" en tick activo
- [ ] Click-to-nav smooth (default) e instantáneo (PRM)
- [ ] Keyboard ↑/↓/j/k/Home/End funcionales
- [ ] Hover state funcional con transition 150ms
- [ ] Mobile breakpoint shrink correcto
- [ ] env(safe-area-inset-bottom) presente en CSS desde day 1 (graceful fallback)
</verification>

<success_criteria>
- [ ] `src/components/StickyTimeline.vue` exporta el componente con DOM UI-SPEC §7.3.
- [ ] Marker reactivo a `scrollProgress` (binding 60fps via RAF en useScrollState).
- [ ] **Marker visualmente recorre la track durante smooth scroll, salta bajo PRM (manual verificado en Task 5.4 items 8-9).**
- [ ] 7 ticks click-to-nav con behavior switching (D-04).
- [ ] Hover/focus/active states UI-SPEC §7.3 implementados.
- [ ] Touch targets ≥44×44px en tick-button.
- [ ] `bottom: env(safe-area-inset-bottom, 0)` aplicado preventivamente (HIGH 4 fix).
- [ ] `src/components/ScrollShell.vue` con keyboard handlers ↑/↓/j/k/Home/End + clamping + PRM-aware.
- [ ] ≥13 tests nuevos en StickyTimeline + ≥10 tests nuevos en ScrollShell (sin el preventDefault eliminado), todos passing.
- [ ] App.vue monta `<StickyTimeline />`.
- [ ] CORE-07, CORE-11, CORE-06, CORE-09 (parcial — click+keyboard branches), A11Y-02 (keyboard handlers reales), A11Y-05 (D-04 verificado) — todos cubiertos.
</success_criteria>

<output>
Tras completar, crear `.planning/phases/01-scroll-shell-sticky-anchors/01-05-SUMMARY.md` documentando:
- Confirmación de marker reactivo via scrollProgress (RAF cableado correctamente desde Plan 02).
- Confirmación del comportamiento del marker bajo smooth scroll (recorre track) vs PRM (salta) — ambos correctos.
- Confirmación de keyboard nav completo (6 keys: ↑↓jkHomeEnd).
- Confirmación de D-04 (click PRM instantáneo).
- Confirmación de `env(safe-area-inset-bottom, 0)` aplicado desde el inicio (no requiere re-iteration en Plan 07).
- Resultado de los 19 ítems manuales.
- Nota sobre el test 11 (preventDefault) eliminado por ambigüedad — confiamos en Vue's `.prevent` declarativo.
- Cualquier ajuste necesario al CSS por solapamiento visual en viewports raros (no debería).
</output>
