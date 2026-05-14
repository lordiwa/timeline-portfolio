<!--
  Chapter6Content.vue — Vue shell del chapter 6 Phaser scene (Phase 5 W3 / Plan 05-04).

  Responsabilidades:
    - Lifecycle Phaser: watch(activeChapter) lazy import + mount + destroy idempotent
      + HMR dispose. shallowRef(null) — PHA-01 mandatory.
    - Bridge Phaser ↔ Vue (PHA-06 + PHA-07 + D5-10 RESOLVED — sin prefijo `vue:`):
        IN  : game.events.on('show-project', id) → activeProject.value = id
              game.events.on('arrival-complete') → arrivalDone.value = true
        OUT : watch(locale) → game.value?.events.emit('locale-changed', l)
              ← null-guard defensive (PHA-06; nombre EXACTO match con SpaceScene listener
              per Threat T-05-W0-05).
    - ResizeObserver (PHA-09 + extends MOB-03 Phase 1 pattern): document.documentElement,
      recalcula zoom integer + game.value.scale.setZoom(newZoom) sólo si difiere
      (Pitfall 8 anti-thrash guard).
    - A11Y: 3 sr-only buttons keyboard-navigable (D5-06 + extends A11Y-02 Phase 1)
      replicando los planet clicks dentro de Phaser. Tab order cronológico
      ar-vr → remoose → software-mind (D5-01).
    - Mantra HTML/Vue (D5-03 + CON-04): v-if=arrivalDone, NO render dentro de Phaser
      (mejor crispness + i18n directo + screen-reader accessible).
    - ProjectOverlay v-if=activeProject (D5-07): W4 reemplaza el stub.

  CSS owned por src/styles/chapter-themes.css @layer components (Task 2 del Plan).
  Sólo declaraciones mínimas locales en <style scoped> (.sr-only utility).

  Layout decisions (D5-09 Pattern 12 mitigation chapter-overlap bug):
    - .ch6-layout: position:relative, NO overflow:hidden (creaba stacking context
      problemático en ch4 — bug Phase 4 deferred). Canvas full-bleed sin contenedor
      restrictivo.
    - .ch6-canvas-host: position:absolute, inset:0.

  Verified contracts:
    - tests/components/Chapter6Content.test.js (T1-T4 PHA-01..04 + bridge listeners)
    - tests/components/Chapter6Content-lazy.test.js (T1-T2 PHA-04 string literal)
    - tests/components/Chapter6Content-bridge.test.js (T1-T3 bridge integration)
    - tests/components/Chapter6Content-resize.test.js (T1-T2 PHA-09 Pitfall 8 guard)
    - tests/components/Chapter6Content-prm.test.js (T1 createGame opt)
    - tests/a11y/keyboard-planet-buttons.test.js (T1-T3 D5-06)
    - tests/phaser/locale-bridge.test.js (T4-T5 emit name match)
    - tests/integration/chapter-overlap-ch6.test.js (T4 mount wire)
-->
<script setup>
import {
  shallowRef,
  ref,
  computed,
  watch,
  onBeforeUnmount,
  inject,
  useTemplateRef,
  nextTick,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useResizeObserver } from '@vueuse/core'
import { projects } from '@/data/projects'
import ProjectOverlay from './ProjectOverlay.vue'

// Resolución virtual base — debe matchear src/phaser/index.js (BASE_W/BASE_H).
// Duplicada localmente para evitar importar el factory top-level (rompería PHA-04 lazy).
const BASE_W = 480
const BASE_H = 270

// Composables — inject de App.vue (provistos en Phase 1).
const { activeChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')
const { t, locale } = useI18n()

// PHA-01: shallowRef — Phaser.Game NUNCA debe ser Vue-reactive-tracked.
// reactive()/ref() en el game tree rompe internals (event emitter recursion,
// scene plugin proxying, etc.). shallowRef solo reactivisa .value top-level.
const game = shallowRef(null)
const canvasHostRef = useTemplateRef('canvasHost')

// Bridge state Vue-side.
// arrivalDone: mantra HTML fade-in trigger (D5-03 + CON-04).
// activeProject: overlay v-if + sr-only button click handler.
const arrivalDone = ref(false)
const activeProject = ref(null)

// 3 proyectos ch6 — usado por v-for de los sr-only buttons (D5-06).
// Orden cronológico ascendente (planetOrbit 0.2 → 0.5 → 0.8) — D5-01.
const ch6Projects = computed(() => projects.filter((p) => p.chapterEra === 6))

/**
 * Compute integer zoom multiplier — duplicado de src/phaser/index.js computeZoom.
 * Local copy para evitar importar el factory top-level (PHA-04 lazy mandate).
 * Fórmula: min(floor(vw/480), floor(vh/270)) || 1 (PHA-03 + Pitfall 8 guard).
 */
function computeZoom() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return Math.min(Math.floor(vw / BASE_W), Math.floor(vh / BASE_H)) || 1
}

// D5-11 / PHA-04 — watch immediate maneja:
//   - mount inicial si activeChapter ya es 6 (deep-link ?ch=6 hipotético)
//   - mount al entrar a ch6 desde ch5
//   - destroy + reset state al salir de ch6
//
// flush:'post' garantiza que el DOM ya tiene el <div ref="canvasHost"> renderizado
// cuando el watcher dispara (parent v-else-if="ch.id === 6" en ScrollShell).
watch(
  activeChapter,
  async (v) => {
    if (v === 6 && !game.value) {
      // Defensive — si el ref aún no está cableado (raro con flush:'post'), esperar tick.
      if (!canvasHostRef.value) {
        await nextTick()
      }
      // PHA-04: lazy import string-literal — Vite separa el chunk Phaser (~150KB gzip).
      // Sin esto, Phaser entraría al bundle inicial penalizando a usuarios que nunca
      // llegan a ch6.
      const { createGame } = await import('@/phaser')
      game.value = createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })

      // Bridge IN — Phaser → Vue (D5-10 RESOLVED — sin prefijo `vue:`).
      // Los nombres deben coincidir EXACTO con los emit() de SpaceScene.js.
      game.value.events.on('show-project', (projectId) => {
        activeProject.value = projectId
      })
      game.value.events.on('arrival-complete', () => {
        arrivalDone.value = true
      })
    } else if (v !== 6 && game.value) {
      // PHA-02: destroy(true, false) — canvas removed, plugins preserved para re-entry.
      game.value.destroy(true, false)
      game.value = null
      // Reset state — al volver a entrar a ch6 la animación arrival re-ejecuta (D5-02).
      arrivalDone.value = false
      activeProject.value = null
    }
  },
  { immediate: true, flush: 'post' },
)

// PHA-06: Vue → Phaser locale bridge (D5-10 RESOLVED — sin prefijo `vue:`).
// optional chaining defensive: el watch de locale dispara en cualquier momento;
// si game.value es null (PRE-mount o POST-destroy) emit() crashearía sin el guard.
// El nombre 'locale-changed' DEBE coincidir EXACTO con el listener registrado en
// SpaceScene.js (verificado por locale-bridge.test.js T5 — Threat T-05-W0-05).
watch(locale, (newLocale) => {
  game.value?.events.emit('locale-changed', newLocale)
})

// PHA-09 + extends MOB-03 (Phase 1 ResizeObserver pattern):
// Recalcula integer zoom cuando el viewport cambia + invoca setZoom solo si
// difiere del actual (Pitfall 8 — anti-thrash guard previene re-render loop).
//
// document.documentElement NO window — ResizeObserver requiere Element observable;
// window no es Element (CSSOM spec).
useResizeObserver(document.documentElement, () => {
  if (!game.value) return
  const newZoom = Math.min(
    Math.floor(window.innerWidth / BASE_W),
    Math.floor(window.innerHeight / BASE_H),
  ) || 1
  if (newZoom !== game.value.scale.zoom) {
    game.value.scale.setZoom(newZoom)
  }
})

// Pitfall 3 + Open Q8 RESOLVED — HMR guard.
// Owner del HMR guard es ESTE componente (NO `src/phaser/index.js` factory — by design).
// El factory no mantiene state, este componente sí (game ref + arrivalDone + activeProject).
// Sin esto, cada save en dev acumularía Phaser.Game instances → memory leak progresivo.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.value?.destroy(true, false)
    game.value = null
    arrivalDone.value = false
    activeProject.value = null
  })
}

// Defensive cleanup — si el componente se desmonta sin pasar por el watch
// (e.g. parent v-if=false abrupto, o teardown de tests), aún destruir el game.
onBeforeUnmount(() => {
  game.value?.destroy(true, false)
  game.value = null
})
</script>

<template>
  <div class="ch6-layout">
    <!-- Phaser canvas host. aria-hidden porque el canvas no es accesible a screen
         readers; los 3 sr-only buttons abajo replican accesibilidad. -->
    <div ref="canvasHost" class="ch6-canvas-host" aria-hidden="true" />

    <!--
      D5-06 — 3 sr-only buttons keyboard-navegables.
      Replican los planet clicks dentro de Phaser para usuarios screen-reader +
      keyboard-only. Visualmente invisibles (.sr-only) pero focusables por Tab.
      aria-label combina t('ui.openProject') (= "Ver proyecto →") con el title
      i18nificado del proyecto para que el screen-reader anuncie cada destino.
      Click handler setea activeProject directamente — mismo state que recibe el
      'show-project' bridge event desde Phaser.
    -->
    <button
      v-for="p in ch6Projects"
      :key="p.id"
      type="button"
      class="ch6-planet-trigger sr-only"
      :aria-label="t('ui.openProject') + ': ' + t(p.titleKey)"
      @click="activeProject = p.id"
    />

    <!--
      D5-03 + CON-04 — mantra HTML/Vue (NO render dentro de Phaser).
      v-if=arrivalDone enseña el texto al fin del arrival cinematográfico (emit
      desde SpaceScene). CSS animation mantra-fade-in 400ms; bajo PRM
      @media override desactiva animation (opacity:1 desde mount) — D5-08 + A11Y-05.
    -->
    <p v-if="arrivalDone" class="ch6-mantra">
      {{ t('chapters.6.mantra') }}
    </p>

    <!--
      D5-07 — ProjectOverlay synthwave (W3 stub minimal; W4 reemplaza completo).
      Render condicional sobre activeProject ref (setado por bridge event o
      sr-only button click). @close emit resetea el ref → overlay desaparece.
    -->
    <ProjectOverlay
      v-if="activeProject"
      :project-id="activeProject"
      @close="activeProject = null"
    />
  </div>
</template>

<style scoped>
/*
 * Estilo mínimo local — el resto vive en src/styles/chapter-themes.css
 * @layer components (Task 2 del Plan 05-04). Aquí sólo la utility .sr-only
 * porque NO existe global en el proyecto (verificado 2026-05-14).
 *
 * .sr-only — patrón estándar WCAG: visually hidden pero readable by screen
 * readers + focusable. clip-path moderno + width/height 1px + overflow hidden.
 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus visible — cuando el usuario tabula a un button sr-only, hacerlo
   visualmente perceptible para sighted-keyboard users (no solo screen-readers). */
.sr-only:focus,
.sr-only:focus-visible {
  position: absolute;
  width: auto;
  height: auto;
  padding: 8px 12px;
  margin: 0;
  clip: auto;
  white-space: normal;
  background: var(--c-surface, #0a061f);
  color: var(--c-accent, #4dffff);
  border: 2px solid var(--c-accent, #4dffff);
  border-radius: 4px;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  font-family: 'Audiowide', sans-serif;
}
</style>
