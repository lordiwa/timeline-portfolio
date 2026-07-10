<!--
  EraTransition.vue — pixel dissolve wipe entre eras (Rafael 2026-07-10).

  Al cambiar activeChapter, una cuadrícula de "píxeles" gigantes del color de la
  era DESTINO inunda la pantalla con stagger aleatorio, sostiene un instante y se
  disuelve revelando la nueva era — el cambio de escena clásico de videojuego.
  Complementa (no reemplaza) el velo temporal sutil de App.vue (f3fad16).

  Contratos:
  - Colores: el overlay lleva :data-chapter="target" → hereda --c-bg/--c-accent
    del cascade de chapter-themes.css. Cero mapas de color duplicados.
  - El cruce 2→3 NO dispara wipe: el drenado+ceniza de Chapter2Content es el
    signature moment y es dueño de ese cruce.
  - PRM: sin wipe (es puro movimiento decorativo).
  - Retrigger en pleno vuelo (scroll rápido multi-era): NO se reinicia la
    animación; solo se re-apunta data-chapter (los píxeles cambian de color).
  - SFX whoosh solo si el engine ya está unlocked (mute lo maneja el master gain).
  - z-index 49: cubre HUDs (40) y velo (48); queda bajo skip-link (50) y boot (999).
-->
<script setup>
import { ref, inject, watch, onBeforeUnmount } from 'vue'
import { engine } from '@/audio/engine'
import { whoosh } from '@/audio/sfx'

const COLS = 24
const ROWS = 14
const CELL_ANIM_MS = 200   // duración de la animación de cada celda
const MAX_DELAY_MS = 150   // stagger aleatorio máximo por celda
const HOLD_MS = 100        // pantalla llena antes de disolver
const IN_MS = CELL_ANIM_MS + MAX_DELAY_MS

const scrollState = inject('scrollState', null)
const prm = inject('prm', null)

const active = ref(false)
const phase = ref('in')          // 'in' | 'out'
const target = ref(0)
// Por celda: delay de entrada y de salida independientes (la disolución no
// debe ser el espejo exacto de la inundación — se vería mecánica).
const cells = ref([])

let holdTimer = null
let endTimer = null

function reduced() {
  return prm?.prefersReduced?.value === true
}

function buildCells() {
  const list = []
  for (let i = 0; i < COLS * ROWS; i++) {
    list.push({
      din: Math.round(Math.random() * MAX_DELAY_MS),
      dout: Math.round(Math.random() * MAX_DELAY_MS),
    })
  }
  cells.value = list
}

function fire(n) {
  target.value = n
  if (active.value) return   // re-apuntado en vuelo: solo cambia el color

  buildCells()
  phase.value = 'in'
  active.value = true
  if (engine.isUnlocked()) whoosh()

  holdTimer = setTimeout(() => { phase.value = 'out' }, IN_MS + HOLD_MS)
  endTimer = setTimeout(() => { active.value = false }, IN_MS + HOLD_MS + IN_MS + 50)
}

if (scrollState?.activeChapter) {
  watch(scrollState.activeChapter, (n, o) => {
    if (o === undefined || n === o) return
    if (reduced()) return
    if (o === 2 && n === 3) return   // el drenado de ch2 es dueño de ese cruce
    fire(n)
  })
}

onBeforeUnmount(() => {
  clearTimeout(holdTimer)
  clearTimeout(endTimer)
})
</script>

<template>
  <div
    v-if="active"
    class="era-transition"
    :class="`era-transition--${phase}`"
    :data-chapter="target"
    aria-hidden="true"
  >
    <div
      v-for="(c, i) in cells"
      :key="i"
      class="era-transition__cell"
      :style="{ '--din': c.din + 'ms', '--dout': c.dout + 'ms' }"
    />
  </div>
</template>

<style scoped>
.era-transition {
  position: fixed;
  inset: 0;
  z-index: 49;
  pointer-events: none;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: repeat(14, 1fr);
}

.era-transition__cell {
  /* Color de la era destino: fondo teñido con su acento, vía cascade */
  background: color-mix(in srgb, var(--c-bg, #000) 76%, var(--c-accent, #fff));
  opacity: 0;
}

/* steps(2) = el "pop" chunky de píxel, sin fade suave */
.era-transition--in .era-transition__cell {
  animation: era-cell-in 200ms steps(2, end) forwards;
  animation-delay: var(--din);
}

.era-transition--out .era-transition__cell {
  opacity: 1;
  animation: era-cell-out 200ms steps(2, end) forwards;
  animation-delay: var(--dout);
}

@keyframes era-cell-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes era-cell-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}

/* PRM: cinturón extra — el watcher ya no dispara, pero si algo montara el
   overlay bajo PRM, que no anime. */
@media (prefers-reduced-motion: reduce) {
  .era-transition--in .era-transition__cell,
  .era-transition--out .era-transition__cell {
    animation: none;
  }
}
</style>
