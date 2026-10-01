<script setup>
// Cuerpo de cada pagina: titulo, lead, nota y franja. Los bugs de contenido / UI "de pagina" viven aca
// y se manifiestan solo en la pagina asignada por el generador (useSite().has).
import { computed } from 'vue'
import { useSite, withTypo } from '../composables/useSite.js'

const props = defineProps({ type: { type: String, required: true }, title: { type: String, default: '' } })
const { has, t, tBug, content } = useSite()

const rawTitle = computed(() => props.title || t(`tpl.${props.type}.title`, { brand: content.value.brand }))
const title = computed(() => (has('typo') ? withTypo(rawTitle.value) : rawTitle.value)) // BUG typo
const lead = computed(() => tBug(`tpl.${props.type}.lead`, { brand: content.value.brand })) // BUG untranslated
</script>

<template>
  <section class="site-page" :data-page="type">
    <h1 :class="{ 'bug-misaligned': has('misaligned') }">{{ title }}</h1>
    <p class="site-lead">{{ lead }}</p>
    <p class="site-note" :class="{ 'bug-truncated': has('text-truncated') }">{{ t(`tpl.${type}.note`) }}</p>
    <slot />
    <div v-if="has('mobile-overflow')" class="site-strip bug-overflow">{{ t('site.strip') }}</div>
  </section>
</template>
