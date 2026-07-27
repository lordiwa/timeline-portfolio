<!--
  Ch3StoryBeat.vue — TASK-009: una fila zig-zag del Acto 2 de ch3 ("La muerte
  de Flash", .planning/design/03-ch3-muerte-de-flash.md §3 acto 2 + §8).

  Extraído de Chapter3Content.vue porque se repite 5 veces (uno por párrafo de
  bio.eras.3, spec §2 "extraer Ch3StoryBeat.vue"). Cada instancia:
  - Muestra SIEMPRE visible el numeral, el kicker y el LEAD del párrafo (spec
    §8, defecto 4 de TASK-007: el que solo scrollea lee la historia sin click).
  - Si `full` es true (beat V, el remate) no hay expansor: todo el párrafo es
    lead y `rest`/`expandable` se ignoran.
  - Si no, un ghost button "Seguir leyendo" (aria-expanded) revela `rest`
    inline (acordeón grid-rows, sin modal — spec §8 elimina el modal viejo).
  - Reveal on scroll propio vía @vueuse/core useIntersectionObserver (mismo
    mecanismo que ScrollRevealCard.vue mas NO se reutiliza ese componente:
    tests/integration/theme-bleed-phase4.test.js bloquea el bleed de estética
    entre eras para ch4/ch5 — mismo principio aplicado aquí por consistencia,
    ch3 no importa un componente de la era "Modern" de ch5). PRM: revealed
    desde el mount, sin animación (mismo patrón defensivo doble que
    ScrollRevealCard.vue: JS-side + CSS-side @media).
-->
<script setup>
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps({
  numeral: { type: String, required: true },
  kicker: { type: String, required: true },
  icon: { type: String, required: true }, // 'flash' | 'code' | 'sprint' | 'megaphone' | 'shield'
  tone: { type: String, default: 'accent' }, // 'residual' (beat I) | 'accent' (II-IV) | 'html5' (beat V)
  lead: { type: String, required: true },
  rest: { type: String, default: '' },
  expandable: { type: Boolean, default: false },
  full: { type: Boolean, default: false },
  reverse: { type: Boolean, default: false },
})

const { t } = useI18n()

const prm = inject('prm', null)
const reduced = computed(() => prm?.prefersReduced?.value ?? false)

const expanded = ref(false)
const readMoreLabel = computed(() => (expanded.value ? t('ch3.ui.readLess') : t('ch3.ui.readMore')))

// Reveal on scroll — defensive double igual a ScrollRevealCard.vue.
const rootEl = ref(null)
const isRevealed = ref(reduced.value)
const { stop } = useIntersectionObserver(
  rootEl,
  ([entry]) => {
    if (entry?.isIntersecting && !isRevealed.value) {
      isRevealed.value = true
      stop()
    }
  },
  { threshold: 0.2 }
)

// Icon paths — 2 tintas, geometría plana simple (decorativo, aria-hidden).
const ICONS = {
  flash: { view: '0 0 48 48', shapes: [
    { d: 'M10 8h28v32H10z', tone: 1, rx: 2 },
    { d: 'M14 8l20 32M34 8L14 40', tone: 2, stroke: true },
  ] },
  code: { view: '0 0 48 48', shapes: [
    { d: 'M18 12L8 24l10 12', tone: 1, stroke: true },
    { d: 'M30 12l10 12-10 12', tone: 1, stroke: true },
    { d: 'M24 22a2 2 0 100 4 2 2 0 000-4z', tone: 2 },
  ] },
  sprint: { view: '0 0 48 48', shapes: [
    { d: 'M9 20h8v18H9z', tone: 1, rx: 1.5 },
    { d: 'M20 10h8v28h-8z', tone: 2, rx: 1.5 },
    { d: 'M31 16h8v22h-8z', tone: 1, rx: 1.5 },
  ] },
  megaphone: { view: '0 0 48 48', shapes: [
    { d: 'M10 20l16-8v24l-16-8z', tone: 1 },
    { d: 'M6 19h4v10H6z', tone: 1, rx: 1 },
    { d: 'M30 18q6 6 0 12', tone: 2, stroke: true },
  ] },
  shield: { view: '0 0 48 48', shapes: [
    { d: 'M24 8l14 5-2 15q0 8-12 12Q12 36 12 28L10 13z', tone: 1 },
    { d: 'M18 23l6 6 8-10', tone: 2, stroke: true },
  ] },
}
const iconDef = computed(() => ICONS[props.icon] || ICONS.flash)
</script>

<template>
  <article
    ref="rootEl"
    class="ch3-beat"
    :class="[`ch3-beat--${tone}`, { 'ch3-beat--alt': reverse, 'is-revealed': isRevealed }]"
  >
    <div class="ch3-beat-icon" aria-hidden="true">
      <span class="ch3-beat-icon-shadow"></span>
      <svg class="ch3-beat-icon-svg" :viewBox="iconDef.view">
        <path
          v-for="(shape, i) in iconDef.shapes"
          :key="i"
          :d="shape.d"
          :class="`ch3-beat-icon-tone${shape.tone}`"
          :fill="shape.stroke ? 'none' : 'currentColor'"
          :stroke="shape.stroke ? 'currentColor' : 'none'"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <div class="ch3-beat-copy">
      <p class="ch3-beat-numeral" aria-hidden="true">{{ numeral }}</p>
      <p class="ch3-beat-kicker">{{ kicker }}</p>
      <p class="ch3-beat-lead">{{ lead }}</p>

      <template v-if="!full && expandable">
        <button
          type="button"
          class="ch3-ghost-btn ch3-beat-more"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >{{ readMoreLabel }}</button>
        <div class="ch3-beat-rest" :class="{ 'is-open': expanded }">
          <p>{{ rest }}</p>
        </div>
      </template>
    </div>
  </article>
</template>
