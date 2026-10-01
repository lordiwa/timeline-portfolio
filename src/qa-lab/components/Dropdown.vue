<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({ label: { type: String, required: true }, items: { type: Array, required: true }, active: { type: String, default: '' } }) // items: [{ id, label }]; active: id de la opcion elegida
const activeLabel = computed(() => props.items.find((i) => i.id === props.active)?.label || '')
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
    <button type="button" class="qa-dd-toggle" aria-haspopup="menu" :aria-expanded="open" @click="open = !open">{{ label }}<template v-if="activeLabel">: {{ activeLabel }}</template> &#9662;</button>
    <ul v-if="open" class="qa-dd-menu" role="menu">
      <li v-for="it in items" :key="it.id" role="none">
        <button type="button" role="menuitemradio" :aria-checked="it.id === active" :class="{ active: it.id === active }" @click="pick(it.id)">{{ it.label }}</button>
      </li>
    </ul>
  </div>
</template>
