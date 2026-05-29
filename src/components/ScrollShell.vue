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
//
// Plan 05 (Wave 4): añade keyboard handlers ↑/↓/j/k/Home/End con clamping a
// [0..6] y PRM-aware behavior (D-04). El composable useScrollState provee
// activeChapter (para calcular target) y scrollToChapter (canonical method).
// usePRM provee prefersReduced para el branch behavior smooth/auto.
//
// El `.prevent` modifier de Vue llama event.preventDefault() declarativamente
// — esto bloquea que el browser intente hacer scroll por defecto con flechas
// (lo que causaría doble-trigger del scroll snap + nuestro scrollToChapter).

import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Chapter0Content from './Chapter0Content.vue'
import Chapter1Content from './Chapter1Content.vue'
import Chapter2Content from './Chapter2Content.vue'
import Chapter3Content from './Chapter3Content.vue'
import Chapter4Content from './Chapter4Content.vue'
import Chapter5Content from './Chapter5Content.vue'
import Chapter6Content from './Chapter6Content.vue'

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

const { t } = useI18n()
const shellEl = ref(null)

// Inject del scrollState (provisto por App.vue desde Plan 02) y del prm (Plan 03).
// Esta es la primera vez que ScrollShell consume el composable directamente —
// antes solo exponía el shellEl ref para que App.vue lo pasara al composable.
const { activeChapter, scrollToChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

// navigate(delta) — handler centralizado para los 6 keydown.
// delta puede ser:
//   - Number (-1 | +1): mover relativo al activeChapter actual, con clamping [0..6]
//   - 'home': ir a 0
//   - 'end': ir a 6
// El behavior se decide aquí (D-04): bajo PRM, 'auto' (jump instantáneo);
// default, 'smooth' (browser anima scrollTop).
function navigate(delta) {
  let target
  if (delta === 'home') target = 0
  else if (delta === 'end') target = 6
  else target = Math.max(0, Math.min(6, activeChapter.value + delta))
  scrollToChapter(target, prefersReduced.value ? 'auto' : 'smooth')
}

defineExpose({ shellEl })
</script>

<template>
  <main
    id="main-content"
    class="scroll-shell"
    tabindex="0"
    ref="shellEl"
    @keydown.up.prevent="navigate(-1)"
    @keydown.down.prevent="navigate(1)"
    @keydown.home.prevent="navigate('home')"
    @keydown.end.prevent="navigate('end')"
    @keydown.j.prevent="navigate(1)"
    @keydown.k.prevent="navigate(-1)"
  >
    <section
      v-for="ch in chapters"
      :key="ch.id"
      :id="`chapter-${ch.id}`"
      :data-chapter="ch.id"
      :aria-label="t('chapters.' + ch.id + '.title')"
      class="chapter-section"
    >
      <Chapter0Content v-if="ch.id === 0" />
      <Chapter1Content v-else-if="ch.id === 1" />
      <Chapter2Content v-else-if="ch.id === 2" />
      <Chapter3Content v-else-if="ch.id === 3" />
      <Chapter4Content v-else-if="ch.id === 4" />
      <Chapter5Content v-else-if="ch.id === 5" />
      <Chapter6Content v-else-if="ch.id === 6" />
      <!-- defensive: dead-branch post-Phase 5 — protege contra futuro ch7+
           si Rafael añade un chapter sin component dedicado. -->
      <div v-else class="chapter-placeholder">
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
  /* Fix arquitectural chapter-overlap bleed (Rafael 2026-05-17):
   * CUALQUIER child absoluto o con transform (ScrollRevealCard transforms,
   * GIFs ch1, starbursts ch3) puede sobresalir del section sin overflow:hidden.
   * Pattern 12 NO aplica aquí — el test ch6-overlap T2 prohíbe overflow:hidden
   * sólo en .ch{N}-layout (creaba stacking context que rompía scroll-snap),
   * NO en .chapter-section. */
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Transparente — BackgroundLayers (z:-1) pinta --c-bg + --bg-image (D2-04). */
  background: transparent;
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
