<script setup>
// Sitio generado: provee pagina + Set de bugs activos + toast a todos los componentes.
import { ref } from 'vue'
import { provideLab } from '../composables/useLab.js'
import { TEMPLATE_COMPONENTS } from '../templates/components.js'
import Toast from './Toast.vue'

const props = defineProps({ page: { type: Object, required: true }, bugSet: { type: Object, required: true } })
const messages = ref([])
let nextId = 1
function toast(text) {
  const id = nextId++
  messages.value.push({ id, text })
  setTimeout(() => { messages.value = messages.value.filter((m) => m.id !== id) }, 3500)
}
provideLab(props.page, props.bugSet, toast)
</script>

<template>
  <component :is="TEMPLATE_COMPONENTS[page.templateId]" />
  <Toast :messages="messages" />
</template>
