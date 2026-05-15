<!--
  GlobalMantra.vue — Footer signature cross-chapter (Phase 6 polish, Rafael 2026-05-14).

  Rafael pidió "And always with a smile. 😄 en todas las fechas" → presencia persistente
  en TODOS los chapters como signature. position:fixed bottom-center, subtle styling,
  theme-aware (hereda --c-fg / --c-mantra del chapter activo via :root cascade).

  - pointer-events: none — NO interfiere con scroll ni focus ni clicks (decorativo).
  - opacity baja default + theme-tinted color → discreto, no compite con el contenido.
  - PRM @media — sin animation (instant).
  - safe-area-inset-bottom — respeta iOS notch / Android home indicator.
  - i18n reactive — bio.mantra ES/EN toggle automático via t().
-->
<script setup>
import { useI18n } from 'vue-i18n'
import { bio } from '@/data/bio'

const { t } = useI18n()
</script>

<template>
  <p class="global-mantra" aria-hidden="true">{{ t(bio.mantraKey) }}</p>
</template>

<style scoped>
.global-mantra {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 0px) + var(--sp-md));
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0 var(--sp-md);
  font-family: var(--font-body, sans-serif);
  font-size: 0.85rem;
  color: var(--c-mantra, var(--c-fg));
  opacity: 0.55;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  z-index: 30;
  /* z-index 30 — debajo de StickyAvatar/Timeline/HUDs (40) y SkipLink (50),
     pero encima del scroll-shell content (auto/0). */
  letter-spacing: 0.02em;
  transition: color 200ms ease, opacity 200ms ease;
}

/* Mobile <600px: aún más pequeño + alineado a viewport bottom con padding mayor
   para evitar overlap con ContactHUD bottom-right que en mobile puede estar más cerca. */
@media (max-width: 599px) {
  .global-mantra {
    font-size: 0.75rem;
    bottom: calc(env(safe-area-inset-bottom, 0px) + var(--sp-sm));
    opacity: 0.45;
  }
}

/* PRM: sin transition. La opacity/color cambian INSTANT al toggle theme. */
@media (prefers-reduced-motion: reduce) {
  .global-mantra {
    transition: none;
  }
}
</style>
