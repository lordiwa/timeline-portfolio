<script setup>
defineProps({ tabs: { type: Array, required: true }, modelValue: { type: String, required: true } })
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="qa-tabs">
    <div role="tablist" class="qa-tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.id"
        :class="{ active: modelValue === tab.id }"
        @click="emit('update:modelValue', tab.id)"
      >{{ tab.label }}</button>
    </div>
    <div role="tabpanel" class="qa-tabpanel"><slot :active="modelValue" /></div>
  </div>
</template>
