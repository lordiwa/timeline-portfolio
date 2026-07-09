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
 * StickyTimeline — "espina temporal" (redesign visual 2026-07-09).
 *
 * Concepto: la nave/cabina que lleva al visitante a través de las eras.
 * Material: vidrio oscuro/claro derivado de --c-bg + tinte del --c-accent
 * del chapter activo via color-mix — el panel se re-tematiza solo, sin
 * tokens nuevos por chapter. Una espina vertical conecta 7 nodos-era:
 * nodos PASADOS rellenos (via :has()), nodo ACTIVO con glow, FUTUROS huecos.
 * La estructura codifica cronología real (no decoración).
 *
 * Fix contraste (bug "blanco sobre blanco" en themes claros ch3/ch5):
 * el estado activo ya NO usa --c-track-active/-–c-bg — usa un pill
 * color-mix(accent 14%) + texto accent/fg, legible en claro y oscuro.
 *
 * - position/z-index/44px touch targets: contratos UI-SPEC §3 preservados.
 * ───────────────────────────────────────────────────────────────────────── */
.sticky-timeline {
  position: fixed;
  top: 50%;
  left: var(--sp-md);
  transform: translateY(-50%);
  z-index: 40;
  /* --hud-fg: fg RESUELTO a nivel panel (theme activo via html[data-chapter]).
     Los .tick-button llevan su propio data-chapter y re-scopean --c-fg al de
     SU era (ej. ch5 claro → fg oscuro → invisible sobre panel oscuro). Capturar
     el valor aquí y usar var(--hud-fg) en las filas inmuniza el texto a ese
     re-scope; los rombos SÍ usan el --c-accent propio de cada era (deliberado:
     cada nodo viste el color de su era). */
  --hud-fg: var(--c-fg);
  background: color-mix(in srgb, var(--c-bg) 74%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  backdrop-filter: blur(14px) saturate(1.2);
  border: 1px solid color-mix(in srgb, var(--c-accent) 32%, transparent);
  border-radius: 14px;
  padding: var(--sp-sm);
  box-shadow:
    0 16px 40px -16px rgba(0, 0, 0, 0.55),
    0 0 24px -8px color-mix(in srgb, var(--c-accent) 30%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--c-fg) 10%, transparent);
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Lista vertical + espina. La espina (::before) corre por el centro de la
 * columna de nodos: gradiente accent→neutro que sugiere el viaje pendiente.
 * ───────────────────────────────────────────────────────────────────────── */
.timeline-ticks {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.timeline-ticks::before {
  content: '';
  position: absolute;
  /* centro de la columna del nodo: padding-left botón 8px + mitad de 9px */
  left: 12px;
  top: 20px;
  bottom: 20px;
  width: 1px;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--c-accent) 60%, transparent),
    color-mix(in srgb, var(--c-fg) 22%, transparent)
  );
  pointer-events: none;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Tick button — [nodo] año ERA. min-width/min-height 44px preservados.
 * Nodo = ::before rombo pixel (cuadrado rotado 45°), 3 estados:
 *   futuro: hueco borde neutro · pasado: relleno accent apagado ·
 *   activo: accent pleno + glow.
 * ───────────────────────────────────────────────────────────────────────── */
.tick-button {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  color: color-mix(in srgb, var(--hud-fg) 52%, transparent);
  cursor: pointer;
  padding: var(--sp-xs) 10px var(--sp-xs) var(--sp-sm);
  min-width: 44px;
  min-height: 44px;
  text-align: left;
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  transition: background 150ms ease, color 150ms ease, transform 150ms ease;
}

/* Nodo-era (rombo) */
.tick-button::before {
  content: '';
  flex: none;
  width: 9px;
  height: 9px;
  transform: rotate(45deg);
  border: 1.5px solid color-mix(in srgb, var(--hud-fg) 38%, transparent);
  background: transparent;
  border-radius: 1px;
  transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}

/* Eras ya recorridas — nodo relleno (accent apagado). :has() selecciona los
   <li> que tienen un sibling posterior conteniendo el aria-current. */
.timeline-tick:has(~ .timeline-tick .tick-button[aria-current="true"]) .tick-button::before {
  background: color-mix(in srgb, var(--c-accent) 55%, var(--c-bg));
  border-color: color-mix(in srgb, var(--c-accent) 70%, transparent);
}

.tick-button:hover {
  color: var(--hud-fg);
  background: color-mix(in srgb, var(--c-accent) 9%, transparent);
}

.tick-button:hover::before {
  border-color: var(--c-accent);
}

/* Activo — pill accent-tinted + nodo con glow. Legible en claro Y oscuro:
   texto = fg/accent del theme (nunca bg-sobre-bg). */
.tick-button[aria-current="true"] {
  background: color-mix(in srgb, var(--c-accent) 15%, transparent);
  color: var(--hud-fg);
  transform: translateX(2px);
}

.tick-button[aria-current="true"]::before {
  background: var(--c-accent);
  border-color: var(--c-accent);
  box-shadow:
    0 0 10px color-mix(in srgb, var(--c-accent) 85%, transparent),
    0 0 3px var(--c-accent);
}

.tick-year {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.tick-era {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.tick-button[aria-current="true"] .tick-year {
  color: var(--hud-fg);
}

.tick-button[aria-current="true"] .tick-era {
  color: var(--c-accent);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile <600px (UI-SPEC §9): compactar a year-only para no ocupar viewport.
 * Padding/inset menores; era oculta; espina y nodos se mantienen.
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .sticky-timeline {
    left: var(--sp-xs);
    padding: var(--sp-xs);
  }
  .tick-button {
    min-width: 44px;
    padding: var(--sp-xs);
    justify-content: flex-start;
  }
  .tick-era {
    display: none;
  }
  .timeline-ticks::before {
    left: 8px;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * PRM — los hover/focus transitions ≤150ms SE MANTIENEN (D-05 interaction-
 * derived). Solo scrollToChapter cambia behavior (D-04, en el script).
 * Los transitions de re-tematización del panel (300ms) se desactivan.
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .sticky-timeline {
    transition: none;
  }
}
</style>
