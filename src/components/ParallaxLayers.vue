<!--
  ParallaxLayers.vue — 4 capas parallax depth-staggered self-contained dentro del ch4.

  Plan 04-04 Task 3.1:
  - Pitfall 6 aplicado: localProgress = clamp((scrollProgress*7)-4, 0, 1) — mapea
    scrollProgress global 0..1 (sobre 7 chapters) a 0..1 dentro del rango de ch4.
  - Pitfall 7 aplicado: usa <img loading="lazy"> NO background-image CSS
    (background-image NO honra loading="lazy" — los 4 PNGs descargarían
    upfront aún si el chapter no es visible).
  - PRM (D4-10d): bajo prefersReduced, todos los layers usan factor 1.0 uniforme
    (sin diferencial = scroll natural sin depth effect).
  - aria-hidden=true: HUD visual decorativo puro, screen readers lo omiten.
  - will-change: transform sobre cada layer — compositor hint, evita re-paint.

  Source: RESEARCH §Pattern 1 (multi-layer parallax) + §Pitfalls 6,7 + §Pattern 7.
-->
<script setup>
import { computed, inject } from 'vue'

const { scrollProgress } = inject('scrollState')
const { prefersReduced } = inject('prm')

// 4 layers depth-staggered. Order: stars-far (slowest, z-0) → ships-near (fastest, z-3)
// Path .jpg para los 2 backgrounds opacos (forge_background output JPEG nativo D4-W2-01),
// .png para los 2 foregrounds con alpha (forge_sprite + bg_remove).
const layers = [
  { src: '/assets/ch4-bg-stars-far.jpg', factor: 0.2, name: 'stars' },
  { src: '/assets/ch4-bg-planet-mid.jpg', factor: 0.5, name: 'planet' },
  { src: '/assets/ch4-fg-panels.png', factor: 0.8, name: 'panels' },
  { src: '/assets/ch4-fg-ships.png', factor: 1.0, name: 'ships' },
]

// Pitfall 6 — scrollProgress global 0..1 sobre 7 chapters; ch4 ocupa rango [4/7, 5/7].
// Mapear a localProgress 0..1 dentro del chapter 4 antes de calcular translateY.
const localProgress = computed(() => {
  return Math.min(1, Math.max(0, scrollProgress.value * 7 - 4))
})

// translateY con factor escalonado. Centro del chapter (localProgress=0.5) → 0vh translate.
// Bajo PRM: factor uniforme 1.0 (sin depth effect — D4-10d).
function getTransform(factor) {
  const f = prefersReduced.value ? 1.0 : factor
  const offsetVh = (localProgress.value - 0.5) * f * 100
  return `translateY(${offsetVh}vh)`
}
</script>

<template>
  <div class="parallax-layers" aria-hidden="true">
    <img
      v-for="layer in layers"
      :key="layer.name"
      :src="layer.src"
      loading="lazy"
      alt=""
      :class="['parallax-layer', `parallax-layer--${layer.name}`]"
      :style="{ transform: getTransform(layer.factor) }"
    />
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────
 * Wrapper — absolute inset 0 dentro del .ch4-layout (Chapter4Content).
 * pointer-events: none → clics pasan al .ch4-content z-index 4.
 * z-index: 0 → debajo de meta+content (z-index: 4).
 * ───────────────────────────────────────────────────────────── */
.parallax-layers {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* ─────────────────────────────────────────────────────────────
 * Layer individual — height: 120% para overflow vertical sin
 * reveal de edge durante el translate (max ±50vh en localProgress
 * extremos = ±50% de viewport height).
 * object-fit: cover → la imagen se escala para llenar el frame.
 * image-rendering: pixelated → preserva crispness pixel art.
 * will-change: transform → hint compositor para promote a layer GPU.
 * ───────────────────────────────────────────────────────────── */
.parallax-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 120%;
  object-fit: cover;
  object-position: center;
  image-rendering: pixelated;
  will-change: transform;
}

/* z-index escalonado por capa para garantizar el orden visual */
.parallax-layer--stars  { z-index: 0; }
.parallax-layer--planet { z-index: 1; }
.parallax-layer--panels { z-index: 2; }
.parallax-layer--ships  { z-index: 3; }
</style>
