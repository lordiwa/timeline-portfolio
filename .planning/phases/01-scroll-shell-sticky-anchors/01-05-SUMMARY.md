---
phase: 1
plan: 5
slug: sticky-timeline-marker
wave: 4
completed: 2026-05-12
duration_min: 18
tests_added: 23
tests_total_suite: 59
commits:
  - a77adc5: "test(timeline): plan 05 task 5.1 RED — 13 tests para StickyTimeline (W4)"
  - 3e49133: "feat(timeline): plan 05 task 5.1 — StickyTimeline.vue GREEN (W4)"
  - 0588fb1: "test(shell): plan 05 task 5.2 RED — 10 tests para keyboard navigation (W4)"
  - ce3ed36: "feat(shell): plan 05 task 5.2 — ScrollShell keyboard nav GREEN (W4)"
  - 3d2bd5d: "feat(app): plan 05 task 5.3 — mount <StickyTimeline /> + viewport-fit=cover (W4)"
  - 3ba49e4: "docs(timeline): plan 05 task 5.4 — manual checklist artifact (W4)"
requirements_covered:
  - CORE-07: "Timeline sticky bottom con marker + año + 7 ticks click-to-navigate"
  - CORE-11: "Timeline marker tracks scrollProgress (0..1) via RAF (cableado E2E)"
  - CORE-06: "Navegación con flechas ↑/↓ (Home/End + j/k aliases)"
  - CORE-09: "PRM respetado en click-to-nav (D-04) y keyboard nav (D-04)"
  - A11Y-02: "Keyboard handlers reales en ScrollShell (completa el tabindex='0' de Plan 02)"
  - A11Y-05: "D-04 verificado via tests: behavior='auto' bajo PRM, 'smooth' default"
  - iOS-01 (parcial): "env(safe-area-inset-bottom, 0) preventivo + viewport-fit=cover precondicion"
key_decisions:
  - "DOM exacto UI-SPEC §7.3: <nav role='navigation' aria-label='...'> + .timeline-track > .timeline-marker + <ol> con 7 .tick-button con aria-current reactivo"
  - "Marker left bindeado a scrollProgress * 100% via computed; CSS transition: left 0ms linear explicito — binding de gesto, no animacion temporal. Bajo smooth scroll el browser anima scrollTop y el RAF de useScrollState refleja en scrollProgress 60fps, asi el marker recorre la track. Bajo PRM (D-04), scrollTop salta -> scrollProgress salta -> marker salta (correcto, no bug)"
  - "Click handler decide behavior aqui (no en composable): scrollToChapter(N, prm ? 'auto' : 'smooth'). El composable acepta behavior libre — la politica D-04 vive en el componente"
  - "bottom: env(safe-area-inset-bottom, 0) PREVENTIVO desde day 1, no condicional post-Plan 07. Fallback graceful a 0 en desktop browsers — zero downside. HIGH 4 fix iter 2"
  - "ScrollShell ahora hace inject('scrollState') + inject('prm') por primera vez. navigate(delta) helper con clamping [0..6] y branch behavior PRM-aware. 6 @keydown.<key>.prevent en <main>: up/down/k/j/home/end"
  - "preventDefault test ELIMINADO (BLOCKER 3 fix): Vue Test Utils trigger no expone spy verificable. .prevent es declarativo de Vue framework — confiamos en el framework. Tests 2-10 verifican el behavior funcional (navigate dispara con delta correcta + clamping + PRM branch) que es lo que importa para a11y"
  - "chapters array duplicado en ScrollShell y StickyTimeline (locked en plan §key-decisions). Phase 3 consolida en src/data/chapters.js con i18n + asset refs. Duplicar 14 LOC en Phase 1 evita acoplar prematuramente a modulo que Phase 3 va a expandir significativamente"
  - "viewport-fit=cover en index.html — precondicion para que env(safe-area-inset-bottom) produzca valores no-cero en iOS. Sin esto, el HIGH 4 preventive seria no-op en iPhone con notch"
files_modified:
  created:
    - src/components/StickyTimeline.vue
    - tests/components/StickyTimeline.test.js
    - .planning/phases/01-scroll-shell-sticky-anchors/01-05-MANUAL-CHECKLIST.md
  modified:
    - src/components/ScrollShell.vue
    - tests/components/ScrollShell.test.js
    - src/App.vue
    - index.html
---

# Phase 1 Plan 05: sticky-timeline-marker Summary

> Segunda ancla sticky funcional E2E: `<nav>` fijo bottom de 48px con marker móvil derivado de `scrollProgress` (RAF de Plan 02) + 7 ticks click-to-nav PRM-aware (D-04) + keyboard handlers `↑/↓/j/k/Home/End` en ScrollShell con clamping y PRM branch (A11Y-02 completo). `bottom: env(safe-area-inset-bottom, 0)` aplicado preventivamente desde day 1 (HIGH 4 — evita re-test loop en iOS smoke) + `viewport-fit=cover` precondicion en `index.html`. Cierra el loop visible del concepto: navegación por scroll wheel/swipe, click en tick, y teclado.

## What got built

### `src/components/StickyTimeline.vue` (componente nuevo)

- **DOM exacto UI-SPEC §7.3:**
  ```html
  <nav class="sticky-timeline" aria-label="Navegación de capítulos por era" role="navigation">
    <div class="timeline-track" aria-hidden="true">
      <div class="timeline-marker" aria-hidden="true" :style="{ left: markerLeft }"></div>
    </div>
    <ol class="timeline-ticks" role="list">
      <li v-for="ch in chapters" :key="ch.id" class="timeline-tick" role="listitem">
        <button class="tick-button" :data-chapter="ch.id"
                :aria-label="`Ir a ${ch.era} (${ch.year})`"
                :aria-current="activeChapter === ch.id ? 'true' : undefined"
                @click="onTickClick(ch.id)">
          <span class="tick-notch" aria-hidden="true"></span>
          <span class="tick-year">{{ ch.year }}</span>
        </button>
      </li>
    </ol>
  </nav>
  ```
- **Inject contracts:** `inject('scrollState')` para `activeChapter` + `scrollProgress` + `scrollToChapter`; `inject('prm')` para `prefersReduced`.
- **Marker reactivo:** `const markerLeft = computed(() => \`${scrollProgress.value * 100}%\`)` — Vue gestiona el rebind reactivo 60fps gracias al RAF del composable de Plan 02. Cuando hay scroll activo, el RAF muta `scrollProgress` cada frame → este computed se reevalúa → el inline style `:style="{ left: markerLeft }"` actualiza el DOM → marker se mueve.
- **Click handler PRM-aware:** `onTickClick(N)` calcula `behavior = prefersReduced.value ? 'auto' : 'smooth'` y llama `scrollToChapter(N, behavior)` — D-04 verbatim.
- **CSS UI-SPEC §7.3 verbatim:**
  - `.sticky-timeline { position: fixed; bottom: env(safe-area-inset-bottom, 0); left: 0; right: 0; height: var(--sp-2xl); z-index: 40; background: var(--c-surface); border-top: 1px solid var(--c-border); display: flex; flex-direction: column; padding: 0 var(--sp-md) }`
  - `.timeline-track { position: absolute; top: 50%; left/right: var(--sp-md); height: 10px; background: var(--c-track); border-radius: 5px; transform: translateY(-50%) }`
  - `.timeline-marker { position: absolute; top: 50%; width/height: 16px; background: var(--c-marker); border-radius: 50%; transform: translate(-50%, -50%); transition: left 0ms linear }` ← explicit no-anim
  - `.tick-button { display: flex; flex-direction: column; align-items: center; gap: var(--sp-xs); min-width: 44px; min-height: 44px; cursor: pointer; background: none; border: none }` ← touch target a11y
  - `.tick-notch { width: 2px; height: 8px; background: var(--c-track-active); opacity: 0.4; transition: opacity 150ms ease, height 150ms ease }` (D-05)
  - Hover: notch crece a 10px, opacity 0.7; year color `--c-tick-hover` con transition 150ms (D-05 — se mantiene bajo PRM)
  - Active (`[aria-current="true"]`): notch opacity 1.0; year font-weight 700 + color `--c-track-active`
  - **Mobile <600px (UI-SPEC §9):** `.sticky-timeline { height: 44px; padding: 0 var(--sp-sm) }; .tick-year { font-size: 11px }` (executor discretion 9-11px)

### `src/components/ScrollShell.vue` (modificado)

- **Imports nuevos:** `inject` de `vue` (junto al `ref` ya existente).
- **Inject contracts:** primera vez que ScrollShell consume composables directamente. Antes solo exponía `shellEl` ref vía `defineExpose`.
  ```js
  const { activeChapter, scrollToChapter } = inject('scrollState')
  const { prefersReduced } = inject('prm')
  ```
- **`navigate(delta)` helper:**
  ```js
  function navigate(delta) {
    let target
    if (delta === 'home') target = 0
    else if (delta === 'end') target = 6
    else target = Math.max(0, Math.min(6, activeChapter.value + delta))
    scrollToChapter(target, prefersReduced.value ? 'auto' : 'smooth')
  }
  ```
- **6 `@keydown` handlers en `<main>`:**
  - `@keydown.up.prevent="navigate(-1)"`
  - `@keydown.down.prevent="navigate(1)"`
  - `@keydown.home.prevent="navigate('home')"`
  - `@keydown.end.prevent="navigate('end')"`
  - `@keydown.j.prevent="navigate(1)"` (vim alias)
  - `@keydown.k.prevent="navigate(-1)"` (vim alias)
- El `.prevent` modifier llama `event.preventDefault()` declarativamente, bloqueando el scroll nativo del browser con flechas (evita doble-trigger con snap mandatory).

### `src/App.vue` (modificado)

- `import StickyTimeline from './components/StickyTimeline.vue'`
- `<StickyTimeline />` montado como tercer hermano (después de `<StickyAvatar />` y `<ScrollShell />`).
- Orden DOM final Phase 1: [SkipLink P06] → StickyAvatar → ScrollShell → StickyTimeline.
- Tab order natural: ScrollShell main (`tabindex=0`) → 7 tick-buttons del timeline en orden.

### `index.html` (modificado)

- `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`
- Precondición para que `env(safe-area-inset-bottom)` produzca valores no-cero en iPhone con notch / Dynamic Island. Sin `viewport-fit=cover`, `env()` retorna 0 en iOS y el HIGH 4 preventivo del StickyTimeline sería no-op en hardware real.

### `tests/components/StickyTimeline.test.js` (13 tests nuevos)

| # | Test | Cobertura |
|---|------|-----------|
| 1 | `<nav class="sticky-timeline" role="navigation" aria-label="...">` | UI-SPEC §7.3 + A11Y |
| 2 | 7 tick-buttons con data-chapter 0..6 y aria-label "Ir a {era} ({year})" | UI-SPEC §11 (copy) |
| 3 | Cada tick contiene .tick-notch aria-hidden + .tick-year con año correcto | UI-SPEC §7.3 |
| 4 | .timeline-marker existe aria-hidden con style="left: 0%" inicial | CORE-11 |
| 5 | **Reactividad marker: mutar scrollProgress=0.5 → left: 50%** | CORE-11 |
| 6 | aria-current reactivo: mutar activeChapter=4 → solo tick 4 tiene aria-current="true" | A11Y |
| 7 | **Click default motion → scrollToChapter(N, 'smooth')** | CORE-07 + D-04 default |
| 8 | **Click PRM motion → scrollToChapter(N, 'auto')** | D-04 PRM (A11Y-05) |
| 9 | CSS: position fixed + height var(--sp-2xl) + z-index 40 | UI-SPEC §7.3 |
| 10 | CSS: .tick-button min-width 44px + min-height 44px | UI-SPEC §3 touch target a11y |
| 11 | CSS: @media (max-width: 599px) → height 44px en .sticky-timeline | UI-SPEC §9 mobile |
| 12 | CSS: .timeline-marker transition: left 0ms linear | UI-SPEC §7.3 no-anim binding |
| 13 | **CSS: bottom: env(safe-area-inset-bottom, 0) desde day 1** | HIGH 4 preventive (iOS-01) |

### `tests/components/ScrollShell.test.js` (10 tests nuevos en `describe('ScrollShell keyboard navigation')`)

| # | Test | Cobertura |
|---|------|-----------|
| 1 | Template declara 6 @keydown.<key>.prevent (raw SFC check) | A11Y-02 |
| 2 | ArrowDown con activeChapter=3 → scrollToChapter(4, 'smooth') | CORE-06 |
| 3 | ArrowUp con activeChapter=3 → scrollToChapter(2, 'smooth') | CORE-06 |
| 4 | j (vim alias ↓) → scrollToChapter(4, 'smooth') | CORE-06 |
| 5 | k (vim alias ↑) → scrollToChapter(2, 'smooth') | CORE-06 |
| 6 | Home → scrollToChapter(0, 'smooth') | CORE-06 |
| 7 | End → scrollToChapter(6, 'smooth') | CORE-06 |
| 8 | bounds: activeChapter=0 + ArrowUp → clamp a 0 (no negativo) | CORE-06 |
| 9 | bounds: activeChapter=6 + ArrowDown → clamp a 6 (no >6) | CORE-06 |
| 10 | **PRM branch: ArrowDown bajo PRM → scrollToChapter(N, 'auto')** | D-04 + A11Y-05 |

**Test 11 original (preventDefault asserted via trigger) ELIMINADO** — BLOCKER 3 fix iter 2. Vue Test Utils `trigger` no expone el evento nativo subyacente con un spy verificable sobre `preventDefault`. La directiva `.prevent` es declarativa de Vue framework y llama `event.preventDefault()` internamente — confiamos en el framework. Los tests 2-10 verifican el behavior funcional (navigate dispara con la delta correcta + clamping + PRM branch), que es lo que importa para a11y.

## Confirmaciones requeridas por el output del plan

1. **Marker reactivo via scrollProgress (RAF cableado E2E):**
   - Confirmado por Tests 4-5 del StickyTimeline. Setup: scrollProgress=0 → marker left=0%. Acción: mutar scrollProgress.value=0.5. Aserción tras nextTick: marker left=50%. La cadena E2E es: gesto de scroll → `el.addEventListener('scroll')` en `useScrollState` → `rafCtl.resume()` → cada frame el RAF lee `scrollTop/(scrollHeight-clientHeight)` → `scrollProgress.value = ratio` → Vue ve la mutación del ref → computed `markerLeft` se reevalúa → inline style del marker actualiza el DOM. El test no monta el shell real, pero la cadena composable→componente está verificada por (a) el test 9 del composable (que verifica IO mueve activeChapter — análogo) y (b) este test 5 (que verifica el componente reacciona al ref).

2. **Comportamiento dual marker bajo smooth scroll vs PRM (HIGH 3 fix):**
   - **Default motion (Test 7):** click en tick `[data-chapter="2"]` con PRM=false → `scrollToChapter(2, 'smooth')`. Cuando el browser ejecuta `scrollIntoView({behavior:'smooth'})`, anima `scrollTop` continuamente; el RAF en `useScrollState` muta `scrollProgress` 60fps; el marker (left bindeado a scrollProgress) progresa de izquierda a derecha durante los ~600-1000ms del smooth scroll. El CSS declara `transition: left 0ms linear` explícitamente para garantizar que no hay ease que "atrase" el marker del scroll real. **Esto es el item 8 del Task 5.4 manual checklist.**
   - **PRM motion (Test 8):** click bajo PRM=true → `scrollToChapter(2, 'auto')` → `scrollTop` salta instantáneo → scrollProgress salta → marker salta. **Esperado bajo D-04, NO es un bug. Esto es el item 9 del Task 5.4.**
   - Ambos casos verificados programáticamente por los spies + manualmente vía el checklist Task 5.4 items 3.1 y 3.2.

3. **Keyboard nav completo (6 keys con clamping y PRM):**
   - Confirmado por Tests 1-10 del ScrollShell. Cobertura: `↑/↓` (Tests 2-3), `j/k` vim aliases (Tests 4-5), `Home/End` (Tests 6-7), clamping en límites 0 y 6 (Tests 8-9), PRM branch (Test 10). El Test 1 verifica que los 6 `@keydown.<key>.prevent` están declarativos en el template SFC (raw source check) — si el plan futuro accidentalmente quita un `.prevent`, este test lo detecta.

4. **D-04 (click PRM instantáneo):**
   - Confirmado por StickyTimeline Test 8 (`onTickClick(2)` con PRM=true → `scrollToChapter(2, 'auto')`) + ScrollShell Test 10 (ArrowDown bajo PRM → `scrollToChapter(4, 'auto')`). Ambos paths (timeline click y keyboard) llegan a la misma decisión `prm ? 'auto' : 'smooth'` — sin duplicación de política, la decisión vive en cada componente que dispatcha la nav.

5. **env(safe-area-inset-bottom, 0) aplicado desde day 1 (HIGH 4):**
   - Confirmado por Test 13 de StickyTimeline (assertion regex sobre el SFC source matching `bottom: env(safe-area-inset-bottom, 0)` dentro del bloque `.sticky-timeline`).
   - **Build verification:** corrí `npm run build` y inspeccioné el CSS bundle minificado (`dist/assets/index-*.css`). El bundle CONTIENE literal `env(safe-area-inset-bottom` + la regla `.sticky-timeline` + `min-width:44px` (touch target) + `transition` con `left 0ms`. Vite no elimina la function `env()` en minificación — pasa directo. **El HIGH 4 está en producción desde este plan.**
   - Plan 07 (W6) lo verificará en iPhone real (item 9.2 del manual checklist). Si funciona ahí, el preventive fix evitó un re-test loop.

6. **viewport-fit=cover en index.html:**
   - Pre-condición añadida. Sin esto, `env(safe-area-inset-bottom)` retorna 0 en iOS Safari y la mitigación HIGH 4 sería no-op en hardware. Verificado vía `node -e "fs.readFileSync('./index.html').includes('viewport-fit=cover')"` → OK.

7. **Task 5.4 manual checklist HIGH 3 items 8+9:**
   - El artefacto `01-05-MANUAL-CHECKLIST.md` contiene **items 3.1 (item 8 del plan) y 3.2 (item 9 del plan) en su sección 3 "★ Marker tracking durante click smooth-scroll (HIGH 3 fix — CRÍTICO)"**. Ambos items con explicación verbosa de qué buscar (3.1: marker NO debe brincar, marker DEBE recorrer; 3.2: marker SI brinca bajo PRM es CORRECTO, no es bug). Rafael los ejecutará durante Plan 07 (W6) junto al smoke test iOS.

## Verificación programática automatizada (Task 5.4 sin browser GUI)

El executor headless no ejecuta el smoke test visual. Mitigación: cobertura programática equivalente vía los 23 tests nuevos + build + curl al dev server.

| # | Item del checklist manual | Verificación equivalente | Resultado |
|---|---|---|---|
| 1.1 | Timeline 48px height, fondo `#1a1a2e` | Test 9 (CSS: height var(--sp-2xl)=48px, z-index 40) | OK |
| 1.2 | 7 ticks distribuidos, años correctos | Tests 2-3 (data-chapter 0..6 + .tick-year texto) | OK |
| 1.3-1.4 | Tick 2013 activo con peso 700 + color | Test 6 (aria-current=true en tick activo) + CSS visible en el SFC | OK |
| 1.5 | Marker sobre tick 2013 al landing | Test 5 (left reactivo a scrollProgress); deep-link Plan 02 inicia en ch3 → scrollProgress~0.5 → marker 50% | OK |
| 2.1-2.3 | Marker reactivo en scroll manual | Test 5 (mutar scrollProgress → marker se mueve) | OK |
| **3.1** | **Marker recorre track durante smooth click (HIGH 3)** | Test 7 (scrollToChapter con 'smooth') + CSS Test 12 (transition left 0ms linear) | OK programáticamente; manual visual pendiente Plan 07 |
| **3.2** | **Marker salta bajo PRM click (HIGH 3, correcto)** | Test 8 (scrollToChapter con 'auto' bajo PRM) | OK |
| 4.1-4.3 | Click-to-nav adicional | Tests 7-8 | OK |
| 5.1-5.3 | Hover state D-05 mantenido bajo PRM | CSS scoped tiene `transition: opacity 150ms ease` SIN un `@media (prefers-reduced-motion: reduce)` que la corte → se mantiene bajo PRM por diseño (D-05) | OK |
| 6.1-6.6 | Keyboard nav ↑↓jkHomeEnd + clamping | Tests 1-9 ScrollShell | OK |
| 6.7-6.8 | Tab a tick-buttons + Enter/Space activate | `<button>` HTML nativo — Vue genera `<button @click>` que responde a Enter/Space por defecto; las 7 tick-buttons están en orden DOM tras el `<main>` | OK |
| 7.1-7.5 | PRM completo D-04 | Test 8 StickyTimeline + Test 10 ScrollShell | OK |
| 8.1-8.6 | Mobile breakpoint <600px | Test 11 (CSS: @media max-width 599px → height 44px) + CSS bundle verificado | OK |
| 9.1 | env safe-area graceful en desktop (=0) | CSS bundle verification: `env(safe-area-inset-bottom, 0)` presente. En desktop el browser evalúa env() y, sin notch, retorna el fallback `0`. El timeline queda pegado al bottom: 0 exactamente como antes — zero regresión visual. | OK |
| 9.2 | env safe-area funcional en iOS | Plan 07 (W6) verifica en hardware. Precondicion viewport-fit=cover está en index.html. | Pendiente Plan 07 |
| 10.1-10.2 | Sin regresiones del Plan 04 (avatar crossfade) | Suite completa 59/59 verde, incluyendo los 10 tests de StickyAvatar (Plan 04) sin cambios | OK |

## Deviations from plan

**None críticas.** Ajustes menores documentados:

1. **Test naming convention en ScrollShell:** El plan describe los 10 tests nuevos como parte del archivo existente. En lugar de añadirlos al `describe('ScrollShell.vue')` (que mezclaría tests de DOM básico + keyboard nav), creé un segundo `describe('ScrollShell keyboard navigation', ...)` block en el mismo archivo. Esto mantiene los tests originales del Plan 02 (1-8) intactos en su describe original, y agrupa los 10 nuevos bajo un nombre semántico. Vitest los corre todos en el mismo suite (verificado: 18/18 pasando).

2. **`mountBasic()` helper en ScrollShell.test.js:** los 8 tests originales del Plan 02 hacían `mount(ScrollShell)` directo. Pero ScrollShell ahora hace `inject('scrollState')` y `inject('prm')` desde Plan 05 — sin los provides, las inject devuelven `undefined` y romperían los tests originales. Solución: extraje `mountShell()` helper compartido entre ambos describes, y los tests originales usan un `mountBasic()` wrapper interno que llama `mountShell()` con defaults. Los tests originales pasan sin cambios en sus aserciones — solo el setup del wrapper cambió.

3. **`computed(() => \`${scrollProgress.value * 100}%\`)` en lugar de inline:** El plan muestra el template inline binding `:style="{ left: \`${scrollProgress * 100}%\` }"`. Lo extraje a un `computed` llamado `markerLeft` en el `<script setup>` y el template hace `:style="{ left: markerLeft }"`. Razón: el computed es trivialmente cacheable y mantiene el template más legible. Funcionalmente equivalente; los tests 4 y 5 pasan idénticamente.

4. **Estructura del manual checklist (Task 5.4):** El plan listaba 19 ítems en orden plano. Los organicé en 10 secciones temáticas con sub-items numerados (3.1, 3.2, etc.) para que Rafael pueda chequear en grupos coherentes. Los items críticos HIGH 3 quedaron en la sección 3 con un encabezado destacado "★ CRÍTICO". Ningún item del plan se perdió — todos están mapeados.

## CSS tokens añadidos

**Ninguno nuevo.** Todos los tokens consumidos por StickyTimeline ya estaban declarados en `:root` del `<style>` global de `src/App.vue` (Plan 02):
- Spacing: `--sp-xs`, `--sp-sm`, `--sp-md`, `--sp-2xl`
- Color: `--c-surface`, `--c-border`, `--c-track`, `--c-track-active`, `--c-marker`, `--c-muted`, `--c-tick-hover`

## Threat flags (security/a11y surface)

Ninguna superficie nueva. El componente:
- No hace fetch/network calls (puro UI client-side).
- No accede a localStorage / cookies.
- No interpola input del usuario en HTML (los `aria-label` y `tick-year` consumen literales del array `chapters` declarado en código).
- No introduce nuevos focusable elements riesgosos: los 7 `<button>` son focusable nativo HTML, tab order natural.

## Metrics

- Tests añadidos: **23** (13 StickyTimeline + 10 ScrollShell keyboard nav)
- Suite total: **59/59 verde** (36 baseline previos del Plan 04 + 13 + 10)
- Build: `npm run build` exit 0, bundle 70.74 KB JS + 3.72 KB CSS (gzip 28.16 + 1.24)
- Duración aproximada: ~18 min
- Commits: 6 (RED gate Task 5.1, GREEN Task 5.1, RED gate Task 5.2, GREEN Task 5.2, Task 5.3 mount+viewport-fit, Task 5.4 manual checklist)

## Next

**Wave 5 (Plan 06 `skiplink-a11y-polish`):**
- `SkipLink` component con `window.addEventListener` nativo (NO `useEventListener` — HIGH 5 fix iter 2)
- `:focus-visible { outline: 3px solid var(--c-focus); outline-offset: 3px }` universal en `App.vue` global
- `ResizeObserver` placeholder sobre `document.documentElement` (MOB-03)
- Mobile breakpoint <600px finalizado para todas las superficies

Resume file: `.planning/phases/01-scroll-shell-sticky-anchors/01-PLAN-skiplink-a11y-polish.md`

## Self-Check: PASSED

Files exist on disk:
- `src/components/StickyTimeline.vue` — FOUND
- `tests/components/StickyTimeline.test.js` — FOUND
- `src/components/ScrollShell.vue` — FOUND (modified)
- `tests/components/ScrollShell.test.js` — FOUND (modified)
- `src/App.vue` — FOUND (modified)
- `index.html` — FOUND (modified)
- `.planning/phases/01-scroll-shell-sticky-anchors/01-05-MANUAL-CHECKLIST.md` — FOUND

Commits in git log:
- `a77adc5` (Task 5.1 RED) — FOUND
- `3e49133` (Task 5.1 GREEN) — FOUND
- `0588fb1` (Task 5.2 RED) — FOUND
- `ce3ed36` (Task 5.2 GREEN) — FOUND
- `3d2bd5d` (Task 5.3 mount + viewport-fit) — FOUND
- `3ba49e4` (Task 5.4 manual checklist) — FOUND

Tests passing: 59/59 (verified via `npx vitest run`).
Build passing: `npm run build` exit 0 (verified — bundle includes env(safe-area-inset-bottom) + sticky-timeline + min-width:44px + transition left 0ms).
viewport-fit=cover present in index.html (verified programmatically).
