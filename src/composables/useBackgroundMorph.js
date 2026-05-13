// src/composables/useBackgroundMorph.js
// Motor de crossfade de 2 capas para background morph (Plan 02-04, Wave 3).
//
// Source: derivado de StickyAvatar.vue Phase 1 Plan 03 (avatar swap state machine)
// adaptado a 2 capas independientes con opacity crossfade.
//
// Decisions baked in:
//   D2-04 (2-layer architecture): layerA + layerB con opacity crossfade independiente.
//   D2-05 (200ms default sync con avatar / ≤150ms PRM): DEFAULT_DURATION_MS=200, PRM_DURATION_MS=150.
//   D-03 cross-cutting (PRM mid-flight recovery): watcher dedicado sobre prefersReduced.
//   Open-Q2-B locked 200ms: sync visual con avatar swap Phase 1.
//
// Contrato: UI-SPEC §7.4 (state machine flow + duration constants + PRM mid-flight recovery).
//
// API:
//   useBackgroundMorph(activeChapter: Ref<number>, prm: { prefersReduced: Ref<boolean> })
//   → { layerA, layerB, transitionPhase }
//
//   layerA/layerB: { chapter: Ref<number|null>, opacity: Ref<number 0..1> }
//   transitionPhase: Ref<'idle' | 'crossfading'>
//
// State machine:
//   Initial state:
//     layerA = { chapter: activeChapter.value, opacity: 1 }  ← visible, lleva el chapter inicial
//     layerB = { chapter: null, opacity: 0 }                 ← transparente, en espera
//     transitionPhase = 'idle'
//
//   On activeChapter change (N → M):
//     incoming.chapter = M (ANTES de tocar opacidades — data-chapter correcto en CSS)
//     transitionPhase = 'crossfading'
//     incoming.opacity = 1, outgoing.opacity = 0 (CSS transition handles interpolation)
//     setTimeout(duration): outgoing.chapter = null, transitionPhase = 'idle', flip activeLayer
//
//   Bajo PRM: duration = 150ms (crossfade más corto, NO instant — diferente del avatar D-02)
//   PRM mid-flight: watcher dedicado snap-finaliza sin esperar timer
//
// NO usa inject/provide — recibe args directamente. App.vue hace provide('bgMorph', bgMorph).
// NO referencia useScrollState ni scrollProgress — solo consume activeChapter discrete.
// Cleanup: onBeforeUnmount cancela pendingTimer (defensive contra HMR leaks).

import { ref, watch, onBeforeUnmount } from 'vue'

export const DEFAULT_DURATION_MS = 200  // Open-Q2-B locked to 200ms (sync avatar Phase 1)
export const PRM_DURATION_MS = 150      // D-03 cross-cutting Phase 1 (crossfade ≤150ms bajo PRM)

export function useBackgroundMorph(activeChapter, prm) {
  const { prefersReduced } = prm

  // ─────────────────────────────────────────────────────────────────────────
  // Estado inicial (UI-SPEC §7.4 verbatim):
  //   layerA visible con el chapter inicial, layerB transparente en espera.
  // ─────────────────────────────────────────────────────────────────────────
  const layerA = {
    chapter: ref(activeChapter.value),
    opacity: ref(1),
  }
  const layerB = {
    chapter: ref(null),
    opacity: ref(0),
  }

  const transitionPhase = ref('idle')

  // Closure-level bookkeeping — NOT refs (no re-renders por cambio interno).
  let pendingTimer = null
  let activeLayer = 'A' // which layer currently holds the visible chapter

  // ─────────────────────────────────────────────────────────────────────────
  // morph(newChapter): orquesta el crossfade entre capas.
  // Llamado por el watch principal en cada cambio de activeChapter.
  // ─────────────────────────────────────────────────────────────────────────
  function morph(newChapter) {
    // Defensive: cancelar cualquier timer en flight (rapid scroll protection, T6)
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }

    const duration = prefersReduced.value ? PRM_DURATION_MS : DEFAULT_DURATION_MS

    // Identificar incoming/outgoing por activeLayer (alternates cada morph)
    const incoming = activeLayer === 'A' ? layerB : layerA
    const outgoing = activeLayer === 'A' ? layerA : layerB

    // Paso crítico: set incoming.chapter ANTES de cambiar opacidades.
    // La CSS transition necesita leer data-chapter correcto del incoming
    // antes de que empiece la interpolación visual.
    incoming.chapter.value = newChapter
    transitionPhase.value = 'crossfading'

    // Disparar el crossfade via opacity bindings.
    // BackgroundLayers.vue declara `transition: opacity 200ms ease` en CSS scoped.
    incoming.opacity.value = 1
    outgoing.opacity.value = 0

    // Programar cleanup post-crossfade:
    //   - limpiar outgoing.chapter (queda en null, lista para el siguiente swap)
    //   - volver a 'idle'
    //   - flip activeLayer para el siguiente morph
    pendingTimer = setTimeout(() => {
      outgoing.chapter.value = null
      transitionPhase.value = 'idle'
      pendingTimer = null
      activeLayer = activeLayer === 'A' ? 'B' : 'A'
    }, duration)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Watch principal: dispara en cada cambio de activeChapter.
  // immediate: false → el estado inicial ya está construido arriba.
  // Guard if (newCh === oldCh) → T8 same-chapter noop.
  // ─────────────────────────────────────────────────────────────────────────
  watch(activeChapter, (newCh, oldCh) => {
    if (newCh === oldCh) return
    morph(newCh)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // PRM mid-flight recovery (análogo a HIGH 2 fix de StickyAvatar Plan 03).
  // Si el user activa PRM durante un crossfade, el watch de activeChapter
  // NO se redispara (su dependencia no cambió). Este watcher dedicado detecta
  // el toggle de prefersReduced y snap-finaliza el estado sin esperar el timer.
  // Previene que una layer quede atascada en opacity parcial.
  // ─────────────────────────────────────────────────────────────────────────
  watch(prefersReduced, (isPRM) => {
    if (isPRM && pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null

      // Snap al estado final: incoming queda visible, outgoing limpiada
      const incoming = activeLayer === 'A' ? layerB : layerA
      const outgoing = activeLayer === 'A' ? layerA : layerB
      incoming.opacity.value = 1
      outgoing.opacity.value = 0
      outgoing.chapter.value = null
      transitionPhase.value = 'idle'
      activeLayer = activeLayer === 'A' ? 'B' : 'A'
    }
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup: cancelar timer pendiente al desmontar el componente host.
  // Defensive contra HMR leaks y unmount mid-fade.
  // ─────────────────────────────────────────────────────────────────────────
  onBeforeUnmount(() => {
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }
  })

  return { layerA, layerB, transitionPhase }
}
