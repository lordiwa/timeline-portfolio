<script setup>
import { computed, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useForm } from '../composables/useForm.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'
import FormField from '../ui/FormField.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'
import ErrorBanner from '../ui/ErrorBanner.vue'

const { site, content, router, has, nthHit, t, store, toast, env } = useSite()
const fields = computed(() => site.data.signupFields.map((k) => content.value.field(k)))
const { values, errors, validateField, validate } = useForm(fields.value, has, env.clock)
const serverError = ref(false)

function submit() {
  if (!validate(fields.value)) return
  if (store.emailTaken(values.email)) { errors.email = { key: 'err.exists' }; return }
  // BUG nth-submit-server-error: el N-esimo envio valido responde 500 (los datos se conservan, no se registra la cuenta).
  serverError.value = nthHit('nth-submit-server-error')
  if (serverError.value) return
  store.bump('submit')
  const nameKey = fields.value.find((f) => f.nameLike)?.key // el campo de nombre del pack (no siempre se llama 'name')
  const dateKey = fields.value.find((f) => f.type === 'date' && /birth/i.test(f.key))?.key // fecha de nacimiento: se guarda tal cual 'YYYY-MM-DD'
  store.register({ name: values[nameKey] || values.email, email: values.email, password: values.password, birth: dateKey ? values[dateKey] : undefined })
  toast(t('signup.created'))
  router.replace(site.pages.includes('account') ? routePath('account') : '/') // queda con sesion iniciada
}
</script>

<template>
  <PageShell type="signup">
    <form class="qa-form" novalidate @submit.prevent="submit">
      <FormField v-for="f in fields" :key="f.key" v-model="values[f.key]" :field="f" :error="errors[f.key]" @blur="validateField(f)" />
      <ErrorBanner :show="serverError" />
      <div class="qa-actions"><PrimaryButton type="submit">{{ t('site.submit') }}</PrimaryButton></div>
    </form>
    <p>{{ t('signup.haveAccount') }} <a :href="`#${routePath('login')}`">{{ t('nav.login') }}</a></p>
  </PageShell>
</template>
