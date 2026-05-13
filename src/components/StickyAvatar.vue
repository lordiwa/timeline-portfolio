<script setup>
// StickyAvatar.vue — Primer ancla sticky funcional de Phase 1 (Plan 04, Wave 3).
//
// Renderiza un <aside> fijo top-left con un placeholder gris 80×96px que muestra
// el texto "ch{N}" reactivo al activeChapter del scrollState. Esta es la versión
// placeholder; Phase 3 reemplazará el <div class="avatar-placeholder"> por
// <img src="/assets/ch{N}-bust.png"> manteniendo el <aside> y el <span> intactos.
//
// Inputs (vía inject):
//   - scrollState.activeChapter: Ref<number>  (readonly) — provisto por App.vue
//   - prm.prefersReduced:        Computed<boolean> — provisto por App.vue
//
// Motion contract (UI-SPEC §8):
//   Default: crossfade JS de 200ms TOTAL — fade-out 100ms + swap (texto via
//   reactividad de Vue) + fade-in 100ms. El CSS declara
//   `transition: opacity 100ms ease` (cada mitad), NO 200ms (que produciría
//   400ms perceptible). Esto es el HIGH 1 fix del plan-checker iter 2.
//
//   Bajo PRM (D-02): swap instantáneo, sin transición de opacidad.
//
// HIGH 2 fix — PRM mid-flight recovery:
//   Si el usuario activa PRM mientras opacity está en 0 (mid-fade), el watch
//   de activeChapter NO se re-dispara (su dependencia no cambió), así que
//   opacity quedaría atascada en 0 → avatar invisible. El watcher dedicado
//   sobre prefersReduced cancela cualquier setTimeout pendiente y fuerza
//   opacity = 1 al activar PRM, garantizando visibilidad.

import { ref, inject, watch, nextTick } from 'vue'

const { activeChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

const opacity = ref(1)
let pendingSwapTimer = null

// Main fade watcher: dispara en cada cambio de chapter.
//
// Default branch (PRM=false):
//   opacity → 0 (transition CSS hace el fade-out 100ms) → setTimeout(100) →
//   opacity → 1 (transition CSS hace el fade-in 100ms). Total 200ms.
//
// PRM branch (D-02):
//   - Cancelar cualquier timer en vuelo (defensive: si el usuario scrolleó
//     antes de activar PRM, podría haber un timer pending).
//   - Asegurar opacity = 1 inmediato. El texto se actualiza por la reactividad
//     del template binding sin transición.
watch(activeChapter, async () => {
  if (prefersReduced.value) {
    if (pendingSwapTimer) {
      clearTimeout(pendingSwapTimer)
      pendingSwapTimer = null
    }
    opacity.value = 1
    return
  }
  opacity.value = 0
  await nextTick()
  pendingSwapTimer = setTimeout(() => {
    opacity.value = 1
    pendingSwapTimer = null
  }, 100)
})

// HIGH 2 fix — PRM-mid-flight recovery watcher.
// Si prefersReduced pasa de false → true mientras un fade está en vuelo,
// el watch de activeChapter no se va a reactivar (su dependencia no cambió).
// Este watcher dedicado cancela el timer pending y restaura opacity = 1,
// garantizando que el avatar nunca queda invisible bajo PRM.
watch(prefersReduced, (isPRM) => {
  if (isPRM) {
    if (pendingSwapTimer) {
      clearTimeout(pendingSwapTimer)
      pendingSwapTimer = null
    }
    opacity.value = 1
  }
})
</script>

<template>
  <aside
    class="sticky-avatar"
    :aria-label="`Avatar de Rafael — chapter ${activeChapter} activo`"
    aria-live="polite"
  >
    <div class="avatar-placeholder" aria-hidden="true" :style="{ opacity }">
      <span class="avatar-chapter-label">ch{{ activeChapter }}</span>
    </div>
  </aside>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * Sticky avatar shell — UI-SPEC §7.2 verbatim.
 * - position: fixed (no sticky — el overflow container es el ScrollShell;
 *   sticky no aplica porque el viewport del scroll está dentro del shell).
 * - top/left var(--sp-md) = 16px desde el viewport del browser.
 * - z-index 40 — bajo el SkipLink (50) pero sobre los chapters (0).
 * - 80×96px exactos — proporciones del bust pixel art que Phase 3 instalará.
 * ───────────────────────────────────────────────────────────────────────── */
.sticky-avatar {
  position: fixed;
  top: var(--sp-md);
  left: var(--sp-md);
  z-index: 40;
  width: 80px;
  height: 96px;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Placeholder gris — UI-SPEC §7.2.
 * - transition: opacity 100ms ease — cada mitad del crossfade es 100ms;
 *   sumadas (fade-out + swap + fade-in) dan 200ms perceptible (UI-SPEC §8).
 *   NO usar 200ms aquí — produciría 400ms perceptible total (HIGH 1 fix).
 * - El swap del texto ch{N} ocurre durante opacity:0 (invisible), por lo
 *   que el usuario solo ve un crossfade limpio sin "flash" del cambio.
 * ───────────────────────────────────────────────────────────────────────── */
.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 100ms ease;
}

.avatar-chapter-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  font-weight: 400;
  color: var(--c-muted);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile breakpoint — UI-SPEC §9 (< 600px → 56×68px, 8px offsets).
 * Solo CSS; sin lógica JS adicional. El componente no se vuelve a renderizar
 * en mobile — solo cambian las dimensiones físicas.
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .sticky-avatar {
    width: 56px;
    height: 68px;
    top: var(--sp-sm);
    left: var(--sp-sm);
  }
  .avatar-chapter-label {
    font-size: 12px;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * PRM defensive — UI-SPEC §8 + D-02.
 * El JS-side (watch en setup) ya hace short-circuit, pero declaramos la
 * regla CSS también para defensa doble. Si por cualquier motivo el JS no
 * corre o se desincroniza (CSP, error de parsing), el CSS garantiza que
 * no haya transición de opacidad bajo PRM.
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .avatar-placeholder {
    transition: none;
  }
}
</style>
