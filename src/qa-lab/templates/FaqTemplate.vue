<script setup>
import { computed, ref } from 'vue'
import { useLab } from '../composables/useLab.js'
import PageShell from '../components/PageShell.vue'
import Accordion from '../components/Accordion.vue'

const { page, has, t } = useLab()
const c = page.content
const q = ref('')
const unlabeled = computed(() => has('missing-label')) // BUG missing-label (buscador)
const items = computed(() =>
  c.questions
    .map((i) => ({ id: i, title: t(`faq.q${i}`), body: t(`faq.a${i}`) }))
    .filter((it) => !q.value.trim() || it.title.toLowerCase().includes(q.value.trim().toLowerCase())),
)
</script>

<template>
  <PageShell tpl-id="faq">
    <div class="qa-toolbar-row">
      <label v-if="!unlabeled" class="qa-label" for="qa-search">{{ t('fields.search') }}</label>
      <input id="qa-search" v-model="q" type="search" :placeholder="unlabeled ? t('fields.search') : ''" />
    </div>
    <Accordion :key="items.length" :items="items" :multiple="c.multiple" :open-first="c.openFirst" />
    <p v-if="!items.length" class="qa-hint">{{ t('list.empty') }}</p>
  </PageShell>
</template>
