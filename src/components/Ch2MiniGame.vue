<!--
  Ch2MiniGame.vue — Vue shell del mini-advergame match-3 ch2 (Phase 04.2).

  Pattern heredado de Chapter6Content.vue:
    - shallowRef(null) para Phaser.Game (PHA-01 mandatory).
    - Lazy dynamic import del factory cuando active=true.
    - watch(active) monta/destruye game para no consumir CPU en otros paneles.
    - onBeforeUnmount destroy idempotent.
    - prefersReduced bridge via inject('prm').
-->
<script setup>
import { shallowRef, ref, watch, onBeforeUnmount, inject, useTemplateRef, nextTick } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false },
})

// Inject PRM (provided por App.vue Phase 1)
const { prefersReduced } = inject('prm', { prefersReduced: ref(false) })

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

watch(
  () => props.active,
  (isActive) => {
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
