<script setup>
import { computed, ref } from 'vue'
import { useLab } from '../composables/useLab.js'
import { useForm, useSubmissions } from '../composables/useForm.js'
import PageShell from '../components/PageShell.vue'
import FormField from '../components/FormField.vue'
import PrimaryButton from '../components/PrimaryButton.vue'

const { page, has, t, toast } = useLab()
const steps = page.content.steps
const { values, errors, validateField, validate } = useForm(steps.flat(), has)
const { count, busy, record } = useSubmissions(has)
const step = ref(0)
const last = computed(() => step.value === steps.length - 1)
const HINTS = { password: 'fields.hintPassword', age: 'fields.hintAge', email: 'fields.hintEmail' }

function next() {
  if (!validate(steps[step.value])) return
  if (!last.value) { step.value += 1; return }
  if (record()) toast(t('site.sent'))
}
</script>

<template>
  <PageShell tpl-id="wizard">
    <div class="qa-stepper" aria-hidden="true"><span v-for="(s, i) in steps" :key="i" :class="{ done: i <= step }" /></div>
    <p class="qa-hint">{{ t('site.step', { n: step + 1, total: steps.length }) }}</p>
    <form class="qa-form" novalidate @submit.prevent="next">
      <FormField
        v-for="f in steps[step]"
        :key="f.key"
        v-model="values[f.key]"
        :field="f"
        :error="errors[f.key]"
        :hint="HINTS[f.key] ? t(HINTS[f.key]) : ''"
        @blur="validateField(f)"
      />
      <div class="qa-actions">
        <button v-if="step > 0" type="button" class="qa-btn secondary" @click="step -= 1">{{ t('site.back') }}</button>
        <PrimaryButton type="submit" :disabled="busy">{{ last ? t('site.submit') : t('site.next') }}</PrimaryButton>
      </div>
    </form>
    <p class="qa-counter" data-testid="submissions">{{ t('site.submissions', { n: count }) }}</p>
  </PageShell>
</template>
