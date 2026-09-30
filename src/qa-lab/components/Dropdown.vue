<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({ label: { type: String, required: true }, items: { type: Array, required: true } }) // [{ id, label }]
const emit = defineEmits(['select'])
const open = ref(false)
const root = ref(null)
const away = (e) => { if (root.value && !root.value.contains(e.target)) open.value = false }
onMounted(() => document.addEventListener('click', away))
onBeforeUnmount(() => document.removeEventListener('click', away))
function pick(id) {
  open.value = false
  emit('select', id)
}
</script>

<template>
  <div ref="root" class="qa-dropdown" @keydown.esc="open = false">
    <button type="button" class="qa-dd-toggle" aria-haspopup="menu" :aria-expanded="open" @click="open = !open">{{ label }} &#9662;</button>
    <ul v-if="open" class="qa-dd-menu" role="menu">
      <li v-for="it in items" :key="it.id" role="none">
        <button type="button" role="menuitem" @click="pick(it.id)">{{ it.label }}</button>
      </li>
    </ul>
  </div>
</template>
