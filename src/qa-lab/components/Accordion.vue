<script setup>
import { ref } from 'vue'

const props = defineProps({
  items: { type: Array, required: true }, // [{ id, title, body }]
  multiple: Boolean,
  openFirst: Boolean,
})
const open = ref(new Set(props.openFirst && props.items.length ? [props.items[0].id] : []))
function toggle(id) {
  const next = new Set(props.multiple ? open.value : [])
  if (open.value.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}
</script>

<template>
  <div class="qa-accordion">
    <div v-for="it in items" :key="it.id" class="qa-acc-item">
      <button type="button" class="qa-acc-head" :aria-expanded="open.has(it.id)" @click="toggle(it.id)">{{ it.title }}</button>
      <div v-show="open.has(it.id)" class="qa-acc-body">{{ it.body }}</div>
    </div>
  </div>
</template>
