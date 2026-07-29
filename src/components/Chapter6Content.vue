<!--
  Chapter6Content.vue — Vue shell del clímax ch6 (TASK-012 + TASK-022, 2026-07-29).

  Responsabilidades:
    - Lifecycle Phaser: watch(activeChapter) lazy import + mount + destroy idempotent
      + HMR dispose. shallowRef(null) — PHA-01 mandatory.
    - TASK-022 (misma carrera que TASK-020 en ch2, ORIGEN del patrón — ver
      tasks/TASK-022.json): guard de entrada `!game.value && !loading.value` +
      re-chequeo de `activeChapter.value === 6` DESPUÉS del `await import`. Sin
      esto: salir de ch6 antes de que el chunk resuelva deja un Phaser.Game
      zombie corriendo su rAF en background para siempre; y un segundo
      disparo concurrente con el import en vuelo crea una segunda instancia
      huérfana. Réplica fiel de src/components/Ch2MiniGame.vue (commit 9ed80dc).
    - TASK-012 rescate: computeZoom ahora se importa del mismo chunk lazy de
      Phaser (ya NO hay copia local calculando contra `window` — ver
      src/phaser/index.js computeZoom(hostEl), que usa getBoundingClientRect()
      del HOST real, no del viewport).
    - Bridge Phaser ↔ Vue (D5-10 — sin prefijo `vue:`):
        IN  : game.events.on('show-project', id) → activeProject.value = id
              game.events.on('arrival-complete') → arrivalDone.value = true
              (compat estructural — spec §3: nada de contenido depende ya de
              esto; el texto vive en Ch6Terminal.vue desde el mount)
        OUT : watch(locale) → game.value?.events.emit('locale-changed', l)
              Ch6Terminal @ascii-progress / @token-tick → game.value?.events.emit(...)
              (bridge DOM → Phaser, spec §4.2: "el DOM manda, Phaser obedece")
    - ResizeObserver (PHA-09): recalcula zoom vía computeZoom(hostEl) del chunk
      lazy + game.value.scale.setZoom(newZoom) sólo si difiere (anti-thrash).
    - A11Y: 3 sr-only buttons keyboard-navigable (D5-06), replicando los planet
      clicks dentro de Phaser. Tab order cronológico ar-vr → remoose → software-mind.
    - Ch6Terminal.vue (TASK-012): la conversación con la IA, DOM-first, SIEMPRE
      montada (no depende de activeChapter ni de Phaser en absoluto) — es el
      corazón narrativo del capítulo y vive independientemente del canvas.
    - ProjectOverlay v-if=activeProject.

  CSS: .ch6-layout / .ch6-canvas-host migrados a este <style scoped> por
  TASK-012 (criterio adicional heredado de TASK-008 — ver comentario del
  orquestador en tasks/TASK-012.json). El bloque .project-overlay* vive ahora
  en ProjectOverlay.vue (mismo motivo). La porción de ch2 en
  chapter-components.css NO se migra nunca (decisión TASK-008 registrada).

  Verified contracts:
    - tests/components/Chapter6Content.test.js
    - tests/components/Chapter6Content-lazy.test.js
    - tests/components/Chapter6Content-bridge.test.js
    - tests/components/Chapter6Content-resize.test.js
    - tests/components/Chapter6Content-prm.test.js
    - tests/components/Chapter6Content.raceZombie.test.js (TASK-022)
    - tests/components/Chapter6Content.raceDoubleInstance.test.js (TASK-022)
    - tests/a11y/keyboard-planet-buttons.test.js
    - tests/phaser/locale-bridge.test.js
    - tests/integration/chapter-overlap-ch6.test.js
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
import Ch6Terminal from './Ch6Terminal.vue'

// Composables — inject de App.vue.
const { activeChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')
const { t, locale } = useI18n()

// PHA-01: shallowRef — Phaser.Game NUNCA debe ser Vue-reactive-tracked.
const game = shallowRef(null)
const canvasHostRef = useTemplateRef('canvasHost')

// TASK-022 — flag de carga en vuelo (mismo patrón Ch2MiniGame.vue): un
// segundo disparo del watch mientras el import original sigue pendiente NO
// debe arrancar una segunda descarga/instancia.
const loading = ref(false)

// computeZoom real del factory — se resuelve DENTRO del chunk lazy (import
// dinámico) la primera vez que se monta, y se reutiliza en el ResizeObserver
// sin volver a importar top-level (rompería PHA-04). TASK-012: ya NO hay una
// copia local que calcule contra `window` — computeZoom(hostEl) vive en
// src/phaser/index.js y usa hostEl.getBoundingClientRect().
let computeZoomFn = null

// Bridge state Vue-side.
const arrivalDone = ref(false)
const activeProject = ref(null)

// 3 proyectos ch6 — usado por v-for de los sr-only buttons (D5-06).
const ch6Projects = computed(() => projects.filter((p) => p.chapterEra === 6))

/**
 * Aplica el anclaje del canvas en el host: bottom-aligned (clip cielo, no héroes)
 * y focal horizontal (center desktop, 30% world-left en portrait <600px).
 * (sin cambios funcionales — ver comentarios extensos en versiones previas)
 */
function applyCanvasAnchor(zoomValue) {
  if (!canvasHostRef.value) return
  const canvasEl = canvasHostRef.value.querySelector('canvas')
  if (!canvasEl) return

  canvasEl.style.marginLeft = '0'
  canvasEl.style.marginTop = '0'

  const hostW = canvasHostRef.value.offsetWidth
  const BASE_W = 960
  const canvasW = BASE_W * zoomValue
  const horizontalOverflow = canvasW - hostW

  let leftPx
  if (horizontalOverflow <= 0) {
    leftPx = -horizontalOverflow / 2
  } else {
    const isNarrow = hostW < 600
    const focalWorldX = isNarrow ? BASE_W * 0.30 : BASE_W * 0.50
    const focalCanvasX = focalWorldX * zoomValue
    const rawLeft = hostW / 2 - focalCanvasX
    const minLeft = hostW - canvasW
    leftPx = Math.max(minLeft, Math.min(0, rawLeft))
  }
  canvasEl.style.left = `${leftPx}px`
}

/**
 * TASK-022 — mountGame() con guard de entrada + re-chequeo post-await.
 * Réplica fiel de Ch2MiniGame.vue mountGame() (commit 9ed80dc, referencia
 * explícita del ticket). Dos escenarios que este guard cierra:
 *   1. Zombie: el visitante sale de ch6 antes de que el chunk resuelva → sin
 *      el re-chequeo, createGame() se invocaría igual y el rAF correría en
 *      background para siempre (destroy() en el watch de salida es no-op
 *      porque game.value seguía null).
 *   2. Doble instancia: salir y volver mientras el import original sigue en
 *      vuelo dispara un segundo mountGame() concurrente; sin `loading.value`
 *      en el guard de entrada, arrancaría una segunda descarga/instancia.
 */
async function mountGame() {
  if (game.value || loading.value) return
  if (!canvasHostRef.value) {
    await nextTick()
    if (!canvasHostRef.value) return
  }
  loading.value = true
  try {
    // PHA-04: lazy import string-literal — Vite separa el chunk Phaser.
    const { createGame, computeZoom } = await import('@/phaser')
    computeZoomFn = computeZoom

    // Re-chequeo post-await (TASK-022): si el capítulo activo ya no es ch6
    // mientras el chunk descargaba, NO se crea nada — evita el zombie.
    if (activeChapter.value !== 6 || !canvasHostRef.value) {
      return
    }

    game.value = createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })

    // Bridge IN — Phaser → Vue (D5-10 — sin prefijo `vue:`).
    game.value.events.on('show-project', (projectId) => {
      activeProject.value = projectId
    })
    game.value.events.on('arrival-complete', () => {
      arrivalDone.value = true
    })

    // Canvas anchor inicial — se aplica cuando Phaser terminó boot.
    const capturedGame = game.value
    capturedGame.events.once?.('ready', () => {
      applyCanvasAnchor(capturedGame.scale.zoom)
    })
  } catch (err) {
    console.error('[Chapter6Content] Failed to load Phaser:', err)
  } finally {
    loading.value = false
  }
}

function destroyGame() {
  if (game.value) {
    // PHA-02: destroy(true, false) — canvas removed, plugins preserved para re-entry.
    game.value.destroy(true, false)
    game.value = null
    // Reset state — al volver a entrar a ch6 la animación arrival re-ejecuta.
    arrivalDone.value = false
    activeProject.value = null
  }
}

// D5-11 / PHA-04 — watch immediate maneja mount inicial + destroy al salir.
// flush:'post' garantiza que el DOM ya tiene <div ref="canvasHost"> renderizado.
watch(
  activeChapter,
  (v) => {
    if (v === 6) {
      mountGame()
    } else {
      destroyGame()
    }
  },
  { immediate: true, flush: 'post' },
)

// PHA-06: Vue → Phaser locale bridge (D5-10 — sin prefijo `vue:`).
watch(locale, (newLocale) => {
  game.value?.events.emit('locale-changed', newLocale)
})

/**
 * Bridge DOM → Phaser (TASK-012 spec §4.2/§6.2): Ch6Terminal.vue emite estos
 * eventos Vue puros (no conoce Phaser); este componente los reenvía al
 * `game.events` real si existe. "El DOM manda, Phaser obedece" — si el game
 * aún no montó (o ya se destruyó), el null-guard hace que la emisión sea un
 * no-op silencioso; la conversación DOM sigue funcionando igual (spec §3: el
 * corazón del capítulo no depende de Phaser).
 */
function onAsciiProgress(progress) {
  game.value?.events.emit('ascii-progress', progress)
}
function onTokenTick() {
  game.value?.events.emit('token-tick')
}

// PHA-09 — Recalcula zoom cuando el viewport cambia + invoca setZoom solo si
// difiere del actual (anti-thrash). TASK-012: computeZoomFn(canvasHostRef.value)
// contra el rect del HOST, nunca contra `window`.
useResizeObserver(document.documentElement, () => {
  if (!game.value || !computeZoomFn || !canvasHostRef.value) return
  const newZoom = computeZoomFn(canvasHostRef.value)
  if (Math.abs(newZoom - game.value.scale.zoom) > 0.01) {
    game.value.scale.setZoom(newZoom)
  }
  applyCanvasAnchor(newZoom)
})

// HMR guard — owner de este guard es ESTE componente.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    destroyGame()
  })
}

// Defensive cleanup — si el componente se desmonta sin pasar por el watch.
onBeforeUnmount(() => {
  destroyGame()
})
</script>

<template>
  <div class="ch6-layout">
    <!-- Phaser canvas host. aria-hidden porque el canvas no es accesible a screen
         readers; los 3 sr-only buttons abajo replican accesibilidad. -->
    <div ref="canvasHost" class="ch6-canvas-host" aria-hidden="true" />

    <!--
      D5-06 — 3 sr-only buttons keyboard-navegables.
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
      TASK-012 — la conversación con la IA, DOM-first, SIEMPRE montada. No
      depende de activeChapter ni de arrivalDone: el texto completo (bio +
      mantra) vive en el DOM desde que Chapter6Content.vue monta, que ocurre
      al arrancar el sitio (ScrollShell mantiene los 7 capítulos siempre
      montados). El bridge hacia Phaser es unidireccional DOM → Phaser.
    -->
    <Ch6Terminal @ascii-progress="onAsciiProgress" @token-tick="onTokenTick" />

    <!--
      ProjectOverlay synthwave. Render condicional sobre activeProject ref
      (setado por bridge event o sr-only button click).
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
 * TASK-012 — migrado desde src/styles/chapter-components.css (criterio
 * adicional heredado de TASK-008, comentario del orquestador en
 * tasks/TASK-012.json). D5-09 Pattern 12 mitigation intacto: .ch6-layout SIN
 * overflow:hidden (creaba stacking context problemático en ch4 — bug Phase 4
 * deferred). Canvas full-bleed sin contenedor restrictivo.
 */
.ch6-layout {
  position: relative;
  width: 100%;
  height: 100%;
}

.ch6-canvas-host {
  position: absolute;
  inset: 0;
  /* overflow:hidden aquí (NO en .ch6-layout) clipea el exceso del canvas cover. */
  overflow: hidden;
}

.ch6-canvas-host :deep(canvas) {
  display: block;
  /* Anclaje bottom: `left` es manejado programáticamente por applyCanvasAnchor(). */
  position: absolute;
  bottom: 0;
}

/*
 * Estilo mínimo local — .sr-only utility (no existe global en el proyecto).
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
