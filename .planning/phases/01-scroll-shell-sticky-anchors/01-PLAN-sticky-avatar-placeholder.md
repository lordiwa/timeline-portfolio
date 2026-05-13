---
phase: 1
plan: 4
slug: sticky-avatar-placeholder
wave: 3
type: execute
mode: mvp
autonomous: true
gap_closure: false
requirements_covered: [CORE-10, CORE-03, CORE-09, A11Y-05]
depends_on: [1, 2, 3]
files_modified:
  - src/components/StickyAvatar.vue
  - src/App.vue
  - tests/components/StickyAvatar.test.js
must_haves:
  truths:
    - "El StickyAvatar es visible top-left durante todo el scroll en todos los chapters"
    - "El texto 'ch{N}' del placeholder coincide con el activeChapter reactivamente al scrollear"
    - "El aria-label del <aside> se actualiza reactivamente con el activeChapter ('Avatar de Rafael — chapter {N} activo')"
    - "Default motion: el swap del avatar es un crossfade JS de 200ms TOTAL (fade-out 100ms + swap + fade-in 100ms) — alineado con UI-SPEC §8"
    - "Bajo PRM (D-02): el swap es instantáneo, sin transición de opacidad"
    - "Si PRM toggle se activa mid-flight (durante el fade), un watcher dedicado restaura opacity a 1 — el avatar nunca queda invisible"
    - "El IO en useScrollState dispara actualizaciones de activeChapter — verifiable porque scrolleando entre chapters el avatar label cambia"
  artifacts:
    - path: src/components/StickyAvatar.vue
      provides: "Componente sticky top-left con placeholder rectángulo gris + texto ch{N} reactivo + crossfade JS 100+100=200ms + PRM-recovery watcher"
      contains: "position: fixed"
    - path: src/App.vue
      provides: "Layout actualizado para montar <StickyAvatar /> como hermano directo del ScrollShell"
      contains: "StickyAvatar"
    - path: tests/components/StickyAvatar.test.js
      provides: "Tests de DOM structure, reactividad de aria-label/text, branch PRM del crossfade, PRM-toggle-mid-flight recovery"
  key_links:
    - from: src/components/StickyAvatar.vue
      to: src/composables/useScrollState.js
      via: "inject('scrollState') + watch(activeChapter)"
      pattern: "inject\\('scrollState'\\)"
    - from: src/components/StickyAvatar.vue
      to: src/composables/usePRM.js
      via: "inject('prm') + watch branch + watch(prefersReduced) recovery"
      pattern: "inject\\('prm'\\)"
---

<objective>
Construir el primer ancla sticky funcional: un `<aside class="sticky-avatar">` fijo en la esquina superior izquierda que muestra un rectángulo gris con el texto `ch{N}` reactivo al `activeChapter`. Implementar el crossfade JS de **200ms TOTAL** (fade-out 100ms + swap + fade-in 100ms, matching UI-SPEC §8 verbatim) en el default motion path y el short-circuit instantáneo bajo PRM (D-02). Añadir un watcher dedicado sobre `prefersReduced` que restaure `opacity = 1` si PRM se activa mid-flight (durante el fade), garantizando que el avatar nunca queda invisible.

**Purpose:** Cubre CORE-10 (sticky avatar slot) y completa el cableado funcional de CORE-03 (IO en useScrollState — el IO ya está en el composable desde Plan 02, pero hasta ahora `activeChapter` no tenía consumer visible). El crossfade aplica D-02 (default 200ms TOTAL, PRM instantáneo) y A11Y-05.

**Phase 3 forward-compat:** El componente está diseñado para que Phase 3 solo reemplace el `<div class="avatar-placeholder">` por un `<img src="/assets/ch{N}-bust.png">`. El `<aside>` y el `<span class="avatar-chapter-label">` permanecen. UI-SPEC §7.2 documenta este patrón.

**Output:**
- `src/components/StickyAvatar.vue` con DOM exacto del UI-SPEC §7.2 y crossfade de 200ms TOTAL (no 400ms).
- `App.vue` actualizado para montar el `<StickyAvatar />` como hermano directo del `<ScrollShell />`.
- Tests cubriendo DOM structure, reactividad del `aria-label` y `ch{N}`, branch PRM del crossfade, y recovery del avatar cuando PRM toggle mid-flight.

**Lo que ESTE plan NO hace:**
- NO incluye la imagen real del bust (Phase 3 / ART-01).
- NO añade themes era-auténticos al avatar (Phase 2).
- NO modifica la timeline (Plan 05).
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
@src/composables/useScrollState.js
@src/composables/usePRM.js

<interfaces>
<!-- DOM contract (UI-SPEC §7.2): -->
```html
<aside
  class="sticky-avatar"
  :aria-label="`Avatar de Rafael — chapter ${activeChapter} activo`"
  aria-live="polite"
>
  <div class="avatar-placeholder" aria-hidden="true" :style="{ opacity }">
    <span class="avatar-chapter-label">ch{{ activeChapter }}</span>
  </div>
</aside>
```

<!-- Inject contracts (proveídos en App.vue por plans 02 y 03): -->
```javascript
const { activeChapter } = inject('scrollState')  // ref<number>, readonly
const { prefersReduced } = inject('prm')         // computed<boolean>
```

<!-- Crossfade JS — UI-SPEC §8 dicta "200ms total" verbatim. -->
<!-- Decisión: opción (a) del checker — fade-out 100ms + swap + fade-in 100ms = 200ms total perceptible. -->
<!-- transition: opacity 100ms ease (NO 200ms) — porque cada mitad del crossfade es 100ms. -->
```javascript
import { ref, inject, watch, nextTick } from 'vue'

const { activeChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

const opacity = ref(1)
let pendingSwapTimer = null

watch(activeChapter, async () => {
  if (prefersReduced.value) {
    // D-02 — instantáneo bajo PRM. Cancelar cualquier fade in-flight para no dejar opacity=0.
    if (pendingSwapTimer) { clearTimeout(pendingSwapTimer); pendingSwapTimer = null }
    opacity.value = 1
    return
  }
  // Default motion: fade-out 100ms → swap (texto se actualiza por reactividad de Vue) → fade-in 100ms
  // Con `transition: opacity 100ms ease` declarado en CSS, opacity 1→0 toma 100ms.
  opacity.value = 0
  await nextTick()
  pendingSwapTimer = setTimeout(() => {
    opacity.value = 1
    pendingSwapTimer = null
  }, 100)
})

// HIGH 2 fix: si PRM se activa mid-flight (mientras opacity está bajando o esperando fade-in),
// el watch de activeChapter no se va a re-disparar, así que opacity puede quedar atascada en 0.
// Watcher dedicado: cuando prefersReduced pasa false→true, cancelar pending timer y restaurar opacity.
watch(prefersReduced, (isPRM) => {
  if (isPRM) {
    if (pendingSwapTimer) { clearTimeout(pendingSwapTimer); pendingSwapTimer = null }
    opacity.value = 1
  }
})
```

<!-- CSS contract (UI-SPEC §7.2 — `transition: opacity 100ms ease` NO 200ms, para que cada mitad del crossfade tome 100ms): -->
```css
.sticky-avatar {
  position: fixed;
  top: var(--sp-md);        /* 16px */
  left: var(--sp-md);
  z-index: 40;
  width: 80px;
  height: 96px;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 100ms ease;  /* cada mitad del crossfade = 100ms → total 200ms (UI-SPEC §8) */
}
.avatar-chapter-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  font-weight: 400;
  color: var(--c-muted);
}
@media (max-width: 599px) {
  .sticky-avatar {
    width: 56px;
    height: 68px;
    top: var(--sp-sm);
    left: var(--sp-sm);
  }
  .avatar-chapter-label {
    font-size: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .avatar-placeholder {
    transition: none;
  }
}
```
</interfaces>

<key-decisions>
- DOM exacto de UI-SPEC §7.2 — no improvisar. `<aside>` con `aria-live="polite"`, `<div>` con `aria-hidden="true"` (UI-SPEC §7.2 lo justifica: evita doble anuncio del texto `ch{N}` ya que el contexto lo da el aria-label del aside).
- `position: fixed` no `sticky` (RESEARCH §Área 6 razona el porqué — el overflow container es el ScrollShell, no el viewport; sticky no aplica). El aside debe ser **hermano** directo del scroll-shell dentro de `#app`, NO hijo del scroll-shell.
- El IO en `useScrollState` (Plan 02) ya actualiza `activeChapter` cuando un section cubre ≥60% del viewport del shell. Este plan solo consume ese ref via `inject('scrollState')`. Si el IO no se cableó correctamente en Plan 02 (no se observan los sections), este plan revelará el bug porque el avatar no actualizará. Solución a esa eventualidad: revisar el `watch(shellRef)` del composable y los `querySelectorAll('[data-chapter]')`.
- **Crossfade timing (HIGH 1 fix):** UI-SPEC §8 dice "200ms total". El timing chosen es **opción (a)** del checker: `transition: opacity 100ms ease` en CSS + `setTimeout(100)` en JS = fade-out 100ms + swap + fade-in 100ms = **200ms total perceptible**, alineado con UI-SPEC §8 verbatim. NO usar `transition: opacity 200ms ease` con setTimeout 200ms — eso produce 400ms perceptible (fade-out 200ms + invisible swap + fade-in 200ms), violando UI-SPEC §8.
- **PRM-toggle-mid-flight recovery (HIGH 2 fix):** El watch principal de `activeChapter` solo se dispara cuando cambia el chapter. Si el usuario activa PRM mientras opacity está en 0 (o esperando fade-in), ese watch no se re-ejecuta y opacity queda atascada → avatar invisible. **Solución:** un segundo watch dedicado sobre `prefersReduced`: cuando pasa false→true, cancela cualquier `pendingSwapTimer` activo y fuerza `opacity = 1` inmediato. Esto garantiza que el avatar siempre es visible bajo PRM, sin importar cuándo se activó.
- PRM short-circuit en el watch de activeChapter: bajo `prefersReduced.value === true`, NO aplicar el setTimeout dance, además **cancelar cualquier timer pending** (defensive — si el usuario activa PRM y luego scrollea rápido, queremos que el segundo scroll vea opacity=1 limpio). Como complemento, el CSS `@media (prefers-reduced-motion: reduce)` quita `transition: opacity 100ms` para defensa doble.
- mobile breakpoint `<600px` en CSS del componente (UI-SPEC §9 — avatar 56×68px en mobile). El media query del componente NO requiere lógica JS, solo CSS.
</key-decisions>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 4.1: Crear StickyAvatar.vue con DOM exacto + reactividad inject + crossfade JS 200ms total + PRM-mid-flight recovery watcher</name>
  <files>src/components/StickyAvatar.vue, tests/components/StickyAvatar.test.js</files>
  <behavior>
    - Test 1: Render: el `<aside>` raíz tiene clase `sticky-avatar`, `aria-live="polite"`, y `aria-label` que incluye el `activeChapter` inicial (3).
    - Test 2: Render: existe `<div class="avatar-placeholder" aria-hidden="true">` con `<span class="avatar-chapter-label">ch3</span>` inicialmente.
    - Test 3: Reactividad: al simular cambio de `activeChapter` (provide un ref mutable en el test), el texto se actualiza a `ch{newN}` y el aria-label refleja el nuevo N.
    - Test 4: Default motion (mock `prefersReduced.value === false`): cambio de activeChapter dispara `opacity.value = 0` inmediatamente; tras `vi.advanceTimersByTime(100)` (no 200), `opacity.value = 1`. Esto verifica que cada mitad del crossfade es 100ms (total 200ms perceptible con el CSS `transition: opacity 100ms ease`).
    - Test 5: PRM motion (mock `prefersReduced.value === true`): cambio de activeChapter NO dispara el flip de opacity (queda en 1 todo el tiempo) — el texto cambia pero sin transición.
    - **Test 6 (NUEVO — HIGH 2): PRM-mid-flight recovery.** Inicio default motion (PRM=false). Disparar cambio de activeChapter → `opacity.value === 0` durante el fade-out. ANTES de que el setTimeout(100) complete, cambiar `prefersReduced.value = true` (toggle PRM mid-flight). Tras `await nextTick()`, assert que `opacity.value === 1` (recovery via el watcher de prefersReduced). El timer pendiente debe haberse cancelado (verificable: `vi.advanceTimersByTime(100)` después y opacity sigue siendo 1, sin "doble set"). Avanzar todos los timers más allá y assertar opacity sigue en 1.
    - Test 7: CSS string check (leer SFC raw): `position: fixed`, `top: var(--sp-md)`, `left: var(--sp-md)`, `z-index: 40`, `width: 80px`, `height: 96px`.
    - Test 8: CSS string check: **`transition: opacity 100ms ease`** (NO 200ms — verifica HIGH 1 fix).
    - Test 9: CSS string check: media query `(max-width: 599px)` con `width: 56px; height: 68px;` declarado.
    - Test 10: CSS string check: media query `(prefers-reduced-motion: reduce)` con `transition: none` sobre `.avatar-placeholder`.
  </behavior>
  <action>
    Escribir `tests/components/StickyAvatar.test.js` primero con los 10 tests. Para testear los inject, usar `mount(StickyAvatar, { global: { provide: { scrollState: { activeChapter: ref(3), ... }, prm: { prefersReduced: computed(() => false) } } } })`. Para mutar `activeChapter` en runtime del test, exponer el ref como mutable desde el test scope (no usar readonly en los mocks). Para mutar `prefersReduced`, usarlo como un `ref` mutable en el test (no `computed` real) para que el watcher se dispare.

    **Test 6 (HIGH 2) — setup detallado:**
    ```javascript
    it('PRM mid-flight: avatar opacity recovers to 1 when PRM activates during fade', async () => {
      vi.useFakeTimers()
      const activeChapter = ref(3)
      const prefersReduced = ref(false)  // ref mutable, no computed
      const wrapper = mount(StickyAvatar, {
        global: {
          provide: {
            scrollState: { activeChapter },
            prm: { prefersReduced },
          },
        },
      })
      // Step 1: trigger fade by changing chapter
      activeChapter.value = 4
      await nextTick()
      // Verify we are mid-flight (opacity = 0)
      const placeholder = wrapper.find('.avatar-placeholder')
      expect(placeholder.attributes('style')).toContain('opacity: 0')
      // Step 2: activate PRM mid-flight
      prefersReduced.value = true
      await nextTick()
      // Step 3: assert opacity recovered to 1 (watcher fired)
      expect(placeholder.attributes('style')).toContain('opacity: 1')
      // Step 4: advance timer past the (cancelled) setTimeout(100); opacity should remain 1
      vi.advanceTimersByTime(150)
      await nextTick()
      expect(placeholder.attributes('style')).toContain('opacity: 1')
      vi.useRealTimers()
    })
    ```

    Después implementar `src/components/StickyAvatar.vue`:

    `<script setup>`:
    ```javascript
    import { ref, inject, watch, nextTick } from 'vue'

    const { activeChapter } = inject('scrollState')
    const { prefersReduced } = inject('prm')

    const opacity = ref(1)
    let pendingSwapTimer = null

    // Main fade watcher: triggered on chapter change.
    watch(activeChapter, async () => {
      if (prefersReduced.value) {
        // D-02 — instantáneo bajo PRM. Cancelar cualquier fade in-flight.
        if (pendingSwapTimer) { clearTimeout(pendingSwapTimer); pendingSwapTimer = null }
        opacity.value = 1
        return
      }
      // Default motion: fade-out → swap (texto via reactividad) → fade-in
      // 100ms + 100ms = 200ms total perceptible (UI-SPEC §8)
      opacity.value = 0
      await nextTick()
      pendingSwapTimer = setTimeout(() => {
        opacity.value = 1
        pendingSwapTimer = null
      }, 100)
    })

    // PRM-mid-flight recovery watcher (HIGH 2 fix):
    // If the user activates PRM during an in-flight fade, the activeChapter watcher
    // won't re-run and opacity would stay at 0. This watcher restores visibility
    // whenever PRM toggles ON.
    watch(prefersReduced, (isPRM) => {
      if (isPRM) {
        if (pendingSwapTimer) { clearTimeout(pendingSwapTimer); pendingSwapTimer = null }
        opacity.value = 1
      }
    })
    ```

    `<template>`:
    ```html
    <aside
      class="sticky-avatar"
      :aria-label="`Avatar de Rafael — chapter ${activeChapter} activo`"
      aria-live="polite"
    >
      <div class="avatar-placeholder" aria-hidden="true" :style="{ opacity }">
        <span class="avatar-chapter-label">ch{{ activeChapter }}</span>
      </div>
    </aside>
    ```

    `<style scoped>`: copiar el bloque CSS del `<interfaces>` arriba. **Importante:** `transition: opacity 100ms ease` (NO 200ms — verifica HIGH 1 fix). El total perceptible es 200ms (fade-out 100ms + swap + fade-in 100ms), matching UI-SPEC §8.

    Iterar hasta que los 10 tests pasen.
  </action>
  <verify>
    <automated>`npx vitest run tests/components/StickyAvatar.test.js`. Exit 0, 10 tests passed.</automated>
  </verify>
  <done>
    `src/components/StickyAvatar.vue` existe con DOM exacto UI-SPEC §7.2, crossfade JS de 200ms TOTAL (100ms+100ms, no 400ms), watcher dedicado para recovery de PRM-mid-flight, mobile breakpoint CSS, transition:none bajo PRM. Los 10 tests pasan incluyendo el de PRM-mid-flight recovery.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 4.2: Montar StickyAvatar en App.vue como hermano del ScrollShell</name>
  <files>src/App.vue</files>
  <action>
    Editar `src/App.vue`. Añadir:
    - `import StickyAvatar from './components/StickyAvatar.vue'` junto a los imports existentes.
    - En el `<template>`, justo antes de `<ScrollShell ref="..." />`, añadir `<StickyAvatar />`. Resultado:
      ```html
      <template>
        <StickyAvatar />
        <ScrollShell :ref="el => { shellRef.value = el?.shellEl ?? null }" />
      </template>
      ```
      (StickyAvatar va ANTES del ScrollShell porque la convención de orden DOM en UI-SPEC §6 lista el avatar antes del main; aunque visualmente ambos son `fixed` y el z-index manda. Mantener orden DOM como en UI-SPEC para no romper tab order — el avatar es no-focusable, va antes del main que sí lo es).

    NO modificar `<style>` ni `<script setup>` salvo los imports.

    Después ejecutar `npm run test:run` para verificar que toda la suite sigue pasando.
  </action>
  <verify>
    <automated>`node -e "const fs = require('fs'); const app = fs.readFileSync('./src/App.vue', 'utf8'); if (!app.includes('StickyAvatar')) process.exit(1); if (!app.match(/<StickyAvatar\\s*\\/>/)) process.exit(1); console.log('OK App.vue StickyAvatar mounted')"`. Plus `npx vitest run` exit 0.</automated>
  </verify>
  <done>
    `src/App.vue` importa y monta `<StickyAvatar />` como hermano directo del `<ScrollShell />`. Suite Vitest sigue passing.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 4.3: Smoke test manual del avatar reactivo</name>
  <files>(verificación, ninguno modificado)</files>
  <action>
    Ejecutar `npm run dev`. Abrir `http://localhost:5173/`.

    1. Verificar que el avatar es visible en la esquina superior izquierda: rectángulo gris (`#1a1a2e`) con borde sutil (`#2e2e4a`), tamaño 80×96px, con texto `ch3` en color muted (`#6b6b8a`) en el centro.
    2. Scrollear hacia abajo → snap a ch4 → el texto del avatar cambia a `ch4` con un crossfade sutil. **El total perceptible del fade es ~200ms (100ms de salida + swap + 100ms de entrada), no 400ms.** Si se ve "fade muy largo", revisar el CSS `transition: opacity` — debe ser 100ms.
    3. Continuar scrolleando → ch5, ch6 — el avatar muta en cada snap.
    4. Scrollear hacia arriba → ch2, ch1, ch0 — el avatar muta correspondientemente.
    5. F12 → inspeccionar el `<aside class="sticky-avatar">` → tiene `aria-label="Avatar de Rafael — chapter X activo"` reactivo a X.
    6. DevTools → Cmd/Ctrl+Shift+P → "Emulate CSS prefers-reduced-motion: reduce". Recargar. Scrollear → el texto del avatar cambia INSTANTÁNEAMENTE sin fade (D-02 verified).
    7. **PRM mid-flight test (HIGH 2 verify manual):** Restaurar PRM emulation a "no-preference". Recargar. Scrollear rápido entre ch3 → ch4 → mientras el fade-out está corriendo (ven el avatar a opacity 0 o transitioning), abrir DevTools → emular PRM "reduce" rápidamente. **El avatar debe volver visible (opacity 1) inmediatamente, no quedarse invisible.** Repetir 2-3 veces si es necesario; el timing es fino pero el comportamiento debe ser consistent: nunca se queda invisible.
    8. Restaurar PRM emulation a "no-preference". Recargar.
    9. DevTools → emular viewport mobile (Cmd/Ctrl+Shift+M, 375×667 o similar < 600px). El avatar shrink a 56×68px y se mueve a top:8px left:8px (UI-SPEC §9 mobile breakpoint).

    Documentar cualquier desviación en el SUMMARY.md. NO debería haber.
  </action>
  <verify>
    <automated>`npx vitest run`. Suite passing (10 tests de StickyAvatar incluido el de PRM-mid-flight).</automated>
  </verify>
  <done>
    Avatar visible top-left durante todo el scroll. Texto `ch{N}` reactivo. Crossfade 200ms total (100+100) default. Instantáneo bajo PRM. PRM-mid-flight no deja avatar invisible. Mobile breakpoint funcional. Los 9 ítems manuales pasan.
  </done>
</task>

</tasks>

<verification>
**Automated:**
```powershell
npx vitest run
```
Exit 0, todos los tests passing (incluyendo 10 nuevos de StickyAvatar con el test de PRM-mid-flight recovery).

**Manual (checklist Task 4.3):**
- [ ] Avatar visible top-left en chapter inicial (ch3) con texto `ch3`.
- [ ] Texto cambia reactivamente al scrollear entre chapters.
- [ ] Crossfade JS 200ms TOTAL (no 400ms) en default motion.
- [ ] Instantáneo bajo PRM emulation.
- [ ] PRM mid-flight: avatar nunca queda invisible al toggle de PRM durante un fade.
- [ ] Mobile breakpoint < 600px shrink el avatar.
- [ ] aria-label reactivo a activeChapter.
</verification>

<success_criteria>
- [ ] `src/components/StickyAvatar.vue` exporta el componente.
- [ ] DOM exacto: `<aside class="sticky-avatar">` con `aria-live="polite"`, `<div class="avatar-placeholder" aria-hidden="true">`, `<span class="avatar-chapter-label">ch{N}</span>`.
- [ ] Reactivo via `inject('scrollState')` — el texto y aria-label se actualizan con activeChapter.
- [ ] Crossfade JS 200ms total (100ms+100ms) default; instantáneo bajo PRM (D-02); alineado con UI-SPEC §8 verbatim (HIGH 1 fix).
- [ ] Watcher dedicado sobre prefersReduced que restaura opacity=1 si PRM activa mid-flight (HIGH 2 fix).
- [ ] Mobile breakpoint < 600px (56×68px).
- [ ] Position: fixed top-left, z-index 40 (UI-SPEC §6).
- [ ] 10 tests Vitest passing incluyendo el de PRM-mid-flight recovery.
- [ ] App.vue monta `<StickyAvatar />` como hermano directo del `<ScrollShell />`.
</success_criteria>

<output>
Tras completar, crear `.planning/phases/01-scroll-shell-sticky-anchors/01-04-SUMMARY.md` documentando:
- Confirmación de que el IO del Plan 02 funciona end-to-end (avatar reactivo al scroll → IO está cableado correctamente).
- Confirmación de que el crossfade total es 200ms perceptible (100ms+100ms), no 400ms.
- Confirmación del recovery PRM-mid-flight (avatar nunca queda invisible).
- Resultado de los 9 ítems del smoke test manual.
- Cualquier ajuste al threshold del IO si fue necesario (no debería).
- Confirmación de que el avatar NO ocluye el era title (UI-SPEC §9 padding-top del chapter-placeholder).
</output>
