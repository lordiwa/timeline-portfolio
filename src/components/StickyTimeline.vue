<script setup>
// StickyTimeline.vue — Segundo ancla sticky funcional de Phase 1 (Plan 05, Wave 4).
//
// Renderiza un <nav> fijo bottom full-width con:
//   - .timeline-track: track horizontal de fondo
//   - .timeline-marker: puck (16px circular) que se mueve continuamente derivado
//     de scrollProgress (0..1) → left: 0%..100%. Sin transition (binding de
//     gesto, no animación CSS — UI-SPEC §7.3 + RESEARCH §Area 7).
//   - .timeline-ticks: <ol> con 7 <button class="tick-button"> distribuidos
//     uniformemente (justify-content: space-between). Cada tick tiene
//     aria-label="Ir a {era} ({year})", aria-current reactivo, touch target
//     ≥44×44px (UI-SPEC §3 excepción declarada, §7.3 min-width/min-height).
//
// Inputs (vía inject):
//   - scrollState.activeChapter:   Ref<number> (readonly) — provisto por App.vue
//   - scrollState.scrollProgress:  Ref<number 0..1> (readonly) — provisto por App.vue
//   - scrollState.scrollToChapter: (N, behavior) → void
//   - prm.prefersReduced:          ComputedRef<boolean>
//
// Motion contract (UI-SPEC §8 + D-04):
//   - Default click: scrollToChapter(N, 'smooth') → el browser anima scrollTop;
//     el RAF en useScrollState actualiza scrollProgress 60fps; el marker (left
//     bindeado a scrollProgress) se mueve continuamente con el scroll. NO salta
//     de golpe.
//   - PRM click (D-04): scrollToChapter(N, 'auto') → scrollTop salta instantáneo
//     → scrollProgress salta → marker salta. Esperado bajo PRM.
//   - El binding del marker NO tiene transition CSS (transition: left 0ms linear)
//     — es data binding 60fps, no animación temporal.
//
// HIGH 4 fix — env(safe-area-inset-bottom) preventivo:
//   El CSS declara `bottom: env(safe-area-inset-bottom, 0)` desde day 1 (no
//   condicional post-Plan 07 smoke test). Fallback graceful a `0` en browsers
//   sin notch (Chrome desktop, Firefox, Safari macOS). En iPhone con notch /
//   Dynamic Island, el inset previene overlap con la Safari toolbar dinámica.
//   Zero downside — solo evita un re-test loop si iOS-02 detecta overlap.
//
// chapters array: duplicado de ScrollShell.vue (decisión locked en plan §key-decisions).
// Phase 3 consolida en src/data/chapters.js con metadata expandida (i18n, assets).

import { computed, inject } from 'vue'

// Single source of Phase 1 chapter data — copiado de UI-SPEC §7.1.
const chapters = [
  { id: 0, year: 1995, era: 'Terminal' },
  { id: 1, year: 2001, era: 'HTML 90s' },
  { id: 2, year: 2009, era: 'Flash' },
  { id: 3, year: 2013, era: 'Web 2.0' },
  { id: 4, year: 2015, era: 'AR/VR' },
  { id: 5, year: 2022, era: 'Modern' },
  { id: 6, year: 2026, era: 'Phaser' },
]

const { activeChapter, scrollProgress, scrollToChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

// Marker left position: bind 1:1 a scrollProgress (0..1) → 0%..100%.
// Computed para que Vue gestione el rebind reactivo. El RAF en useScrollState
// muta scrollProgress 60fps mientras hay scroll activo → este computed se
// reevalúa cada frame → el style binding del template actualiza el DOM.
// transition: left 0ms linear en el CSS previene cualquier ease que herede.
const markerLeft = computed(() => `${scrollProgress.value * 100}%`)

// Click handler: D-04 — switch behavior según PRM.
// El composable acepta 'smooth' o 'auto' como parámetro libre; este componente
// decide cuál pasar. Bajo PRM, scrollTop salta instantáneo (correcto, no bug).
function onTickClick(N) {
  const behavior = prefersReduced.value ? 'auto' : 'smooth'
  scrollToChapter(N, behavior)
}
</script>

<template>
  <nav
    class="sticky-timeline"
    aria-label="Navegación de capítulos por era"
    role="navigation"
  >
    <div class="timeline-track" aria-hidden="true">
      <div
        class="timeline-marker"
        aria-hidden="true"
        :style="{ left: markerLeft }"
      ></div>
    </div>

    <ol class="timeline-ticks" role="list">
      <li
        v-for="ch in chapters"
        :key="ch.id"
        class="timeline-tick"
        role="listitem"
      >
        <button
          class="tick-button"
          :data-chapter="ch.id"
          :aria-label="`Ir a ${ch.era} (${ch.year})`"
          :aria-current="activeChapter === ch.id ? 'true' : undefined"
          @click="onTickClick(ch.id)"
        >
          <span class="tick-notch" aria-hidden="true"></span>
          <span class="tick-year">{{ ch.year }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * StickyTimeline shell — UI-SPEC §7.3 verbatim.
 * - position: fixed bottom — usa env(safe-area-inset-bottom, 0) PREVENTIVAMENTE
 *   desde day 1 (HIGH 4 fix). Fallback graceful a 0 en browsers sin notch.
 *   En iPhone con notch / Dynamic Island previene overlap con Safari toolbar.
 * - height: var(--sp-2xl) = 48px.
 * - z-index 40 — bajo el SkipLink (50, llega en Plan 06) pero sobre chapters (0).
 * - flex column para que el track (absolute) y los ticks (flex row) convivan.
 * ───────────────────────────────────────────────────────────────────────── */
.sticky-timeline {
  position: fixed;
  bottom: env(safe-area-inset-bottom, 0);
  left: 0;
  right: 0;
  height: var(--sp-2xl);
  z-index: 40;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0 var(--sp-md);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Track — barra horizontal de fondo (UI-SPEC §7.3).
 * - position: absolute centrada verticalmente sobre la timeline.
 * - height 10px (excepción declarada UI-SPEC §3, dentro del rango 8-12px).
 * ───────────────────────────────────────────────────────────────────────── */
.timeline-track {
  position: absolute;
  top: 50%;
  left: var(--sp-md);
  right: var(--sp-md);
  height: 10px;
  background: var(--c-track);
  border-radius: 5px;
  transform: translateY(-50%);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Marker — puck móvil de 16px (UI-SPEC §7.3).
 * - left bindeado a scrollProgress via inline style (markerLeft computed).
 * - transition: left 0ms linear — explícito para sobreescribir cualquier
 *   herencia futura. El binding es data, no animación. Durante un click
 *   smooth, el browser anima scrollTop y nuestro RAF reflecta en scrollProgress
 *   60fps → el marker progresa continuamente. Bajo PRM, jump instantáneo.
 * ───────────────────────────────────────────────────────────────────────── */
.timeline-marker {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: var(--c-marker);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: left 0ms linear;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Lista de ticks — flex distribuido uniformemente.
 * - justify-content: space-between → los 7 ticks se reparten en el ancho útil.
 * - height 100% para que los tick-buttons puedan crecer hasta la altura del
 *   timeline (touch target 44px se cumple así).
 * ───────────────────────────────────────────────────────────────────────── */
.timeline-ticks {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
  /* Relativo al .sticky-timeline padded; el track va por debajo (z-index implícito
     por orden de hijos). Los ticks reciben click. */
  position: relative;
  z-index: 1;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Tick button — botón clicable que envuelve notch + year (UI-SPEC §7.3).
 * - min-width / min-height 44px → touch target a11y (UI-SPEC §3 excepción).
 * - flex column para apilar notch arriba, year debajo, con gap 4px.
 * - cursor: pointer + background/border none → look minimalista.
 * - font-family monospace heredado del scaffold.
 * ───────────────────────────────────────────────────────────────────────── */
.tick-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-xs);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Tick notch — pequeña barra vertical 2×8px sobre el track.
 * - opacity inactiva 0.4; hover sube a 0.7 y crece a 10px; activo sube a 1.0.
 * - transition 150ms ease (D-05 interaction-derived — se mantiene bajo PRM).
 * ───────────────────────────────────────────────────────────────────────── */
.tick-notch {
  display: block;
  width: 2px;
  height: 8px;
  background: var(--c-track-active);
  opacity: 0.4;
  transition: opacity 150ms ease, height 150ms ease;
}

.tick-button:hover .tick-notch {
  opacity: 0.7;
  height: 10px;
}

.tick-button:hover .tick-year {
  color: var(--c-tick-hover);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Tick activo — aria-current="true" controla el estilo.
 * - Notch opacity 1.0 (full strength).
 * - Year font-weight 700 + color --c-track-active (alto contraste).
 * ───────────────────────────────────────────────────────────────────────── */
.tick-button[aria-current="true"] .tick-notch {
  opacity: 1;
}

.tick-button[aria-current="true"] .tick-year {
  font-weight: 700;
  color: var(--c-track-active);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Year label — 12px, regular por defecto, color muted.
 * - transition color 150ms ease para el hover/active swap (D-05).
 * ───────────────────────────────────────────────────────────────────────── */
.tick-year {
  font-size: 12px;
  font-weight: 400;
  color: var(--c-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  transition: color 150ms ease;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile breakpoint <600px — UI-SPEC §9.
 * - height baja a 44px (mantiene touch target).
 * - padding lateral baja a 8px (vs 16px desktop).
 * - tick-year baja a 11px (executor discretion 9-11px, UI-SPEC §9 nota).
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .sticky-timeline {
    height: 44px;
    padding: 0 var(--sp-sm);
  }
  .tick-year {
    font-size: 11px;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * PRM — los hover/focus transitions ≤150ms SE MANTIENEN (D-05 interaction-
 * derived). Solo el scrollTo programático cambia behavior (D-04, manejado en
 * el script setup, no aquí). Por eso este componente NO declara un branch
 * @media (prefers-reduced-motion: reduce) — sería incorrecto cortar las
 * micro-transitions hover/focus.
 * ───────────────────────────────────────────────────────────────────────── */
</style>
