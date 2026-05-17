<!--
  FlashPreloader.vue — Y2K cyber preloader for ch2 (Phase 04.1).

  Behavior:
  - Trigger: visible-prop toggled by parent on viewport-enter (IntersectionObserver
    lives in Chapter2Content; this component just animates when visible flips true).
  - Animation: 1.2s fake load. Progress 0→100 via requestAnimationFrame.
  - prefers-reduced-motion: skip the bar animation, show 100% immediately and emit ready.
  - Emits: 'ready' when progress hits 100, parent uses this to hide the preloader overlay.
-->
<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  durationMs: { type: Number, default: 1200 },
})
const emit = defineEmits(['ready'])

const progress = ref(0)
let raf = null
let startedAt = 0

const prm = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function tick(now) {
  const elapsed = now - startedAt
  const pct = Math.min(100, Math.round((elapsed / props.durationMs) * 100))
  progress.value = pct
  if (pct >= 100) {
    raf = null
    emit('ready')
    return
  }
  raf = requestAnimationFrame(tick)
}

function start() {
  progress.value = 0
  if (prm) {
    progress.value = 100
    emit('ready')
    return
  }
  if (raf) cancelAnimationFrame(raf)
  startedAt = performance.now()
  raf = requestAnimationFrame(tick)
}

function stop() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = null
  }
}

watch(() => props.visible, (v) => {
  if (v) start()
  else stop()
}, { immediate: true })

onUnmounted(stop)
</script>

<template>
  <div v-if="visible" class="flash-preloader" role="status" aria-live="polite" aria-label="Loading">
    <div class="flash-preloader-spinner" aria-hidden="true">
      <span class="flash-preloader-cube"></span>
    </div>
    <div class="flash-preloader-bar" aria-hidden="true">
      <div class="flash-preloader-fill" :style="{ width: progress + '%' }"></div>
    </div>
    <div class="flash-preloader-label">LOADING {{ progress }}%</div>
    <div class="flash-preloader-sub">flash player 9 · initializing stage</div>
  </div>
</template>
