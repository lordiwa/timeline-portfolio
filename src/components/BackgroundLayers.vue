<script setup>
// BackgroundLayers.vue — HUD invariante de background morph (Plan 02-04, Wave 3).
//
// Propósito: renderizar 2 capas full-viewport apiladas detrás de todo el contenido
// para el crossfade de background entre chapters. No es focusable, no intercepta
// clicks, no aparece en el árbol de accesibilidad (aria-hidden="true").
//
// Source: UI-SPEC §7 (DOM contract §7.1 + CSS contract §7.2 + DOM order §7.3)
// Decisions baked in: D2-04 (2-layer crossfade architecture), D2-05 (200ms/150ms PRM)
//
// Consume bgMorph via inject('bgMorph') — provisto por App.vue tras Plan 02-04 wiring.
// La reactividad llega desde useBackgroundMorph via layerA/layerB refs.
//
// Debe ser el PRIMER hijo del template root de App.vue (UI-SPEC §7.3 + z-index stacking):
//   BackgroundLayers (z-index: -1) → SkipLink → StickyAvatar → ScrollShell → StickyTimeline → LangToggle
//
// CSS scoped UI-SPEC §7.2 VERBATIM:
//   .bg-layers: position:fixed; inset:0; z-index:-1; pointer-events:none
//   .bg-layer:  position:absolute; inset:0; background:var(--c-bg); transition:opacity 200ms ease
//   @media(prefers-reduced-motion:reduce): transition:opacity 150ms ease (D-03 cross-cutting)

import { inject } from 'vue'

const { layerA, layerB } = inject('bgMorph')
</script>

<template>
  <!-- aria-hidden: HUD decorativo puro — screen readers no deben anunciar el fondo.
       No es focusable + pointer-events:none: los clics pasan al contenido debajo. -->
  <div class="bg-layers" aria-hidden="true">
    <div
      class="bg-layer bg-layer-a"
      :data-chapter="layerA.chapter.value"
      :style="{ opacity: layerA.opacity.value }"
    ></div>
    <div
      class="bg-layer bg-layer-b"
      :data-chapter="layerB.chapter.value"
      :style="{ opacity: layerB.opacity.value }"
    ></div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * Wrapper — UI-SPEC §7.2 VERBATIM.
 * - position: fixed (no sticky — cubre todo el viewport sin scroll)
 * - inset: 0 (shorthand para top:0 right:0 bottom:0 left:0)
 * - z-index: -1 — detrás de CUALQUIER otro elemento positional (z=0+)
 * - pointer-events: none — los clics pasan al contenido encima
 *   (sin esto, el fondo absorbería todos los clicks aunque sea invisible)
 * ───────────────────────────────────────────────────────────────────────── */
.bg-layers {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Capa individual — UI-SPEC §7.2 VERBATIM.
 * - position: absolute; inset: 0 — llena el wrapper completamente
 * - background: var(--c-bg) — token resuelto por [data-chapter="N"] del
 *   chapter-themes.css (W2). Cuando data-chapter cambia reactivamente,
 *   --c-bg toma el valor del nuevo chapter automáticamente.
 * - transition: opacity 200ms ease — el crossfade visual entre layers.
 *   El timing 200ms es intencionalmente IGUAL al avatar swap Phase 1 (D2-05).
 * ───────────────────────────────────────────────────────────────────────── */
.bg-layer {
  position: absolute;
  inset: 0;
  background: var(--c-bg);
  transition: opacity 200ms ease;
}

/* ─────────────────────────────────────────────────────────────────────────
 * PRM branch — D-03 cross-cutting (UI-SPEC §7.2 verbatim).
 * Reduce la duración a 150ms bajo prefers-reduced-motion: reduce.
 * DIFERENTE del avatar swap (D-02) que es instant bajo PRM — el bg morph
 * mantiene crossfade (≤150ms) para que el cambio de color sea perceptible.
 * El composable useBackgroundMorph también usa PRM_DURATION_MS=150 para
 * el setTimeout de cleanup (sync entre JS y CSS side).
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .bg-layer {
    transition: opacity 150ms ease;
  }
}
</style>
