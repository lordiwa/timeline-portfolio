<script setup>
// StickyTimeline.vue — Navegación lateral vertical (post-redesign 2026-05-13).
//
// Historia: La versión Phase 1 era una barra horizontal bottom con marker móvil
// (bindeado a scrollProgress). Coexistía con la scrollbar nativa y se sentía
// como una segunda scrollbar redundante. Rafael pidió: "no que sea una scrollbar
// sino botones de estados en una barra vertical sticky que se sincronice al
// scroll nativo". Este componente reemplaza al diseño Phase 1 verbatim.
//
// Diseño actual:
//   - <nav> fixed left (sp-md inset), centrado vertical (top: 50% + translateY).
//   - 7 botones apilados verticalmente, cada uno con año + era.
//   - aria-current="true" sobre el botón del chapter activo (sincronizado al
//     scroll nativo vía inject('scrollState').activeChapter — el composable
//     useScrollState ya emite reactivamente).
//   - Click → scrollToChapter(N, behavior) — smooth en default, auto en PRM (D-04).
//   - Sin marker móvil. No depende de scrollProgress.
//
// Touch target: cada botón mantiene min-width/min-height 44px (UI-SPEC §3 ex.).
// Mobile <600px: oculta la era, deja solo el año (compactar columna lateral).

import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

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
// scrollProgress ya NO se consume (no hay marker). Solo activeChapter para
// el highlight y scrollToChapter para los clicks.
const { activeChapter, scrollToChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

function onTickClick(N) {
  const behavior = prefersReduced.value ? 'auto' : 'smooth'
  scrollToChapter(N, behavior)
}
</script>

<template>
  <nav
    class="sticky-timeline"
    :aria-label="t('ui.timeline.navAria')"
    role="navigation"
  >
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
          :aria-label="t('ui.timeline.tickAria', { era: ch.era, year: ch.year })"
          :aria-current="activeChapter === ch.id ? 'true' : undefined"
          @click="onTickClick(ch.id)"
        >
          <span class="tick-year">{{ ch.year }}</span>
          <span class="tick-era">{{ ch.era }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * StickyTimeline shell — vertical, izquierda, centrada.
 * - position: fixed; left: var(--sp-md); top: 50% + translateY(-50%) para
 *   centrar el bloque sin importar la cantidad de chapters.
 * - z-index 40: bajo SkipLink (50), sobre chapters (0). Compatible con
 *   BackgroundLayers (-1) y LangToggle (40 también, ubicación distinta).
 * - El contenedor tiene fondo --c-surface + border, redondeado para look de
 *   panel/dock. Phase 2 ya reasigna --c-surface por chapter — el panel se
 *   tiñe automáticamente al cambiar de chapter.
 * ───────────────────────────────────────────────────────────────────────── */
.sticky-timeline {
  position: fixed;
  top: 50%;
  left: var(--sp-md);
  transform: translateY(-50%);
  z-index: 40;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: var(--sp-sm);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Lista vertical de ticks. flex-direction: column con gap pequeño entre
 * botones. Sin marker — el active state se transmite via aria-current.
 * ───────────────────────────────────────────────────────────────────────── */
.timeline-ticks {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Tick button — fila horizontal año + era. min-width / min-height 44px
 * (touch target UI-SPEC §3 ex). Inactivo: --c-muted. Hover: --c-tick-hover.
 * Activo (aria-current="true"): fondo --c-track-active + color --c-bg.
 * Transitions 150ms ease (D-05 interaction-derived, se mantiene bajo PRM).
 * ───────────────────────────────────────────────────────────────────────── */
.tick-button {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: var(--sp-sm);
  background: none;
  border: none;
  color: var(--c-muted);
  cursor: pointer;
  padding: var(--sp-xs) var(--sp-sm);
  min-width: 44px;
  min-height: 44px;
  text-align: left;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  transition: background 150ms ease, color 150ms ease;
}

.tick-button:hover {
  color: var(--c-tick-hover);
}

.tick-button[aria-current="true"] {
  background: var(--c-track-active);
  color: var(--c-bg);
}

.tick-year {
  font-size: 12px;
  font-weight: 700;
}

.tick-era {
  font-size: 13px;
}

.tick-button[aria-current="true"] .tick-year,
.tick-button[aria-current="true"] .tick-era {
  color: var(--c-bg);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile <600px (UI-SPEC §9): compactar a year-only para no ocupar viewport.
 * Padding/inset menores; era oculta; el año queda como dot-numérico.
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .sticky-timeline {
    left: var(--sp-xs);
    padding: var(--sp-xs);
  }
  .tick-button {
    min-width: 44px;
    padding: var(--sp-xs);
    justify-content: center;
  }
  .tick-era {
    display: none;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * PRM — los hover/focus transitions ≤150ms SE MANTIENEN (D-05 interaction-
 * derived). Solo scrollToChapter cambia behavior (D-04, en el script).
 * ───────────────────────────────────────────────────────────────────────── */
</style>
