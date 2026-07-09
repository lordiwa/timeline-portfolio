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

import { inject, ref, watch } from 'vue'

const { layerA, layerB } = inject('bgMorph')

// Ken Burns 2026-07-09: cuando una capa recibe un chapter nuevo (incoming),
// dispara drift scale 1.035 → 1.0 en 1.2s ease-out (solo transform).
// prm inyectado con fallback para entornos de test sin provide('prm').
const { prefersReduced } = inject('prm', { prefersReduced: ref(false) })

const kbA = ref(false)
const kbB = ref(false)

watch(layerA.chapter, (newCh, oldCh) => {
  if (prefersReduced.value || newCh === null || newCh === oldCh) return
  kbA.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => { kbA.value = true }))
})

watch(layerB.chapter, (newCh, oldCh) => {
  if (prefersReduced.value || newCh === null || newCh === oldCh) return
  kbB.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => { kbB.value = true }))
})
</script>

<template>
  <!-- aria-hidden: HUD decorativo puro — screen readers no deben anunciar el fondo.
       No es focusable + pointer-events:none: los clics pasan al contenido debajo. -->
  <div class="bg-layers" aria-hidden="true">
    <div
      class="bg-layer bg-layer-a"
      :class="{ 'bg-layer--kb': kbA }"
      :data-chapter="layerA.chapter.value"
      :style="{ opacity: layerA.opacity.value }"
    ></div>
    <div
      class="bg-layer bg-layer-b"
      :class="{ 'bg-layer--kb': kbB }"
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
  /* Shorthand `background` (no background-color): contrato de diseño T7.
     Resetea sub-props a initial; background-image/size/position se re-declaran abajo. */
  background: var(--c-bg);
  background-image: var(--bg-image, none);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* Pixel art crisp scaling — chapter bg assets vienen de pixelforge */
  image-rendering: pixelated;
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

/* ─────────────────────────────────────────────────────────────────────────
 * Vignette cinematográfica global (redesign 2026-07-09).
 * Pseudo-elemento sobre ambas capas: oscurece sutilmente los bordes del
 * viewport y enfoca la mirada al centro. Funciona en themes oscuros Y claros
 * (multiply sobre blanco = gris suave). Cero DOM nuevo, cero interacción
 * (el wrapper ya es pointer-events:none + aria-hidden).
 * ───────────────────────────────────────────────────────────────────────── */
.bg-layers::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    120% 95% at 50% 42%,
    transparent 58%,
    rgba(4, 4, 14, 0.34) 100%
  );
  mix-blend-mode: multiply;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Ken Burns (transiciones de era 2026-07-09).
 * La capa incoming arranca en scale(1.035) y drifta suavemente a scale(1.0)
 * en 1.2s ease-out. Solo transform: sin impacto en opacity ni layout.
 * .bg-layer--kb se añade via JS watch en layerN.chapter; se retira al acabar.
 * PRM: el watcher JS ya no aplica kbN=true bajo prefersReduced — no llega aquí.
 * ────────────────────────────────────────────────────────────────────────── */
@keyframes ken-burns {
  from { transform: scale(1.035); }
  to   { transform: scale(1); }
}

.bg-layer--kb {
  animation: ken-burns 1.2s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .bg-layer--kb {
    animation: none;
  }
}
</style>
