<script setup>
// Wizard de 4 a 6 pasos con validacion condicional:
//  - "Soy una empresa" muestra (y exige) el campo Empresa; "Quiero novedades" muestra Frecuencia.
//  - Elegir el plan Premium agrega el paso de Pago.
// Los campos y pasos ocultos NO se validan ni se resumen. Reglas en wizard/logic.js.
import { computed, ref, watch } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useForm, useSubmissions } from '../composables/useForm.js'
import { visibleFields, visibleSteps } from '../wizard/logic.js'
import PageShell from '../ui/PageShell.vue'
import FormField from '../ui/FormField.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'
import ErrorBanner from '../ui/ErrorBanner.vue'

const { site, content, has, nthHit, t, toast, env, store } = useSite()
const serverError = ref(false)
const spec = site.data.wizard
const allKeys = [...new Set(spec.steps.flatMap((s) => s.fields))]
const { values, errors, validateField, validate } = useForm(allKeys.map((k) => content.value.field(k)), has, env.clock)
const { count, busy, record } = useSubmissions(has, env.clock)

const steps = computed(() => visibleSteps(spec, values))
const stepId = ref(spec.steps[0].id)
const idx = computed(() => Math.max(0, steps.value.findIndex((s) => s.id === stepId.value)))
const current = computed(() => steps.value[idx.value])
const last = computed(() => idx.value === steps.value.length - 1)
const fieldsOf = (step) => visibleFields(spec, step, values).map((k) => content.value.field(k))
const fields = computed(() => fieldsOf(current.value))

// Un campo que se oculta pierde su error pendiente.
watch(() => values, () => {
  const shown = new Set(steps.value.flatMap((s) => visibleFields(spec, s, values)))
  for (const k of Object.keys(errors)) if (!shown.has(k)) delete errors[k]
}, { deep: true })

const display = (f) => {
  const v = values[f.key]
  if (f.type === 'checkbox') return v ? t('wizard.yes') : t('wizard.no')
  if (f.options.length) return f.options.find((o) => o.value === v)?.text || '—'
  return v || '—'
}
const summary = computed(() =>
  steps.value.flatMap((s) => (s.id === 'confirm' ? [] : fieldsOf(s))).map((f) => ({ key: f.key, label: f.label, text: display(f) })),
)

function next() {
  if (!validate(fields.value)) return
  if (!last.value) { stepId.value = steps.value[idx.value + 1].id; return }
  // Envio final: se valida TODO lo visible; si algo falla, se vuelve al primer paso con error.
  const bad = steps.value.find((s) => !validate(fieldsOf(s)))
  if (bad) { stepId.value = bad.id; return }
  if (busy.value) return // reenvio dentro de la ventana de bloqueo
  // BUG nth-submit-server-error: el N-esimo envio valido responde 500 (los datos se conservan, el contador no avanza).
  serverError.value = nthHit('nth-submit-server-error')
  if (serverError.value) return
  store.bump('submit')
  if (record()) toast(t('site.sent'))
}
</script>

<template>
  <PageShell type="wizard">
    <div class="qa-stepper" aria-hidden="true"><span v-for="(s, i) in steps" :key="s.id" :class="{ done: i <= idx }" /></div>
    <p class="qa-hint" data-testid="wizard-progress">{{ t('site.step', { n: idx + 1, total: steps.length }) }} · {{ content.stepTitle(current.id) }}</p>
    <form class="qa-form" novalidate @submit.prevent="next">
      <template v-if="current.id === 'confirm'">
        <ul class="qa-summary-lines" data-testid="wizard-summary">
          <li v-for="s in summary" :key="s.key"><b>{{ s.label }}:</b> {{ s.text }}</li>
        </ul>
      </template>
      <FormField v-for="f in fields" :key="f.key" v-model="values[f.key]" :field="f" :error="errors[f.key]" @blur="validateField(f)" />
      <ErrorBanner :show="serverError && last" />
      <div class="qa-actions">
        <button v-if="idx > 0" type="button" class="qa-btn secondary" @click="stepId = steps[idx - 1].id">{{ t('site.back') }}</button>
        <PrimaryButton type="submit" :disabled="busy">{{ last ? t('site.submit') : t('site.next') }}</PrimaryButton>
      </div>
    </form>
    <p class="qa-counter" data-testid="submissions">{{ t('site.submissions', { n: count }) }}</p>
  </PageShell>
</template>
