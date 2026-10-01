<script setup>
import { computed } from 'vue'
import { useSite } from '../composables/useSite.js'

defineProps({ type: { type: String, default: 'button' }, disabled: Boolean })
const { has, t } = useSite()
const covered = computed(() => has('button-covered')) // BUG: sticker que intercepta los clicks
const tabindex = computed(() => (has('tab-order') ? 1 : undefined)) // BUG: tabindex positivo
</script>

<template>
  <span class="qa-btn-wrap">
    <button class="qa-btn" :type="type" :disabled="disabled" :tabindex="tabindex"><slot /></button>
    <span v-if="covered" class="qa-sticker" data-testid="qa-sticker">{{ t('site.promo') }}</span>
  </span>
</template>
