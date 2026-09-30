<script setup>
import { computed } from 'vue'
import { useLab } from '../composables/useLab.js'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { default: '' },
  error: { type: Object, default: null },
  hint: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'blur'])
const { page, has, t } = useLab()

const id = computed(() => `qa-${props.field.key}`)
const label = computed(() => t(`fields.${props.field.key}`))
// BUG missing-label: el campo objetivo no tiene <label> ni aria-label, solo placeholder.
const unlabeled = computed(() => has('missing-label') && page.content.labelTarget === props.field.key)
// BUG tab-order: tabindex positivo en un campo (el boton principal tiene tabindex=1).
const tabindex = computed(() => (has('tab-order') && page.content.labelTarget === props.field.key ? 2 : undefined))
const opts = computed(() => Array.from({ length: props.field.options || 0 }, (_, i) => ({ value: String(i), text: t(`opt.${props.field.key}_${i}`) })))
const on = (e) => emit('update:modelValue', props.field.type === 'checkbox' ? e.target.checked : e.target.value)
</script>

<template>
  <div class="qa-field" :class="{ 'has-error': error }" :data-field="field.key">
    <template v-if="field.type === 'radio'">
      <fieldset>
        <legend class="qa-label">{{ label }}<span v-if="field.required" aria-hidden="true"> *</span></legend>
        <label v-for="o in opts" :key="o.value" class="qa-inline">
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
        <option v-for="o in opts" :key="o.value" :value="o.value">{{ o.text }}</option>
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
    <p v-if="hint && !error" class="qa-hint">{{ hint }}</p>
    <p v-if="error" class="qa-error" role="alert">{{ t(error.key) }}</p>
  </div>
</template>
