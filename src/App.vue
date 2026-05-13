<script setup>
// App.vue — Layout root del walking skeleton (Plan 02) + PRM provider (Plan 03).
//
// Reemplaza el placeholder original con:
// - <ScrollShell /> renderizado como el único hijo de #app
// - useScrollState(shellRef) instanciado en setup() — el composable usa
//   `watch(shellRef, ..., { immediate: true, flush: 'post' })` internamente
//   así que NO importa que shellRef.value sea null en este momento (PATTERN A).
// - provide('scrollState', ...) para que futuros StickyAvatar/StickyTimeline puedan inject
// - Plan 03 (W2): usePRM() instanciado y provisto como 'prm' — single source of
//   truth para prefers-reduced-motion. Consumers (StickyAvatar Plan 04, StickyTimeline
//   Plan 05) lo inject('prm') sin prop drilling. UI-SPEC §8.
//
// El "function ref" pattern del template asigna `el.shellEl` (expuesto por
// ScrollShell vía defineExpose) al shellRef cuando ScrollShell monta. El watch
// interno del composable detecta el cambio de null → DOM element y dispara
// la inicialización (IO + listener + deep-link parsing).

import { ref, provide } from 'vue'
import ScrollShell from './components/ScrollShell.vue'
import StickyAvatar from './components/StickyAvatar.vue'
import StickyTimeline from './components/StickyTimeline.vue'
import { useScrollState } from './composables/useScrollState'
import { usePRM } from './composables/usePRM'

const shellRef = ref(null)
const scrollState = useScrollState(shellRef)
const prm = usePRM()

provide('scrollState', scrollState)
provide('prm', prm)
</script>

<template>
  <!-- Orden DOM (UI-SPEC §6): SkipLink (Plan 06) → StickyAvatar → ScrollShell → StickyTimeline.
       Los sticky elements son position: fixed; el orden DOM importa para tab order:
       el avatar es non-focusable, el ScrollShell es focusable (tabindex="0"),
       los 7 tick-buttons del StickyTimeline son focusables y vienen al final del Tab order.
       Visualmente el z-index controla la pila (avatar/timeline 40, skip-link 50). -->
  <StickyAvatar />
  <ScrollShell :ref="el => { shellRef.value = el?.shellEl ?? null }" />
  <StickyTimeline />
</template>

<!--
  Global tokens (UI-SPEC §3 + §4). NO scoped — declaran CSS Custom Properties
  en :root para que cualquier componente descendiente las consuma. Phase 2 las
  sobreescribirá por [data-chapter="N"] selectors a nivel de tema.
-->
<style>
:root {
  /* Spacing — UI-SPEC §3 */
  --sp-xs: 4px;
  --sp-sm: 8px;
  --sp-md: 16px;
  --sp-lg: 24px;
  --sp-xl: 32px;
  --sp-2xl: 48px;
  --sp-3xl: 64px;

  /* Color (paleta neutra Phase 1) — UI-SPEC §4 */
  --c-bg: #0b0b16;
  --c-fg: #e7e7f0;
  --c-surface: #1a1a2e;
  --c-border: #2e2e4a;
  --c-track: #2e2e4a;
  --c-track-active: #e7e7f0;
  --c-marker: #a0a0c0;
  --c-focus: #7dd3fc;
  --c-muted: #6b6b8a;
  --c-tick-hover: #c0c0d8;
}

/* PRM defensive CSS-side — D-01 (UI-SPEC §8 + RESEARCH §Área 5).
   El composable usePRM de Plan 03 añadirá el branch JS para scrollTo({behavior}). */
.scroll-shell {
  scroll-behavior: smooth;
}
@media (prefers-reduced-motion: reduce) {
  .scroll-shell {
    scroll-behavior: auto;
  }
}
</style>
