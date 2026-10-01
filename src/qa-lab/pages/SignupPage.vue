<script setup>
import { computed } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useForm } from '../composables/useForm.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'
import FormField from '../ui/FormField.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'

const { site, content, router, has, t, store, toast, env } = useSite()
const fields = computed(() => site.data.signupFields.map((k) => content.value.field(k)))
const { values, errors, validateField, validate } = useForm(fields.value, has, env.clock)

function submit() {
  if (!validate(fields.value)) return
  if (store.emailTaken(values.email)) { errors.email = { key: 'err.exists' }; return }
  store.bump('submit')
  const nameKey = fields.value.find((f) => f.nameLike)?.key // el campo de nombre del pack (no siempre se llama 'name')
  store.register({ name: values[nameKey] || values.email, email: values.email, password: values.password })
  toast(t('signup.created'))
  router.replace(site.pages.includes('account') ? routePath('account') : '/') // queda con sesion iniciada
}
</script>

<template>
  <PageShell type="signup">
    <form class="qa-form" novalidate @submit.prevent="submit">
      <FormField v-for="f in fields" :key="f.key" v-model="values[f.key]" :field="f" :error="errors[f.key]" @blur="validateField(f)" />
      <div class="qa-actions"><PrimaryButton type="submit">{{ t('site.submit') }}</PrimaryButton></div>
    </form>
    <p>{{ t('signup.haveAccount') }} <a :href="`#${routePath('login')}`">{{ t('nav.login') }}</a></p>
  </PageShell>
</template>
