<!--
  SoundToggle.vue — botón HUD fijo para controlar el sonido.

  Posición: esquina inferior izquierda (bottom-left), sobre la StickyTimeline
  (que es top, izquierda) pero no choca con ContactHUD (bottom-right).
  z-index: 40 — mismo nivel que el resto de HUDs.

  Estados:
    on    — sonido activo, icono altavoz con ondas
    off   — silenciado, icono altavoz con X
    locked — AudioContext aún no unlocked (BootScreen no completado),
             icono altavoz con candado; click hace unlock

  Icono: pixel art 10×10 en SVG inline (shape-rendering: crispEdges).
  Sin imágenes externas — 100% CSS/SVG.

  PRM: el botón es siempre visible y funcional (el audio no es visual).
  Pero se ajusta el transition a 0ms bajo PRM (sin animación del icono).

  i18n: aria-label en es/en via claves audio.*
-->
<script setup>
import { inject, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { engine } from '@/audio/engine'

const { t } = useI18n()

// Recibe el objeto de audio del provide en App.vue
const audio = inject('audio', null)

const muted = computed(() => audio?.muted?.value ?? engine.isMuted())
// Vía el ref reactivo del composable — engine.isUnlocked() no es reactivo y un
// computed sobre él se cachea para siempre en su primer valor (bug del unlock fantasma).
const unlocked = computed(() => audio?.unlocked?.value ?? engine.isUnlocked())

const state = computed(() => {
  if (!unlocked.value) return 'locked'
  return muted.value ? 'off' : 'on'
})

const ariaLabel = computed(() => {
  if (state.value === 'locked') return t('audio.soundLocked')
  return muted.value ? t('audio.soundOff') : t('audio.soundOn')
})

async function handleClick() {
  if (!engine.isUnlocked()) {
    // No debería ocurrir (BootScreen hace el unlock), pero como safety:
    await (audio?.unlock?.() ?? engine.unlock())
    audio?.playCurrentEra?.(0)
    return
  }
  audio?.toggle?.()
}
</script>

<template>
  <button
    class="sound-toggle"
    :class="[`sound-toggle--${state}`]"
    :aria-label="ariaLabel"
    :aria-pressed="state === 'on'"
    type="button"
    @click="handleClick"
  >
    <!-- Icono altavoz pixel-art (10×10 SVG, crispEdges) -->

    <!-- Estado: ON — altavoz con dos ondas -->
    <svg
      v-if="state === 'on'"
      viewBox="0 0 10 10"
      width="20"
      height="20"
      aria-hidden="true"
      shape-rendering="crispEdges"
      class="sound-toggle__icon"
    >
      <!-- Cuerpo del altavoz -->
      <rect x="1" y="3" width="2" height="4" />
      <rect x="3" y="2" width="1" height="6" />
      <!-- Cuerno del altavoz -->
      <rect x="4" y="1" width="1" height="8" />
      <!-- Ondas de sonido -->
      <rect x="6" y="3" width="1" height="4" />
      <rect x="8" y="2" width="1" height="6" />
    </svg>

    <!-- Estado: OFF — altavoz con X -->
    <svg
      v-else-if="state === 'off'"
      viewBox="0 0 10 10"
      width="20"
      height="20"
      aria-hidden="true"
      shape-rendering="crispEdges"
      class="sound-toggle__icon"
    >
      <!-- Cuerpo del altavoz -->
      <rect x="1" y="3" width="2" height="4" />
      <rect x="3" y="2" width="1" height="6" />
      <rect x="4" y="1" width="1" height="8" />
      <!-- X de silencio -->
      <rect x="6" y="2" width="1" height="1" />
      <rect x="7" y="3" width="1" height="1" />
      <rect x="8" y="4" width="1" height="1" />
      <rect x="7" y="5" width="1" height="1" />
      <rect x="6" y="6" width="1" height="1" />
      <rect x="8" y="2" width="1" height="1" />
      <rect x="7" y="3" width="1" height="1" />
      <rect x="6" y="4" width="1" height="1" />
      <rect x="7" y="5" width="1" height="1" />
      <rect x="8" y="6" width="1" height="1" />
    </svg>

    <!-- Estado: LOCKED — altavoz con candado -->
    <svg
      v-else
      viewBox="0 0 10 10"
      width="20"
      height="20"
      aria-hidden="true"
      shape-rendering="crispEdges"
      class="sound-toggle__icon"
    >
      <!-- Cuerpo del altavoz (atenuado) -->
      <rect x="1" y="3" width="2" height="4" />
      <rect x="3" y="2" width="1" height="6" />
      <rect x="4" y="1" width="1" height="8" />
      <!-- Candado -->
      <rect x="6" y="5" width="3" height="3" />
      <rect x="7" y="3" width="1" height="3" />
      <rect x="6" y="4" width="1" height="1" />
      <rect x="8" y="4" width="1" height="1" />
    </svg>
  </button>
</template>

<style scoped>
.sound-toggle {
  position: fixed;
  /* TASK-019 — AC5: en desktop (1536×791 dpr1.25, el viewport real de
     Rafael) el `bottom: var(--sp-md)` original (16px) caía encima del HUD
     diegético `.ch4-hud-bl` de Chapter4Content.vue ("FPS 72.4 │ LATENCY
     11ms", bottom:12px/left:14px, ~37-45px de alto) — medido en Chrome real,
     el icono tapaba el bloque "FPS". Se sube el piso a 60px (16 + 44, el
     alto de un tap target) para despejar cualquier HUD de esquina de ~44px
     de alto sin depender de saber la altura exacta de cada capítulo (fix
     sistémico, no un offset ad-hoc sólo para ch4). Mobile (abajo) conserva
     su propio valor sin cambios. */
  bottom: calc(var(--sp-md) + 44px);
  left: var(--sp-md);
  z-index: 40;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 44px;
  min-width: 44px;
  height: 44px;
  min-height: 44px;

  padding: 0;
  /* TASK-008: material RAFAEL-OS (chassis.css §6.2), unificado con el resto
     del chasis (antes usaba --c-surface como base de vidrio; todo HUD fijo
     ahora comparte el mismo --hud-glass derivado de --c-bg). */
  border: 1.5px solid var(--hud-line);
  border-radius: var(--hud-radius);
  background: var(--hud-glass);
  cursor: pointer;

  color: var(--hud-fg);
  transition: border-color 150ms, background 150ms, opacity 150ms;
}

.sound-toggle:hover {
  border-color: var(--c-accent);
  background: color-mix(in srgb, var(--hud-glass) 60%, var(--c-accent));
}

/* SVG fill hereda del color del botón */
.sound-toggle__icon rect {
  fill: currentColor;
}

/* Estado locked: más tenue para indicar que está esperando */
.sound-toggle--locked {
  opacity: 0.55;
}

.sound-toggle--locked:hover {
  opacity: 0.85;
}

/* Estado off: acento rojizo para indicar silencio */
.sound-toggle--off {
  color: color-mix(in srgb, var(--hud-fg) 60%, #f87171);
}

/* PRM: sin transitions (el color no es movimiento visual
   pero el fadeo del border sí puede molestar bajo PRM) */
@media (prefers-reduced-motion: reduce) {
  .sound-toggle {
    transition: none;
  }
}

/* Mobile: tap target garantizado. TASK-019: `(max-height: 500px)` añadido
   para que mobile landscape (ancho > 599px pero alto corto de teléfono, ej.
   844×390) reciba el mismo inset compacto en vez del lift de +44px del
   bloque desktop de arriba — ese lift es para despejar HUD de esquina en
   viewports altos, innecesario aquí porque ContactHUD/StickyTimeline ya
   compactan su propia huella en este mismo breakpoint (ver sus componentes). */
@media (max-width: 599px), (max-height: 500px) {
  .sound-toggle {
    bottom: var(--sp-sm);
    left: var(--sp-sm);
  }
}
</style>
