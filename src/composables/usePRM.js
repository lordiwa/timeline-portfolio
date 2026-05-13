// src/composables/usePRM.js
// Single source of truth para `prefers-reduced-motion` en el proyecto (Plan 03, Wave 2).
//
// Wrap mínimo sobre `usePreferredReducedMotion` de @vueuse/core. UI-SPEC §8 dicta:
//   "El composable `usePRM` es el único punto de lectura — no duplicar matchMedia
//    en múltiples componentes."
//
// API:
//   - motion: Ref<'reduce' | 'no-preference'>  (proviene tal cual de vueuse)
//   - prefersReduced: ComputedRef<boolean>     (true ⇔ motion === 'reduce')
//
// Cleanup: vueuse maneja add/remove del listener 'change' del MediaQueryList
// automáticamente cuando el componente que llamó usePRM() se desmonta — por eso
// NO necesitamos onBeforeUnmount aquí.
//
// Provided globalmente en App.vue via `provide('prm', usePRM())`. Consumers
// (StickyAvatar Plan 04, StickyTimeline Plan 05) inyectan vía `inject('prm')`.
//
// D-01 (UI-SPEC §8): el branch CSS-side `@media (prefers-reduced-motion: reduce)`
// ya está declarado en App.vue (Plan 02). Este composable cablea el JS-side para
// los scrollTo({behavior}) programáticos y el avatar swap que vienen en plans 04/05.

import { computed } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

export function usePRM() {
  const motion = usePreferredReducedMotion()
  const prefersReduced = computed(() => motion.value === 'reduce')
  return { motion, prefersReduced }
}
