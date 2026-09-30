<script setup>
import { nextTick, ref, watch } from 'vue'
import { useLab } from '../composables/useLab.js'

const props = defineProps({ open: Boolean, title: { type: String, default: '' } })
const emit = defineEmits(['close'])
const { has, t } = useLab()
const dialog = ref(null)
let opener = null

watch(
  () => props.open,
  async (isOpen, wasOpen) => {
    if (isOpen) {
      opener = document.activeElement
      if (has('console-error')) {
        // BUG: TypeError real y no capturado (window.onerror) al abrir el modal.
        const settings = {}
        setTimeout(() => { settings.items.length }, 0)
      }
      await nextTick()
      dialog.value?.focus()
    } else if (wasOpen) {
      // Correcto: devolver el foco a quien abrio el modal. BUG modal-focus-lost: no se devuelve.
      if (!has('modal-focus-lost') && opener && opener.focus) opener.focus()
      opener = null
    }
  },
)
</script>

<template>
  <div v-if="open" class="qa-modal-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <div ref="dialog" class="qa-modal" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1">
      <h2>{{ title }}</h2>
      <div class="qa-modal-body"><slot /></div>
      <button type="button" class="qa-btn secondary" @click="emit('close')">{{ t('site.close') }}</button>
    </div>
  </div>
</template>
