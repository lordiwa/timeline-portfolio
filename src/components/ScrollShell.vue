<script setup>
// ScrollShell.vue
// Componente raíz scrolleable de Phase 1.
//
// Renderiza 7 ChapterSection inline + CSS scroll-snap-y mandatory.
//
// Diseño: las 7 sections viven inline (no componente separado) para mantener
// el código corto y verifiable. Phase 2 podría extraerlas si themes lo justifican.
//
// El `<main>` raíz se expone vía defineExpose({ shellEl }) para que App.vue
// pueda asignar la referencia DOM al shellRef que useScrollState está observando.

import { ref } from 'vue'

// Single source of truth para los chapters de Phase 1. Copiado de UI-SPEC §7.1.
const chapters = [
  { id: 0, year: 1995, era: 'Terminal' },
  { id: 1, year: 2001, era: 'HTML 90s' },
  { id: 2, year: 2009, era: 'Flash' },
  { id: 3, year: 2013, era: 'Web 2.0' },
  { id: 4, year: 2015, era: 'AR/VR' },
  { id: 5, year: 2022, era: 'Modern' },
  { id: 6, year: 2026, era: 'Phaser' },
]

const shellEl = ref(null)

defineExpose({ shellEl })
</script>

<template>
  <main
    id="main-content"
    class="scroll-shell"
    tabindex="0"
    ref="shellEl"
  >
    <section
      v-for="ch in chapters"
      :key="ch.id"
      :id="`chapter-${ch.id}`"
      :data-chapter="ch.id"
      :aria-label="`${ch.era} — ${ch.year}`"
      class="chapter-section"
    >
      <div class="chapter-placeholder">
        <p class="era-title">{{ ch.year }} · {{ ch.era }}</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * ScrollShell root
 * - CORE-01: scroll-snap-type: y mandatory
 * - CORE-08: 100vh fallback + 100dvh (older Safari fallback first)
 * - iOS-01: -webkit-overflow-scrolling: touch
 * - A11Y-02 (parcial): outline none → :focus-visible se sobreescribe en Plan 06
 * ───────────────────────────────────────────────────────────────────────── */
.scroll-shell {
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  outline: none;
}

/* ─────────────────────────────────────────────────────────────────────────
 * ChapterSection
 * - CORE-02 (parcial): cada section es un viewport-height block
 * - CORE-04: scroll-snap-align: start + scroll-snap-stop: always (no skipping)
 * - CORE-08: 100vh fallback + 100dvh
 * - UI-SPEC §7.1: flex center para alinear el era title
 * ───────────────────────────────────────────────────────────────────────── */
.chapter-section {
  height: 100vh;
  height: 100dvh;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg);
  color: var(--c-fg);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Era title placeholder (UI-SPEC §5, §9)
 * Padding reserva espacio para avatar (top) y timeline (bottom),
 * aunque esos componentes aún no existan (vienen en Plans 04-05).
 * ───────────────────────────────────────────────────────────────────────── */
.chapter-placeholder {
  padding-top: calc(80px + var(--sp-md));
  padding-bottom: calc(48px + var(--sp-sm));
  padding-left: var(--sp-lg);
  padding-right: var(--sp-lg);
  text-align: center;
}

.era-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
}
</style>
