<!--
  FloatingPanel.vue — Card holographic AR/VR (Plan 04-04 Task 3.2).

  Glass holographic con backdrop-filter blur + @supports fallback (Pitfall 3).
  Estructura mínima — slot wrapper + título opcional. Styling vive en
  chapter-themes.css @layer components bajo [data-chapter="4"] .floating-panel
  para que aplique tokens ch4 via cascade (convención Phase 3 ProjectCard idem).

  Responsibilities:
  - Render slot (project content arbitrario).
  - Render h3 title si prop title presente (v-if).
  - DOM structural: <article class="floating-panel"> + <h3 class="floating-panel__title">.

  NO Responsibilities:
  - styling — vive en chapter-themes.css externalizado para era-cascade.
  - i18n — el llamador pasa título ya traducido.
-->
<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <article class="floating-panel">
    <h3 v-if="title" class="floating-panel__title">{{ title }}</h3>
    <slot />
  </article>
</template>
