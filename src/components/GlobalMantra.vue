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
  /* Píldora de vidrio (redesign 2026-07-09): antes el texto flotaba desnudo
     sobre arte pixel ocupado y se perdía. El velo translúcido + blur lo hace
     legible en los 7 chapters sin robar protagonismo (sigue discreto). */
  padding: 5px 14px;
  background: color-mix(in srgb, var(--c-bg) 55%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border: 1px solid color-mix(in srgb, var(--c-mantra, var(--c-fg)) 22%, transparent);
  border-radius: 999px;
  font-family: var(--font-body, sans-serif);
  font-size: 0.85rem;
  color: var(--c-mantra, var(--c-fg));
  opacity: 0.8;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  z-index: 30;
  /* z-index 30 — debajo de StickyAvatar/Timeline/HUDs (40) y SkipLink (50),
     pero encima del scroll-shell content (auto/0). */
  letter-spacing: 0.02em;
  transition: color 200ms ease, opacity 200ms ease, background 200ms ease, border-color 200ms ease;
}

/* Mobile <600px: aún más pequeño + alineado a viewport bottom con padding mayor
   para evitar overlap con ContactHUD bottom-right que en mobile puede estar más cerca.
   TASK-019: `(max-height: 500px)` añadido — mismo teléfono en landscape corto
   (ver el comentario de StickyTimeline/ContactHUD para el porqué del segundo
   disparador). Reducción adicional de opacidad/tamaño en ese caso: la firma es
   decorativa (pointer-events:none) y el espacio vertical es el más escaso de
   los cinco breakpoints del ticket — cede terreno primero. NOTA (hand-off
   TASK-019): parte del solapamiento medido contra `.global-mantra` en ch0/ch4/
   ch5 correlaciona con el desborde de texto que TASK-018 ya investiga (el
   párrafo de bio excede el viewport y su borde inferior cae justo donde vive
   esta firma) — no es enteramente un problema de posición de este componente. */
@media (max-width: 599px), (max-height: 500px) {
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
