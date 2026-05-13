<script setup>
// ContactHUD.vue — HUD fijo bottom-right para contacto rápido (Plan 03-02, Task 2.1).
//
// D3-10 verbatim: invariante a chapter — usa tokens neutros (:root) NO [data-chapter].
// CON-03: contact info persistente y accesible desde cualquier chapter sin scroll.
// T-CON-03 mitigation: rel="noopener noreferrer" + target="_blank" en cada external anchor.
// RESEARCH Pattern 5 verbatim: posición + tap targets 44×44 + flex column + mobile @media.
//
// Análogo arquitectural al LangToggle (Phase 2 W1): HUD invariante fixed, tokens neutros,
// sin outline propio (Pitfall 7), transition 150ms, aria-labels i18n reactivos (Pitfall 3).
//
// import contact desde @/data/contact (Plan 03-01) — valores hardcoded (T-CON-03: no runtime mutation).
// Si contact.email === '' (CONTENT-CHECKLIST §3 no rellenado aún), el icon se renderea
// con aria-disabled='true' y sin href — defensive (D3-10 verbatim).

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { contact } from '@/data/contact'

const { t } = useI18n()

const emailDisabled = computed(() => !contact.email || contact.email === '')
const linkedinDisabled = computed(() => !contact.linkedinUrl || contact.linkedinUrl === '')
const githubDisabled = computed(() => !contact.githubUrl || contact.githubUrl === '')
</script>

<template>
  <div class="contact-hud" :aria-label="t('contact.hudAria')">
    <!-- Email anchor: mailto: nativo. Si email='', aria-disabled='true' + sin href (defensive). -->
    <a
      :href="emailDisabled ? undefined : `mailto:${contact.email}`"
      class="contact-icon"
      :aria-label="t('contact.emailAria')"
      :title="t('contact.emailTooltip')"
      :aria-disabled="emailDisabled ? 'true' : undefined"
    >
      <!-- SVG envelope inline — sin libs externas (key_decisions: SVG inline) -->
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 5L2 7" />
      </svg>
    </a>

    <!-- LinkedIn anchor: external → rel="noopener noreferrer" + target="_blank" (T-CON-03) -->
    <a
      v-if="!linkedinDisabled"
      :href="contact.linkedinUrl"
      class="contact-icon"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('contact.linkedinAria')"
    >
      <!-- SVG LinkedIn icon inline -->
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    </a>

    <!-- GitHub anchor: external → rel="noopener noreferrer" + target="_blank" (T-CON-03) -->
    <a
      v-if="!githubDisabled"
      :href="contact.githubUrl"
      class="contact-icon"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('contact.githubAria')"
    >
      <!-- SVG GitHub octocat simplificado inline -->
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22 0 1.61-.02 2.91-.02 3.31 0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    </a>

    <!-- otherUrl anchor: CONDITIONAL — v-if="contact.otherUrl" (D3-10 + key_decisions) -->
    <!-- external → rel="noopener noreferrer" + target="_blank" (T-CON-03) -->
    <a
      v-if="contact.otherUrl"
      :href="contact.otherUrl"
      class="contact-icon"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('contact.otherAria') || 'Other link'"
    >
      <!-- SVG external link icon inline -->
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * ContactHUD shell — D3-10 + RESEARCH Pattern 5 verbatim.
 * - position: fixed bottom-right (var(--sp-md) = 16px) — análogo al LangToggle top-right.
 * - bottom: env(safe-area-inset-bottom, 0) — previene overlap con Safari toolbar dinámica (iOS-01).
 * - z-index 40 — mismo nivel que LangToggle/avatar/timeline; bajo el SkipLink (50).
 * - flex column — iconos apilados verticalmente.
 * - width/height 44px por .contact-icon — tap target a11y mínimo (UI-SPEC §3 + A11Y).
 * - transition 150ms — interaction-derived (D-05), análogo a LangToggle.
 * - NO se declara outline: propio — el :focus-visible universal de App.vue lo cubre (Pitfall 7).
 * - Tokens NEUTROS: --c-surface, --c-border, --c-fg, --c-accent, --c-bg — invariante a chapter (D3-10).
 * ───────────────────────────────────────────────────────────────────────── */
.contact-hud {
  position: fixed;
  bottom: env(safe-area-inset-bottom, 0);
  right: var(--sp-md);
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.contact-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  color: var(--c-fg);
  text-decoration: none;
  transition: background 150ms ease, color 150ms ease;
}

.contact-icon:hover:not([aria-disabled='true']) {
  background: var(--c-accent, var(--c-tick-hover, var(--c-surface)));
  color: var(--c-bg);
}

.contact-icon[aria-disabled='true'] {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile — RESEARCH Pattern 5 §537-548 verbatim.
 * <600px: right shrinks a --sp-sm; bottom añade --sp-sm extra por barra de navegación.
 * Tap target 44×44 PRESERVADO (width/height fijos en .contact-icon no cambian).
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .contact-hud {
    right: var(--sp-sm);
    bottom: calc(env(safe-area-inset-bottom, 0) + var(--sp-sm));
  }
}
</style>
