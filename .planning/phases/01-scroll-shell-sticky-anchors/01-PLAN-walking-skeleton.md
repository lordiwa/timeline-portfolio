---
phase: 1
plan: 2
slug: walking-skeleton
wave: 1
type: execute
mode: mvp
walking_skeleton: true
autonomous: true
gap_closure: false
requirements_covered: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-08, iOS-01, A11Y-02]
depends_on: [1]
files_modified:
  - src/App.vue
  - src/components/ScrollShell.vue
  - src/composables/useScrollState.js
  - tests/components/ScrollShell.test.js
  - tests/composables/useScrollState.test.js
must_haves:
  truths:
    - "Al abrir http://localhost:5173/, las 7 chapter sections existen en el DOM"
    - "El scroll vertical hace snap chapter-a-chapter (no skipping en flicks rápidos)"
    - "La página aterriza directamente en chapter 3 (2013 · Web 2.0) al cargar /"
    - "Cargar /?ch=0 aterriza directamente en chapter 0 (1995 · Terminal); /?ch=6 en chapter 6"
    - "Cargar /?ch=99 o /?ch=abc aterriza en chapter 3 (fallback)"
    - "El ScrollShell tiene tabindex='0' (focusable programáticamente para el skip link del Plan 06)"
    - "El composable useScrollState expone activeChapter (ref readonly) y scrollToChapter(N, behavior)"
    - "Sin errores en consola (F12) ni warnings de Vue"
  artifacts:
    - path: src/App.vue
      provides: "Layout root reemplazando el placeholder; monta el ScrollShell y proporciona scrollState via provide"
      contains: "ScrollShell"
    - path: src/components/ScrollShell.vue
      provides: "Componente raíz scrolleable con 7 ChapterSection inline + CSS scroll-snap-y mandatory"
      contains: "scroll-snap-type"
    - path: src/composables/useScrollState.js
      provides: "Composable que expone activeChapter (ref readonly), scrollProgress (ref readonly), scrollToChapter(N, behavior); inicializa IO (stub) + parsea ?ch=N usando watch(shellRef, ...)"
      exports: ["useScrollState"]
    - path: tests/composables/useScrollState.test.js
      provides: "Tests unitarios para ?ch=N parsing, default ch3, validación de rangos. Wrapper template incluye 7 <div id='chapter-N'> stubs para que scrollToChapter no falle en null."
    - path: tests/components/ScrollShell.test.js
      provides: "Tests para CORE-01 (scroll-snap-type), CORE-02 (7 sections), CORE-04 (snap-stop), CORE-08 (100dvh), A11Y-02 (tabindex)"
  key_links:
    - from: src/App.vue
      to: src/components/ScrollShell.vue
      via: "import + <ScrollShell />"
      pattern: "ScrollShell"
    - from: src/App.vue
      to: src/composables/useScrollState.js
      via: "import + provide('scrollState', useScrollState(shellRef))"
      pattern: "useScrollState"
    - from: src/components/ScrollShell.vue
      to: 7 ChapterSection inline
      via: "v-for sobre array `chapters`"
      pattern: "v-for=\"ch in chapters\""
---

<objective>
**Walking Skeleton:** el primer deliverable end-to-end funcional. Al completar este plan, Rafael puede abrir `npm run dev` → ver 7 chapter sections apiladas → hacer scroll vertical con snap chapter-a-chapter → aterrizar en chapter 3 por default → probar `?ch=N` para deep-link → ver el placeholder de cada chapter con el era title (`YYYY · {era_name}`).

**Purpose:** Eliminar el riesgo más alto primero. Si el snap no funciona, todo lo demás (avatar, timeline, PRM, keyboard) es accesorio. Este plan confirma que la mecánica núcleo está sólida antes de invertir en features secundarios. RESEARCH §3 SPIDR lo recomienda explícitamente como Plan 1.

**Output:**
- `App.vue` reescrito como layout root.
- `ScrollShell.vue` con 7 chapter sections inline (sin componentes separados todavía — eso vendría si la fase escalara, pero por ahora 7 sections inline mantienen el código corto y verifiable).
- `useScrollState.js` composable con `activeChapter`, `scrollProgress`, `scrollToChapter`. IO está cableado pero su único consumer (StickyAvatar) llega en Plan 04 — para Plan 02 el IO actualiza `activeChapter.value` y nada más.
- Tests unitarios cubriendo CORE-01..05/08.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/PROJECT.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-PLAN.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-UI-SPEC.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-RESEARCH.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-CONTEXT.md
@src/App.vue
@index.html

<interfaces>
<!-- Datos canónicos consumidos de UI-SPEC §7.1 (era labels) y §6 (DOM structure). -->

Chapters array (single source of truth para Phase 1, copiado de UI-SPEC §7.1):
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

DOM target (UI-SPEC §6):
```html
<div id="app">
  <!-- skip link y avatar/timeline vienen en plans 04, 05, 06 -->
  <main id="main-content" class="scroll-shell" tabindex="0">
    <section id="chapter-0" data-chapter="0" aria-label="Terminal — 1995">...</section>
    <!-- × 7 -->
  </main>
</div>
```

ChapterSection inline (UI-SPEC §7.1):
```html
<section
  id="chapter-{N}"
  class="chapter-section"
  data-chapter="{N}"
  :aria-label="`${era} — ${year}`"
>
  <div class="chapter-placeholder">
    <p class="era-title">{{ year }} · {{ era }}</p>
  </div>
</section>
```

CSS tokens (UI-SPEC §3, §4 — los que se usan en este plan):
- `--c-bg: #0b0b16` (fondo dominante de chapter sections)
- `--c-fg: #e7e7f0` (texto base, incluye era title)
- `--sp-md: 16px` (padding del avatar slot ref; aquí solo se usa en chapter-placeholder calc)
- `--sp-sm: 8px` (padding del timeline ref; aquí solo en calc)
Declarar estos tokens como CSS Custom Properties en `:root` dentro de `App.vue` style global (sin scoped). Phase 2 los sobreescribirá por `[data-chapter="N"]`.

`useScrollState` interfaz (RESEARCH §6 code example):
```javascript
export function useScrollState(shellRef) {
  return {
    activeChapter: readonly(activeChapter),    // ref<number>
    scrollProgress: readonly(scrollProgress),  // ref<number 0..1>
    scrollToChapter: (N, behavior = 'smooth') => void,
  }
}
```
</interfaces>

<key-decisions>
- UI-SPEC §7.1 dicta DOM exacto de ChapterSection — replicar 1:1.
- 7 sections inline en `ScrollShell.vue` (no un `<ChapterSection>` componente separado): mantiene el código corto y verifiable; Phase 2 podría extraerlos si themes lo justifican, pero Phase 1 no necesita esa abstracción.
- `useScrollState(shellRef)` recibe un Vue ref del DOM element raíz (el `<main>` con clase `.scroll-shell`). Esto es el "overflow container" donde el IO observa y donde se escucha el `scroll` event.
- **Setup vía `watch(shellRef, ...)` con `{ immediate: true }`, NO en `onMounted`.** App.vue instancia `useScrollState(shellRef)` antes de que el `:ref` callback de Vue haya cableado el DOM element al ref. Si el composable hace su setup en su propio `onMounted`, el ref puede seguir siendo `null` (race con el `:ref` callback). La solución correcta es reactiva: el composable hace `watch(shellRef, (el) => { if (el) { initObserver(el); maybeApplyDeepLink() } }, { immediate: true })` para que la inicialización corra exactamente cuando el ref se asigna. Si se asigna en el mismo tick (synchronous render), `{ immediate: true }` lo dispara; si se asigna después (mounted lifecycle), watch lo dispara entonces. Este patrón elimina la null-trap.
- `scrollProgress` se calcula via RAF dentro del composable (RESEARCH §6 código). Para Plan 02 está cableado pero no se consume nadie todavía (Plan 05 lo consume para el marker).
- Default landing chapter 3 + `?ch=N` parsing dentro del callback de `watch(shellRef, ...)`. **Llamar `scrollToChapter(initial, 'auto')` (método público del composable), NO `getElementById(...).scrollIntoView(...)` directo.** Esto permite que los tests spy `scrollToChapter` correctamente. El doble RAF queda dentro de `scrollToChapter` ó wrapping en el caller — decisión: el doble RAF queda en el caller (el callback de watch), porque `scrollToChapter` debe seguir siendo síncrono para que los consumers (tick click, keyboard) puedan llamarlo sin double-RAF artificial.
- IO con `root: shellEl`, `threshold: [0.6]` (RESEARCH §Pitfall 2 razona el 0.6). El IO actualiza `activeChapter` cuando un section cubre ≥60% del viewport interno del shell.
- CSS `scroll-behavior: smooth` declarado vía CSS estático en `.scroll-shell` + branch `@media (prefers-reduced-motion: reduce) { scroll-behavior: auto; }` como **defensa CSS-side**. El composable de Plan 03 añade la dimensión JS para `scrollTo({behavior})` programáticos.
- `height: 100vh; height: 100dvh;` pattern dual (RESEARCH §Área 1) en `.scroll-shell` y `.chapter-section` para fallback en older Safari + preferir `dvh` donde sea soportado.
- iOS-01: `-webkit-overflow-scrolling: touch` declarado en `.scroll-shell`.
- **`scrollToChapter` defensive null-check:** `const el = document.getElementById(\`chapter-${N}\`); if (!el) return; el.scrollIntoView(...)`. Esto permite que tests con wrapper templates incompletos no rompan, y previene crashes runtime si el DOM aún no está listo.
- NO importar Phaser. NO importar nada de `public/assets/`. NO theme styles (Phase 2).
</key-decisions>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 2.1: Crear useScrollState composable (setup via watch(shellRef, ...) — sin race condition; ?ch=N llama scrollToChapter público)</name>
  <files>src/composables/useScrollState.js, tests/composables/useScrollState.test.js</files>
  <behavior>
    - Test 1: Importado sin error, exporta función `useScrollState`.
    - Test 2: Al llamar `useScrollState(ref(null))`, retorna `{ activeChapter, scrollProgress, scrollToChapter }`; los dos primeros son refs readonly con valores iniciales 3 y 0 respectivamente. Mientras el ref siga null, NO se ha cableado IO ni listeners (verificable porque el global IntersectionObserver mock NO recibió `observe`).
    - Test 3: Mock `window.location.search = '?ch=0'` ANTES de llamar el composable; mount el wrapper component (con su template stub) → `scrollToChapter` spy es llamado con `(0, 'auto')` después del doble RAF.
    - Test 4: Mock `?ch=99` → `scrollToChapter` spy llamado con `(3, 'auto')` (fallback).
    - Test 5: Mock `?ch=abc` → `scrollToChapter` spy llamado con `(3, 'auto')`.
    - Test 6: Mock `?ch=` (vacío) → `scrollToChapter` spy llamado con `(3, 'auto')`.
    - Test 7: Sin query string → `scrollToChapter` spy llamado con `(3, 'auto')`.
    - Test 8: Llamar manualmente `result.scrollToChapter(2, 'smooth')` → invoca `scrollIntoView({ behavior: 'smooth', block: 'start' })` sobre el `#chapter-2` element del DOM mock.
    - Test 9: IO mock callback con `{ isIntersecting: true, intersectionRatio: 0.7, target: { dataset: { chapter: '4' } } }` → `activeChapter.value === 4`.
    - Test 10: IO mock callback con `intersectionRatio: 0.4` (< 0.6) → activeChapter NO cambia.
    - Test 11: `onBeforeUnmount` cleanup: el observer.disconnect se llama, el scroll listener se remueve, el RAF pausa.

    **Para que `scrollToChapter` realmente encuentre los `#chapter-N` en jsdom**, el wrapper template DEBE incluir los 7 stubs (ver `<action>` abajo). Sin los stubs, los Tests 3-8 fallan porque `document.getElementById('chapter-N')` retorna null.
  </behavior>
  <action>
    **Wrapper template para los tests (canónico, usar en TODOS los tests que mounten):**
    ```javascript
    // tests/composables/useScrollState.test.js
    import { mount } from '@vue/test-utils'
    import { ref, defineComponent } from 'vue'
    import { useScrollState } from '@/composables/useScrollState'

    function makeWrapper() {
      let exposed = null
      const Comp = defineComponent({
        setup() {
          const shellRef = ref(null)
          const state = useScrollState(shellRef)
          exposed = { shellRef, state }
          return { shellRef }
        },
        // 7 chapter stubs requeridos para que document.getElementById('chapter-N')
        // funcione en jsdom durante los tests de deep-link y scrollToChapter directo.
        template: `
          <div>
            <main ref="shellRef" class="scroll-shell">
              <section id="chapter-0" data-chapter="0"></section>
              <section id="chapter-1" data-chapter="1"></section>
              <section id="chapter-2" data-chapter="2"></section>
              <section id="chapter-3" data-chapter="3"></section>
              <section id="chapter-4" data-chapter="4"></section>
              <section id="chapter-5" data-chapter="5"></section>
              <section id="chapter-6" data-chapter="6"></section>
            </main>
          </div>
        `,
      })
      const wrapper = mount(Comp, { attachTo: document.body })
      return { wrapper, get: () => exposed }
    }
    ```

    Para los tests de deep-link (3-7), reescribir `window.history.replaceState({}, '', '/?ch=X')` ANTES de `makeWrapper()`. Para spy `scrollToChapter`, dado que es retornado por el composable, hay dos opciones:
    - **Opción A (preferida):** spy directamente sobre el `scrollIntoView` del element `#chapter-N` (más bajo nivel, no requiere stub del composable). Los tests 3-7 entonces verifican: `expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })` y verifican qué `#chapter-N` recibió el call inspeccionando el contexto.
    - **Opción B:** importar `useScrollState` y wrap con un proxy spy en el wrapper component (más invasivo).

    Usar Opción A: en `beforeEach` del describe block, hacer `vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {})`. Los tests entonces leen `scrollIntoView.mock.calls` y verifican el element correcto via `mock.calls[N][0].this` o assertando vs el spy del element específico (`document.getElementById('chapter-3').scrollIntoView`).

    Para Tests 4-7 que verifican `scrollToChapter` fue invocado con `(N, 'auto')`, dado que estamos spyando `scrollIntoView` no `scrollToChapter` directamente: el equivalente es verificar `scrollIntoView` fue llamado UNA VEZ con `{ behavior: 'auto', block: 'start' }` sobre el `#chapter-N` correcto. Documentar el mapping en un helper:
    ```javascript
    function assertNavigatedTo(chapterN, behavior) {
      const el = document.getElementById(`chapter-${chapterN}`)
      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior, block: 'start' })
    }
    ```
    Y en cada test después del doble RAF + await flushPromises:
    ```javascript
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    await flushPromises()
    assertNavigatedTo(3, 'auto')  // o el chapter esperado
    ```

    **Implementación de `src/composables/useScrollState.js`** (siguiendo RESEARCH §6 pero con el fix del race condition):

    ```javascript
    import { ref, readonly, watch, onBeforeUnmount } from 'vue'
    import { useRafFn } from '@vueuse/core'

    export function useScrollState(shellRef) {
      const activeChapter = ref(3)
      const scrollProgress = ref(0)

      let observer = null
      let scrollListener = null
      const rafCtl = useRafFn(() => {
        const el = shellRef.value
        if (!el) return
        const denom = el.scrollHeight - el.clientHeight
        scrollProgress.value = denom > 0 ? el.scrollTop / denom : 0
      }, { immediate: false })

      let idleTimer = null
      function handleScroll() {
        rafCtl.resume()
        clearTimeout(idleTimer)
        idleTimer = setTimeout(() => rafCtl.pause(), 150)
      }

      function scrollToChapter(N, behavior = 'smooth') {
        const el = document.getElementById(`chapter-${N}`)
        if (!el) return  // defensive: tests / SSR / early mount
        el.scrollIntoView({ behavior, block: 'start' })
      }

      function parseInitialChapter() {
        const params = new URLSearchParams(window.location.search)
        const raw = params.get('ch')
        const N = Number(raw)
        if (raw === null || raw === '' || !Number.isInteger(N) || N < 0 || N > 6) {
          return 3
        }
        return N
      }

      function initObserver(el) {
        observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
              const N = Number(entry.target.dataset.chapter)
              if (Number.isInteger(N)) activeChapter.value = N
            }
          }
        }, { root: el, threshold: [0.6] })
        el.querySelectorAll('[data-chapter]').forEach(s => observer.observe(s))
      }

      function maybeApplyDeepLink() {
        const initial = parseInitialChapter()
        // Doble RAF: deja que el browser termine snap layout antes de scrollIntoView
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToChapter(initial, 'auto')
          })
        })
      }

      // CRÍTICO: setup reactivo, NO onMounted.
      // App.vue instancia useScrollState(shellRef) durante setup(), antes de que el
      // :ref callback de Vue haya asignado el DOM element al ref. Si hiciéramos el
      // setup en onMounted del composable, el ref podría seguir null (race con :ref).
      // watch con immediate:true corre cuando el ref se asigna (sincrónico o no).
      const stopWatch = watch(
        shellRef,
        (el) => {
          if (!el) return
          initObserver(el)
          scrollListener = handleScroll
          el.addEventListener('scroll', scrollListener, { passive: true })
          maybeApplyDeepLink()
        },
        { immediate: true, flush: 'post' }
      )

      onBeforeUnmount(() => {
        observer?.disconnect()
        if (scrollListener && shellRef.value) {
          shellRef.value.removeEventListener('scroll', scrollListener)
        }
        rafCtl.pause()
        clearTimeout(idleTimer)
        stopWatch()
      })

      return {
        activeChapter: readonly(activeChapter),
        scrollProgress: readonly(scrollProgress),
        scrollToChapter,
      }
    }
    ```

    Notas para el executor:
    - `flush: 'post'` en el watch garantiza que el callback corre DESPUÉS del DOM update, así `el.querySelectorAll('[data-chapter]')` ve los stubs ya cableados.
    - El doble RAF dentro de `maybeApplyDeepLink` NO dentro de `scrollToChapter` — es importante porque otros callers (tick click, keyboard) NO deben pagar 2 frames de latencia. Solo el initial deep-link lo necesita por la race con snap layout.
    - El `addEventListener('scroll', ...)` va sobre el `<main>` (overflow container), no sobre `window`, porque el snap container es el `<main>` y ese es el element que dispara scroll events.

    Iterar tests + impl hasta que los 11 tests pasen.
  </action>
  <verify>
    <automated>`npx vitest run tests/composables/useScrollState.test.js`. Exit 0, 11 tests passed.</automated>
  </verify>
  <done>
    `src/composables/useScrollState.js` existe y exporta `useScrollState`. Los 11 tests pasan. El composable parsea `?ch=N`, valida rangos, hace doble-RAF antes de llamar `scrollToChapter`, cablea IO con threshold 0.6, cablea RAF con pause/resume idle. Setup vía `watch(shellRef, ..., { immediate: true, flush: 'post' })` (NO onMounted) — no race con null ref. Deep-link siempre va por `scrollToChapter` (un solo source of truth, spy-able desde tests).
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2.2: Crear ScrollShell.vue con 7 ChapterSection inline + CSS scroll-snap-y mandatory</name>
  <files>src/components/ScrollShell.vue, tests/components/ScrollShell.test.js</files>
  <behavior>
    - Test 1: Render: el `<main>` raíz tiene clase `scroll-shell`, id `main-content`, `tabindex="0"` (CORE-A11Y-02).
    - Test 2: Render: existen exactamente 7 `<section>` hijos con `data-chapter` 0..6 (CORE-02).
    - Test 3: Cada section tiene `id="chapter-N"`, `aria-label="{era} — {year}"` con los valores del array canónico (Terminal/HTML 90s/Flash/Web 2.0/AR/VR/Modern/Phaser y los años respectivos).
    - Test 4: Cada section contiene un `<p class="era-title">` con texto `{year} · {era}` (UI-SPEC §11 copy contract).
    - Test 5: CSS computed/declared: `.scroll-shell` declara `scroll-snap-type: y mandatory` (CORE-01). Inspectionable via `wrapper.find('.scroll-shell').attributes('style')` o leyendo `<style>` block del SFC en raw.
    - Test 6: `.chapter-section` declara `scroll-snap-align: start` y `scroll-snap-stop: always` (CORE-04).
    - Test 7: `.chapter-section` declara `height: 100dvh` (con fallback `100vh` antes — CORE-08).
    - Test 8: `.scroll-shell` declara `-webkit-overflow-scrolling: touch` (iOS-01).
  </behavior>
  <action>
    Escribir `tests/components/ScrollShell.test.js` primero con los 8 tests. Usar `mount` de @vue/test-utils. Para los tests CSS (5-8), leer el archivo `.vue` como string y assert que el bloque `<style>` contiene los substrings críticos (no requiere parsing CSS — buscar literal strings tipo `scroll-snap-type: y mandatory`, `scroll-snap-align: start`, etc.). Esto es testing pragmático para CSS estático en SFC; suficiente para Wave 1.

    Después implementar `src/components/ScrollShell.vue` con:
    - `<script setup>` que define el array `chapters` (canónico, 7 entries con id/year/era).
    - `<template>` con `<main id="main-content" class="scroll-shell" tabindex="0" ref="shellEl">` y dentro un `<section v-for="ch in chapters" :key="ch.id" :id="\`chapter-${ch.id}\`" :data-chapter="ch.id" :aria-label="\`${ch.era} — ${ch.year}\`" class="chapter-section">`. Dentro de cada section: `<div class="chapter-placeholder"><p class="era-title">{{ ch.year }} · {{ ch.era }}</p></div>`.
    - **NO importar `useScrollState` desde dentro de ScrollShell.vue** — el composable se instancia en App.vue (Task 2.3) y el shellRef se pasa a través de defineExpose o el composable se provee. Para Plan 02, ScrollShell.vue solo expone su `shellEl` ref via `defineExpose({ shellEl })`. La conexión la hace App.vue.
    - `<style scoped>` con:
      - `.scroll-shell`: `height: 100vh; height: 100dvh; overflow-y: scroll; scroll-snap-type: y mandatory; -webkit-overflow-scrolling: touch; outline: none;` (outline:none se sobreescribirá por `:focus-visible` en Plan 06).
      - `.chapter-section`: `height: 100vh; height: 100dvh; width: 100%; scroll-snap-align: start; scroll-snap-stop: always; display: flex; align-items: center; justify-content: center; background: var(--c-bg); color: var(--c-fg);`.
      - `.chapter-placeholder`: `padding-top: calc(80px + var(--sp-md)); padding-bottom: calc(48px + var(--sp-sm)); text-align: center;` (UI-SPEC §9 — deja espacio para avatar y timeline aunque aún no existan).
      - `.era-title`: `font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 700; line-height: 1.1; margin: 0;` (UI-SPEC §5).
    - Iterar hasta que los 8 tests pasen.
  </action>
  <verify>
    <automated>`npx vitest run tests/components/ScrollShell.test.js`. Exit 0, 8 tests passed.</automated>
  </verify>
  <done>
    `src/components/ScrollShell.vue` existe con 7 ChapterSection inline, CSS scroll-snap-y mandatory, snap-stop always, 100dvh fallback, tabindex 0, -webkit-overflow-scrolling touch. Los 8 tests pasan.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2.3: Reescribir App.vue como layout root + cablear useScrollState al shellRef</name>
  <files>src/App.vue</files>
  <action>
    Reemplazar el contenido entero de `src/App.vue` (placeholder actual de 25 líneas) por el layout root.

    `<script setup>`:
    - `import { ref, provide } from 'vue'`
    - `import ScrollShell from './components/ScrollShell.vue'`
    - `import { useScrollState } from './composables/useScrollState'`
    - `const shellRef = ref(null)` — apuntará al `<main>.scroll-shell` interior de ScrollShell.
    - `const scrollState = useScrollState(shellRef)` — instancia el composable. El composable usa `watch(shellRef, ..., { immediate: true, flush: 'post' })` internamente, así que NO importa que `shellRef.value` sea `null` en este momento: cuando el `:ref` callback del template asigne el element, el watch dispara la inicialización (IO, scroll listener, deep-link parsing) automáticamente.
    - `provide('scrollState', scrollState)` — para que StickyAvatar (Plan 04) y StickyTimeline (Plan 05) puedan `inject('scrollState')` sin prop drilling.

    `<template>`:
    ```html
    <ScrollShell :ref="el => { shellRef.value = el?.shellEl ?? null }" />
    ```
    Esto usa el "function ref" pattern: cuando Vue monta el ScrollShell, llama el callback con la component instance; extraemos `shellEl` (que ScrollShell.vue expone via `defineExpose({ shellEl })`) y lo asignamos al shellRef que el composable está watcheando. El watch interno del composable detecta el cambio de null → DOM element y dispara la inicialización.

    `<style>` (no scoped, global):
    ```css
    :root {
      /* Spacing tokens — UI-SPEC §3 */
      --sp-xs: 4px;
      --sp-sm: 8px;
      --sp-md: 16px;
      --sp-lg: 24px;
      --sp-xl: 32px;
      --sp-2xl: 48px;
      --sp-3xl: 64px;
      /* Color tokens — UI-SPEC §4 (paleta neutra Phase 1; Phase 2 sobreescribe por chapter) */
      --c-bg: #0b0b16;
      --c-fg: #e7e7f0;
      --c-surface: #1a1a2e;
      --c-border: #2e2e4a;
      --c-track: #2e2e4a;
      --c-track-active: #e7e7f0;
      --c-marker: #a0a0c0;
      --c-focus: #7dd3fc;
      --c-muted: #6b6b8a;
      --c-tick-hover: #c0c0d8;
    }

    /* PRM defensive CSS-side — UI-SPEC §8, RESEARCH §Área 5 */
    .scroll-shell {
      scroll-behavior: smooth;
    }
    @media (prefers-reduced-motion: reduce) {
      .scroll-shell {
        scroll-behavior: auto;
      }
    }
    ```

    NO añadir provide('prm', ...) en este plan — eso viene en Plan 03 cuando exista `usePRM`.
    NO añadir SkipLink/StickyAvatar/StickyTimeline al template — vienen en plans 04-06.

    Después de implementar, ejecutar `npm run dev` manualmente (NO en background del task) NO es necesario — el verify automatizado abajo es suficiente. Si Rafael quiere validar visualmente, lo hace en el `<verification>` block manual de fin de plan.
  </action>
  <verify>
    <automated>`npx vitest run`. Toda la suite debe pasar (los tests del Plan 1 + los nuevos de useScrollState y ScrollShell). Plus: `node -e "const fs = require('fs'); const app = fs.readFileSync('./src/App.vue', 'utf8'); if (!app.includes('useScrollState')) process.exit(1); if (!app.includes('ScrollShell')) process.exit(1); if (!app.includes('--c-bg: #0b0b16')) process.exit(1); console.log('OK App.vue')"`</automated>
  </verify>
  <done>
    `src/App.vue` importa y monta `<ScrollShell />`, instancia `useScrollState` y proveea via `provide('scrollState', ...)`. Los CSS Custom Properties de UI-SPEC §3 y §4 están declarados en `:root` (global). El CSS-side PRM branch está declarado. Todos los tests Vitest pasan.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2.4: Smoke test manual del walking skeleton</name>
  <files>(verificación, ninguno modificado)</files>
  <action>
    Ejecutar `npm run dev` desde el working directory. Abrir `http://localhost:5173/` en el browser local (NO accedido desde mobile aún — eso es Plan 07). Verificar la siguiente checklist:

    1. La página carga sin errores en consola (F12).
    2. Se ve un único era title centrado en la pantalla: `2013 · Web 2.0` (default landing chapter 3).
    3. Hacer scroll hacia abajo (mouse wheel o trackpad) → snappea al chapter 4 (`2015 · AR/VR`).
    4. Continuar scrolleando hacia abajo → snappea ch5 (`2022 · Modern`), después ch6 (`2026 · Phaser`).
    5. Hacer scroll hacia arriba → snappea ch2 (`2009 · Flash`), después ch1 (`2001 · HTML 90s`), después ch0 (`1995 · Terminal`).
    6. Hacer un flick rápido — el snap-stop:always debe impedir skipping (avanza solo 1 chapter por gesto).
    7. Abrir `http://localhost:5173/?ch=0` → carga directamente en ch0.
    8. Abrir `http://localhost:5173/?ch=6` → carga directamente en ch6.
    9. Abrir `http://localhost:5173/?ch=99` → fallback a ch3.
    10. Abrir `http://localhost:5173/?ch=abc` → fallback a ch3.
    11. F12 → DevTools → inspeccionar el `<main.scroll-shell>` → tiene `tabindex="0"`.
    12. Inspect el `<section[data-chapter="3"]>` → `aria-label="Web 2.0 — 2013"`.

    Si CUALQUIER ítem falla, NO marcar el plan como done — abrir un nuevo task o revisar la implementación. Documentar el resultado en el SUMMARY.md del plan.
  </action>
  <verify>
    <automated>`npx vitest run`. Exit 0, suite entera pasando.</automated>
  </verify>
  <done>
    Los 12 ítems manuales pasan. La consola no muestra errores ni warnings de Vue. El walking skeleton está funcionando E2E para los CORE-01..05/08 + iOS-01 + A11Y-02 (tabindex).
  </done>
</task>

</tasks>

<verification>
**Automated:**
```powershell
npx vitest run
```
Exit 0, suite completa (smoke + useScrollState + ScrollShell) pasa.

**Manual (checklist del Task 2.4):**
- [ ] Landing en ch3 al cargar `/`
- [ ] Snap funcional ch0..ch6 con scroll
- [ ] `?ch=N` deep-link funcional + fallback a 3 para inválidos
- [ ] Sin errores en consola
- [ ] `tabindex="0"` en `.scroll-shell`
- [ ] 7 sections en el DOM con `data-chapter` correcto
</verification>

<success_criteria>
- [ ] `src/composables/useScrollState.js` existe y exporta el composable.
- [ ] `src/components/ScrollShell.vue` existe con 7 ChapterSection inline.
- [ ] `src/App.vue` reescrito como layout root + provide('scrollState').
- [ ] Tests Vitest pasan (≥ 11 tests del composable + ≥ 8 tests del ScrollShell).
- [ ] CORE-01 (scroll-snap-type), CORE-02 (7 sections), CORE-03 (composable + IO stub), CORE-04 (snap-stop), CORE-05 (default ch3 + ?ch=N), CORE-08 (100dvh), iOS-01 (-webkit-overflow-scrolling), A11Y-02 (tabindex) — todos verificables.
- [ ] Walking skeleton funcional E2E al abrir `npm run dev`.
</success_criteria>

<output>
Tras completar, crear `.planning/phases/01-scroll-shell-sticky-anchors/01-02-SUMMARY.md` documentando:
- Tests pasados (count).
- Resultado de los 12 ítems del smoke test manual.
- Cualquier desviación del UI-SPEC §7.1 (no debería haber).
- Confirmación de que `provide('scrollState', ...)` está cableado y disponible para inject en plans posteriores.
- Confirmación de que el setup del composable corre vía watch(shellRef) — no hubo race conditions de null observadas en el smoke test.
</output>
