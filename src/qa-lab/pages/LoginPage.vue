<script setup>
import { computed, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useForm } from '../composables/useForm.js'
import { safeNext } from '../router/index.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'
import FormField from '../ui/FormField.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'

const { site, content, route, router, has, t, store, env } = useSite()
// En el login la contrasena no tiene largo minimo: se compara contra la cuenta.
const keys = ['email', 'password']
const fieldsOf = () => [content.value.generic('email', { autocomplete: 'username' }), content.value.generic('password', { min: 1, hint: '', autocomplete: 'current-password' })]
const fields = computed(fieldsOf)
const { values, errors, validateField, validate } = useForm(fieldsOf(), has, env.clock)
const failed = ref(false)
const hasSignup = site.pages.includes('signup')
const demo = site.data.demoUser

function submit() {
  failed.value = false
  if (!validate(fields.value)) return
  const r = store.login(values.email, values.password)
  if (!r.ok) { failed.value = true; return }
  router.replace(safeNext(site, route.value.query.next) || (site.pages.includes('account') ? routePath('account') : '/'))
}
</script>

<template>
  <PageShell type="login">
    <p class="qa-hint" data-testid="demo-creds">{{ t('login.demo', { email: demo.email, password: demo.password }) }}</p>
    <form class="qa-form" novalidate @submit.prevent="submit">
      <FormField v-for="f in fields" :key="f.key" v-model="values[f.key]" :field="f" :error="errors[f.key]" @blur="validateField(f)" />
      <p v-if="failed" class="qa-error" role="alert" data-testid="login-error">{{ t('err.credentials') }}</p>
      <div class="qa-actions"><PrimaryButton type="submit">{{ t('login.submit') }}</PrimaryButton></div>
    </form>
    <p v-if="hasSignup">{{ t('login.noAccount') }} <a :href="`#${routePath('signup')}`">{{ t('nav.signup') }}</a></p>
  </PageShell>
</template>
