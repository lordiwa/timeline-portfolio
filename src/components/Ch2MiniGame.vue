<!--
  Ch2MiniGame.vue — Vue shell del mini-advergame match-3 ch2 (Phase 04.2).

  Pattern heredado de Chapter6Content.vue:
    - shallowRef(null) para Phaser.Game (PHA-01 mandatory).
    - Lazy dynamic import del factory cuando active=true.
    - watch(active) monta/destruye game para no consumir CPU en otros paneles.
    - onBeforeUnmount destroy idempotent.
    - prefersReduced bridge via inject('prm').

  TASK-020 (2026-07-27) — gate de ciclo de vida a nivel de capítulo del sitio:
  antes de este fix, `active` (= panel local === 'home') era la ÚNICA señal, y
  ScrollShell.vue mantiene los 7 capítulos SIEMPRE montados — el juego arrancaba
  en el primer render de la página y solo pausaba su escena al cambiar de panel,
  jamás su Phaser.Game completo. `scene.pause()` no detiene el loop interno de
  Phaser (Phaser.DOM.RequestAnimationFrame.step seguía a ~60/s en ch0).

  Fix: se inyecta `scrollState` (provisto por App.vue) para leer el
  `activeChapter` del sitio, además de la noción local de panel que ya existía.
  Decisión de producto de Rafael 2026-07-27 ("que se destruya y recree como
  ch6, dale"): al salir de ch2 el Phaser.Game se DESTRUYE por completo; al
  volver, se RECREA — replicando el patrón watch(activeChapter) de
  Chapter6Content.vue. Consecuencia aceptada explícitamente: una partida en
  curso se pierde al scrollear fuera de ch2 y volver.

  La noción LOCAL de panel se preserva intacta: dentro de ch2, cambiar de panel
  (home → about/work/contact) sigue pausando/resumiendo la MISMA instancia
  (comportamiento pre-existente, evita recrear el juego en cada click de
  sidebar). Solo el ciclo de vida a nivel de capítulo se ata al patrón ch6.
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

const props = defineProps({
  active: { type: Boolean, default: false },
})

// Inject PRM (provided por App.vue Phase 1)
const { prefersReduced } = inject('prm', { prefersReduced: ref(false) })

// TASK-020 — inject scrollState (provisto por App.vue) para el gate site-level.
// Fallback ref(2) si no hay provider (tests unitarios aislados de este
// componente que no proveen scrollState): preserva el comportamiento previo
// donde el gate era puramente local (panel === 'home').
const scrollState = inject('scrollState', null)
const activeChapter = scrollState?.activeChapter ?? ref(2)
const isChapterActive = computed(() => activeChapter.value === 2)

const game = shallowRef(null)
const hostRef = useTemplateRef('canvasHost')
const loading = ref(false)

async function mountGame() {
  if (game.value) return
  // Defensive — flush:'post' should guarantee hostRef bound, pero retry tick por si acaso.
  if (!hostRef.value) {
    await nextTick()
    if (!hostRef.value) return
  }
  loading.value = true
  try {
    const { createMiniGame } = await import('@/phaser/ch2/index.js')
    if (!hostRef.value) {
      loading.value = false
      return
    }
    game.value = createMiniGame(hostRef.value, {
      prefersReduced: prefersReduced?.value ?? false,
    })
  } catch (err) {
    console.error('[Ch2MiniGame] Failed to load Phaser:', err)
  } finally {
    loading.value = false
  }
}

function destroyGame() {
  if (game.value) {
    game.value.destroy(true, false)
    game.value = null
  }
}

// Pause/resume preferred over destroy/recreate cuando el panel cambia — evita
// race conditions de Phaser global state (WebGL context, audio, scene plugins)
// cuando KeepAlive mantiene la HomePanel viva pero inactiva.
function pauseGame() {
  if (!game.value) return
  try { game.value.scene.pause('MatchScene') } catch {}
}
function resumeGame() {
  if (!game.value) return
  try { game.value.scene.resume('MatchScene') } catch {}
}

// TASK-020 — watch combinado: [panel local, capítulo del sitio].
// El gate de capítulo GANA sobre el de panel: fuera de ch2 se destruye
// siempre, sin importar el panel local (réplica exacta del patrón
// watch(activeChapter) de Chapter6Content.vue). Dentro de ch2, la lógica
// pause/resume/mount pre-existente por panel queda intacta.
watch(
  [() => props.active, isChapterActive],
  ([isActive, chapterActive]) => {
    if (!chapterActive) {
      destroyGame()
      return
    }
    if (isActive) {
      if (game.value) resumeGame()
      else mountGame()
    } else {
      pauseGame()
    }
  },
  { immediate: true, flush: 'post' }
)

onBeforeUnmount(destroyGame)

// HMR — destroy on dispose para evitar zombie games
if (import.meta.hot) {
  import.meta.hot.dispose(destroyGame)
}
</script>

<template>
  <div class="ch2-minigame" :class="{ 'ch2-minigame-loading': loading }">
    <div class="ch2-minigame-frame">
      <div ref="canvasHost" class="ch2-minigame-canvas-host"></div>
      <div v-if="loading" class="ch2-minigame-loader" aria-hidden="true">
        LOADING.GAME
      </div>
    </div>
    <div class="ch2-minigame-caption" aria-hidden="true">
      ▸ swap adjacent · match 3+ · timer 60s
    </div>
  </div>
</template>
