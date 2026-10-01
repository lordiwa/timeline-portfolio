<script setup>
// Barra del lab (fuera del sitio generado) + sitio multi-pagina por (semilla, nivel).
import { computed, effectScope, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { generateSite } from './generator/site.js'
import { LEVELS, normalizeLevel } from './generator/levels.js'
import { concretePath } from './generator/pages.js'
import { newSeed } from './generator/prng.js'
import { BUG_BY_ID, BUGS, CATEGORIES } from './bugs/catalog.js'
import { bugLocation } from './bugs/locations.js'
import { describeBug } from './bugs/describe.js'
import { LOCALES } from './i18n/index.js'
import { readParams } from './boot.js'
import SiteRoot from './components/SiteRoot.vue'
import { useAttempt } from './report/useAttempt.js'
import StartAttempt from './report/StartAttempt.vue'
import ReportPanel from './report/ReportPanel.vue'
import ConfirmDialog from './report/ConfirmDialog.vue'

const props = defineProps({ initialSeed: { type: String, default: '' }, initialLevel: { type: String, default: '' } })
const { t, locale } = useI18n()

const seed = ref(props.initialSeed || newSeed())
const level = ref(normalizeLevel(props.initialLevel))
const bugWhere = (b) => {
  const w = bugLocation(site.value, b.id)
  return w ? t(w.key, { n: w.n, step: w.stepKey ? t(w.stepKey) : '' }) : ''
}
const site = computed(() => generateSite(seed.value, level.value))
// Descripcion con el campo REAL del sitio (los bugs de validacion afectan campos del pack: bugs/describe.js).
const describe = (id) => describeBug(site.value, id, locale.value)
const revealed = ref(false)

// --- Registro de la prueba (TASK-050) ---
let scope = null
function makeAttempt() {
  scope?.stop()
  scope = effectScope(true) // el cronometro se libera al reemplazar el intento (los handlers no tienen scope propio)
  return scope.run(() => useAttempt(seed.value, level.value))
}
const attempt = shallowRef(null)
const panel = ref('closed') // 'closed' | 'start' | 'drawer'
const pendingSwitch = ref(null)
const confirmReveal = ref(false)
attempt.value = makeAttempt()
const inProgress = computed(() => attempt.value.started.value && !attempt.value.finished.value)
onBeforeUnmount(() => scope?.stop())

const SHORT = 90
// Las 36 entradas del catalogo, en el orden del catalogo y con el texto generico (no el del sitio): igual en toda
// semilla, asi que la lista no delata cuales estan activos.
const bugOptions = computed(() => BUGS.map((b) => {
  const d = b.description[locale.value] || b.description.es
  return { id: b.id, label: d.length > SHORT ? `${d.slice(0, SHORT - 1)}…` : d }
}))
const scoreContext = computed(() => ({
  activeBugIds: site.value.bugs, categoryOf: (id) => BUG_BY_ID[id]?.category ?? null, lang: locale.value,
}))
const pageNames = computed(() => site.value.pages.map((p) => t(`pageName.${p}`)))
const resultSolution = computed(() => site.value.bugs.map((id) => ({
  id, category: t(`lab.category.${BUG_BY_ID[id].category}`), text: describe(id), where: bugWhere({ id }),
})))

async function onTakeTest() {
  if (attempt.value.started.value) { panel.value = panel.value === 'drawer' ? 'closed' : 'drawer'; return }
  panel.value = 'start'
  await nextTick()
  document.getElementById('qa-start-name')?.focus()
}
function onStart(data) {
  attempt.value.start(data)
  if (revealed.value) attempt.value.markSolutionViewed() // ya vio el solucionario antes de empezar: queda marcado
  panel.value = 'drawer'
}
function toggleReveal() {
  if (revealed.value) { revealed.value = false; return }
  if (inProgress.value && !attempt.value.solutionViewed.value) { confirmReveal.value = true; return }
  revealed.value = true
}
function doReveal() {
  attempt.value.markSolutionViewed()
  confirmReveal.value = false
  revealed.value = true
}
// Solucionario: los bugs activos (misma fuente que los flags) + la pagina donde se manifiesta cada uno.
const solution = computed(() =>
  site.value.bugs.map((id) => {
    const page = site.value.bugPages[id]
    return { ...BUG_BY_ID[id], page, path: concretePath(site.value, page) }
  }),
)

function syncUrl() {
  const url = new URL(window.location.href)
  url.searchParams.set('seed', seed.value)
  url.searchParams.set('level', level.value)
  url.searchParams.set('lang', locale.value)
  window.history.replaceState(null, '', url) // conserva el #/ruta actual (el titulo lo pone cada pagina del sitio)
}
watch([seed, level, locale], syncUrl, { immediate: true })

/**
 * La URL es la fuente de verdad. Cambiar el nivel o pedir una pagina nueva APILA una entrada (pushState)
 * con la URL completa y el hash en #/: asi 'atras' vuelve exactamente al sitio anterior.
 */
function applySite(nextSeed, nextLevel, { push = false } = {}) {
  if (push) {
    const url = new URL(window.location.href)
    url.searchParams.set('seed', nextSeed)
    url.searchParams.set('level', nextLevel)
    url.searchParams.set('lang', locale.value)
    url.hash = '#/'
    window.history.pushState(null, '', url)
  }
  seed.value = nextSeed
  level.value = nextLevel
  revealed.value = false
  panel.value = 'closed'
  attempt.value = makeAttempt() // un intento propio por (semilla, nivel): si habia uno guardado, se retoma
}
/**
 * Decision (TASK-050 fase B): cambiar la semilla o el nivel con una prueba EN CURSO (empezada y sin resultado)
 * pide confirmacion y, si se acepta, DESCARTA el intento (hallazgos y cronometro). No se bloquea el cambio:
 * el candidato siempre puede salir, pero nunca pierde su trabajo sin decirlo. Un resultado ya mostrado no pide nada.
 */
function requestSite(nextSeed, nextLevel, opts = {}) {
  if (nextSeed === seed.value && nextLevel === level.value) return true
  if (inProgress.value) { pendingSwitch.value = { nextSeed, nextLevel, ...opts }; return false }
  applySite(nextSeed, nextLevel, opts)
  return true
}
function confirmSwitch() {
  const p = pendingSwitch.value
  pendingSwitch.value = null
  attempt.value.discard()
  applySite(p.nextSeed, p.nextLevel, { push: p.push })
}
function cancelSwitch() {
  const p = pendingSwitch.value
  pendingSwitch.value = null
  if (p?.fromUrl) syncUrl() // atras/adelante ya habia cambiado la URL: se restaura la del intento
}
/** El idioma tambien es historial: cambiarlo apila una entrada (conserva la ruta); atras lo restaura. */
function setLang(e) {
  const next = e.target.value
  if (!LOCALES.includes(next) || next === locale.value) return
  const url = new URL(window.location.href)
  url.searchParams.set('lang', next)
  window.history.pushState(null, '', url)
  locale.value = next
}
const regenerate = () => requestSite(newSeed(), level.value, { push: true })
const setLevel = (e) => {
  if (!requestSite(seed.value, normalizeLevel(e.target.value), { push: true })) e.target.value = level.value // el select vuelve hasta que se confirme
}

/** Atras / adelante: se re-derivan seed y level de la URL y el sitio se regenera si cambiaron. */
function syncFromUrl() {
  const p = readParams(window.location.search)
  const lv = normalizeLevel(p.level)
  const lang = new URLSearchParams(window.location.search).get('lang')
  if (LOCALES.includes(lang) && lang !== locale.value) locale.value = lang
  if ((p.seed && p.seed !== seed.value) || lv !== level.value) requestSite(p.seed || seed.value, lv, { fromUrl: true })
}
window.addEventListener('popstate', syncFromUrl)
window.addEventListener('hashchange', syncFromUrl)
onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncFromUrl)
  window.removeEventListener('hashchange', syncFromUrl)
})
</script>

<template>
  <div class="lab">
    <header class="lab-bar">
      <strong class="lab-title">{{ t('lab.title') }}</strong>
      <span class="lab-seed">{{ t('lab.seed') }}: <code data-testid="seed">{{ seed }}</code></span>
      <label>{{ t('lab.level') }}
        <select :value="level" data-testid="level" @change="setLevel">
          <option v-for="l in LEVELS" :key="l" :value="l">{{ t(`lab.levels.${l}`) }}</option>
        </select>
      </label>
      <button type="button" data-testid="new-page" @click="regenerate">{{ t('lab.newPage') }}</button>
      <label class="lab-lang">{{ t('lab.language') }}
        <select :value="locale" data-testid="lang" @change="setLang">
          <option v-for="l in LOCALES" :key="l" :value="l">{{ l }}</option>
        </select>
      </label>
      <button type="button" data-testid="take-test" :aria-expanded="attempt.started.value ? String(panel === 'drawer') : undefined" @click="onTakeTest">{{ attempt.started.value ? t('report.openReport') : t('report.takeTest') }}</button>
      <button type="button" data-testid="reveal" @click="toggleReveal">{{ revealed ? t('lab.hide') : t('lab.reveal') }}</button>
    </header>
    <p class="lab-meta">{{ t('lab.tagline') }} {{ t('lab.cartNote') }}</p>

    <section v-if="revealed" class="lab-solution" data-testid="solution">
      <h2>{{ t('lab.bugsTitle') }}</h2>
      <p>{{ t('lab.bugsCount', { n: solution.length }) }} · {{ t('lab.theme') }}: {{ t(`themeName.${site.themeId}`) }} · {{ t('lab.level') }}: {{ t(`lab.levels.${level}`) }}</p>
      <p class="lab-pages" data-testid="site-pages">{{ t('lab.pageList', { n: site.pages.length }) }}: {{ site.pages.map((p) => t(`pageName.${p}`)).join(', ') }}</p>
      <p v-if="!solution.length">{{ t('lab.noBugs') }}</p>
      <ul>
        <li v-for="b in solution" :key="b.id" :data-bug-id="b.id" :data-bug-page="b.page">
          <code>{{ b.id }}</code>
          <em>{{ t(`lab.category.${b.category}`) }} · {{ t(`lab.difficulty.${b.difficulty}`) }}</em>
          <span>{{ describe(b.id) }}</span>
          <small v-if="bugWhere(b)" class="lab-where" data-testid="bug-where">{{ bugWhere(b) }}</small>
          <a :href="`#${b.path}`" data-testid="bug-link">{{ t('lab.page') }}: {{ t(`pageName.${b.page}`) }} (#{{ b.path }})</a>
        </li>
      </ul>
    </section>

    <div v-if="panel === 'start'" class="qa-modal-backdrop">
      <div class="qa-modal" role="dialog" aria-modal="true" :aria-label="t('report.startTitle')" data-testid="start-dialog" @keydown.esc="panel = 'closed'">
        <StartAttempt @start="onStart" />
        <button type="button" data-testid="start-cancel" @click="panel = 'closed'">{{ t('report.cancel') }}</button>
      </div>
    </div>
    <div v-if="panel === 'drawer' && attempt.started.value" class="lab-drawer" data-testid="drawer" @keydown.esc="panel = 'closed'">
      <button type="button" class="lab-drawer-close" data-testid="drawer-close" @click="panel = 'closed'">{{ t('report.closeReport') }}</button>
      <ReportPanel :key="`${seed}|${level}`" :attempt="attempt" :score-context="scoreContext" :categories="CATEGORIES"
                   :bug-options="bugOptions" :pages="pageNames" :solution="resultSolution" />
    </div>
    <ConfirmDialog v-if="confirmReveal" :title="t('report.revealTitle')" :message="t('report.revealMsg')" :confirm-label="t('report.revealOk')"
                   :cancel-label="t('report.cancel')" @confirm="doReveal" @cancel="confirmReveal = false" />
    <ConfirmDialog v-if="pendingSwitch" :title="t('report.switchTitle')" :message="t('report.switchMsg')" :confirm-label="t('report.switchOk')"
                   :cancel-label="t('report.keep')" @confirm="confirmSwitch" @cancel="cancelSwitch" />

    <SiteRoot :key="`${seed}|${level}`" :site="site" />
  </div>
</template>

<style>
.qa-modal-backdrop { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(31, 41, 51, .6); }
.qa-modal { max-width: 440px; width: calc(100% - 32px); padding: 18px 20px; background: #fff; color: #1f2933; border-radius: 8px; }
.qa-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
.qa-modal button, .lab-drawer button { padding: 6px 12px; border: 1px solid #9aa5b1; border-radius: 4px; background: #fff; color: #1f2933; font: inherit; cursor: pointer; }
.qa-modal form label, .lab-drawer label { display: block; margin-top: 8px; }
.lab-drawer { position: fixed; top: 0; right: 0; bottom: 0; z-index: 50; width: min(380px, 100%); overflow-y: auto; padding: 12px 16px; background: #fff; color: #1f2933; box-shadow: -4px 0 16px rgba(0, 0, 0, .25); }
.lab-drawer input, .lab-drawer textarea, .lab-drawer select, .qa-modal input { width: 100%; box-sizing: border-box; font: inherit; }
.report-error { color: #b42318; min-height: 1.2em; }
</style>
