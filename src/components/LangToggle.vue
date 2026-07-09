<script setup>
// LangToggle.vue — Botón pill fixed top-right para alternar ES ↔ EN (Plan 02-02, Task 2.1).
//
// UI-SPEC §8 + D2-10 + I18N-03.
//
// Posición simétrica al StickyAvatar (top-left) → este componente se ubica top-right.
// Es un HUD invariante: sus colores vienen de tokens neutros (--c-surface, --c-border,
// --c-fg, --c-muted) — se ve igual en los 7 chapters (UI-SPEC §8.5).
//
// Click toggle:
//   1. Asigna `locale.value` primero → vue-i18n re-evalúa todos los t() reactivos.
//   2. Llama persistLocale(next) → localStorage.setItem('portfolio.locale', next) (I18N-03).
//
// Mobile <600px (UI-SPEC §8.3):
//   Reduce a icon-only mode: padding shrinks, .lang-sep y .lang-inactive ocultos,
//   ::before muestra '🌐', mantiene min-width/min-height 44px (tap target a11y).
//
// Pitfall 7 evitado: NO se declara outline: propio en .lang-toggle. El focus-visible
// universal de App.vue (líneas 125-128: outline 3px solid var(--c-focus)) lo cubre.

import { useI18n } from 'vue-i18n'
import { persistLocale } from '@/i18n'

const { locale, t } = useI18n()

function toggle() {
  const next = locale.value === 'es' ? 'en' : 'es'
  locale.value = next
  persistLocale(next)
}
</script>

<template>
  <button
    class="lang-toggle"
    :aria-label="t('ui.langToggle.aria')"
    @click="toggle"
  >
    <span class="lang-active">{{ locale === 'es' ? 'ES' : 'EN' }}</span>
    <span class="lang-sep" aria-hidden="true">|</span>
    <span class="lang-inactive">{{ locale === 'es' ? 'EN' : 'ES' }}</span>
  </button>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * LangToggle shell — UI-SPEC §8.2 verbatim.
 * - position: fixed top-right (var(--sp-md) = 16px) — simétrico al avatar top-left.
 * - z-index 40 — mismo nivel que avatar/timeline; bajo el SkipLink (50).
 * - pill con border-radius: 999px + display flex centrado.
 * - min-width/min-height 44px — tap target a11y (UI-SPEC §3).
 * - transition: background/color 150ms — interaction-derived (D-05).
 * - NO se declara outline: propio — el :focus-visible universal de App.vue lo cubre.
 * ───────────────────────────────────────────────────────────────────────── */
.lang-toggle {
  position: fixed;
  top: var(--sp-md);
  right: var(--sp-md);
  z-index: 40;
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: var(--sp-sm) var(--sp-md);
  /* Material HUD era-tinted (redesign 2026-07-09) — vidrio de cabina:
     bg del theme translúcido + blur + hairline accent. Se re-tematiza solo. */
  background: color-mix(in srgb, var(--c-bg) 74%, transparent);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid color-mix(in srgb, var(--c-accent) 32%, transparent);
  border-radius: 999px;
  color: var(--c-fg);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
  box-shadow:
    0 10px 28px -14px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 color-mix(in srgb, var(--c-fg) 10%, transparent);
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}

.lang-active {
  color: var(--c-accent);
}

.lang-inactive {
  color: color-mix(in srgb, var(--c-fg) 45%, transparent);
}

.lang-sep {
  color: color-mix(in srgb, var(--c-fg) 30%, transparent);
}

.lang-toggle:hover {
  background: color-mix(in srgb, var(--c-accent) 12%, color-mix(in srgb, var(--c-bg) 74%, transparent));
  border-color: color-mix(in srgb, var(--c-accent) 60%, transparent);
  box-shadow:
    0 10px 28px -14px rgba(0, 0, 0, 0.55),
    0 0 16px -4px color-mix(in srgb, var(--c-accent) 45%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--c-fg) 10%, transparent);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile icon-only mode — UI-SPEC §8.3 verbatim.
 * <600px: padding shrinks; .lang-sep y .lang-inactive ocultos;
 * ::before muestra '🌐' como ícono; .lang-active reduce font-size.
 * Mantiene min-width/min-height 44px → tap target a11y preservado.
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .lang-toggle {
    padding: var(--sp-sm);
  }

  .lang-sep {
    display: none;
  }

  .lang-inactive {
    display: none;
  }

  .lang-toggle::before {
    content: '🌐';
    font-size: 14px;
    margin-right: var(--sp-xs);
  }

  .lang-active {
    font-size: 11px;
  }
}
</style>
