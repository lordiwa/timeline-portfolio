<script setup>
import { useLab } from '../composables/useLab.js'

const props = defineProps({
  page: { type: Number, required: true },
  pages: { type: Number, required: true },
  skipAt: { type: Number, default: 1 },
})
const emit = defineEmits(['update:page'])
const { has, t } = useLab()

function go(n) {
  emit('update:page', Math.min(props.pages, Math.max(1, n)))
}
// BUG pagination-skips: desde la pagina skipAt, "Siguiente" avanza dos.
const next = () => go(props.page + (has('pagination-skips') && props.page === props.skipAt ? 2 : 1))
</script>

<template>
  <nav class="qa-pager" aria-label="pagination">
    <button type="button" :disabled="page <= 1" @click="go(page - 1)">{{ t('list.prev') }}</button>
    <span class="qa-page-info">{{ t('list.page', { page, pages }) }}</span>
    <button type="button" :disabled="page >= pages" @click="next">{{ t('list.next') }}</button>
  </nav>
</template>
