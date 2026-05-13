<script setup>
// SkipLink.vue — Primer focusable del DOM (Plan 06, Wave 5).
//
// Renderiza un <a href="#main-content"> bilingüe centrado en top:8px que aparece
// desde la carga inicial (A11Y-01). Se oculta tras el primer scroll del usuario
// O tras el primer blur del propio link (cuando el usuario tabula más allá).
//
// Tab order (UI-SPEC §10):
//   1. SkipLink (este componente, primer hijo del template root de App.vue)
//   2. #main-content (ScrollShell con tabindex="0")
//   3. tick-button[data-chapter="0"] ... tick-button[data-chapter="6"]
//
// Al click/Enter, el browser navega a `#main-content` y como ese <main> tiene
// `tabindex="0"`, el foco se transfiere automáticamente — no requiere JS extra.
//
// HIGH 5 fix (iter 2 plan-checker):
//   useEventListener de @vueuse/core + window.dispatchEvent(new Event('scroll'))
//   es flake-prone en jsdom (timing del closure, re-attach). Para un caso simple
//   de "primer scroll oculta", `onMounted` + `window.addEventListener('scroll',
//   handler, { once: true, passive: true })` directo es más determinístico.
//   `{ once: true }` garantiza que el listener se autodescarga después del
//   primer evento. `onBeforeUnmount` añade un removeEventListener defensive por
//   si el componente unmount antes del primer scroll.
//
//   Adicional: `defineExpose({ handleScrollOnce })` permite invocar el handler
//   directamente desde tests, evitando depender de dispatchEvent.

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const isHidden = ref(false)
let scrollHandler = null

function onBlur() {
  isHidden.value = true
}

function handleScrollOnce() {
  isHidden.value = true
  // { once: true } se autodescarga; no requiere removeEventListener aquí.
}

onMounted(() => {
  scrollHandler = handleScrollOnce
  window.addEventListener('scroll', scrollHandler, { once: true, passive: true })
})

onBeforeUnmount(() => {
  // Defensive: si el componente unmount antes del primer scroll, el listener
  // sigue registrado en window. { once: true } no garantiza cleanup en unmount,
  // solo después del evento. Removerlo evita leaks en hot-reload de Vite.
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
  }
})

// Exponer para test invocation directo (HIGH 5 fix — evita flake de
// dispatchEvent en jsdom). El test invoca wrapper.vm.handleScrollOnce()
// y verifica que isHidden cambia a true.
defineExpose({ handleScrollOnce })
</script>

<template>
  <a
    href="#main-content"
    id="skip-link"
    class="skip-link"
    :class="{ hidden: isHidden }"
    @blur="onBlur"
  >{{ t('ui.skipLink') }}</a>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * SkipLink — UI-SPEC §7.4 verbatim.
 * - position: fixed top:8px, centrado horizontalmente con transform.
 * - z-index 50 — sobre avatar/timeline (40) y sobre chapters (0).
 * - bilingüe: "Saltar al contenido / Skip to content" en un solo string
 *   antes de que Phase 2 implemente el toggle i18n.
 * - white-space: nowrap + overflow ellipsis + max-width: calc(100vw - 32px)
 *   como fallback para viewport pequeño (UI-SPEC §7.4 final paragraph).
 * - transition opacity 200ms ease — el hide-on-scroll/blur hace fade-out.
 * ───────────────────────────────────────────────────────────────────────── */
.skip-link {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  background: var(--c-surface);
  color: var(--c-fg);
  font-size: 14px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: var(--sp-sm) var(--sp-md);
  border: 1px solid var(--c-border);
  border-radius: 4px;
  text-decoration: none;
  white-space: nowrap;
  opacity: 1;
  pointer-events: auto;
  transition: opacity 200ms ease;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100vw - 32px);
}

/* Hide state — toggled vía :class="{ hidden: isHidden }". */
.skip-link.hidden {
  opacity: 0;
  pointer-events: none;
}

/* Focus ring local — el universal :focus-visible de App.vue también aplica,
   pero declararlo explícitamente garantiza el outline incluso si alguien
   override el universal en el futuro. Mismo valor (cyan 3px offset 3px). */
.skip-link:focus {
  outline: 3px solid var(--c-focus);
  outline-offset: 3px;
}

/* ─────────────────────────────────────────────────────────────────────────
 * PRM — sin transition al hide para usuarios con motion-sensitivity.
 * El swap de opacidad pasa a ser instantáneo (UI-SPEC §8 D-06).
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
}
</style>
