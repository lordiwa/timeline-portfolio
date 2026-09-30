<script setup>
defineProps({ messages: { type: Array, required: true } })
</script>

<template>
  <div class="qa-toasts" aria-live="polite">
    <div v-for="m in messages" :key="m.id" class="qa-toast" role="status">{{ m.text }}</div>
  </div>
</template>
