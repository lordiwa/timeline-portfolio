<script setup>
import { computed, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import PageShell from '../ui/PageShell.vue'
import Accordion from '../components/Accordion.vue'

const { site, content, has, t, labelTarget } = useSite()
const q = ref('')
const unlabeled = computed(() => has('missing-label') && labelTarget() === 'search') // BUG missing-label (buscador)
const items = computed(() =>
  content.value.faq
    .map((f) => ({ id: f.id, title: f.q, body: f.a }))
    .filter((it) => !q.value.trim() || it.title.toLowerCase().includes(q.value.trim().toLowerCase())),
)
</script>

<template>
  <PageShell type="faq">
    <div class="qa-toolbar-row">
      <label v-if="!unlabeled" class="qa-label" for="qa-search">{{ t('fields.search') }}</label>
      <input id="qa-search" v-model="q" type="search" :placeholder="unlabeled ? t('fields.search') : ''" />
    </div>
    <Accordion :key="`${items.length}:${content.brand}`" :items="items" :multiple="site.data.faq.multiple" :open-first="site.data.faq.openFirst" />
    <p v-if="!items.length" class="qa-hint">{{ t('list.empty') }}</p>
  </PageShell>
</template>
