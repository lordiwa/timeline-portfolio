<script setup>
// Formulario para empezar la prueba: nombre + email + aviso de privacidad. Emite start({name,email}).
import { ref, nextTick } from 'vue'
import { useI18n, I18nT } from 'vue-i18n'
import { LIMITS } from './schema.js'

const emit = defineEmits(['start'])
const { t } = useI18n()
const name = ref('')
const email = ref('')
const error = ref('')
const nameEl = ref(null)
const emailEl = ref(null)
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

async function onSubmit() {
  const n = name.value.trim()
  const e = email.value.trim()
  if (!n || n.length > LIMITS.name) { error.value = t('report.errName'); await nextTick(); nameEl.value?.focus(); return }
  if (!EMAIL_RE.test(e) || e.length > LIMITS.email) { error.value = t('report.errEmail'); await nextTick(); emailEl.value?.focus(); return }
  error.value = ''
  emit('start', { name: n, email: e })
}
</script>

<template>
  <form class="report-start" data-testid="start-attempt" novalidate @submit.prevent="onSubmit">
    <h2>{{ t('report.startTitle') }}</h2>
    <label for="qa-start-name">{{ t('report.name') }}</label>
    <input id="qa-start-name" ref="nameEl" v-model="name" type="text" autocomplete="name" :maxlength="LIMITS.name" required />
    <label for="qa-start-email">{{ t('report.email') }}</label>
    <input id="qa-start-email" ref="emailEl" v-model="email" type="email" autocomplete="email" :maxlength="LIMITS.email" required />
    <I18nT keypath="report.privacy" tag="p" class="report-privacy" data-testid="privacy">
      <template #contact><a :href="`mailto:${t('report.contact')}`">{{ t('report.contact') }}</a></template>
    </I18nT>
    <p role="alert" aria-live="assertive" class="report-error" data-testid="start-error">{{ error }}</p>
    <button type="submit">{{ t('report.start') }}</button>
  </form>
</template>
