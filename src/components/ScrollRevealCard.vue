<!--
  ScrollRevealCard.vue — Reveal animation IntersectionObserver-driven (Plan 04-05 Task 3).

  Wrapper que aplica fade+slide-in cuando el card entra al viewport.
  Single-shot: una vez revealed, deja de observar (stop()).

  PRM defensive double:
  - JS-side: bajo prefersReduced, isRevealed init=true desde mount (sin IO trigger).
  - CSS-side: chapter-themes.css @media (prefers-reduced-motion: reduce) garantiza
    instant render aunque JS no corra o no capture el inject.

  Source: RESEARCH §Pattern 6 + UI-SPEC §6.7.
  Anti-pattern aceptable: 1 IO instance per card (vueuse maneja cleanup en onBeforeUnmount).
  Issue #896 (single observer per chapter) aplica solo a hand-rolled IO setups —
  vueuse useIntersectionObserver es safe.
-->
<script setup>
import { ref, inject, onBeforeUnmount } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps({
  threshold: {
    type: Number,
    default: 0.15,
  },
  delay: {
    type: Number,
    default: 0,
  },
})

const { prefersReduced } = inject('prm')
const cardEl = ref(null)
// PRM defensive JS-side: bajo PRM, ya está revelado al montar.
const isRevealed = ref(prefersReduced.value)

const { stop } = useIntersectionObserver(
  cardEl,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !isRevealed.value) {
      setTimeout(() => {
        isRevealed.value = true
      }, props.delay)
      stop() // single-shot reveal
    }
  },
  { threshold: props.threshold }
)

onBeforeUnmount(stop)
</script>

<template>
  <div
    ref="cardEl"
    class="scroll-reveal-card"
    :class="{ 'scroll-reveal-card--revealed': isRevealed }"
  >
    <slot />
  </div>
</template>
