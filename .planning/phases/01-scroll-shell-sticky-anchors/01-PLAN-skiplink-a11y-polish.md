---
phase: 1
plan: 6
slug: skiplink-a11y-polish
wave: 5
type: execute
mode: mvp
autonomous: true
gap_closure: false
requirements_covered: [A11Y-01, MOB-01, MOB-03]
depends_on: [1, 2, 3, 4, 5]
files_modified:
  - src/components/SkipLink.vue
  - src/App.vue
  - tests/components/SkipLink.test.js
must_haves:
  truths:
    - "El SkipLink es visible desde la carga inicial, centrado horizontalmente en top:8px"
    - "Tab desde la URL bar enfoca el SkipLink como primer focusable del DOM"
    - "Enter sobre el SkipLink mueve el foco programáticamente al <main id='main-content' tabindex='0'>"
    - "Tras hacer Enter, presionar ↓ navega entre chapters inmediatamente (sin recapturar foco)"
    - "El SkipLink se oculta (opacity:0; pointer-events:none) tras el primer scroll del usuario o tras el primer blur del propio link"
    - "Existe un :focus-visible { outline: 3px solid var(--c-focus); outline-offset: 3px } global aplicado a tick-button, skip-link y main-content"
    - "El ResizeObserver sobre document.documentElement está montado (placeholder defensive — Phase 5 lo usa de verdad)"
    - "En mobile portrait <600px todos los sticky elements se reacomodan SIN bloquear el era title (verificado en DevTools con 375x667)"
    - "En mobile portrait <600px el SkipLink al-load muestra el texto completo sin ellipsis (verificado manual; si trunca, reducir copy a 'Saltar al contenido' / 'Skip to content' antes de cerrar Plan 06)"
  artifacts:
    - path: src/components/SkipLink.vue
      provides: "Skip-to-content link visible at-load + hide-on-scroll/blur (vía onMounted + window.addEventListener nativo, NO useEventListener para evitar flake jsdom) + focus management al <main>"
      contains: "href=\"#main-content\""
    - path: src/App.vue
      provides: "Layout actualizado: <SkipLink /> es el primer hijo de #app (DOM order = tab order); :focus-visible global declarado; ResizeObserver placeholder cableado"
      contains: "SkipLink"
    - path: tests/components/SkipLink.test.js
      provides: "Tests del DOM exacto, hide-on-scroll (invocando handler directamente vía exposed ref), focus management, position fixed top center"
  key_links:
    - from: src/components/SkipLink.vue
      to: src/components/ScrollShell.vue
      via: "href='#main-content' apunta al <main id='main-content'>"
      pattern: "#main-content"
    - from: src/App.vue
      to: "@vueuse/core useResizeObserver"
      via: "import + useResizeObserver(document.documentElement, ...)"
      pattern: "useResizeObserver"
---

<objective>
Cerrar el bucle de accesibilidad de Phase 1: añadir el SkipLink como primer focusable del DOM, aplicar el focus ring universal `:focus-visible`, cablear el `ResizeObserver` defensive sobre `document.documentElement` (MOB-03), y verificar el mobile breakpoint `<600px` E2E.

**Purpose:** Cubre A11Y-01 (skip link), MOB-01 (portrait + landscape funcionales — el verify final), MOB-03 (ResizeObserver no `orientationchange`). El focus ring universal indirectamente refuerza A11Y-05 (PRM en transiciones — el focus-visible es interaction-derived, se mantiene bajo PRM por D-05). Phase 1 queda lista para el smoke test iOS del Plan 07.

**Output:**
- `src/components/SkipLink.vue` con DOM/CSS UI-SPEC §7.4. Hide-on-scroll implementado con `onMounted` + `window.addEventListener('scroll', handler, { once: true, passive: true })` directo (NO `useEventListener` — más determinístico en jsdom, HIGH 5 fix).
- `src/App.vue` actualizado:
  - `<SkipLink />` montado como primer hijo del template (DOM order = tab order).
  - `:focus-visible` global en `<style>` (no scoped).
  - `useResizeObserver(document.documentElement, ...)` cableado (placeholder reactive — Phase 5 lo usa de verdad).
- Tests cubriendo SkipLink (≥8 tests).

**Lo que ESTE plan NO hace:**
- NO ejecuta el smoke test iOS (Plan 07).
- NO añade themes (Phase 2).
- NO modifica el avatar o la timeline (plans 04 y 05 ya completos).
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
@src/App.vue
@src/components/ScrollShell.vue
@src/components/StickyAvatar.vue
@src/components/StickyTimeline.vue

<interfaces>
<!-- DOM contract (UI-SPEC §7.4): -->
```html
<a
  href="#main-content"
  class="skip-link"
  id="skip-link"
  :class="{ hidden: isHidden }"
  @blur="onBlur"
>
  Saltar al contenido / Skip to content
</a>
```

<!-- Hide-on-scroll/blur logic (UI-SPEC §7.4) — usando addEventListener nativo (HIGH 5 fix): -->
```javascript
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isHidden = ref(false)
let scrollHandler = null

function onBlur() {
  isHidden.value = true
}

function handleScrollOnce() {
  isHidden.value = true
  // { once: true } se autodescarga; no requiere removeEventListener aquí.
}

onMounted(() => {
  scrollHandler = handleScrollOnce
  window.addEventListener('scroll', scrollHandler, { once: true, passive: true })
})

onBeforeUnmount(() => {
  // Defensive: si el componente unmount antes del primer scroll, remove el listener.
  // El option { once: true } no garantiza cleanup en unmount, solo después del evento.
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
  }
})

// Exponer el handler para test invocation directo (HIGH 5 fix: jsdom dispatch no es confiable):
defineExpose({ handleScrollOnce })
```

<!-- CSS (UI-SPEC §7.4): -->
```css
.skip-link {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  background: var(--c-surface);
  color: var(--c-fg);
  font-size: 14px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: var(--sp-sm) var(--sp-md);
  border: 1px solid var(--c-border);
  border-radius: 4px;
  text-decoration: none;
  white-space: nowrap;
  opacity: 1;
  pointer-events: auto;
  transition: opacity 200ms ease;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100vw - 32px);
}
.skip-link.hidden {
  opacity: 0;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
}
```

<!-- Focus ring universal (UI-SPEC §10) — declarado en App.vue <style> global (NO scoped): -->
```css
:focus-visible {
  outline: 3px solid var(--c-focus);
  outline-offset: 3px;
}
```

<!-- ResizeObserver defensive (UI-SPEC §9, RESEARCH §Área 7) — en App.vue script setup: -->
```javascript
import { useResizeObserver } from '@vueuse/core'
import { ref } from 'vue'

const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)

useResizeObserver(document.documentElement, (entries) => {
  const entry = entries[0]
  viewportWidth.value = entry.contentRect.width
  viewportHeight.value = entry.contentRect.height
})
```

Nota: Estos refs `viewportWidth`/`viewportHeight` NO se consumen en Phase 1. Son placeholder defensive — Phase 5 (Phaser scene) los necesita para `Math.floor(vw/480), Math.floor(vh/270)`. Para Phase 1, su único uso es satisfacer MOB-03 cableado.
</interfaces>

<key-decisions>
- SkipLink debe ser el **primer hijo** del template root (UI-SPEC §10 — tab order: skip → main → ticks). En App.vue:
  ```html
  <template>
    <SkipLink />
    <StickyAvatar />
    <ScrollShell :ref="..." />
    <StickyTimeline />
  </template>
  ```
- El target `#main-content` ya existe (ScrollShell.vue declara `<main id="main-content" tabindex="0">` desde Plan 02). Cuando el browser navega a `#main-content` con un href, transfiere foco automáticamente al elemento si tiene `tabindex` (RESEARCH §Pitfall 5 confirma).
- **`useEventListener` reemplazado por `onMounted` + `window.addEventListener` nativo (HIGH 5 fix):** `useEventListener` de @vueuse/core + `dispatchEvent(new Event('scroll'))` es flake-prone en jsdom — el closure de `stop()` y el timing de re-attach pueden romper. Para SkipLink (un caso simple de "primer scroll oculta"), `window.addEventListener('scroll', handler, { once: true, passive: true })` directo en `onMounted` es más determinístico y reduce surface area de testing flake. `{ once: true }` garantiza el listener se autodescarga después del primer scroll. El `onBeforeUnmount` añade un removeEventListener defensive por si el componente unmount antes del primer scroll.
- `onBlur` listener: cuando el usuario tabea más allá del skip link (foco sale), `isHidden = true`. Esto coexiste con el scroll-based hide; ambos paths llevan al mismo estado.
- `:focus-visible` global se declara en `App.vue <style>` (NO scoped) porque debe aplicar a CUALQUIER focusable: `.tick-button`, `.skip-link`, `#main-content`, y cualquier futuro elemento. Si fuera scoped, no aplicaría a los componentes hijos.
- ResizeObserver: vueuse maneja cleanup. NO debounce — para Phase 1 los handlers son no-ops, no hay costo de re-render por resize que justifique debouncing. Phase 5 lo añadirá si lo necesita.
- NO añadir test para ResizeObserver behavior — el placeholder no tiene comportamiento observable. Confiamos en vueuse + el mock global de tests/setup.js. Una verificación trivial es leer App.vue como string y verificar que importa `useResizeObserver`.
- **Test 3 invocation strategy (HIGH 5 fix):** El test que verifica hide-on-scroll NO debe depender de `window.dispatchEvent(new Event('scroll'))` para disparar el listener — eso es jsdom-flake-prone. **Solución:** exponer el handler via `defineExpose({ handleScrollOnce })` y en el test invocarlo directamente: `wrapper.vm.handleScrollOnce()` → `await nextTick()` → assert clase `hidden`. Esto testea la lógica del componente sin depender de event dispatch jsdom. Plus, queremos verificar que el real listener está enganchado al `window` scroll event — eso lo verificamos via `vi.spyOn(window, 'addEventListener')` en otro test (verificación de configuración, no de comportamiento).
</key-decisions>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 6.1: Crear SkipLink.vue con DOM/CSS UI-SPEC §7.4 + hide-on-scroll/blur (addEventListener nativo, NO useEventListener)</name>
  <files>src/components/SkipLink.vue, tests/components/SkipLink.test.js</files>
  <behavior>
    - Test 1: Render: el `<a>` tiene `href="#main-content"`, `class="skip-link"`, `id="skip-link"`, y texto bilingüe "Saltar al contenido / Skip to content".
    - Test 2: Render inicial: NO tiene clase `hidden` (visible at load).
    - **Test 3 (HIGH 5 fix): invocando el handler directamente vía `defineExpose`.** Después del mount, hacer `wrapper.vm.handleScrollOnce()` (handler expuesto) → `await nextTick()` → assert clase `hidden` aplicada. NO usar `window.dispatchEvent` — flake en jsdom.
    - Test 4: Tras simular blur del link (`wrapper.find('a').trigger('blur')`), la clase `hidden` se aplica.
    - Test 5: Listener registration check: en `beforeEach`, hacer `vi.spyOn(window, 'addEventListener')`; tras el mount, assert que `window.addEventListener` fue llamado con `'scroll'`, una función, y options object con `once: true` y `passive: true`. Esto verifica el wiring correcto al window event sin depender de dispatch jsdom.
    - Test 6: CSS string check: `position: fixed; top: 8px; left: 50%; transform: translateX(-50%); z-index: 50`.
    - Test 7: CSS string check: `.skip-link.hidden` declara `opacity: 0; pointer-events: none`.
    - Test 8: CSS string check: media query `(prefers-reduced-motion: reduce)` con `transition: none`.
  </behavior>
  <action>
    Escribir `tests/components/SkipLink.test.js` con los 8 tests.

    Para Test 3 (HIGH 5 fix), el componente DEBE exponer `handleScrollOnce` via `defineExpose`. El test entonces:
    ```javascript
    it('hides after first scroll (handler invoked directly)', async () => {
      const wrapper = mount(SkipLink)
      expect(wrapper.find('a').classes()).not.toContain('hidden')
      // Invocar el handler expuesto directamente, evitando dispatchEvent flake en jsdom.
      wrapper.vm.handleScrollOnce()
      await nextTick()
      expect(wrapper.find('a').classes()).toContain('hidden')
    })
    ```

    Para Test 5 (verificación de wiring):
    ```javascript
    it('registers window scroll listener with once:true, passive:true', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      mount(SkipLink)
      const scrollCall = addSpy.mock.calls.find(c => c[0] === 'scroll')
      expect(scrollCall).toBeDefined()
      expect(scrollCall[2]).toMatchObject({ once: true, passive: true })
      addSpy.mockRestore()
    })
    ```

    Después implementar `src/components/SkipLink.vue`:

    `<script setup>`:
    ```javascript
    import { ref, onMounted, onBeforeUnmount } from 'vue'

    const isHidden = ref(false)
    let scrollHandler = null

    function onBlur() {
      isHidden.value = true
    }

    function handleScrollOnce() {
      isHidden.value = true
    }

    onMounted(() => {
      scrollHandler = handleScrollOnce
      window.addEventListener('scroll', scrollHandler, { once: true, passive: true })
    })

    onBeforeUnmount(() => {
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler)
        scrollHandler = null
      }
    })

    // Exponer para test invocation directo (evita flake de dispatchEvent en jsdom)
    defineExpose({ handleScrollOnce })
    ```

    `<template>`:
    ```html
    <a
      href="#main-content"
      id="skip-link"
      class="skip-link"
      :class="{ hidden: isHidden }"
      @blur="onBlur"
    >
      Saltar al contenido / Skip to content
    </a>
    ```

    `<style scoped>`: copiar el bloque CSS exacto del `<interfaces>` (UI-SPEC §7.4).

    **NO importar `useEventListener` de @vueuse/core** — eliminado por HIGH 5. Usar `window.addEventListener` nativo dentro de `onMounted`.

    Iterar hasta que los 8 tests pasen.
  </action>
  <verify>
    <automated>`npx vitest run tests/components/SkipLink.test.js`. Exit 0, 8 tests passed.</automated>
  </verify>
  <done>
    `src/components/SkipLink.vue` existe con DOM UI-SPEC §7.4, hide-on-scroll vía `window.addEventListener` nativo (NO useEventListener — HIGH 5 fix), hide-on-blur, position fixed top center, transition 200ms (none bajo PRM). Handler expuesto vía `defineExpose` para testing determinístico. Los 8 tests pasan.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 6.2: Montar SkipLink + cablear ResizeObserver placeholder + focus ring universal en App.vue</name>
  <files>src/App.vue</files>
  <action>
    Editar `src/App.vue`. Cambios:

    1. Imports: añadir
       ```javascript
       import SkipLink from './components/SkipLink.vue'
       import { useResizeObserver } from '@vueuse/core'
       ```

    2. Script setup: añadir después de los existing composables:
       ```javascript
       const viewportWidth = ref(window.innerWidth)
       const viewportHeight = ref(window.innerHeight)

       useResizeObserver(document.documentElement, (entries) => {
         const entry = entries[0]
         viewportWidth.value = entry.contentRect.width
         viewportHeight.value = entry.contentRect.height
       })
       ```
       NO export ni provide — son refs internos defensive. Phase 5 los promoverá.

    3. Template: añadir `<SkipLink />` como **primer hijo** del root template (DOM order = tab order):
       ```html
       <template>
         <SkipLink />
         <StickyAvatar />
         <ScrollShell :ref="el => { shellRef.value = el?.shellEl ?? null }" />
         <StickyTimeline />
       </template>
       ```

    4. Style global (no scoped): añadir al `<style>` existente:
       ```css
       /* Focus ring universal — UI-SPEC §10 */
       :focus-visible {
         outline: 3px solid var(--c-focus);
         outline-offset: 3px;
       }
       ```

    NO modificar las otras declaraciones del style (CSS Custom Properties, PRM CSS branch, etc.). Mantener todo intacto.

    Ejecutar la suite Vitest para verificar que no hay regresiones.
  </action>
  <verify>
    <automated>`node -e "const fs = require('fs'); const app = fs.readFileSync('./src/App.vue', 'utf8'); if (!app.includes('SkipLink')) process.exit(1); if (!app.includes('useResizeObserver')) process.exit(1); if (!app.includes(':focus-visible')) process.exit(1); console.log('OK App.vue polish wired')"`. Plus `npx vitest run` exit 0.</automated>
  </verify>
  <done>
    `src/App.vue` monta `<SkipLink />` como primer hijo del template, cablea ResizeObserver placeholder, declara `:focus-visible` global. Suite Vitest passing.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 6.3: Smoke test manual del SkipLink + focus ring + mobile breakpoint</name>
  <files>(verificación, ninguno modificado)</files>
  <action>
    Ejecutar `npm run dev`. Abrir `http://localhost:5173/`.

    SkipLink at-load:
    1. Inmediatamente visible un botón centrado horizontalmente en top:8px con texto "Saltar al contenido / Skip to content", fondo `#1a1a2e`, texto `#e7e7f0`.
    2. NO está sobre el avatar (avatar es top-left con margen 16px; skip-link es top:8px centered → no chocan).

    SkipLink tab order:
    3. Click en la URL bar (para reset el foco). Después presionar `Tab` una vez → el foco visualmente cae en el SkipLink con un outline cyan brillante de 3px y offset 3px (UI-SPEC §10 focus ring).
    4. Presionar `Enter` → el foco salta al `<main.scroll-shell>` (verificable: el SkipLink ya no tiene outline, y al presionar ↓ inmediatamente el snap a ch4 dispara — confirmando que el shell tiene foco).
    5. Recargar la página. Presionar `Tab` (skip link recibe foco) → presionar `Tab` otra vez → el foco sale del skip link → el skip link se oculta (opacity 0).

    SkipLink hide-on-scroll:
    6. Recargar. Skip link visible. Hacer scroll (mouse wheel) un poco → el skip link se oculta con un fade de 200ms.

    Focus ring universal:
    7. Tab desde URL bar varias veces → outline cyan en SkipLink → en main → en los 7 tick-button de la timeline (uno por Tab). Todos tienen el mismo outline 3px cyan offset 3px.
    8. Mouse click en un tick → tick recibe foco → outline visible solo en keyboard nav (`:focus-visible`, no `:focus`).

    Mobile responsive:
    9. DevTools viewport 375×667 (portrait < 600px). Verify:
       - Avatar shrink a 56×68px en top:8px left:8px.
       - Timeline shrink a 44px height, padding 8px.
       - SkipLink se mantiene legible (centered, max-width: calc(100vw - 32px) — con texto bilingüe puede recortarse con ellipsis si la pantalla es muy pequeña).
       - Era title centrado, no ocluido por avatar ni timeline (el padding del `.chapter-placeholder` cuida esto).
    10. **MEDIUM 3 check: En viewport 375×667, el SkipLink al-load muestra el texto completo sin ellipsis. Si trunca, reducir copy a sólo 'Saltar al contenido' / 'Skip to content' (decidir antes de cerrar Plan 06).** Inspeccionar el SkipLink en DevTools con viewport 375×667 — leer el `clientWidth` vs `scrollWidth` del elemento; si `scrollWidth > clientWidth`, hay overflow → aplicar mitigación. Mitigación opciones (decidir antes de cerrar el plan):
        - (a) Acortar el copy del texto bilingüe — eliminar el más largo, dejar "Saltar al contenido / Skip to content" tal cual está si cabe; si no, dejar solo uno (depende del idioma del browser, pero para Phase 1 sin i18n usar "Saltar al contenido / Skip to content" literal — si trunca, ir a opción (b)).
        - (b) Reducir `font-size: 14px` a `font-size: 12px` en el media query `(max-width: 599px)`. Añadir al scoped CSS del SkipLink:
          ```css
          @media (max-width: 599px) {
            .skip-link {
              font-size: 12px;
              padding: var(--sp-xs) var(--sp-sm);
            }
          }
          ```
        Documentar la decisión en el SUMMARY.
    11. Rotar a landscape (en DevTools: 667×375). Verify:
        - Scroll vertical sigue snappeando.
        - Sticky elements visibles.
        - Era title visible.
    12. Restaurar viewport desktop (1280×800 o similar).

    PRM final check:
    13. Emular PRM en DevTools. Recargar. Verify combined:
        - Scroll snap = jump instantáneo (D-01).
        - Avatar swap = sin fade (D-02), pero siempre visible (HIGH 2 recovery).
        - Click en tick = jump instantáneo (D-04).
        - Hover sobre tick = sigue teniendo color transition 150ms (D-05).
        - Skip link transition desaparece (transition: none aplicado).

    Documentar cualquier desviación. NO debería haber. Si el SkipLink overflow en mobile portrait, aplicar la mitigación elegida (opción a o b) — UI discretion permitida.
  </action>
  <verify>
    <automated>`npx vitest run`. Suite entera passing.</automated>
  </verify>
  <done>
    Los 13 ítems manuales pasan. Tab order correcto. Focus ring universal aplicado. Skip link hide-on-scroll/blur funcional. SkipLink en mobile portrait muestra texto completo sin ellipsis (o mitigación aplicada y documentada). Mobile breakpoint completo. PRM coherente entre todos los caminos. Phase 1 funcionalmente completa salvo iOS smoke test.
  </done>
</task>

</tasks>

<verification>
**Automated:**
```powershell
npx vitest run
```
Exit 0, todos los tests passing.

**Manual (checklist Task 6.3):**
- [ ] SkipLink visible at-load
- [ ] Tab order: SkipLink → main → 7 ticks
- [ ] Enter en SkipLink → foco en main
- [ ] SkipLink se oculta tras scroll
- [ ] Focus ring cyan visible en todos los focusable
- [ ] Mobile portrait/landscape funcional
- [ ] **SkipLink en 375×667 portrait: texto completo sin ellipsis (o mitigación aplicada)**
- [ ] PRM coherente E2E
</verification>

<success_criteria>
- [ ] `src/components/SkipLink.vue` existe con DOM UI-SPEC §7.4.
- [ ] SkipLink es el primer hijo del template root (tab order correcto).
- [ ] Hide-on-scroll usa `window.addEventListener` nativo (HIGH 5 fix), NO `useEventListener`.
- [ ] Handler `handleScrollOnce` expuesto via `defineExpose` para testing determinístico.
- [ ] Focus ring universal `:focus-visible` aplicado global.
- [ ] ResizeObserver placeholder cableado en App.vue.
- [ ] Mobile breakpoint < 600px verificado E2E.
- [ ] SkipLink legible en viewport 375×667 sin ellipsis (o mitigación documentada).
- [ ] A11Y-01, MOB-01, MOB-03 cubiertos.
- [ ] 8 tests SkipLink passing.
- [ ] Suite completa sin regresiones.
</success_criteria>

<output>
Tras completar, crear `.planning/phases/01-scroll-shell-sticky-anchors/01-06-SUMMARY.md` documentando:
- Confirmación de tab order correcto: SkipLink → main → tick-button × 7.
- Confirmación de focus ring universal aplicado.
- Resultado de los 13 ítems manuales (incluyendo el check de overflow mobile del SkipLink).
- Decisión y mitigación aplicada (si la hubo) para el overflow mobile del SkipLink.
- Confirmación de que el ResizeObserver placeholder está cableado para que Phase 5 lo extienda.
- Nota: la UI-SPEC §12 visible verification checklist (18 items) ahora debería pasar al 100% en desktop y mobile emulator. El smoke test iOS del Plan 07 es el último gate.
</output>
