<script setup>
import { computed } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useForm, useSubmissions } from '../composables/useForm.js'
import PageShell from '../ui/PageShell.vue'
import FormField from '../ui/FormField.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'

const { site, content, has, t, toast } = useSite()
const fields = computed(() => site.data.contactFields.map((k) => content.value.field(k)))
const { values, errors, validateField, validate } = useForm(fields.value, has)
const { count, busy, record } = useSubmissions(has)

function submit() {
  if (!validate(fields.value)) return
  if (record()) toast(t('site.sent'))
}
</script>

<template>
  <PageShell type="contact">
    <form class="qa-form" novalidate @submit.prevent="submit">
      <FormField v-for="f in fields" :key="f.key" v-model="values[f.key]" :field="f" :error="errors[f.key]" @blur="validateField(f)" />
      <div class="qa-actions"><PrimaryButton type="submit" :disabled="busy">{{ t('site.submit') }}</PrimaryButton></div>
    </form>
    <p class="qa-counter" data-testid="submissions">{{ t('site.submissions', { n: count }) }}</p>
  </PageShell>
</template>
