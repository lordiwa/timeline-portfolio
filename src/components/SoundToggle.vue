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
const unlocked = computed(() => engine.isUnlocked())

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
    await engine.unlock()
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
  bottom: var(--sp-md);
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
  border: 1.5px solid color-mix(in srgb, var(--c-accent) 40%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--c-surface) 85%, transparent);
  cursor: pointer;

  color: var(--c-fg);
  transition: border-color 150ms, background 150ms, opacity 150ms;
}

.sound-toggle:hover {
  border-color: var(--c-accent);
  background: color-mix(in srgb, var(--c-surface) 95%, var(--c-accent));
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
  color: color-mix(in srgb, var(--c-fg) 60%, #f87171);
}

/* PRM: sin transitions (el color no es movimiento visual
   pero el fadeo del border sí puede molestar bajo PRM) */
@media (prefers-reduced-motion: reduce) {
  .sound-toggle {
    transition: none;
  }
}

/* Mobile: tap target garantizado */
@media (max-width: 599px) {
  .sound-toggle {
    bottom: var(--sp-sm);
    left: var(--sp-sm);
  }
}
</style>
