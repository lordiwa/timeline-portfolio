<script setup>
import { nextTick, ref, watch } from 'vue'
import { useSite } from '../composables/useSite.js'

const props = defineProps({ open: Boolean, title: { type: String, default: '' }, returnTo: { type: Function, default: null } }) // returnTo: elemento alternativo para devolver el foco
const emit = defineEmits(['close'])
const { has, t, env } = useSite()
const dialog = ref(null)
let opener = null

// Focus trap minimo: Tab / Shift+Tab ciclan dentro del dialogo (Esc lo maneja el backdrop).
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
function trap(e) {
  if (e.key !== 'Tab' || !dialog.value) return
  const items = [...dialog.value.querySelectorAll(FOCUSABLE)]
  if (!items.length) { e.preventDefault(); dialog.value.focus(); return }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (e.shiftKey && (active === first || active === dialog.value)) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
}

watch(
  () => props.open,
  async (isOpen, wasOpen) => {
    if (isOpen) {
      opener = document.activeElement
      if (has('console-error')) {
        // BUG: TypeError real y no capturado (window.onerror) al abrir el modal.
        const settings = {}
        env.clock.setTimeout(() => { settings.items.length }, 0)
      }
      await nextTick()
      dialog.value?.focus()
    } else if (wasOpen) {
      // Correcto: devolver el foco a quien abrio el modal. BUG modal-focus-lost: no se devuelve.
      const target = (props.returnTo && props.returnTo()) || opener
      if (!has('modal-focus-lost') && target && target.focus) target.focus()
      opener = null
    }
  },
)
</script>

<template>
  <div v-if="open" class="qa-modal-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <div ref="dialog" class="qa-modal" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1" @keydown="trap">
      <h2>{{ title }}</h2>
      <div class="qa-modal-body"><slot /></div>
      <button type="button" class="qa-btn secondary" @click="emit('close')">{{ t('site.close') }}</button>
    </div>
  </div>
</template>
