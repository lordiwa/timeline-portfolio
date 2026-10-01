<script setup>
// Dialogo de confirmacion propio y accesible (sin window.confirm): role=alertdialog, modal, foco inicial en
// "Cancelar" (la opcion segura), Tab atrapado dentro, Escape cancela y el foco vuelve a quien lo abrio.
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  cancelLabel: { type: String, required: true },
})
const emit = defineEmits(['confirm', 'cancel'])
const root = ref(null)
const cancelBtn = ref(null)
let opener = null

function onKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); emit('cancel'); return }
  if (e.key !== 'Tab') return
  const f = root.value?.querySelectorAll('button')
  if (!f?.length) return
  const first = f[0]
  const last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
onMounted(() => { opener = document.activeElement; cancelBtn.value?.focus() })
onBeforeUnmount(() => { if (opener && document.contains(opener)) opener.focus() })
</script>

<template>
  <div class="qa-modal-backdrop">
    <div ref="root" class="qa-modal" role="alertdialog" aria-modal="true" aria-labelledby="qa-confirm-title" aria-describedby="qa-confirm-msg"
         data-testid="confirm-dialog" @keydown="onKey">
      <h2 id="qa-confirm-title">{{ title }}</h2>
      <p id="qa-confirm-msg">{{ message }}</p>
      <div class="qa-modal-actions">
        <button ref="cancelBtn" type="button" data-testid="confirm-cancel" @click="emit('cancel')">{{ cancelLabel }}</button>
        <button type="button" data-testid="confirm-ok" @click="emit('confirm')">{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>
