<script setup>
import { computed, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useForm, useSubmissions } from '../composables/useForm.js'
import PageShell from '../ui/PageShell.vue'
import FormField from '../ui/FormField.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'
import ErrorBanner from '../ui/ErrorBanner.vue'

const { site, content, has, nthHit, t, toast, env, store } = useSite()
const fields = computed(() => site.data.contactFields.map((k) => content.value.field(k)))
const { values, errors, validateField, validate } = useForm(fields.value, has, env.clock)
const { count, busy, record } = useSubmissions(has, env.clock)

const serverError = ref(false)

function submit() {
  if (!validate(fields.value)) return
  if (busy.value) return // reenvio dentro de la ventana de bloqueo: ni se registra ni cuenta como envio
  // BUG nth-submit-server-error: el N-esimo envio valido responde 500 (los datos se conservan, el contador no avanza).
  serverError.value = nthHit('nth-submit-server-error')
  if (serverError.value) return
  store.bump('submit')
  if (record()) toast(t('site.sent'))
}
</script>

<template>
  <PageShell type="contact">
    <form class="qa-form" novalidate @submit.prevent="submit">
      <FormField v-for="f in fields" :key="f.key" v-model="values[f.key]" :field="f" :error="errors[f.key]" @blur="validateField(f)" />
      <ErrorBanner :show="serverError" />
      <div class="qa-actions"><PrimaryButton type="submit" :disabled="busy">{{ t('site.submit') }}</PrimaryButton></div>
    </form>
    <p class="qa-counter" data-testid="submissions">{{ t('site.submissions', { n: count }) }}</p>
  </PageShell>
</template>
