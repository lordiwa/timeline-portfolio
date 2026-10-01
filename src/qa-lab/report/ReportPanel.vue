<script setup>
// Panel lateral de reporte. Recibe el estado de useAttempt (prop `attempt`) y el contexto de puntaje
// (prop `scoreContext`: { activeBugIds, categoryOf, lang }). Sin cablear: App.vue no lo importa todavia.
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { LIMITS, SEVERITIES } from './schema.js'

const props = defineProps({
  attempt: { type: Object, required: true },
  scoreContext: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  bugOptions: { type: Array, default: () => [] }, // [{ id, label }] del catalogo completo (no solo los activos)
  pages: { type: Array, default: () => [] },
})
const { t } = useI18n()

const page = ref('')
const description = ref('')
const severity = ref('medium')
const guessedBugId = ref('')
const guessedCategory = ref('')
const error = ref('')
const descEl = ref(null)

const attempt = props.attempt
const elapsed = computed(() => {
  const s = Math.floor(attempt.elapsedMs.value / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})
const full = computed(() => attempt.findings.value.length >= LIMITS.findings)

async function add() {
  const d = description.value.trim()
  if (!d || d.length > LIMITS.description) {
    error.value = t('report.errDescription', { max: LIMITS.description })
    await nextTick()
    descEl.value?.focus()
    return
  }
  if (full.value) { error.value = t('report.errMax', { max: LIMITS.findings }); return }
  error.value = ''
  attempt.addFinding({
    page: page.value.trim(), description: d, severity: severity.value,
    guessedBugId: guessedBugId.value || null, guessedCategory: guessedCategory.value || null,
  })
  description.value = ''; guessedBugId.value = ''; guessedCategory.value = ''
  await nextTick()
  descEl.value?.focus()
}

async function send() {
  await attempt.submit(props.scoreContext)
}
</script>

<template>
  <aside class="report-panel" data-testid="report-panel" :aria-label="t('report.title')">
    <h2>{{ t('report.title') }}</h2>

    <section v-if="attempt.finished.value" data-testid="report-result" aria-live="polite">
      <h3>{{ t('report.resultTitle') }}</h3>
      <p class="report-score">{{ t('report.score', { n: attempt.result.value.score.score }) }}</p>
      <ul>
        <li>{{ t('report.hits', { n: attempt.result.value.score.breakdown.hits }) }}</li>
        <li>{{ t('report.halfHits', { n: attempt.result.value.score.breakdown.halfHits.length }) }}</li>
        <li>{{ t('report.falsePositives', { n: attempt.result.value.score.breakdown.falsePositives }) }}</li>
        <li>{{ t('report.missed', { n: attempt.result.value.score.breakdown.missed }) }}</li>
      </ul>
      <p>{{ t('report.time', { t: elapsed }) }}</p>
    </section>

    <template v-else>
      <p class="report-timer" data-testid="timer" role="timer">{{ t('report.time', { t: elapsed }) }}</p>

      <form data-testid="finding-form" novalidate @submit.prevent="add">
        <label for="qa-f-page">{{ t('report.page') }}</label>
        <input id="qa-f-page" v-model="page" type="text" list="qa-f-pages" :maxlength="LIMITS.page" />
        <datalist id="qa-f-pages"><option v-for="p in pages" :key="p" :value="p" /></datalist>

        <label for="qa-f-desc">{{ t('report.description') }}</label>
        <textarea id="qa-f-desc" ref="descEl" v-model="description" rows="3" :maxlength="LIMITS.description" required />

        <label for="qa-f-sev">{{ t('report.severity') }}</label>
        <select id="qa-f-sev" v-model="severity">
          <option v-for="s in SEVERITIES" :key="s" :value="s">{{ t(`report.sev.${s}`) }}</option>
        </select>

        <label for="qa-f-cat">{{ t('report.category') }}</label>
        <select id="qa-f-cat" v-model="guessedCategory">
          <option value="">{{ t('report.none') }}</option>
          <option v-for="c in categories" :key="c" :value="c">{{ t(`lab.category.${c}`) }}</option>
        </select>

        <label for="qa-f-bug">{{ t('report.bug') }}</label>
        <select id="qa-f-bug" v-model="guessedBugId">
          <option value="">{{ t('report.none') }}</option>
          <option v-for="b in bugOptions" :key="b.id" :value="b.id">{{ b.label }}</option>
        </select>

        <p role="alert" aria-live="assertive" class="report-error" data-testid="finding-error">{{ error }}</p>
        <button type="submit" :disabled="full">{{ t('report.add') }}</button>
      </form>

      <h3>{{ t('report.findings', { n: attempt.findings.value.length }) }}</h3>
      <ul data-testid="finding-list">
        <li v-for="f in attempt.findings.value" :key="f.id">
          <span>[{{ t(`report.sev.${f.severity}`) }}] {{ f.page }} {{ f.description }}</span>
          <button type="button" :aria-label="t('report.remove')" @click="attempt.removeFinding(f.id)">×</button>
        </li>
      </ul>

      <p role="alert" aria-live="assertive" class="report-error" data-testid="submit-error">
        {{ attempt.error.value ? t(`report.submitError.${attempt.error.value.error}`) : '' }}
      </p>
      <button type="button" data-testid="submit-report" :disabled="attempt.sending.value" @click="send">
        {{ attempt.sending.value ? t('report.sending') : t('report.submit') }}
      </button>
    </template>
  </aside>
</template>
