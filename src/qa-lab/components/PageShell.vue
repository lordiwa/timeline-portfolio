<script setup>
import { computed, ref } from 'vue'
import { useLab, withTypo } from '../composables/useLab.js'
import Modal from './Modal.vue'
import Dropdown from './Dropdown.vue'

const props = defineProps({ tplId: { type: String, required: true } })
const { page, has, t, tBug, tt, toast } = useLab()
const helpOpen = ref(false)

const brand = computed(() => tt(`name${page.brandIdx}`))
const rawTitle = computed(() => t(`tpl.${props.tplId}.title`, { brand: brand.value }))
const title = computed(() => (has('typo') ? withTypo(rawTitle.value) : rawTitle.value)) // BUG typo
const lead = computed(() => tBug(`tpl.${props.tplId}.lead`, { brand: brand.value })) // BUG untranslated
const menu = computed(() => [
  { id: 'home', label: t('site.home') },
  { id: 'catalog', label: t('site.catalog') },
  { id: 'contact', label: t('site.contactLink') },
])
const vars = computed(() => ({
  '--hue': page.style.hue,
  '--radius': `${page.style.radius}px`,
  '--width': `${page.style.width}px`,
}))
</script>

<template>
  <div class="site" :class="[`hdr-${page.style.header}`, `font-${page.style.font}`, `den-${page.style.density}`, { 'lowc': has('low-contrast') }]" :style="vars" :data-template="tplId" :data-theme="page.themeId">
    <header class="site-header">
      <span class="brand">{{ brand }}</span>
      <span v-if="page.style.header === 'banner'" class="tagline">{{ tt('tagline') }}</span>
      <nav class="site-nav">
        <Dropdown :label="t('site.menu')" :items="menu" @select="toast(menu.find((m) => m.id === $event).label)" />
        <button type="button" class="site-help" @click="helpOpen = true">{{ t('site.help') }}</button>
      </nav>
    </header>
    <main class="site-main">
      <h1 :class="{ 'bug-misaligned': has('misaligned') }">{{ title }}</h1>
      <p class="site-lead">{{ lead }}</p>
      <p class="site-note" :class="{ 'bug-truncated': has('text-truncated') }">{{ t(`tpl.${tplId}.note`) }}</p>
      <slot />
      <div v-if="has('mobile-overflow')" class="site-strip bug-overflow">{{ t('site.strip') }}</div>
    </main>
    <footer class="site-footer">{{ t('site.footer', { brand }) }}</footer>
    <Modal :open="helpOpen" :title="t('site.helpTitle')" @close="helpOpen = false">
      <p>{{ t("site.helpBody") }} <a href="#" @click.prevent="toast(t('site.aboutText', { brand }))">{{ t("site.about") }}</a></p>
    </Modal>
  </div>
</template>
