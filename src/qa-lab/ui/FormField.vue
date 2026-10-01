<script setup>
// field = content.field(key): { key, type, required, label, hint, options:[{value,text}] }
import { computed } from 'vue'
import { useSite } from '../composables/useSite.js'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { default: '' },
  error: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'blur'])
const { has, t, labelTarget } = useSite()

const id = computed(() => `qa-${props.field.key}`)
const label = computed(() => props.field.label)
const isTarget = computed(() => labelTarget() === props.field.key)
// BUG missing-label: el campo objetivo no tiene <label> ni aria-label, solo placeholder.
const unlabeled = computed(() => has('missing-label') && isTarget.value)
// BUG tab-order: tabindex positivo en un campo (el boton principal tiene tabindex=1).
const tabindex = computed(() => (has('tab-order') && isTarget.value ? 2 : undefined))
const on = (e) => emit('update:modelValue', props.field.type === 'checkbox' ? e.target.checked : e.target.value)
</script>

<template>
  <div class="qa-field" :class="{ 'has-error': error }" :data-field="field.key">
    <template v-if="field.type === 'radio'">
      <fieldset>
        <legend class="qa-label">{{ label }}<span v-if="field.required" aria-hidden="true"> *</span></legend>
        <label v-for="o in field.options" :key="o.value" class="qa-inline">
          <input type="radio" :name="id" :value="o.value" :checked="modelValue === o.value" @change="on" @blur="emit('blur')" />
          {{ o.text }}
        </label>
      </fieldset>
    </template>
    <template v-else-if="field.type === 'checkbox'">
      <label class="qa-inline" :for="id">
        <input :id="id" type="checkbox" :checked="modelValue" @change="on" @blur="emit('blur')" />
        {{ label }}<span v-if="field.required" aria-hidden="true"> *</span>
      </label>
    </template>
    <template v-else>
      <label v-if="!unlabeled" class="qa-label" :for="id">{{ label }}<span v-if="field.required" aria-hidden="true"> *</span></label>
      <span v-else class="qa-label" aria-hidden="true">{{ label }}</span>
      <select v-if="field.type === 'select'" :id="id" :value="modelValue" :tabindex="tabindex" @change="on" @blur="emit('blur')">
        <option value="">{{ t('opt.choose') }}</option>
        <option v-for="o in field.options" :key="o.value" :value="o.value">{{ o.text }}</option>
      </select>
      <textarea v-else-if="field.type === 'textarea'" :id="id" rows="3" :value="modelValue" :placeholder="unlabeled ? label : ''" :tabindex="tabindex" @input="on" @blur="emit('blur')" />
      <input
        v-else
        :id="id"
        :type="field.type === 'text' ? 'text' : field.type"
        :value="modelValue"
        :placeholder="unlabeled ? label : ''"
        :tabindex="tabindex"
        :autocomplete="field.type === 'password' ? 'new-password' : 'off'"
        @input="on"
        @blur="emit('blur')"
      />
    </template>
    <p v-if="field.hint && !error" class="qa-hint">{{ field.hint }}</p>
    <p v-if="error" class="qa-error" role="alert">{{ error.text || t(error.key, error.params || {}) }}</p>
  </div>
</template>
